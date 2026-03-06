#!/bin/bash
# run_pipeline.sh — 一键运行 CLSCI 数据管线
# 用法: bash scripts/run_pipeline.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== JuriPulse CLSCI Data Pipeline ==="
echo ""

# Check API key — 支持 Kimi Coding API 或 Anthropic
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "WARNING: ANTHROPIC_API_KEY not set. Will use cached results only."
    echo ""
    echo "  Kimi Coding API (推荐):"
    echo "    export ANTHROPIC_BASE_URL=https://api.kimi.com/coding/"
    echo "    export ANTHROPIC_API_KEY=sk-kimi-..."
    echo ""
    echo "  Anthropic API:"
    echo "    export ANTHROPIC_API_KEY=sk-ant-..."
    echo ""
fi

# Step 1: AI Analysis (if API key available)
if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "Step 1: Running LLM analysis..."
    python3 "$SCRIPT_DIR/claude_analyze.py"
    echo ""
fi

# Step 2: Export enhanced JSON
echo "Step 2: Exporting enhanced JSON for frontend..."
python3 "$SCRIPT_DIR/export_enhanced.py"
echo ""

echo "=== Pipeline Complete ==="
echo "Frontend data is in public/data/"
echo "Run 'npm run dev' to preview."
