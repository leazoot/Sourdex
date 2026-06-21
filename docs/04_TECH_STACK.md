# 04 Tech Stack — Sourdex

> Follows [docs/PRD.md](./PRD.md) 7.2. PRD-determined choices are binding. Undetermined choices that don't block doc/architecture init have a default marked **(default)**; choices that affect architecture or require business sign-off go to Open Questions and must not be unilaterally finalized.

## 1. 语言

- **TypeScript**（主语言，PRD 7.2.1）。strict mode（PRD 11.1）。
- 理由：插件/Web/本地服务共享类型；前后端统一开发体验；开源贡献门槛低；生态完整。

## 2. 前端技术栈（PRD 7.2.2）

| 项 | 选择 | 状态 |
|----|------|------|
| 框架 | React | PRD 确定 |
| 构建 | Vite | PRD 确定 |
| 样式 | Tailwind CSS | PRD 确定 |
| 组件 | shadcn/ui | **(default)** 见 OQ-02 |
| 轻量状态 | Zustand | **(default)** 见 OQ-01（PRD 列 Zustand/Jotai 二选一） |
| 服务端数据状态 | TanStack Query | PRD 确定 |
| i18n | 统一 i18n 文件（库待定） | PRD 要求能力，库 = OQ |

## 3. 浏览器插件（PRD 7.2.3）

- WXT + React + TypeScript + Manifest V3。
- Chrome / Edge 首发。

## 4. 后端 / 本地服务（PRD 7.2.4）

- Node.js + Fastify + Zod + Drizzle ORM + SQLite。

## 5. 数据库（PRD 7.2.5）

- SQLite（主存储）。
- FTS5（全文检索，v0.1）。
- sqlite-vec（向量检索，v0.2）。
- 本地文件系统保存快照与导出文件。

## 6. ORM / 数据访问

- **Drizzle ORM**（PRD 7.2.4）。
- Repository 模式封装（PRD 10.1）；migration 由 Drizzle 管理。

## 7. 状态管理

- 服务端数据：TanStack Query。
- 客户端轻量状态：Zustand **(default)**。
- 原则：避免全局可变状态（PRD 11.1）。

## 8. UI 组件策略

- shadcn/ui **(default)** + Tailwind；分层：primitive → shared ui → feature → page（PRD 11.2）。
- 深色模式、reduced motion、键盘可达、对比度合格（PRD 19.2）。

## 9. 测试工具

- 单元/集成：**Vitest** **(default)**（与 Vite 生态一致；PRD 未指定具体测试框架，仅指定能力，PRD 21）。
- 组件渲染测试：**@testing-library/react** **(default)**。
- E2E：**Playwright** **(default)**（PRD 21.3 要求 E2E 能力）。
- 具体命令在项目初始化后于 [09_TEST_PLAN.md](./09_TEST_PLAN.md) 确认。

## 10. 构建工具

- **pnpm** workspace + **Turborepo**（PRD 8, 22.3）。
- Vite（web/extension 构建）；WXT（扩展打包）。
- Lint：**ESLint**；格式化：**Prettier**（PRD 24.1）。

## 11. 部署方式

- v0.1：本地服务（Node 进程）+ 本地 Web UI，文档指导手动启动 **(default，见 OQ-05)**。
- 扩展：构建 zip，手动安装 / 后续商店上架。
- v0.3+：Tauri 2 桌面封装（PRD 7.2.6）。
- 发布：GitHub Actions + Changesets，产物含 server package、web build、extension zip、changelog（PRD 22）。

## 12. 第三方服务

- v0.1：无强制外部服务。
- v0.2：AI Provider（OpenAI-compatible、Ollama；后续 Anthropic/Gemini/LM Studio），经 Provider 抽象层接入（PRD 7.2.7, 14.2）。

## 12.5 内容提取（packages/extractor，STAGE-05 已确认）

- **@mozilla/readability**（PRD 5.1.2 指定的 Readability 类正文提取）。
- **jsdom**（Readability 的标准 DOM 配对，纯 JS、无原生构建、不执行脚本/不加载子资源）。
- **turndown**（HTML→Markdown，Node 端自带 DOM）。
- 自实现：HTML 清洗/sanitize（移除 script/style/iframe/事件处理器/javascript: URL）、纯文本归一、阅读量度（CJK+Latin，OQ-R4）。
- 备选：linkedom（更轻，但与 Readability 兼容性次于 jsdom，未采用）。

## 13. 选型理由（摘要）

- TypeScript monorepo：跨端共享类型与领域模型，降低贡献门槛。
- Fastify + Zod：轻量、性能好、schema 校验一体化，契合“所有外部输入 Zod 校验”。
- SQLite + FTS5：本地优先、零依赖部署、内置全文检索，契合 MVP 性能目标（1 万条 < 500ms）。
- Drizzle：类型安全、迁移可控、轻量。
- WXT：现代 MV3 扩展开发体验，React/TS 一致。
- Turborepo + pnpm：monorepo 缓存与任务编排。

## 14. 备选方案

- 状态管理：Jotai（PRD 备选）。
- 测试：Jest（备选，但 Vitest 更契合 Vite）。
- 全文检索：外部引擎（如 Meilisearch）——不采用，违背本地优先与零依赖。
- 后端框架：Express/Hono——不采用，Fastify 已由 PRD 指定。

## 15. Open Questions

- OQ-T1（=OQ-01）：Zustand vs Jotai。默认 Zustand。需确认。
- OQ-T2（=OQ-02）：shadcn/ui vs 自定义组件库。默认 shadcn/ui。需确认。
- OQ-T3：i18n 库选型（如 i18next / lingui / 轻量自研）。PRD 仅要求能力。建议 i18next，STAGE-07 前确认。
- OQ-T4：测试框架是否采用 Vitest + Playwright 默认组合？需确认（影响 09_TEST_PLAN 命令）。
- OQ-T5（=OQ-08）：Node / pnpm / Turborepo 版本基线锁定。STAGE-01 启动时确认。
- OQ-T6（=OQ-04）：License（AGPL-3.0 vs Apache-2.0）。**已解决（STAGE-10，用户决定）：Apache-2.0。**
- OQ-T7：API Key 加密存储具体实现。**已解决（2026-06-21，用户决定）：本地加密文件**（`secrets.enc`，AES-256-GCM，scrypt 派生主密钥，仅 `node:crypto`）；系统 Keychain 留作后续增强（PRD 17.2）。
