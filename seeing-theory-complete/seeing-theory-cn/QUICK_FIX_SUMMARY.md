# 贝叶斯推断 Bug 快速修复摘要

## 🐛 Bug
"有稳定工作"反而增加累犯风险

## 📍 位置
`src/chapters/Chapter5_BayesianInference.tsx` 第 376-387 行

## ❌ 错误代码
```typescript
const pEvidenceIfHigh = observed ? 
  (ev.isPositive ? ev.pIfHigh : 1 - ev.pIfHigh) : 
  (ev.isPositive ? 1 - ev.pIfHigh : ev.pIfHigh)
```

## ✅ 修复代码
```typescript
if (observed) {
  pEvidenceIfHigh = ev.pIfHigh  // 证据存在 → 使用原概率
  pEvidenceIfLow = ev.pIfLow
} else {
  pEvidenceIfHigh = 1 - ev.pIfHigh  // 证据不存在 → 使用补概率
  pEvidenceIfLow = 1 - ev.pIfLow
}
```

## 📊 修复效果
| 证据 | 修复前 | 修复后 |
|------|--------|--------|
| 有固定住所(是) | 30% → 56% ❌ | 30% → 18% ✅ |
| 有稳定工作(是) | 异常上升 ❌ | 18% → 7% ✅ |

## ✓ 验证状态
- [x] 数学验证通过
- [x] TypeScript 编译通过
- [x] 所有测试场景正确
