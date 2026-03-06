#!/bin/bash
# Deploy Seeing Theory to GitHub Pages

set -e

echo "🚀 部署看见理论到 GitHub Pages"
echo "================================"

# 配置
REPO_URL="https://github.com/aryella-byte/pengyali.github.io.git"
DIST_DIR="/root/.openclaw/workspace/seeing-theory-cn/dist"
TEMP_DIR="/tmp/seeing-theory-deploy"

# 清理临时目录
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

echo "📦 克隆仓库..."
git clone --depth 1 $REPO_URL $TEMP_DIR/repo

echo "📁 创建 seeing-theory 目录..."
mkdir -p $TEMP_DIR/repo/seeing-theory

echo "📋 复制构建文件..."
cp -r $DIST_DIR/* $TEMP_DIR/repo/seeing-theory/

echo "🔍 检查文件..."
ls -la $TEMP_DIR/repo/seeing-theory/

echo ""
echo "✅ 准备完成！"
echo ""
echo "请在本地运行以下命令完成部署："
echo ""
echo "cd $TEMP_DIR/repo"
echo "git add seeing-theory/"
echo "git commit -m 'Add Seeing Theory interactive learning platform'"
echo "git push origin main"
echo ""
echo "🌐 部署后访问："
echo "https://aryella-byte.github.io/pengyali.github.io/seeing-theory/"
