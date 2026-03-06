# 贝叶斯累犯风险评估修复验证

## Bug 描述
原代码在处理负面证据（降低风险的因素）时，逻辑完全反转：
- "有稳定工作"本应降低风险，却反而增加风险
- "有固定住所"本应降低风险，却反而增加风险

## 根本原因
第 382-383 行的概率计算逻辑错误：
```typescript
// ❌ 错误的逻辑
const pEvidenceIfHigh = observed ? (ev.isPositive ? ev.pIfHigh : 1 - ev.pIfHigh) : (ev.isPositive ? 1 - ev.pIfHigh : ev.pIfHigh)
```

当 `observed=true` (证据存在) 且 `isPositive=false` (负面证据) 时，
代码错误地使用了 `1 - ev.pIfHigh`，将概率反转了。

## 修复方案
简化逻辑，直接根据证据是否存在来选择概率：
```typescript
// ✓ 正确的逻辑
if (observed) {
  // 证据存在 → 使用原始概率
  pEvidenceIfHigh = ev.pIfHigh
  pEvidenceIfLow = ev.pIfLow
} else {
  // 证据不存在 → 使用补概率
  pEvidenceIfHigh = 1 - ev.pIfHigh
  pEvidenceIfLow = 1 - ev.pIfLow
}
```

## 验证案例

### 案例 1：有固定住所
- 数据：`{ pIfLow: 0.8, pIfHigh: 0.4 }`
- 初始风险：30%
- 选择："是"

**修复前**：
- P(高|证据) = 56.25% ❌ 风险上升！

**修复后**：
- P(高|证据) = 17.6% ✓ 风险下降！

### 案例 2：有稳定工作
- 数据：`{ pIfLow: 0.7, pIfHigh: 0.25 }`
- 初始风险：17.6%
- 选择："是"

**修复前**：
- 风险继续异常上升

**修复后**：
- P(高|证据) = 7.1% ✓ 风险进一步下降！

## 完整测试序列
初始风险：30%
1. 有固定住所：是 → 17.6%
2. 有稳定工作：是 → 7.1%
3. 曾有暴力前科：是 → 27.5%
4. 完成矫正项目：是 → 12.6%
5. 有药物滥用史：否 → 8.9%

所有更新方向都符合常识和贝叶斯推断逻辑！
