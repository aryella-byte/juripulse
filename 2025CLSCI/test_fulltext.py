#!/usr/bin/env python3
"""
测试详情页全文采集
"""

import asyncio
from playwright.async_api import async_playwright

async def test_fulltext():
    print("启动浏览器...")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={'width': 1400, 'height': 900},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        page = await context.new_page()

        # 直接打开一篇文章的详情页
        url = "https://www.pkulaw.com/qikan/f0e8392490859c607585e82eea42cda6bdfb.html"
        print(f"访问详情页: {url}")
        await page.goto(url, wait_until='domcontentloaded')
        await asyncio.sleep(5)

        # 先打印整个页面的文本，看看有什么
        print("\n获取页面全部文本...")
        full_text = await page.evaluate('() => document.body.innerText')

        print(f"\n{'='*60}")
        print("页面全文内容:")
        print(f"{'='*60}")
        print(full_text[:3000])
        print(f"\n... 总共 {len(full_text)} 字符")

        # 检查是否有特定区域
        print(f"\n{'='*60}")
        print("检查页面元素...")

        elements = await page.evaluate('''() => {
            const info = [];

            // 检查所有有class的div
            const divs = document.querySelectorAll('div[class]');
            divs.forEach(div => {
                const cls = div.className;
                const text = div.textContent.trim();
                if (text.length > 100 && text.length < 10000) {
                    info.push({
                        tag: 'div',
                        class: cls.substring(0, 50),
                        textLen: text.length,
                        preview: text.substring(0, 150).replace(/\\s+/g, ' ')
                    });
                }
            });

            return info.slice(0, 15);
        }''')

        for el in elements:
            print(f"  {el['tag']}.{el['class']} ({el['textLen']}字)")
            print(f"    -> {el['preview'][:80]}...")

        # 截图
        await page.screenshot(path='/Users/yalipeng/Downloads/2025CLSCI/detail_page.png', full_page=True)
        print("\n已保存完整截图: detail_page.png")

        print("\n浏览器保持打开20秒...")
        await asyncio.sleep(20)

        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_fulltext())
