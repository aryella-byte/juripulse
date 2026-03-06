#!/usr/bin/env python3
"""
采集缺失的两个期刊：中外法学 (ID 2) 和 政法论坛 (ID 4)
使用 innerText 方式提取文章信息
"""

import asyncio
import json
import random
from datetime import datetime
from playwright.async_api import async_playwright

MISSING_JOURNALS = {
    '中外法学': {'id': 2, 'issues': 6},
    '政法论坛': {'id': 4, 'issues': 6},
}

OUTPUT_DIR = '/Users/yalipeng/Downloads/2025CLSCI/output'


async def collect_journal_via_text(context, journal_name, journal_id, expected_issues):
    """使用 innerText 方式采集期刊文章"""
    print(f"\n{'='*60}")
    print(f"采集: {journal_name} (ID: {journal_id}, 预期{expected_issues}期)")
    print(f"{'='*60}")

    articles = []
    page = await context.new_page()

    try:
        url = f"https://www.pkulaw.com/singlejournal/qikan/{journal_id}"
        print(f"  访问: {url}")
        await page.goto(url, wait_until='domcontentloaded')
        await asyncio.sleep(5)

        # 点击2025年
        print("  点击2025年...")
        clicked = await page.evaluate('''() => {
            const links = document.querySelectorAll('a');
            for (const link of links) {
                if (link.textContent.trim() === '2025') {
                    link.click();
                    return true;
                }
            }
            return false;
        }''')

        if not clicked:
            print("  未找到2025年，尝试查找可用年份...")
            years = await page.evaluate('''() => {
                const links = document.querySelectorAll('a');
                const years = [];
                for (const link of links) {
                    const t = link.textContent.trim();
                    if (/^20\\d{2}$/.test(t)) years.push(t);
                }
                return years;
            }''')
            print(f"  可用年份: {years}")
            await page.close()
            return articles

        await asyncio.sleep(4)

        # 获取分页信息
        pagination = await page.evaluate('''() => {
            const text = document.body.innerText;
            const match = text.match(/页数\\s*(\\d+)\\s*\\/\\s*(\\d+)/);
            return match ? {current: parseInt(match[1]), total: parseInt(match[2])} : null;
        }''')

        total_pages = pagination['total'] if pagination else 1
        print(f"  共 {total_pages} 页")

        seen_hrefs = set()
        page_num = 1

        while page_num <= total_pages:
            print(f"  第{page_num}/{total_pages}页...")

            # 使用 innerText 方式提取文章
            page_articles = await page.evaluate('''() => {
                const results = [];
                const links = document.querySelectorAll('a');

                for (const link of links) {
                    const href = link.href || '';
                    const title = link.textContent.trim();

                    // 文章链接特征
                    if (href.includes('/qikan/') && href.includes('.html') &&
                        href.length > 60 &&
                        title.length > 4 && title.length < 150 &&
                        !title.includes('《') && !title.includes('》') &&
                        !title.includes('目录') && !title.includes('总目录')) {

                        // 向上查找上下文
                        let contextText = '';
                        let parent = link.parentElement;
                        for (let i = 0; i < 8 && parent; i++) {
                            contextText = parent.innerText || parent.textContent || '';
                            if (contextText.includes('2025年') && contextText.includes('期')) break;
                            parent = parent.parentElement;
                        }

                        if (contextText.includes('2025年')) {
                            const issueMatch = contextText.match(/第(\\d+)期/);
                            const pageMatch = contextText.match(/第(\\d+)页/);

                            // 提取作者
                            let author = '';
                            const parts = contextText.split('页');
                            if (parts.length > 1) {
                                const afterPage = parts[1].trim();
                                const words = afterPage.split(/[\\s\\n]/);
                                if (words[0] && words[0].length >= 2 && words[0].length <= 10) {
                                    author = words[0];
                                }
                            }

                            results.push({
                                title: title,
                                href: href,
                                year: '2025',
                                issue: issueMatch ? issueMatch[1] : '',
                                page: pageMatch ? pageMatch[1] : '',
                                author: author
                            });
                        }
                    }
                }

                return results;
            }''')

            new_count = 0
            for art in page_articles:
                if art['href'] not in seen_hrefs:
                    seen_hrefs.add(art['href'])
                    art['journal'] = journal_name
                    articles.append(art)
                    new_count += 1

            print(f"    + {new_count} 篇 (累计 {len(articles)})")

            # 打印本页采集到的标题
            for art in page_articles:
                if art['href'] in seen_hrefs:
                    print(f"      - [{art['issue']}期] {art['title'][:40]}")

            # 翻页
            if page_num < total_pages:
                await page.evaluate('''() => {
                    const links = document.querySelectorAll('a');
                    for (const link of links) {
                        if (link.textContent.trim() === '下一页') {
                            link.click();
                            return;
                        }
                    }
                }''')
                await asyncio.sleep(3)

            page_num += 1

        # 检查期数
        found_issues = set([a['issue'] for a in articles if a['issue']])
        print(f"\n  采集完成: {len(articles)} 篇")
        print(f"  期数: {sorted([int(i) for i in found_issues if i.isdigit()])}")

        if len(found_issues) < expected_issues:
            print(f"  注意: 预期{expected_issues}期，实际{len(found_issues)}期")

        # 如果没拿到文章，尝试用另一种方式（直接从 innerText 解析）
        if len(articles) == 0:
            print("\n  链接方式未获取到文章，尝试 innerText 整体解析...")
            text_articles = await parse_from_innertext(page, journal_name)
            articles.extend(text_articles)
            print(f"  innerText 解析获取: {len(text_articles)} 篇")

    except Exception as e:
        print(f"  错误: {e}")
        import traceback
        traceback.print_exc()

    await page.close()
    return articles


async def parse_from_innertext(page, journal_name):
    """从整个页面的 innerText 中解析文章信息"""
    articles = []
    full_text = await page.evaluate('() => document.body.innerText')

    lines = full_text.split('\n')
    current_issue = ''

    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue

        # 检测期号
        import re
        issue_match = re.search(r'2025年\s*第(\d+)期', line)
        if issue_match:
            current_issue = issue_match.group(1)
            continue

        # 检测文章标题行（通常包含页码和作者）
        # 格式类似：标题  第XX页  作者名
        page_match = re.search(r'第(\d+)页', line)
        if page_match and current_issue and len(line) > 10:
            # 提取标题（页码之前的部分）
            title_part = line[:line.index('第' + page_match.group(1) + '页')].strip()
            if len(title_part) > 4:
                # 提取作者（页码之后的部分）
                after_page = line[line.index('页') + 1:].strip()
                author = after_page.split()[0] if after_page else ''

                articles.append({
                    'title': title_part,
                    'href': '',
                    'year': '2025',
                    'issue': current_issue,
                    'page': page_match.group(1),
                    'author': author if len(author) >= 2 and len(author) <= 10 else '',
                    'journal': journal_name
                })

    return articles


async def main():
    print("=" * 60)
    print("  采集缺失期刊: 中外法学、政法论坛")
    print(f"  时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # 加载已有数据
    existing_file = f'{OUTPUT_DIR}/CLSCI_all_titles_2025.json'
    try:
        with open(existing_file, 'r') as f:
            all_articles = json.load(f)
        print(f"\n已有数据: {len(all_articles)} 篇")
    except:
        all_articles = []
        print("\n未找到已有数据")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={'width': 1400, 'height': 900},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        )

        new_articles_total = []

        for journal_name, config in MISSING_JOURNALS.items():
            articles = await collect_journal_via_text(
                context, journal_name, config['id'], config['issues']
            )
            new_articles_total.extend(articles)

            # 随机延迟
            delay = random.uniform(3, 5)
            print(f"  等待 {delay:.1f}s...")
            await asyncio.sleep(delay)

        await browser.close()

    # 合并并保存
    print(f"\n新采集: {len(new_articles_total)} 篇")

    # 按期刊分组统计
    from collections import Counter
    new_counts = Counter([a['journal'] for a in new_articles_total])
    for j, c in new_counts.items():
        print(f"  {j}: {c}篇")

    # 保存新采集的单独文件
    for journal_name in MISSING_JOURNALS:
        journal_arts = [a for a in new_articles_total if a['journal'] == journal_name]
        if journal_arts:
            journal_file = f'{OUTPUT_DIR}/{journal_name}_2025_titles.json'
            with open(journal_file, 'w', encoding='utf-8') as f:
                json.dump(journal_arts, f, ensure_ascii=False, indent=2)
            print(f"  保存: {journal_file} ({len(journal_arts)}篇)")

    # 合并到总文件
    all_articles.extend(new_articles_total)
    with open(existing_file, 'w', encoding='utf-8') as f:
        json.dump(all_articles, f, ensure_ascii=False, indent=2)
    print(f"\n合并后总计: {len(all_articles)} 篇")
    print(f"保存至: {existing_file}")

    # 最终统计
    total_counts = Counter([a.get('journal', '未知') for a in all_articles])
    print(f"\n各期刊统计:")
    for j, c in sorted(total_counts.items(), key=lambda x: -x[1]):
        print(f"  {j}: {c}篇")


if __name__ == '__main__':
    asyncio.run(main())
