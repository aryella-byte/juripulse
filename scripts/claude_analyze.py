#!/usr/bin/env python3
"""
claude_analyze.py — 使用 LLM API 对 CLSCI 文章进行智能分析。

支持 Kimi Coding API（Anthropic SDK 兼容）或原生 Anthropic API。

功能：
- 批量分析（每批 10-15 篇）
- 多标签主题分类（27 个法学主题）
- 研究方法智能识别
- 语义关键词提取
- 一句话摘要生成
- 刑法相关度评分
- 结果缓存

使用方法（Kimi Coding API）：
  export ANTHROPIC_BASE_URL=https://api.kimi.com/coding/
  export ANTHROPIC_API_KEY=sk-kimi-...
  python scripts/claude_analyze.py

使用方法（原生 Anthropic）：
  export ANTHROPIC_API_KEY=sk-ant-...
  python scripts/claude_analyze.py
"""

import json
import os
import sys
import hashlib
import time
from pathlib import Path

try:
    from anthropic import Anthropic
except ImportError:
    print("ERROR: 请先安装 anthropic: pip install anthropic>=0.40.0")
    sys.exit(1)

# ============================================================
# Paths
# ============================================================
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CANDIDATES_PATH = PROJECT_ROOT / "2025CLSCI" / "output" / "criminal_law_candidates.json"
FULLTEXT_DIR = PROJECT_ROOT / "2025CLSCI" / "fulltext"  # 全文目录（待爬取）
CACHE_DIR = SCRIPT_DIR / "cache"
OUTPUT_DIR = SCRIPT_DIR / "output"

CACHE_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================
# Topics & Methods
# ============================================================
TOPICS = [
    "法益理论与犯罪构成", "刑法解释与方法论", "刑法一般理论",
    "轻罪治理与出罪机制", "经济刑法与反腐败", "行刑衔接与法秩序统一",
    "AI与算法刑法", "网络犯罪与平台治理", "数据法与数字法治",
    "认罪认罚从宽制度", "量刑制度与刑罚论", "正当防卫与紧急避险",
    "共犯理论与共同犯罪", "企业合规与单位犯罪", "财产犯罪与侵占",
    "少年司法与未成年人保护", "国际刑法与跨境犯罪", "环境犯罪与资源保护",
    "知识产权刑法保护", "刑事政策与犯罪预防", "刑事诉讼程序",
    "检察与监察制度", "民事责任与侵权法", "公司法与金融证券",
    "行政法与行政诉讼", "宪法学与基本权利",
]

METHODS = [
    "法教义学分析", "实证研究", "比较法研究",
    "规范建构", "跨学科研究", "案例研究法",
]

BATCH_SIZE = 12
# 自动检测 API 端点：Kimi 用 kimi 模型，Anthropic 用 Haiku
BASE_URL = os.environ.get("ANTHROPIC_BASE_URL", "")
IS_KIMI = "kimi" in BASE_URL.lower()
MODEL = "kimi" if IS_KIMI else "claude-haiku-4-5-20251001"


def get_cache_key(title: str) -> str:
    return hashlib.md5(title.encode()).hexdigest()


def load_cache(title: str) -> dict | None:
    key = get_cache_key(title)
    cache_file = CACHE_DIR / f"{key}.json"
    if cache_file.exists():
        with open(cache_file, "r") as f:
            return json.load(f)
    return None


def save_cache(title: str, result: dict):
    key = get_cache_key(title)
    cache_file = CACHE_DIR / f"{key}.json"
    with open(cache_file, "w") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)


def load_fulltext(title: str) -> str | None:
    """尝试加载文章全文。"""
    if not FULLTEXT_DIR.exists():
        return None
    # 按标题哈希或文件名匹配
    safe_name = title.replace("/", "_").replace("\\", "_")[:80]
    for ext in [".txt", ".md"]:
        path = FULLTEXT_DIR / f"{safe_name}{ext}"
        if path.exists():
            return path.read_text(encoding="utf-8")
    # 也尝试哈希文件名
    key = hashlib.md5(title.encode()).hexdigest()
    for ext in [".txt", ".md"]:
        path = FULLTEXT_DIR / f"{key}{ext}"
        if path.exists():
            return path.read_text(encoding="utf-8")
    return None


def analyze_batch(client: Anthropic, articles: list[dict], use_fulltext: bool = False) -> list[dict]:
    """Analyze a batch of articles using LLM API."""

    if use_fulltext:
        # 全文模式：每篇单独调用，传入全文
        return analyze_fulltext_batch(client, articles)

    articles_text = "\n".join(
        f"{i+1}. 标题：{a['title']}  期刊：{a.get('journal','')}  期号：{a.get('issue','')}"
        for i, a in enumerate(articles)
    )

    topics_list = "\n".join(f"- {t}" for t in TOPICS)
    methods_list = "\n".join(f"- {m}" for m in METHODS)

    prompt = f"""请分析以下 {len(articles)} 篇中国法学论文，为每篇返回 JSON 分析结果。

论文列表：
{articles_text}

可选主题（每篇可多选 1-3 个）：
{topics_list}

可选研究方法（每篇选 1-2 个）：
{methods_list}

请返回一个 JSON 数组，每个元素包含：
{{
  "index": 序号(1开始),
  "topics": ["主题1", "主题2"],
  "methods": ["方法1"],
  "keywords": ["关键词1", "关键词2", "关键词3"],  // 3-6个语义关键词，避免截断
  "summary": "一句话摘要（20-40字）",
  "relevance_score": 8  // 刑法相关度 1-10
}}

要求：
1. topics 必须从上述列表中选择
2. keywords 要求完整、有意义的法学术语（如"虚开增值税专用发票"而非"虚开增值"）
3. relevance_score: 纯刑法/刑诉 8-10，泛刑法 5-7，仅标题含刑法词但实为其他领域 1-4
4. 只返回 JSON 数组，不要其他内容"""

    return _call_api(client, prompt)


def analyze_fulltext_batch(client: Anthropic, articles: list[dict]) -> list[dict]:
    """逐篇分析全文。"""
    topics_list = "\n".join(f"- {t}" for t in TOPICS)
    methods_list = "\n".join(f"- {m}" for m in METHODS)
    results = []

    for i, a in enumerate(articles):
        fulltext = load_fulltext(a["title"])
        if not fulltext:
            print(f"  [跳过] 无全文: {a['title'][:40]}...")
            continue

        # 截取前 6000 字（避免 token 超限）
        text_excerpt = fulltext[:6000]

        prompt = f"""请分析以下中国法学论文，返回 JSON 分析结果。

标题：{a['title']}
期刊：{a.get('journal', '')}  期号：{a.get('issue', '')}

论文全文（节选）：
{text_excerpt}

可选主题（可多选 1-3 个）：
{topics_list}

可选研究方法（选 1-2 个）：
{methods_list}

请返回一个 JSON 对象：
{{
  "topics": ["主题1", "主题2"],
  "methods": ["方法1"],
  "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"],
  "summary": "一句话摘要（20-40字）",
  "relevance_score": 8
}}

要求：
1. topics 必须从上述列表中选择，基于全文内容准确分类
2. keywords 要求完整、有意义的法学术语，3-6个
3. summary 基于全文内容撰写，概括核心论点
4. relevance_score: 纯刑法/刑诉 8-10，泛刑法 5-7，其他领域 1-4
5. 只返回 JSON 对象，不要其他内容"""

        batch_result = _call_api(client, prompt)
        if batch_result:
            result = batch_result if isinstance(batch_result, dict) else batch_result[0]
            result["index"] = i + 1
            results.append(result)
            print(f"  ✓ [{i+1}/{len(articles)}] {a['title'][:40]}...")
        else:
            print(f"  ✗ [{i+1}/{len(articles)}] {a['title'][:40]}...")

        time.sleep(0.5)  # rate limit

    return results


def _call_api(client: Anthropic, prompt: str) -> list[dict] | dict:
    """Call LLM API and parse JSON response."""
    try:
        resp = client.messages.create(
            model=MODEL,
            max_tokens=4000,
            temperature=0.2,
            messages=[{"role": "user", "content": prompt}],
        )
        text = resp.content[0].text.strip()
        # Clean markdown code blocks
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        return json.loads(text)
    except Exception as e:
        print(f"  API call failed: {e}")
        return []


def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: 请设置 ANTHROPIC_API_KEY 环境变量")
        print("  Kimi: export ANTHROPIC_BASE_URL=https://api.kimi.com/coding/")
        print("        export ANTHROPIC_API_KEY=sk-kimi-...")
        print("  Anthropic: export ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)

    if not CANDIDATES_PATH.exists():
        print(f"ERROR: 找不到候选文章: {CANDIDATES_PATH}")
        sys.exit(1)

    with open(CANDIDATES_PATH, "r") as f:
        articles = json.load(f)

    # 检测是否有全文可用
    use_fulltext = FULLTEXT_DIR.exists() and any(FULLTEXT_DIR.iterdir())
    mode_str = "全文分析" if use_fulltext else "标题分析"
    api_str = f"Kimi ({BASE_URL})" if IS_KIMI else f"Anthropic ({MODEL})"

    print(f"加载 {len(articles)} 篇候选文章")
    print(f"API: {api_str}")
    print(f"模式: {mode_str}")

    # Check cache
    uncached = []
    cached_results = {}
    cache_suffix = "_fulltext" if use_fulltext else ""
    for a in articles:
        cached = load_cache(a["title"] + cache_suffix)
        if cached:
            cached_results[a["title"]] = cached
        else:
            uncached.append(a)

    print(f"已缓存: {len(cached_results)}, 待分析: {len(uncached)}")

    if uncached:
        client_kwargs = {"api_key": api_key}
        if BASE_URL:
            client_kwargs["base_url"] = BASE_URL
        client = Anthropic(**client_kwargs)

        if use_fulltext:
            # 全文模式：逐篇分析
            print(f"全文逐篇分析 {len(uncached)} 篇...")
            results = analyze_batch(client, uncached, use_fulltext=True)
            for result in results:
                idx = result.get("index", 0) - 1
                if 0 <= idx < len(uncached):
                    title = uncached[idx]["title"]
                    save_cache(title + cache_suffix, result)
                    cached_results[title] = result
        else:
            # 标题批量模式
            batches = [uncached[i : i + BATCH_SIZE] for i in range(0, len(uncached), BATCH_SIZE)]
            print(f"共 {len(batches)} 批，每批 {BATCH_SIZE} 篇")

            for batch_idx, batch in enumerate(batches):
                print(f"\n处理第 {batch_idx + 1}/{len(batches)} 批...")
                results = analyze_batch(client, batch)

                for result in results:
                    idx = result.get("index", 0) - 1
                    if 0 <= idx < len(batch):
                        title = batch[idx]["title"]
                        save_cache(title + cache_suffix, result)
                        cached_results[title] = result
                        print(f"  ✓ {title[:40]}...")

                # Rate limiting
                if batch_idx < len(batches) - 1:
                    time.sleep(1)

    # Merge results into enriched articles
    enriched = []
    for a in articles:
        result = cached_results.get(a["title"], {})
        enriched.append({
            "title": a.get("title", ""),
            "journal": a.get("journal", ""),
            "year": a.get("year", "2025"),
            "issue": a.get("issue", ""),
            "page": a.get("page", ""),
            "author": a.get("author", ""),
            "topics": result.get("topics", []),
            "methods": result.get("methods", []),
            "keywords": result.get("keywords", []),
            "summary": result.get("summary", ""),
            "relevance_score": result.get("relevance_score", 5),
        })

    output_path = OUTPUT_DIR / "enriched_articles.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)

    # Stats
    topic_counts = {}
    for a in enriched:
        for t in a["topics"]:
            topic_counts[t] = topic_counts.get(t, 0) + 1
    no_topic = sum(1 for a in enriched if not a["topics"])

    print(f"\n=== 分析完成 ===")
    print(f"总文章: {len(enriched)}")
    print(f"无主题: {no_topic} ({no_topic/len(enriched)*100:.1f}%)")
    print(f"主题分布:")
    for t, c in sorted(topic_counts.items(), key=lambda x: -x[1]):
        print(f"  {t}: {c}")
    print(f"\n输出: {output_path}")


if __name__ == "__main__":
    main()
