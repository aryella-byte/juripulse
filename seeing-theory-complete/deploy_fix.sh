#!/bin/bash

# Deploy Seeing Theory Bug Fix to GitHub Pages
echo "🚀 Deploying Seeing Theory bug fix..."

# Set paths
SOURCE_DIR="/Users/yalipeng/Desktop/论文projects/实验性项目/seeing-theory-complete/seeing-theory-cn/dist"
DEPLOY_DIR="/Users/yalipeng/Desktop/论文projects/实验性项目/seeing-theory-complete/pengyali.github.io/seeing-theory"

# Backup current version
echo "📦 Creating backup..."
cp -r "$DEPLOY_DIR" "${DEPLOY_DIR}.backup"

# Clear old files
echo "🗑️  Removing old files..."
rm -rf "$DEPLOY_DIR"/*

# Copy new build
echo "📂 Copying new build..."
cp -r "$SOURCE_DIR"/* "$DEPLOY_DIR"/

# Verify
echo "✅ Verifying deployment..."
ls -la "$DEPLOY_DIR"

echo "✨ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. cd pengyali.github.io"
echo "2. git add seeing-theory"
echo "3. git commit -m 'Fix Bayesian inference bug in recidivism risk assessment'"
echo "4. git push origin main"
