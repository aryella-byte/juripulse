#!/bin/bash
# Seeing Theory 部署脚本 - 在本地运行

echo "🚀 Seeing Theory 部署脚本"
echo "=========================="
echo ""
echo "由于环境限制，无法直接推送到 GitHub。"
echo "请按以下步骤手动完成部署："
echo ""
echo "1. 确保您在本地有克隆的仓库："
echo "   git clone https://github.com/aryella-byte/pengyali.github.io.git"
echo ""
echo "2. 创建 seeing-theory 目录并复制文件："
echo "   mkdir -p pengyali.github.io/seeing-theory"
echo "   cp -r /path/to/seeing-theory-cn/dist/* pengyali.github.io/seeing-theory/"
echo ""
echo "3. 进入仓库并提交："
echo "   cd pengyali.github.io"
echo "   git add seeing-theory/"
echo "   git commit -m 'Add Seeing Theory interactive learning platform v1.0'"
echo "   git push origin main"
echo ""
echo "或者使用以下单行命令（在本地运行）："
echo ""

# 生成一键部署命令
cat << 'EOF'
cd /tmp && \
rm -rf seeing-theory-deploy && \
mkdir seeing-theory-deploy && \
cd seeing-theory-deploy && \
git clone https://github.com/aryella-byte/pengyali.github.io.git repo && \
cd repo && \
mkdir -p seeing-theory && \
cp -r /root/.openclaw/workspace/seeing-theory-cn/dist/* seeing-theory/ && \
git add seeing-theory/ && \
git commit -m "Add Seeing Theory v1.0 - 6 chapters with legal case studies" && \
git push origin main && \
echo "✅ 部署成功！"
EOF

echo ""
echo "🌐 部署后访问地址："
echo "   https://aryella-byte.github.io/pengyali.github.io/seeing-theory/"
echo ""
echo "📊 部署内容概览："
echo "   - 6 个完整章节"
echo "   - 127+ 交互式可视化"
echo "   - 6 个法律案例"
echo "   - 总大小: 437 KB (gzip: 123 KB)"
