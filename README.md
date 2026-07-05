# JuriPulse / 法脉

中国法学核心期刊智能研究引擎。项目当前部署在 GitHub Pages：

https://aryella-byte.github.io/juripulse/

## 技术栈

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- D3
- lucide-react
- 静态导出部署：`next.config.ts` 中 `output: "export"`，`basePath: "/juripulse"`

## 本地开发

```bash
npm install
npm run dev
```

开发服务器默认地址：

```text
http://localhost:3000
```

由于项目配置了 `basePath: "/juripulse"`，本地访问页面时使用：

```text
http://localhost:3000/juripulse
```

## 常用命令

```bash
npm run lint
npm run build
```

注意：生产构建使用 `next/font/google`，首次构建需要访问 Google Fonts。如果网络受限，`npm run build` 会在字体下载阶段失败。

## 目录说明

- `src/app`：页面路由。
- `src/components`：页面组件和可视化组件。
- `public/data`：前端运行时读取的 JSON 数据源，静态导出时会复制到 `out/data`。
- `scripts`：数据更新脚本；`update-brief-ai.mjs` 用于每日 AI 简报，部分包含本地路径的内部脚本不纳入版本管理。
- `2025CLSCI`：原始/中间数据目录，默认不纳入版本管理。
- `out`：静态导出产物，默认不纳入版本管理。

## 页面模块

- `/`：首页，展示平台入口、趋势和核心统计。
- `/research`：研究动态，读取 CLSCI 统计、关键词、学科、引文和作者网络数据。
- `/pulse`：研究图景，展示专题文献综述。
- `/brief`：AI 每日法学简报，读取 `brief_data.json`。
- `/theory`：统计学交互章节。

## 数据更新

前端主要依赖 `public/data/*.json`。法学简报由 `.github/workflows/daily-brief.yml` 定时更新，默认每日新增 3 条新闻和 1 条研究，并清理低质量旧条目。

每日简报自动更新使用 `.github/workflows/daily-brief.yml`。在 GitHub 仓库中配置 Secret：

```text
ARK_API_KEY=你的火山 Ark API Key
```

默认模型为 `ark-code-latest`，默认 OpenAI 兼容 Base URL 为：

```text
https://ark.cn-beijing.volces.com/api/coding/v3
```

如需调整，可在 GitHub Actions Variables 中设置 `BRIEF_AI_MODEL` 或 `ARK_BASE_URL`。

CLSCI 数据管线入口：

```bash
bash scripts/run_pipeline.sh
```

脚本会：

1. 在设置 `ANTHROPIC_API_KEY` 时运行 LLM 分析。
2. 导出前端需要的增强 JSON。
3. 写入 `public/data`。

如果只需要保持当前线上数据，不要删除 `public/data`。缺失该目录会导致本地页面能构建但运行时数据请求 404。

## 部署

构建静态站点：

```bash
npm run build
```

构建完成后，静态文件位于 `out/`。当前线上地址是 GitHub Pages 的 `/juripulse/` 路径，因此 `next.config.ts` 中的 `basePath` 需要保留。
