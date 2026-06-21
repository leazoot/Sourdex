# Development — Sourdex

> 面向贡献者的开发指南。配合 [CLAUDE.md](../CLAUDE.md)（执行规约）、[03_ARCHITECTURE.md](03_ARCHITECTURE.md)、[04_TECH_STACK.md](04_TECH_STACK.md)、[09_TEST_PLAN.md](09_TEST_PLAN.md) 与 [.claude/rules/](../.claude/rules/) 使用。

## 环境要求

- Node ≥ 22（见 `.nvmrc`）
- pnpm 10.x（见 `package.json` 的 `packageManager`，建议 `corepack enable`）

## 安装

```bash
pnpm install
```

## 仓库结构

```text
apps/
  extension/   浏览器插件（WXT + MV3）
  web/         Web UI（React + Vite + Tailwind）
  server/      本地服务（Fastify + Drizzle + SQLite/FTS5）
packages/
  core/        领域类型、错误、契约（contracts）、工具
  db/          schema / migration / repository
  extractor/   正文提取 + HTML→Markdown
  search/      搜索 query 解析 / 高亮
  exporter/    Markdown / Obsidian 导出
docs/          PRD 与文档体系（01~14）
design/        UI 设计稿（视觉 source of truth）
tests/e2e/     端到端测试（Playwright）
```

依赖方向只能从外向内：`route → service → repository / extractor / contract`。详见 [03_ARCHITECTURE.md](03_ARCHITECTURE.md)。

## 常用命令

```bash
pnpm typecheck      # 类型检查（turbo，各包）
pnpm lint           # ESLint（flat config，no-any）
pnpm format:check   # Prettier 检查
pnpm test           # 单元 / 集成测试（Vitest）
pnpm build          # 构建（turbo）
pnpm test:e2e       # 端到端测试（Playwright，见下）
```

## 运行各应用

```bash
pnpm --filter @sourdex/server start    # 本地服务（127.0.0.1:8787）
pnpm --filter @sourdex/web dev         # Web UI（dev server）
pnpm --filter @sourdex/extension zip   # 打包插件 → .output/*.zip
```

Web UI 通过 token 访问本地服务：`VITE_SOURDEX_API_TOKEN=<token> pnpm --filter @sourdex/web dev`。token 由插件配对流程产生（服务端控制台打印配对码）。

## 测试

- 单元 / 集成：Vitest（两套 project：node 与 jsdom）。核心逻辑可脱离 UI 与真实 DB 测试。
- 端到端：Playwright。运行前置：

  ```bash
  pnpm build                          # 产出 server dist
  pnpm exec playwright install chromium
  pnpm test:e2e                       # 需 5180 / 8799 端口空闲
  ```

  E2E 覆盖 v0.1 关键链路：保存 → Inbox → 搜索 → Reader → 导出 Markdown。详见 [09_TEST_PLAN.md](09_TEST_PLAN.md) §5。

## 数据库与迁移

- SQLite + Drizzle + FTS5；schema 严格遵循 PRD §12，**不得擅自增删表 / 字段**。
- 数据结构变更必须附 migration + 迁移测试（见 [.claude/rules/database.md](../.claude/rules/database.md)）。

## 提交与 PR

- 遵循 Conventional Commits（见 [CONTRIBUTING.md](../CONTRIBUTING.md)）。
- 每个 PR 必须通过：install / typecheck / lint / format check / unit test / build（CI 全绿）。
- 触及核心闭环的改动须跑相关集成 + E2E。

## 文档驱动流程

每次开始 / 完成任务遵循 [CLAUDE.md](../CLAUDE.md) 的 Starting / Closing / Batch 协议，并同步更新 `docs/08_TASKS.md`、`docs/12_PROGRESS.md`（及阶段完成时的 `docs/14_STAGE_SUMMARY.md`）。
