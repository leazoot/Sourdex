# 09 Test Plan — Sourdex

> Follows [docs/PRD.md](./PRD.md) 21–22. Project is **not yet initialized**; concrete commands are marked “待项目初始化后确认”. Do not invent test commands that don't exist. No core development should proceed without a defined check strategy.

## 1. 测试目标

- 保证 v0.1 核心闭环（保存 → 提取 → 入库 → 搜索 → 阅读 → 导出）稳定可靠。
- 保护模块边界与分层（PRD 9）：核心逻辑可脱离 UI 与真实 DB 测试。
- 满足 PRD 25.1 质量指标：插件保存率 95%+、正文提取成功率 80%+、搜索 1 万条内 < 500ms。

## 2. 测试范围

| 范围 | v0.1 | 说明 |
|------|------|------|
| URL 规范化 | ✅ 单元 | PRD 21.1 |
| 正文提取 / 清洗 | ✅ fixture 单元 | PRD 21.1/21.4 |
| HTML→Markdown | ✅ 单元 | PRD 21.1 |
| 标签规范化 | ⚠️ 基础 | 完整规则 v0.2 |
| 搜索 query 解析 | ✅ 单元 | PRD 21.1 |
| 导出文件名安全 | ✅ 单元 | PRD 21.1 |
| AI 输出 JSON 解析 | ⏸ v0.2 | 随 AI 功能 |
| Repository | ✅ 测试 SQLite | PRD 21.1 |
| 保存网页完整流程 | ✅ 集成 | PRD 21.2 |
| 提取失败 fallback | ✅ 集成 | PRD 21.2 |
| 搜索流程 | ✅ 集成 | PRD 21.2 |
| 导出流程 | ✅ 集成 | PRD 21.2 |
| 插件↔本地服务连接 | ✅ 集成 | PRD 21.2 |
| E2E 关键链路 | ✅ E2E | PRD 21.3 |

## 3. 单元测试策略（PRD 21.1）

- 工具（STAGE-01 已确认）：Vitest（root config，`pnpm test` = `vitest run`，匹配 `{apps,packages}/**/src/**/*.test.ts`）。
- 范围：纯函数/领域逻辑/工具（URL 规范化、Markdown 转换、标签规范化、query 解析、文件名安全、AI JSON 解析[v0.2]）。
- 要求：覆盖正常 + 边界 + 异常路径；无外部网络依赖；extractor 用 fixture，ai provider 用 mock。

## 4. 集成测试策略（PRD 21.2）

- 工具（默认）：Vitest + 测试 SQLite（内存或临时文件库）。
- 范围：保存网页完整流程、提取失败 fallback、搜索流程、导出流程、AI 摘要任务[v0.2]、插件与本地服务连接。
- 要求：使用真实 SQLite + repository；隔离数据目录到临时路径，测试后清理。

## 5. E2E 测试策略（PRD 21.3）

- 工具（默认）：Playwright（见 OQ-T4）。
- v0.1 必覆盖：① 保存网页 ② 打开 Inbox ③ 搜索关键词 ④ 打开资料详情 ⑤ 导出 Markdown。
- 要求：针对 Web UI + 本地服务联调；扩展保存路径可用集成测试或 Playwright 扩展上下文（机制随 OQ-A1 确定）。
- 实现（STAGE-10/TASK-048，`tests/e2e/save-search-export.spec.ts`）：用真实 server（`apps/server/dist`）+ Vite dev（`@sourdex/web`）跑通五步关键链路；① 保存经本地 capture API（扩展所调端点），② 后台 worker 真实提取+建索引（轮询 `/api/items/:id/content` 至关键词出现），③④⑤ 通过真实 Web UI 完成。鉴权用预写 `auth.json` 的固定 token（临时数据目录 `$TMPDIR/sourdex-e2e`，前端经 `VITE_SOURDEX_API_TOKEN` 注入），免交互配对。OQ-TP2：扩展 MV3 在 headless 下加载脆弱，故 E2E 以「调用扩展所用 capture API」覆盖保存路径，扩展 UI 自身由单测/集成测试覆盖。
- 运行命令：先 `pnpm build`（产出 server dist）+ `pnpm exec playwright install chromium`，再 `pnpm test:e2e`；需 5180/8799 端口空闲（Playwright 自动起停 server 与 Vite dev）。

## 6. 手动验收清单（v0.1，对齐 PRD 28）

1. 插件可保存当前网页。
2. 插件可保存选中文本。
3. 本地服务可启动（监听 127.0.0.1）。
4. SQLite 可迁移（空库 → 可用）。
5. 网页正文可提取（含中文/技术文档）。
6. Markdown 可生成。
7. Inbox 可查看资料。
8. Library 可查看资料。
9. Reader 可阅读资料（无广告/导航）。
10. 搜索可用（命中片段 + 高亮）。
11. 单条 Markdown 可导出（Obsidian 可打开）。
12. 批量 Markdown 可导出（zip 目录清晰）。
13. 设置页可查看数据目录。
14. 深色模式可用。
15. EN/中文可切换。
16. 服务关闭时插件提示清晰。
17. 提取失败时资料仍保存。
18. 删除有二次确认且不静默删用户数据。
19. 关闭网络后仍可查看/搜索/导出。
20. README 可指导新用户运行。

## 7. 构建检查（PRD 22.1）

- 命令（STAGE-01 已确认可用）：`pnpm install` / `pnpm typecheck`（turbo）/ `pnpm build`（turbo）。

## 8. Lint / Format 检查

- ESLint 9 flat + Prettier 3（PRD 24.1）。命令（STAGE-01 已确认）：`pnpm lint`（`eslint .`）/ `pnpm format:check`（`prettier --check .`，Markdown 排除）。
- 关键规则：no-any（必须时注释说明）、文件 kebab-case、组件 PascalCase、组件 < 150 行、函数尽量 < 50 行。

## 9. 安全检查（PRD 17）

- 静态核对：服务默认 127.0.0.1（禁止 0.0.0.0）；所有 API 输入 Zod 校验；CORS 仅允许插件 ID + 本地 Web UI；日志不含正文/API Key；导出诊断日志脱敏；API Key 加密存储（v0.2）。
- 建议：依赖审计（`pnpm audit`，待确认）；提交前扫描密钥（可选 hook）。
- 详见 [.claude/rules/security.md](../.claude/rules/security.md)。

## 10. 回归测试策略

- 每个 PR：执行 CI 全套（PRD 22.1）。
- 触及核心闭环的改动：必须同时跑相关集成测试 + 相关 E2E。
- PRD 29.15：不合并没有测试或没有说明的核心 PR。
- 数据结构变更：必须附迁移与迁移测试。

## 11. 每个阶段需要运行的检查

| Stage | 必跑检查 |
|-------|----------|
| STAGE-01 | install / typecheck / lint / format / build / CI 全绿 |
| STAGE-02 | typecheck + core 单元测试（URL 规范化等） |
| STAGE-03 | repository 测试 SQLite 单测 + 迁移测试 |
| STAGE-04 | API 集成测试 + 输入校验 + 服务启动检查 |
| STAGE-05 | extractor fixture 单测 + fallback 集成 + Markdown 转换单测 |
| STAGE-06 | 插件↔服务连接集成 + 手动加载 Chrome 验证 |
| STAGE-07 | 组件渲染测试 + typecheck + lint + 手动 UI 验收 |
| STAGE-08 | 搜索集成测试 + query 解析单测 + 1 万条性能校验 |
| STAGE-09 | 导出单测（文件名安全）+ 导出集成测试 |
| STAGE-10 | E2E 全链路 + 手动验收清单 + CI + 打包验证 |

## 12. Fixture（PRD 21.4）

维护网页 fixture：普通博客、技术文档、GitHub issue、论坛帖子、中文文章、英文文章、提取失败页面。存放于 `packages/extractor/test/fixtures/`。

## 13. Open Questions

- OQ-TP1（=OQ-T4）：是否采用 Vitest + Playwright 默认组合？确认后将本文“待确认”命令落实为具体命令。
- OQ-TP2：扩展 E2E 的运行方式（Playwright 加载 MV3 扩展 vs 仅集成测试 API 路径）。**已解决（STAGE-10/TASK-048）**：E2E 经扩展所用 capture API 覆盖保存路径（headless 加载 MV3 脆弱），扩展 UI 由单测/集成测试覆盖。
- OQ-TP3：性能基准如何生成 1 万条测试数据（seed 脚本 vs fixture 批量）。建议复用 STAGE-03 seed。
- OQ-TP4：覆盖率门槛是否纳入 CI？PRD 未要求；建议先不强制，核心逻辑优先。
