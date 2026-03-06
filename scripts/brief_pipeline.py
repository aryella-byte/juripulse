#!/usr/bin/env python3
"""
brief_pipeline.py — Legal Brief 数据管线。

RSS 抓取 → AI 分析 → 生成双语摘要 → 输出 JSON。

使用方法：
  export KIMI_API_KEY=sk-...
  python scripts/brief_pipeline.py
"""

import json
import os
import sys
import re
import hashlib
import time
from datetime import datetime
from pathlib import Path

try:
    import feedparser
except ImportError:
    print("ERROR: pip install feedparser")
    sys.exit(1)

try:
    from openai import OpenAI
except ImportError:
    print("ERROR: pip install openai")
    sys.exit(1)

# ============ Config ============
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_FILE = PROJECT_ROOT / "public" / "data" / "brief_data.json"

NEWS_SOURCES = {
    "SCOTUSblog": "https://www.scotusblog.com/feed/",
    "JURIST": "https://www.jurist.org/feed/",
    "Financial Times": "https://www.ft.com/rss/home",
    "The Economist": "https://www.economist.com/leaders/rss.xml",
    "WSJ": "https://feeds.content.dowjones.io/public/rss/WSJcomUSBusiness",
}

RESEARCH_SOURCES = {
    "Harvard Law Review": "https://harvardlawreview.org/feed/",
    "Stanford Law Review": "https://www.stanfordlawreview.org/feed/",
    "Columbia Law Review": "https://columbialawreview.org/feed/",
    "NYU Law Review": "https://www.nyulawreview.org/feed/",
    "Michigan Law Review": "https://michiganlawreview.org/feed/",
    "Virginia Law Review": "https://virginialawreview.org/feed/",
    "Cornell Law Review": "https://cornelllawreview.org/feed/",
    "California Law Review": "https://www.californialawreview.org/feed/",
}

JUNK_KEYWORDS = [
    "call for submissions", "essay competition", "announcement",
    "career", "job opening", "fellowship", "subscribe", "newsletter",
    "podcast", "video", "webinar", "live blog", "liveblog",
    "symposium", "conference", "scotustoday",
]

MAX_NEWS_PER_DAY = 5
MAX_RESEARCH_PER_DAY = 3
MIN_QUALITY_SCORE = 7
MODEL = "kimi-k2p5"


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def load_data():
    if DATA_FILE.exists():
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"news": [], "research": []}


def save_data(data):
    data["news"].sort(key=lambda x: x.get("date", ""), reverse=True)
    data["research"].sort(key=lambda x: x.get("date", ""), reverse=True)
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    log(f"Saved to {DATA_FILE}")


def get_item_id(title):
    return hashlib.md5(title.encode()).hexdigest()[:12]


def is_junk(title):
    text = title.lower()
    return any(j in text for j in JUNK_KEYWORDS)


def fetch_feed(url, source):
    try:
        log(f"Fetching {source}...")
        feed = feedparser.parse(url)
        items = []
        for entry in feed.entries[:15]:
            title = entry.get("title", "").strip()
            if not title or is_junk(title):
                continue
            date_str = entry.get("published", entry.get("updated", ""))
            date = parse_date(date_str)
            items.append({"title": title, "url": entry.get("link", ""), "date": date})
        log(f"  {source}: {len(items)} candidates")
        return items
    except Exception as e:
        log(f"  {source} failed: {e}")
        return []


def parse_date(date_str):
    if not date_str:
        return datetime.now().strftime("%Y-%m-%d")
    for fmt in ["%a, %d %b %Y %H:%M:%S %z", "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%d"]:
        try:
            return datetime.strptime(date_str[: len(fmt) + 10].strip(), fmt).strftime("%Y-%m-%d")
        except (ValueError, IndexError):
            continue
    return datetime.now().strftime("%Y-%m-%d")


def analyze_with_ai(client, title, source, is_research=False):
    content_type = "法学研究论文" if is_research else "法律新闻"
    prompt = f"""分析以下{content_type}，返回JSON（不要markdown代码块）：

标题：{title}
来源：{source}

{{
  "summaryCN": "60-100字中文摘要",
  "whyMattersCN": "80-120字重要性分析，包含比较法视角",
  "tags": ["标签1", "标签2"],
  "category": "constitutional|criminal|international|corporate|tech|general"
}}"""

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            max_tokens=800,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}],
        )
        text = resp.choices[0].message.content.strip()
        text = re.sub(r"^```json\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        return json.loads(text)
    except Exception as e:
        log(f"  AI analysis failed: {e}")
        return None


def generate_tags(category, tags_list):
    tag_classes = {
        "constitutional": "constitutional",
        "criminal": "criminal",
        "international": "international",
        "corporate": "constitutional",
        "tech": "tech",
        "general": "",
    }
    return [
        {"name": tag, "class": tag_classes.get(category, "")}
        for tag in tags_list[:2]
    ] or [{"name": "法律动态", "class": ""}]


def update_section(client, data, sources, key, max_items, is_research=False):
    existing_ids = {get_item_id(item["title"]) for item in data.get(key, [])}
    new_items = []

    for source, url in sources.items():
        if len(new_items) >= max_items:
            break
        items = fetch_feed(url, source)
        for item in items:
            if len(new_items) >= max_items:
                break
            if get_item_id(item["title"]) in existing_ids:
                continue

            log(f"  Analyzing: {item['title'][:50]}...")
            analysis = analyze_with_ai(client, item["title"], source, is_research)
            if not analysis or len(analysis.get("summaryCN", "")) < 20:
                continue

            entry = {
                "title": item["title"],
                "titleCN": item["title"],
                "url": item["url"],
                "date": item["date"],
                "summaryCN": analysis["summaryCN"],
                "summaryEN": "",
                "whyMattersCN": analysis.get("whyMattersCN", ""),
                "whyMattersEN": "",
                "tags": generate_tags(analysis.get("category", ""), analysis.get("tags", [])),
                "quality_score": 8,
            }
            if is_research:
                entry["journal"] = source
            else:
                entry["source"] = source

            new_items.append(entry)
            existing_ids.add(get_item_id(item["title"]))
            time.sleep(0.5)

    data[key].extend(new_items)
    log(f"  {key}: +{len(new_items)} new items")
    return data


def main():
    api_key = os.environ.get("KIMI_API_KEY")
    if not api_key:
        log("No KIMI_API_KEY set. Skipping AI analysis.")
        log("Existing data will be preserved.")
        return

    client = OpenAI(api_key=api_key, base_url="https://api.kimi.com/coding/v1")
    data = load_data()
    log(f"Current: {len(data.get('news', []))} news, {len(data.get('research', []))} research")

    data = update_section(client, data, NEWS_SOURCES, "news", MAX_NEWS_PER_DAY)
    data = update_section(client, data, RESEARCH_SOURCES, "research", MAX_RESEARCH_PER_DAY, is_research=True)

    save_data(data)
    log(f"Final: {len(data['news'])} news, {len(data['research'])} research")


if __name__ == "__main__":
    main()
