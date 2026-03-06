#!/usr/bin/env python3
"""
测试脚本：采集一篇文章试水
1. 打开中国法学期刊页面
2. 点击2025年筛选
3. 获取第一篇文章信息
4. 点击概览获取摘要
"""

import asyncio
from playwright.async_api import async_playwright

async def test_single_article():
    print("启动浏览器...")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={'width': 1400, 'height': 900},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        page = await context.new_page()

        # 访问中国法学期刊页面
        url = "https://www.pkulaw.com/singlejournal/qikan/1"
        print(f"访问: {url}")
        await page.goto(url, wait_until='domcontentloaded')
        await asyncio.sleep(3)

        # 步骤1：点击左侧"2025"年份
        print("\n步骤1: 点击2025年份筛选...")
        year_clicked = await page.evaluate('''() => {
            // 在左侧期刊年份区域找2025
            const yearElements = document.querySelectorAll('.qk-year a, .year-list a, [class*="year"] a, .sidebar a, dt, dd, li');
            for (const el of yearElements) {
                const text = el.textContent.trim();
                if (text === '2025' || text === '2025年') {
                    console.log('找到年份:', text);
                    el.click();
                    return true;
                }
            }
            // 备用：找所有链接
            const allLinks = document.querySelectorAll('a');
            for (const el of allLinks) {
                if (el.textContent.trim() === '2025') {
                    el.click();
                    return true;
                }
            }
            return false;
        }''')
        print(f"   年份点击结果: {year_clicked}")
        await asyncio.sleep(2)

        # 步骤2：获取当前页面文章列表
        print("\n步骤2: 获取文章列表...")
        articles = await page.evaluate('''() => {
            const results = [];
            // 查找所有文章条目 - 根据截图结构
            const items = document.querySelectorAll('[class*="article"], [class*="item"], .result-item, .qk-item');

            // 如果上面没找到，尝试找包含"概览"的区块
            let containers = items.length > 0 ? items : document.querySelectorAll('div');

            for (const item of containers) {
                const text = item.textContent;
                // 检查是否包含文章特征
                if (text.includes('概览') && text.includes('2025年')) {
                    // 提取标题 - 通常是第一个链接
                    const titleLink = item.querySelector('a[href*="/qikan/"]');
                    const title = titleLink ? titleLink.textContent.trim() : '';
                    const href = titleLink ? titleLink.href : '';

                    // 提取年份、期数等
                    const yearMatch = text.match(/(\d{4})年/);
                    const issueMatch = text.match(/第(\d+)期/);
                    const pageMatch = text.match(/第(\d+)页/);

                    // 提取作者 - 通常在页码后面
                    const authorMatch = text.match(/第\d+页\s+([^\s《]+)/);

                    if (title && title.length > 4 && !title.includes('目录')) {
                        results.push({
                            title: title,
                            href: href,
                            year: yearMatch ? yearMatch[1] : '',
                            issue: issueMatch ? issueMatch[1] : '',
                            page: pageMatch ? pageMatch[1] : '',
                            author: authorMatch ? authorMatch[1] : ''
                        });
                    }
                }
            }

            // 去重
            const seen = new Set();
            return results.filter(a => {
                if (seen.has(a.title)) return false;
                seen.add(a.title);
                return true;
            });
        }''')

        print(f"   找到 {len(articles)} 篇文章")
        if articles:
            for i, art in enumerate(articles[:5], 1):
                print(f"   {i}. {art['title'][:30]}... | {art['year']}年第{art['issue']}期 | {art['author']}")

        # 步骤3：点击第一篇文章的"概览"获取摘要
        if articles:
            print(f"\n步骤3: 点击第一篇文章的概览...")
            first_title = articles[0]['title']

            # 方法1：直接找所有"概览"链接，点击第一个
            clicked = await page.evaluate('''() => {
                const links = document.querySelectorAll('a');
                for (const link of links) {
                    if (link.textContent.trim() === '概览') {
                        link.click();
                        return 'clicked first 概览';
                    }
                }
                return 'not found';
            }''')
            print(f"   概览点击结果: {clicked}")
            await asyncio.sleep(3)

            # 尝试获取弹出的摘要内容
            abstract_text = await page.evaluate('''() => {
                // 方法1：查找layer弹窗（pkulaw常用）
                const layer = document.querySelector('.layui-layer, .layer-content, .layui-layer-content');
                if (layer) {
                    return 'layer: ' + layer.textContent.trim().substring(0, 800);
                }

                // 方法2：查找modal
                const modal = document.querySelector('.modal, .dialog, [class*="modal"], [class*="dialog"]');
                if (modal && modal.offsetParent !== null) {
                    return 'modal: ' + modal.textContent.trim().substring(0, 800);
                }

                // 方法3：查找摘要相关class
                const possibleSelectors = [
                    '.abstract', '.summary', '.zy', '.zhaiyao',
                    '[class*="abstract"]', '[class*="overview"]'
                ];
                for (const sel of possibleSelectors) {
                    const el = document.querySelector(sel);
                    if (el && el.textContent.trim().length > 50) {
                        return 'selector: ' + el.textContent.trim().substring(0, 800);
                    }
                }

                // 方法4：检查body中是否有新增的浮层
                const allDivs = document.querySelectorAll('div[style*="z-index"]');
                for (const div of allDivs) {
                    const text = div.textContent.trim();
                    if (text.includes('摘要') && text.length > 100) {
                        return 'zindex-div: ' + text.substring(0, 800);
                    }
                }

                return '';
            }''')

            if abstract_text:
                print(f"   摘要内容:\n{abstract_text[:500]}...")
            else:
                print("   未获取到弹窗摘要，尝试进入详情页...")

                # 方法2：进入文章详情页获取摘要
                if articles[0]['href']:
                    print(f"   打开详情页: {articles[0]['href']}")
                    detail_page = await context.new_page()
                    await detail_page.goto(articles[0]['href'], wait_until='domcontentloaded')
                    await asyncio.sleep(3)

                    detail_info = await detail_page.evaluate('''() => {
                        const getText = (selectors) => {
                            for (const sel of selectors) {
                                const el = document.querySelector(sel);
                                if (el) return el.textContent.trim();
                            }
                            return '';
                        };

                        // 尝试从页面文本中提取摘要
                        const bodyText = document.body.innerText;
                        const abstractMatch = bodyText.match(/摘\s*要[：:]\s*([\s\S]{20,500}?)(?=关键词|关\s*键\s*词|Keywords|$)/i);

                        return {
                            title: getText(['h1', '.title', '.article-title']),
                            author: getText(['.author', '.authors', '.writer', '[class*="author"]']),
                            abstract: abstractMatch ? abstractMatch[1].trim() : getText(['.abstract', '.summary', '.zy', '[class*="abstract"]']),
                            keywords: getText(['.keywords', '.keyword', '.gjc', '[class*="keyword"]']),
                            pageHtml: document.body.innerHTML.substring(0, 2000)
                        };
                    }''')

                    print(f"   详情页标题: {detail_info['title']}")
                    print(f"   详情页作者: {detail_info['author']}")
                    print(f"   详情页摘要: {detail_info['abstract'][:200] if detail_info['abstract'] else '无'}...")
                    print(f"   详情页关键词: {detail_info['keywords']}")

                    await detail_page.close()

        # 步骤4：检查翻页元素
        print("\n步骤4: 检查翻页元素...")
        pagination = await page.evaluate('''() => {
            const info = {
                currentPage: '',
                totalPages: '',
                hasNextPage: false,
                nextPageSelector: ''
            };

            // 查找页码信息: "页数 1/25"
            const pageText = document.body.innerText;
            const pageMatch = pageText.match(/页数\s*(\d+)\s*\/\s*(\d+)/);
            if (pageMatch) {
                info.currentPage = pageMatch[1];
                info.totalPages = pageMatch[2];
            }

            // 查找下一页按钮
            const nextBtns = document.querySelectorAll('a');
            for (const btn of nextBtns) {
                if (btn.textContent.trim() === '下一页') {
                    info.hasNextPage = true;
                    info.nextPageSelector = 'found';
                    break;
                }
            }

            return info;
        }''')

        print(f"   当前页: {pagination['currentPage']}/{pagination['totalPages']}")
        print(f"   有下一页: {pagination['hasNextPage']}")

        print("\n测试完成，浏览器保持打开30秒供观察...")
        await asyncio.sleep(30)

        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_single_article())
