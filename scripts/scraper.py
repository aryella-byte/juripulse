#!/usr/bin/env python3
"""
采集刑法相关文章详情
1. 先从列表页补全所有文章的作者信息（题录）
2. 只对刑法相关文章采集详情页（摘要、关键词、目次、正文）
"""

import asyncio
import json
import random
from datetime import datetime
from playwright.async_api import async_playwright

# 刑法相关文章标题（语义分析筛选）
CRIMINAL_LAW_TITLES = [
    "财产犯罪中利益转移的要件重构：从物的占有到债的实现",
    "论规范归咎刑事责任范型",
    "从形式法典化到实质法典化：刑事诉讼法的法典化进阶",
    "中国刑事司法治理的传统范式及其现代意蕴",
    "机动侦查权的理论新释与程序设计",
    "论网络聚合犯罪的刑法规制",
    "区分自然犯与法定犯的新标准：主体性法益／主体间性法益",
    "民行刑交叉中的高空抛物致损赔偿规则",
    "但书出罪的规范基础与实践展开",
    "论程序法上的犯罪事实",
    "轻微犯罪治理的规范困境与路径优化",
    "从外在名誉到内在尊严：侮辱罪保护法益的重构与展开",
    "法典化背景下刑事特别程序体系配置完善研究",
    "立案追诉标准在审判中的参照适用",
    "中国刑法学自主知识体系的内涵阐释与建构路径",
    "实质法益保护理念下行政犯行刑反向衔接机制的展开",
    '论中国刑法上的"二阶刑事违法"',
    "论刑事案件不法原因给付财产的没收",
    "宽容原则之上：法律解释与存疑有利于被告",
]

async def scrape_detail(context, article):
    """采集单篇文章详情页"""
    print(f"    采集详情: {article['title'][:30]}...")

    page = await context.new_page()
    try:
        await page.goto(article['href'], wait_until='domcontentloaded')
        await asyncio.sleep(3)

        # 提取详情 - 使用字符串操作，避免正则问题
        detail = await page.evaluate('''() => {
            const result = {
                title: '',
                author: '',
                institution: '',
                abstract_cn: '',
                abstract_en: '',
                keywords: '',
                toc: '',
                fulltext: ''
            };

            const bodyText = document.body.innerText;
            const lines = bodyText.split('\\n');

            // 标题
            const h1 = document.querySelector('h1');
            result.title = h1 ? h1.textContent.trim() : '';

            // 遍历行提取信息
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                if (line.startsWith('作者：') || line.startsWith('作者:')) {
                    result.author = line.replace(/^作者[：:]/, '').trim();
                }
                if (line.startsWith('作者单位：') || line.startsWith('作者单位:')) {
                    result.institution = line.replace(/^作者单位[：:]/, '').trim();
                }
                if (line.startsWith('关键词：') || line.startsWith('关键词:')) {
                    result.keywords = line.replace(/^关键词[：:]/, '').trim();
                }
            }

            // 摘要 - 找"摘要："和"关键词"之间的内容
            const absStart = bodyText.indexOf('摘要：');
            const absStart2 = bodyText.indexOf('摘要:');
            const absIdx = absStart > 0 ? absStart : absStart2;
            if (absIdx > 0) {
                const afterAbs = bodyText.substring(absIdx + 3);
                const kwIdx = afterAbs.indexOf('关键词');
                const enIdx = afterAbs.indexOf('英文摘要');
                const endIdx = Math.min(
                    kwIdx > 0 ? kwIdx : 9999,
                    enIdx > 0 ? enIdx : 9999,
                    2000
                );
                result.abstract_cn = afterAbs.substring(0, endIdx).trim();
            }

            // 英文摘要
            const enAbsIdx = bodyText.indexOf('英文摘要');
            if (enAbsIdx > 0) {
                const afterEnAbs = bodyText.substring(enAbsIdx + 5);
                const tocIdx = afterEnAbs.indexOf('目次');
                const endIdx = Math.min(tocIdx > 0 ? tocIdx : 2000, 2000);
                result.abstract_en = afterEnAbs.substring(0, endIdx).trim();
            }

            // 目次
            const tocIdx = bodyText.indexOf('目次');
            if (tocIdx > 0) {
                const afterToc = bodyText.substring(tocIdx + 2);
                const contentIdx = afterToc.indexOf('一、');
                const endIdx = Math.min(contentIdx > 0 ? contentIdx : 1000, 1000);
                result.toc = afterToc.substring(0, endIdx).trim();
            }

            // 正文（从"一、"开始）
            const contentIdx = bodyText.indexOf('一、');
            if (contentIdx > 0) {
                result.fulltext = bodyText.substring(contentIdx, contentIdx + 3000);
            }

            return result;
        }''')

        await page.close()
        return detail

    except Exception as e:
        print(f"    错误: {e}")
        await page.close()
        return None

async def scrape_list_page_authors(page):
    """从列表页提取作者信息"""
    authors_map = await page.evaluate('''() => {
        const result = {};
        const links = document.querySelectorAll('a[href*="/qikan/"]');

        for (const link of links) {
            const title = link.textContent.trim();
            if (title.length > 5 && title.length < 100 && !title.includes('《')) {
                // 找父元素获取作者
                let parent = link.parentElement;
                for (let i = 0; i < 5 && parent; i++) {
                    const text = parent.textContent || '';
                    // 简单匹配：找"页"后面的名字
                    const parts = text.split('页');
                    if (parts.length > 1) {
                        const afterPage = parts[1].trim();
                        const name = afterPage.split(/[\\s\\n]/)[0];
                        if (name && name.length >= 2 && name.length <= 10) {
                            result[title] = name;
                            break;
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        return result;
    }''')
    return authors_map

async def main():
    print("=" * 60)
    print("  PKULaw 刑法文章采集")
    print("=" * 60)

    # 读取已有的标题数据
    with open('/Users/yalipeng/Downloads/2025CLSCI/output/all_titles_2025.json', 'r') as f:
        all_articles = json.load(f)

    print(f"已有 {len(all_articles)} 篇文章题录")

    # 标记刑法相关文章
    criminal_articles = []
    for art in all_articles:
        art['is_criminal_law'] = art['title'] in CRIMINAL_LAW_TITLES
        if art['is_criminal_law']:
            criminal_articles.append(art)

    print(f"其中刑法相关: {len(criminal_articles)} 篇")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={'width': 1400, 'height': 900},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )

        # 步骤1：从列表页补全作者信息
        print("\n步骤1: 补全作者信息...")
        page = await context.new_page()
        await page.goto("https://www.pkulaw.com/singlejournal/qikan/1", wait_until='domcontentloaded')
        await asyncio.sleep(2)

        # 点击2025年
        await page.evaluate('''() => {
            const links = document.querySelectorAll('a');
            for (const link of links) {
                if (link.textContent.trim() === '2025') {
                    link.click();
                    return;
                }
            }
        }''')
        await asyncio.sleep(2)

        # 遍历页面获取作者
        all_authors = {}
        for page_num in range(1, 6):  # 5页
            print(f"  第{page_num}页...")
            authors = await scrape_list_page_authors(page)
            all_authors.update(authors)

            if page_num < 5:
                await page.evaluate('''() => {
                    const links = document.querySelectorAll('a');
                    for (const link of links) {
                        if (link.textContent.trim() === '下一页') {
                            link.click();
                            return;
                        }
                    }
                }''')
                await asyncio.sleep(2)

        await page.close()

        # 更新作者信息
        for art in all_articles:
            if art['title'] in all_authors:
                art['author'] = all_authors[art['title']]

        print(f"  获取到 {len(all_authors)} 个作者")

        # 步骤2：采集刑法文章详情
        print(f"\n步骤2: 采集 {len(criminal_articles)} 篇刑法文章详情...")

        criminal_details = []
        for i, art in enumerate(criminal_articles, 1):
            print(f"\n[{i}/{len(criminal_articles)}] {art['title'][:40]}...")

            detail = await scrape_detail(context, art)

            if detail:
                result = {
                    'journal': '中国法学',
                    'year': art['year'],
                    'issue': art['issue'],
                    'page': art.get('page', ''),
                    'title': art['title'],
                    'author': detail['author'] or art.get('author', ''),
                    'institution': detail['institution'],
                    'abstract_cn': detail['abstract_cn'],
                    'abstract_en': detail['abstract_en'],
                    'keywords': detail['keywords'],
                    'toc': detail['toc'],
                    'fulltext_preview': detail['fulltext'],
                    'url': art['href'],
                    'scraped_at': datetime.now().isoformat()
                }
                criminal_details.append(result)

                if detail['abstract_cn']:
                    print(f"    ✓ 摘要: {detail['abstract_cn'][:50]}...")
                else:
                    print(f"    ! 未获取到摘要")
            else:
                print(f"    ✗ 采集失败")

            # 随机延迟，避免被ban
            delay = random.uniform(3, 6)
            print(f"    等待 {delay:.1f}s...")
            await asyncio.sleep(delay)

        await browser.close()

    # 保存结果
    print("\n保存结果...")

    # 1. 全部题录
    catalog_file = '/Users/yalipeng/Downloads/2025CLSCI/output/中国法学_2025_全部题录.json'
    catalog_data = [{
        'journal': '中国法学',
        'year': a['year'],
        'issue': a['issue'],
        'page': a.get('page', ''),
        'title': a['title'],
        'author': a.get('author', ''),
        'is_criminal_law': a['is_criminal_law'],
        'url': a['href']
    } for a in all_articles if a['title'] != '2025年总目录']

    with open(catalog_file, 'w', encoding='utf-8') as f:
        json.dump(catalog_data, f, ensure_ascii=False, indent=2)
    print(f"  题录: {catalog_file} ({len(catalog_data)}篇)")

    # 2. 刑法文章详情
    criminal_file = '/Users/yalipeng/Downloads/2025CLSCI/output/中国法学_2025_刑法文章.json'
    with open(criminal_file, 'w', encoding='utf-8') as f:
        json.dump(criminal_details, f, ensure_ascii=False, indent=2)
    print(f"  刑法详情: {criminal_file} ({len(criminal_details)}篇)")

    # 统计
    print(f"\n{'=' * 60}")
    print(f"采集完成!")
    print(f"  全部文章: {len(catalog_data)} 篇")
    print(f"  刑法文章: {len(criminal_details)} 篇")
    print(f"  刑法占比: {100*len(criminal_details)/len(catalog_data):.1f}%")
    print(f"{'=' * 60}")

if __name__ == '__main__':
    asyncio.run(main())
