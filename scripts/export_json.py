#!/usr/bin/env python3
"""
export_json.py — 将 gen_report3.py 的NLP分析结果导出为前端可用的JSON文件。

使用方法:
  1. 先运行 gen_report3.py 生成分析结果
  2. 运行本脚本，从分析管线的中间结果中导出前端JSON
  3. 将生成的JSON复制到 juripulse/public/data/

如果完整的 NLP 管线源数据不可用，本脚本会从 criminal_law_candidates.json
生成基础展示数据。

输出:
  - clsci_articles.json  — 文章列表（标题、期刊、期数、页码）
  - clsci_topics.json    — 主题建模结果、期刊统计、方法论分布
  - clsci_network.json   — 关键词共现网络（节点+边）
"""
import json
import re
import os
from collections import Counter, defaultdict
from pathlib import Path

# ============================================================
# Paths
# ============================================================
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_ROOT / 'public' / 'data'
CLSCI_DIR = Path('/Users/yalipeng/Downloads/2025CLSCI/output')
CANDIDATES_PATH = Path('/Users/yalipeng/Desktop/论文projects/实验性项目/2025CLSCI/output/criminal_law_candidates.json')

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def try_full_pipeline():
    """尝试加载完整NLP管线的源数据（需要先运行gen_report3.py）。"""
    all_titles = CLSCI_DIR / 'CLSCI_all_titles_2025.json'
    details = CLSCI_DIR / 'criminal_law_details_all.json'
    if all_titles.exists() and details.exists():
        return True
    return False


def export_from_candidates():
    """从 criminal_law_candidates.json 生成基础展示数据。"""
    print('Loading candidates data...')
    with open(CANDIDATES_PATH, 'r') as f:
        articles = json.load(f)

    print(f'  {len(articles)} articles loaded')

    # ---- clsci_articles.json ----
    articles_export = []
    for a in articles:
        articles_export.append({
            'title': a.get('title', ''),
            'journal': a.get('journal', ''),
            'year': a.get('year', '2025'),
            'issue': a.get('issue', ''),
            'page': a.get('page', ''),
        })

    with open(OUTPUT_DIR / 'clsci_articles.json', 'w', encoding='utf-8') as f:
        json.dump(articles_export, f, ensure_ascii=False, indent=2)
    print(f'  clsci_articles.json: {len(articles_export)} articles')

    # ---- Journal statistics ----
    journal_counts = Counter(a.get('journal', '') for a in articles)
    journal_stats = [
        {'journal': j, 'count': c}
        for j, c in journal_counts.most_common()
    ]

    # ---- Issue distribution ----
    issue_counts = Counter(a.get('issue', '') for a in articles)
    issue_stats = [
        {'issue': k, 'count': v}
        for k, v in sorted(issue_counts.items(), key=lambda x: int(x[0]) if x[0].isdigit() else 99)
    ]

    # ---- Keyword-based topic classification (simplified) ----
    TOPIC_KW = {
        '法益理论': ['法益', '归责', '构成要件', '违法性', '不法', '犯罪论', '规范论'],
        '轻罪治理': ['轻罪', '犯罪记录', '前科', '出罪', '但书', '微罪'],
        '经济刑法': ['受贿', '贪污', '行贿', '洗钱', '经济刑法', '非法经营', '金融犯罪'],
        '行刑衔接': ['行刑', '刑民', '民刑', '行政犯', '法定犯', '法秩序'],
        'AI与刑法': ['人工智能', 'AI', '算法', '大模型', '深度伪造'],
        '网络犯罪': ['网络犯罪', '网络暴力', '电信诈骗', '帮信', '帮助信息'],
        '数据犯罪': ['数据犯罪', '个人信息', '数据安全', '数据保护'],
        '刑事证据': ['证据', '侦查', '电子证据', '非法证据'],
        '认罪认罚': ['认罪认罚', '从宽'],
        '刑事诉讼': ['刑事诉讼法', '法典化'],
        '量刑制度': ['量刑'],
        '正当防卫': ['正当防卫', '防卫', '紧急避险'],
        '共犯理论': ['共犯', '共谋', '共同犯罪', '帮助犯', '正犯'],
        '企业合规': ['单位犯罪', '企业合规', '企业刑事', '涉企'],
        '财产犯罪': ['盗窃', '财产犯罪', '占有', '诈骗', '侵占'],
    }

    topic_articles = defaultdict(list)
    for a in articles:
        title = a.get('title', '')
        matched = False
        for topic, kws in TOPIC_KW.items():
            if any(kw in title for kw in kws):
                topic_articles[topic].append(title)
                matched = True
                break
        if not matched:
            topic_articles['其他'].append(title)

    topic_stats = [
        {'topic': t, 'count': len(arts), 'articles': arts[:5]}
        for t, arts in sorted(topic_articles.items(), key=lambda x: -len(x[1]))
    ]

    # ---- Methodology detection (title-based simplified) ----
    METHOD_PATTERNS = {
        '实证研究': r'实证|统计|数据|样本|裁判文书',
        '比较法': r'比较|域外|德国|日本|美国|英国',
        '法教义学': r'教义学|解释论|体系解释',
        '规范建构': r'制度设计|制度建构|立法建议|立法完善',
    }
    method_counts = Counter()
    for a in articles:
        title = a.get('title', '')
        detected = False
        for method, pattern in METHOD_PATTERNS.items():
            if re.search(pattern, title):
                method_counts[method] += 1
                detected = True
        if not detected:
            method_counts['规范分析'] += 1

    method_stats = [
        {'method': m, 'count': c}
        for m, c in method_counts.most_common()
    ]

    # ---- Write clsci_topics.json ----
    topics_data = {
        'summary': {
            'total_articles': len(articles),
            'journal_count': len(journal_counts),
            'year': '2025',
        },
        'journals': journal_stats,
        'issues': issue_stats,
        'topics': topic_stats,
        'methods': method_stats,
    }
    with open(OUTPUT_DIR / 'clsci_topics.json', 'w', encoding='utf-8') as f:
        json.dump(topics_data, f, ensure_ascii=False, indent=2)
    print(f'  clsci_topics.json: {len(topic_stats)} topics, {len(journal_stats)} journals')

    # ---- Build keyword co-occurrence network (title-based) ----
    # Extract 2-4 character Chinese terms from titles
    keyword_counter = Counter()
    article_kws = []
    for a in articles:
        title = a.get('title', '')
        # Simple extraction: find known legal terms in title
        kws = set()
        all_terms = []
        for topic_kws in TOPIC_KW.values():
            all_terms.extend(topic_kws)
        for term in all_terms:
            if term in title:
                kws.add(term)
        # Also extract 2-char patterns
        for m in re.finditer(r'[\u4e00-\u9fff]{2,4}', title):
            w = m.group()
            if w not in {'研究', '论述', '问题', '分析', '探讨', '视角', '角度', '中国', '我国'}:
                kws.add(w)
        article_kws.append(list(kws)[:8])
        for kw in kws:
            keyword_counter[kw] += 1

    # Build edges
    edges = defaultdict(int)
    for kws in article_kws:
        for i, kw1 in enumerate(kws):
            for kw2 in kws[i+1:]:
                pair = tuple(sorted([kw1, kw2]))
                edges[pair] += 1

    # Filter to top keywords and significant edges
    top_kws = {kw for kw, _ in keyword_counter.most_common(60)}
    nodes = []
    for kw, count in keyword_counter.most_common(60):
        nodes.append({'id': kw, 'count': count})

    edge_list = []
    for (kw1, kw2), weight in sorted(edges.items(), key=lambda x: -x[1]):
        if kw1 in top_kws and kw2 in top_kws and weight >= 2:
            edge_list.append({'source': kw1, 'target': kw2, 'weight': weight})

    # Only keep top 50 nodes and edges that reference those nodes
    final_nodes = nodes[:50]
    final_node_ids = {n['id'] for n in final_nodes}
    final_edges = [e for e in edge_list if e['source'] in final_node_ids and e['target'] in final_node_ids]

    network_data = {
        'nodes': final_nodes,
        'edges': final_edges[:100],
    }
    with open(OUTPUT_DIR / 'clsci_network.json', 'w', encoding='utf-8') as f:
        json.dump(network_data, f, ensure_ascii=False, indent=2)
    print(f'  clsci_network.json: {len(network_data["nodes"])} nodes, {len(network_data["edges"])} edges')


def main():
    if try_full_pipeline():
        print('Full NLP pipeline data available — using complete analysis.')
        # TODO: Import from gen_report3.py results when available
        export_from_candidates()
    elif CANDIDATES_PATH.exists():
        print('Using candidates data (simplified analysis)...')
        export_from_candidates()
    else:
        print('ERROR: No data files found.')
        print(f'  Expected: {CANDIDATES_PATH}')
        return

    print('\nDone! JSON files written to:')
    for f in sorted(OUTPUT_DIR.glob('*.json')):
        print(f'  {f}')


if __name__ == '__main__':
    main()
