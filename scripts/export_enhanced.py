#!/usr/bin/env python3
"""
export_enhanced.py — 从 AI 分析结果或候选文章生成前端 JSON。

优先使用 claude_analyze.py 的 AI 分析结果；
若无 AI 结果，则使用增强版关键词分类作为 fallback。

使用方法：
  python scripts/export_enhanced.py
"""

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_ROOT / "public" / "data"
ENRICHED_PATH = SCRIPT_DIR / "output" / "enriched_articles.json"
CANDIDATES_PATH = PROJECT_ROOT / "2025CLSCI" / "output" / "criminal_law_candidates.json"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================
# 增强版关键词主题分类（fallback 用）
# ============================================================
TOPIC_KW = {
    # === 刑法总论 ===
    "法益理论与犯罪构成": [
        "法益", "归责", "构成要件", "违法性", "不法", "犯罪论", "规范论",
        "行为无价值", "结果无价值", "因果关系", "客观归责",
        "犯罪构成", "犯罪主体", "罪责", "归咎", "责任主义",
        "被害人承诺", "过失犯", "预见可能性", "原因自由行为",
        "规范性要素", "包括一罪", "注意规范", "保护目的",
        "刑事责任能力", "精神病人", "定罪", "业务过失",
    ],
    "刑法解释与方法论": [
        "刑法解释", "体系解释", "目的解释", "文义解释", "罪刑法定",
        "类推", "扩张解释", "限缩解释", "法教义学", "刑法教义学",
        "补正解释", "交互解释", "有利于被告", "存疑",
        "法逻辑", "刑法适用", "社科法学", "教义学分析",
    ],
    "刑法一般理论": [
        "刑法学", "刑法功能", "刑法立法", "谦抑", "刑事违法",
        "自主知识体系", "刑法知识", "中国刑法", "刑法表达",
        "领域刑法", "法体系中的刑法", "刑事可罚", "刑事立法",
        "刑法体系", "刑法理论", "刑法评价", "刑法定性",
        "预防性立法", "刑法边界", "刑法保护模式", "刑法规制模式",
        "罪名体系", "犯罪化", "除罪化", "刑法要义", "刑法规制",
        "刑事法制", "刑事法", "国家安全观", "法体系",
        "刑法介入", "入罪界限", "刑事一体",
    ],
    "轻罪治理与出罪机制": [
        "轻罪", "犯罪记录", "前科", "出罪", "但书", "微罪",
        "附条件不起诉", "轻刑", "醉驾", "犯罪分层",
        "相对不起诉", "酌定不起诉", "轻微犯罪",
    ],
    "经济刑法与反腐败": [
        "受贿", "贪污", "行贿", "洗钱", "经济刑法", "非法经营",
        "金融犯罪", "职务犯罪", "挪用", "侵吞",
        "虚开增值税专用发票", "虚开", "经济犯罪",
        "截贿", "骗取贷款", "非法牟利", "非法吸收公众存款",
        "配资", "破坏生产经营", "玩忽职守", "拒不执行",
    ],
    "行刑衔接与法秩序统一": [
        "行刑", "刑民", "民刑", "行政犯", "法定犯", "法秩序",
        "衔接", "竞合", "二元制裁", "责任倒挂", "刑行",
        "治安管理", "民事救济阻断", "公共风险", "行主刑辅",
        "商刑交叉",
    ],
    "AI与算法刑法": [
        "人工智能", "AI", "算法", "大模型", "深度伪造",
        "自动驾驶", "机器人", "智能", "人机共驾", "大语言模型",
    ],
    "网络犯罪与平台治理": [
        "网络犯罪", "网络暴力", "电信诈骗", "帮信", "帮助信息",
        "网络安全", "黑产", "网络诈骗", "平台", "网络平台",
        "互联网", "电子商务", "守门人", "网络聚合", "合作规制",
        "分布式拒绝服务", "网络时代", "恢复义务",
    ],
    "数据法与数字法治": [
        "数据犯罪", "个人信息", "数据安全", "数据保护", "隐私",
        "公民个人信息", "数字时代", "数字化", "数字经济",
        "数字法学", "数字检察", "数据权益", "数据资产",
        "虚拟货币", "数据泄露", "公共数据", "商业数据",
        "企业数据", "数字金融", "电子数据", "数据调取",
        "私密图像", "数据", "数字",
    ],
    "认罪认罚从宽制度": [
        "认罪认罚", "从宽", "速裁", "控辩协商",
    ],
    "量刑制度与刑罚论": [
        "量刑", "裁量", "刑罚", "缓刑", "减刑", "假释",
        "数罪并罚", "悔罪", "驱逐出境", "暂予监外",
        "社区矫正", "刑罚执行", "监狱", "犯罪数额",
        "违法所得", "特别残忍手段",
    ],
    "正当防卫与紧急避险": [
        "正当防卫", "防卫过当", "紧急避险", "防卫", "互殴",
        "自甘冒险",
    ],
    "共犯理论与共同犯罪": [
        "共犯", "共谋", "共同犯罪", "帮助犯", "正犯", "教唆",
        "从犯", "间接正犯",
    ],
    "企业合规与单位犯罪": [
        "单位犯罪", "企业合规", "企业刑事", "涉企",
        "合规不起诉", "法人犯罪", "企业产权", "民营企业",
        "营商环境", "商业创新",
    ],
    "财产犯罪与侵占": [
        "盗窃", "财产犯罪", "占有", "诈骗", "侵占", "抢劫",
        "敲诈勒索",
    ],
    "少年司法与未成年人保护": [
        "未成年", "少年", "校园", "低龄犯罪",
    ],
    "国际刑法与跨境犯罪": [
        "国际刑法", "跨境", "引渡", "国际合作", "恐怖主义", "反恐",
        "域外适用", "属人管辖", "涉外刑事", "海外",
        "涉外", "投资条约",
    ],
    "环境犯罪与资源保护": [
        "环境犯罪", "污染", "生态", "公益诉讼", "野生动物",
        "自然资源", "耕地保护", "环境质量", "环境数据",
        "自然空间资源", "环境",
    ],
    "知识产权刑法保护": [
        "知识产权", "商标", "著作权", "专利",
    ],
    "刑事政策与犯罪预防": [
        "刑事政策", "犯罪预防", "社会治理", "综合治理",
        "宽严相济", "犯罪治理", "仇恨犯罪", "淫秽物品",
    ],
    # === 刑事诉讼 ===
    "刑事诉讼程序": [
        "刑事诉讼", "追诉", "辩护", "逮捕", "羁押",
        "管辖", "刑事司法", "讯问", "质证", "被告人",
        "被追诉人", "审查起诉", "辩护权", "辩护制度", "刑事辩护",
        "公诉", "驳回公诉", "撤回起诉", "刑事审判",
        "证明责任", "刑事涉案", "刑事涉财", "陪审",
        "远程审判", "印证", "犯罪事实", "立案追诉",
        "追诉时效", "刑事程序", "刑事被告", "人权保障",
        "强制措施", "批捕", "疑罪从无", "移送管辖",
        "权利保障", "涉案财产", "程序法", "证据",
        "侦查", "电子证据", "非法证据", "证明标准",
        "鉴定", "勘验", "时效", "审查逮捕", "证明",
    ],
    # === 检察与监察 ===
    "检察与监察制度": [
        "检察", "检察权", "检察院", "检察监督", "检察机关",
        "检察工作", "检察听证", "指导性案例", "法律监督",
        "监察", "纪检", "纪检监察", "监察机关", "监察对象",
        "调查权", "监察强制",
    ],
    # === 民事法 ===
    "民事责任与侵权法": [
        "损害赔偿", "连带责任", "补充责任", "违约",
        "缔约过失", "赔礼道歉", "公平责任", "精神损害",
        "侵权", "高空抛坠物", "建筑物管理人", "用人者责任",
        "继承", "遗产", "承租人", "履行利益", "惩罚性赔偿",
        "信赖利益", "照护职责", "食品安全", "人格权",
        "民事赔偿", "赔偿责任", "合同编", "违法合同",
        "仲裁", "民事执行", "保险", "不动产",
        "过失责任",
    ],
    # === 公司法与金融证券 ===
    "公司法与金融证券": [
        "股东", "出资", "董事", "公司法", "股权", "认缴",
        "反垄断", "经营者集中", "不正当竞争", "组织法",
        "证券", "内幕交易", "信息披露", "投资", "基金",
        "虚假陈述", "私募",
    ],
    # === 行政法 ===
    "行政法与行政诉讼": [
        "行政诉讼", "行政处罚", "行政赔偿", "行政违法",
        "行政合规", "权力清单", "责任清单", "起诉期限",
        "行政机关", "地方政府", "地方人大", "优抚",
    ],
    # === 宪法学 ===
    "宪法学与基本权利": [
        "宪法", "基本权利", "人身自由", "宪法检视", "宪法理由",
        "宪法观",
    ],
}

METHOD_PATTERNS = {
    "实证研究": r"实证|统计|样本|裁判文书|大数据|定量|回归|调研|处罚书",
    "比较法研究": r"比较|域外|德国|日本|美国|英国|法国|大陆法|英美法",
    "法教义学分析": r"教义学|解释论|体系解释|规范分析|构成要件|法理",
    "规范建构": r"制度设计|制度建构|立法建议|立法完善|立法论|规范建构",
    "跨学科研究": r"跨学科|社会学|经济学|心理学|哲学|伦理|政治学",
    "案例研究法": r"案例|指导案例|典型案例|判例",
}

# 停用词（不作为关键词的常见词汇）
STOPWORDS = {
    "研究", "论述", "问题", "分析", "探讨", "视角", "角度", "中国", "我国",
    "论文", "关于", "基于", "视域", "逻辑", "思考", "若干", "试论", "浅析",
    "路径", "对策", "反思", "建构", "完善", "检视", "回应", "争议", "评析",
    "解读", "面向", "回顾", "展望", "进路", "维度", "当代", "新时代",
}

# 法学领域术语词表（用于关键词提取）
LEGAL_TERMS = set()
for kws in TOPIC_KW.values():
    for kw in kws:
        LEGAL_TERMS.add(kw)


def classify_article(title: str) -> dict:
    """对单篇文章做关键词分类（fallback 模式）。"""
    topics = []
    for topic, kws in TOPIC_KW.items():
        if any(kw in title for kw in kws):
            topics.append(topic)
    if not topics:
        topics = ["其他"]

    methods = []
    for method, pattern in METHOD_PATTERNS.items():
        if re.search(pattern, title):
            methods.append(method)
    if not methods:
        methods = ["规范分析"]

    # 关键词提取：先匹配已知术语，再补充标题中的双字/三字/四字词
    keywords = set()
    for term in LEGAL_TERMS:
        if term in title:
            keywords.add(term)
    # 补充提取：2-6 字中文连续片段
    for m in re.finditer(r"[\u4e00-\u9fff]{2,6}", title):
        w = m.group()
        if w not in STOPWORDS and len(w) >= 2:
            keywords.add(w)
    # 去掉过短和过泛的词
    keywords = [kw for kw in keywords if len(kw) >= 2 and kw not in STOPWORDS]
    # 按长度优先（长词更有意义）
    keywords.sort(key=lambda x: -len(x))
    keywords = keywords[:6]

    return {
        "topics": topics[:3],
        "methods": methods[:2],
        "keywords": keywords,
    }


def load_articles():
    """加载文章数据。优先 AI enriched，否则 fallback 分类。"""
    if ENRICHED_PATH.exists():
        print(f"Loading AI-enriched articles from {ENRICHED_PATH}")
        with open(ENRICHED_PATH, "r") as f:
            articles = json.load(f)
        # 检查是否真的有主题数据
        has_topics = sum(1 for a in articles if a.get("topics"))
        if has_topics > len(articles) * 0.3:
            return articles, True
        print(f"  Warning: only {has_topics}/{len(articles)} have topics, using fallback classification")

    if not CANDIDATES_PATH.exists():
        print(f"ERROR: No data files found at {CANDIDATES_PATH}")
        return [], False

    print(f"Using keyword-based classification (fallback mode)")
    with open(CANDIDATES_PATH, "r") as f:
        raw = json.load(f)

    articles = []
    for a in raw:
        title = a.get("title", "")
        classified = classify_article(title)
        articles.append({
            "title": title,
            "journal": a.get("journal", ""),
            "year": a.get("year", "2025"),
            "issue": a.get("issue", ""),
            "page": a.get("page", ""),
            "author": a.get("author", ""),
            "topics": classified["topics"],
            "methods": classified["methods"],
            "keywords": classified["keywords"],
            "summary": "",
            "relevance_score": 5,
        })

    return articles, False


def export_articles(articles: list[dict]):
    """Export clsci_articles.json."""
    export = []
    for a in articles:
        entry = {
            "title": a["title"],
            "journal": a["journal"],
            "year": a["year"],
            "issue": a["issue"],
            "page": a["page"],
        }
        if a.get("author"):
            entry["author"] = a["author"]
        if a.get("topics"):
            entry["topics"] = a["topics"]
        if a.get("methods"):
            entry["methods"] = a["methods"]
        if a.get("keywords"):
            entry["keywords"] = a["keywords"]
        if a.get("summary"):
            entry["summary"] = a["summary"]
        if a.get("relevance_score"):
            entry["relevance_score"] = a["relevance_score"]
        export.append(entry)

    path = OUTPUT_DIR / "clsci_articles.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(export, f, ensure_ascii=False, indent=2)
    print(f"  clsci_articles.json: {len(export)} articles")


def export_topics(articles: list[dict]):
    """Export clsci_topics.json with temporal data."""
    journal_counts = Counter(a["journal"] for a in articles)
    journal_stats = [{"journal": j, "count": c} for j, c in journal_counts.most_common()]

    issue_counts = Counter(a["issue"] for a in articles)
    issue_stats = sorted(
        [{"issue": k, "count": v} for k, v in issue_counts.items()],
        key=lambda x: int(x["issue"]) if x["issue"].isdigit() else 99,
    )

    # 主题统计（每篇文章可能多主题，各主题独立计数）
    topic_articles = defaultdict(list)
    for a in articles:
        for t in a.get("topics", ["其他"]):
            topic_articles[t].append(a["title"])

    topic_stats = [
        {
            "topic": t,
            "count": len(arts),
            "articles": arts[:8],
            "top_keywords": _top_keywords_for_topic(articles, t),
        }
        for t, arts in sorted(topic_articles.items(), key=lambda x: -len(x[1]))
    ]

    # 方法统计
    method_counts = Counter()
    for a in articles:
        for m in a.get("methods", ["规范分析"]):
            method_counts[m] += 1
    method_stats = [{"method": m, "count": c} for m, c in method_counts.most_common()]

    # 时序数据
    issues_sorted = sorted(
        set(a["issue"] for a in articles),
        key=lambda x: int(x) if x.isdigit() else 99,
    )
    topic_trends = {}
    for topic in [ts["topic"] for ts in topic_stats[:15]]:
        trend = []
        for iss in issues_sorted:
            count = sum(
                1 for a in articles
                if a["issue"] == iss and topic in a.get("topics", [])
            )
            trend.append(count)
        topic_trends[topic] = trend

    # 期刊×主题矩阵
    journal_topic_matrix = {}
    for j in [js["journal"] for js in journal_stats[:10]]:
        journal_topic_matrix[j] = {}
        j_articles = [a for a in articles if a["journal"] == j]
        for t in [ts["topic"] for ts in topic_stats[:10]]:
            count = sum(1 for a in j_articles if t in a.get("topics", []))
            if count > 0:
                journal_topic_matrix[j][t] = count

    topics_data = {
        "summary": {
            "total_articles": len(articles),
            "journal_count": len(journal_counts),
            "year": "2025",
        },
        "journals": journal_stats,
        "issues": issue_stats,
        "topics": topic_stats,
        "methods": method_stats,
        "temporal": {
            "issues": issues_sorted,
            "topic_trends": topic_trends,
        },
        "journal_topic_matrix": journal_topic_matrix,
    }

    path = OUTPUT_DIR / "clsci_topics.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(topics_data, f, ensure_ascii=False, indent=2)

    # 统计"其他"比例
    other_count = len(topic_articles.get("其他", []))
    other_pct = other_count / len(articles) * 100 if articles else 0
    print(f"  clsci_topics.json: {len(topic_stats)} topics, \"其他\" = {other_count} ({other_pct:.1f}%)")


def _top_keywords_for_topic(articles: list[dict], topic: str) -> list[str]:
    kw_counter = Counter()
    for a in articles:
        if topic in a.get("topics", []):
            for kw in a.get("keywords", []):
                kw_counter[kw] += 1
    return [kw for kw, _ in kw_counter.most_common(6)]


def export_network(articles: list[dict]):
    """Export clsci_network.json — 关键词共现网络。"""
    keyword_counter = Counter()
    article_kws = []

    for a in articles:
        kws = a.get("keywords", [])
        if not kws:
            continue
        article_kws.append(kws)
        for kw in kws:
            keyword_counter[kw] += 1

    # 共现边
    edges = defaultdict(int)
    for kws in article_kws:
        for i, kw1 in enumerate(kws):
            for kw2 in kws[i + 1:]:
                pair = tuple(sorted([kw1, kw2]))
                edges[pair] += 1

    top_kws = {kw for kw, _ in keyword_counter.most_common(60)}

    # 度数
    degree_map = defaultdict(int)
    for (kw1, kw2), weight in edges.items():
        if kw1 in top_kws and kw2 in top_kws and weight >= 2:
            degree_map[kw1] += 1
            degree_map[kw2] += 1

    nodes = []
    for kw, count in keyword_counter.most_common(50):
        topic = _keyword_primary_topic(articles, kw)
        nodes.append({
            "id": kw,
            "count": count,
            "topic": topic,
            "degree": degree_map.get(kw, 0),
        })

    node_ids = {n["id"] for n in nodes}
    edge_list = []
    for (kw1, kw2), weight in sorted(edges.items(), key=lambda x: -x[1]):
        if kw1 in node_ids and kw2 in node_ids and weight >= 2:
            edge_list.append({"source": kw1, "target": kw2, "weight": weight})

    # 按主题聚类
    clusters = defaultdict(list)
    for n in nodes:
        if n.get("topic"):
            clusters[n["topic"]].append(n["id"])

    network_data = {
        "nodes": nodes,
        "edges": edge_list[:120],
        "clusters": dict(clusters),
    }

    path = OUTPUT_DIR / "clsci_network.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(network_data, f, ensure_ascii=False, indent=2)
    print(f"  clsci_network.json: {len(nodes)} nodes, {len(edge_list[:120])} edges")


def _keyword_primary_topic(articles: list[dict], keyword: str) -> str:
    topic_counts = Counter()
    for a in articles:
        if keyword in a.get("keywords", []):
            for t in a.get("topics", []):
                topic_counts[t] += 1
    if topic_counts:
        return topic_counts.most_common(1)[0][0]
    return ""


def main():
    articles, is_enriched = load_articles()
    if not articles:
        return

    print(f"\nExporting {len(articles)} articles ({'AI-enriched' if is_enriched else 'keyword-classified'})...")
    export_articles(articles)
    export_topics(articles)
    export_network(articles)

    print(f"\nDone! Files written to {OUTPUT_DIR}")
    for f in sorted(OUTPUT_DIR.glob("clsci_*.json")):
        size_kb = f.stat().st_size / 1024
        print(f"  {f.name}: {size_kb:.1f} KB")


if __name__ == "__main__":
    main()
