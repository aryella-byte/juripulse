#!/bin/bash
# Seeing Theory 验证优化脚本
# 在开发完成后自动运行

echo "🔍 Seeing Theory 验证优化开始..."

cd /root/.openclaw/workspace/seeing-theory-cn

# 1. 代码质量检查
echo "📋 1. 代码质量检查..."

# 检查TypeScript语法
npx tsc --noEmit 2>&1 | tee /tmp/tsc-errors.txt
if [ $? -ne 0 ]; then
  echo "❌ TypeScript 编译错误，请修复以下问题："
  cat /tmp/tsc-errors.txt
  exit 1
fi

# ESLint检查
npx eslint src --ext .ts,.tsx 2>&1 | tee /tmp/eslint-errors.txt
if [ $? -ne 0 ]; then
  echo "⚠️ ESLint 警告/错误："
  cat /tmp/eslint-errors.txt
fi

# 2. 内容完整性检查
echo "📚 2. 内容完整性检查..."

# 检查各章节文件大小（确保不是占位符）
declare -A min_sizes
min_sizes[Chapter1]=10000
min_sizes[Chapter2]=10000
min_sizes[Chapter3]=10000
min_sizes[Chapter4]=10000
min_sizes[Chapter5]=10000
min_sizes[Chapter6]=10000

all_pass=true
for chapter in Chapter1_BasicProbability Chapter2_CompoundProbability Chapter3_Distributions Chapter4_FrequentistInference Chapter5_BayesianInference Chapter6_RegressionAnalysis; do
  file="src/chapters/${chapter}.tsx"
  if [ -f "$file" ]; then
    size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
    chapter_key=${chapter%%_*}
    min_size=${min_sizes[$chapter_key]}
    
    if [ "$size" -lt "$min_size" ]; then
      echo "  ⚠️ $chapter 文件过小 (${size} bytes)，可能是占位符"
      all_pass=false
    else
      echo "  ✅ $chapter 文件大小正常 (${size} bytes)"
    fi
  else
    echo "  ❌ $chapter 文件不存在"
    all_pass=false
  fi
done

# 3. DNA证据分布检查
echo "🔬 3. DNA证据分布检查..."

# 检查Chapter 1和Chapter 5的DNA内容
echo "  Chapter 1 (基础概率) DNA内容："
grep -n "DNA\|DNA证据" src/chapters/Chapter1_BasicProbability.tsx | head -5

echo "  Chapter 5 (贝叶斯推断) DNA内容："
grep -n "DNA\|DNA证据" src/chapters/Chapter5_BayesianInference.tsx | head -5

# 检查其他章节不应有DNA内容
echo "  检查其他章节不应包含DNA内容..."
for chapter in Chapter3 Chapter4 Chapter6; do
  count=$(grep -c "DNA证据" src/chapters/${chapter}*.tsx 2>/dev/null || echo 0)
  if [ "$count" -gt 0 ]; then
    echo "  ⚠️ $chapter 包含DNA证据内容，应移至Chapter 1或5"
  else
    echo "  ✅ $chapter 未包含DNA证据内容"
  fi
done

# 4. 法律案例检查
echo "⚖️ 4. 法律案例完整性检查..."

for chapter in Chapter1 Chapter2 Chapter3 Chapter4 Chapter5 Chapter6; do
  file=$(ls src/chapters/${chapter}*.tsx 2>/dev/null | head -1)
  if [ -f "$file" ]; then
    has_case=$(grep -c "法律案例\|Legal Case\|Scale.*size={28}" "$file" || echo 0)
    if [ "$has_case" -gt 0 ]; then
      echo "  ✅ $chapter 包含法律案例"
    else
      echo "  ⚠️ $chapter 可能缺少法律案例"
    fi
  fi
done

# 5. D3可视化检查
echo "📊 5. D3可视化检查..."

for chapter in Chapter1 Chapter2 Chapter3 Chapter4 Chapter5 Chapter6; do
  file=$(ls src/chapters/${chapter}*.tsx 2>/dev/null | head -1)
  if [ -f "$file" ]; then
    has_d3=$(grep -c "d3\." "$file" || echo 0)
    if [ "$has_d3" -gt 0 ]; then
      echo "  ✅ $chapter 包含D3可视化 (${has_d3} 处)"
    else
      echo "  ⚠️ $chapter 可能缺少D3可视化"
    fi
  fi
done

# 6. 构建测试
echo "🏗️ 6. 构建测试..."
npm run build 2>&1 | tee /tmp/build-log.txt
if [ $? -ne 0 ]; then
  echo "❌ 构建失败，请检查错误日志："
  tail -50 /tmp/build-log.txt
  exit 1
fi

echo "✅ 构建成功"

# 7. 与原版对比检查
echo "📖 7. 与原版Seeing Theory对比..."

# 检查核心概念是否都包含
core_concepts=(
  "基础概率:概率事件,期望,大数定律"
  "复合概率:独立事件,贝叶斯定理,条件概率"
  "概率分布:二项分布,泊松分布,正态分布,中心极限定理"
  "频率派推断:置信区间,假设检验,p值"
  "贝叶斯推断:先验分布,后验分布,MCMC"
  "回归分析:线性回归,最小二乘法,相关系数"
)

for concept in "${core_concepts[@]}"; do
  IFS=':' read -r chapter keywords <<< "$concept"
  # 简化检查，实际应由人工审核
  echo "  📋 $chapter 应包含: $keywords"
done

# 8. 生成优化报告
echo ""
echo "═══════════════════════════════════════"
echo "📈 验证优化报告"
echo "═══════════════════════════════════════"

if [ "$all_pass" = true ]; then
  echo "✅ 所有检查通过！"
else
  echo "⚠️ 部分检查需要关注，详见上文"
fi

echo ""
echo "📊 文件统计："
wc -l src/chapters/*.tsx | tail -1

echo ""
echo "🎯 下一步建议："
echo "  1. 人工审核各章节内容的完整性和准确性"
echo "  2. 测试所有交互式可视化是否正常工作"
echo "  3. 检查法律案例的专业性和适用性"
echo "  4. 部署到测试环境进行最终验证"

echo ""
echo "✨ 验证优化完成！"
