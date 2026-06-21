# Rules — Testing, Build & Checks

> 适用范围：单元/集成/E2E 测试、构建与检查。须符合 [docs/09_TEST_PLAN.md](../../docs/09_TEST_PLAN.md) 与 PRD 21–22。

## 工具（默认，OQ-T4）

- 单元/集成：Vitest。
- 组件渲染：@testing-library/react。
- E2E：Playwright。
- 具体命令在项目初始化后于 09_TEST_PLAN 落实（当前预期 `pnpm test` / `pnpm typecheck` / `pnpm lint` / `pnpm build`）。

## 必测范围（PRD 21.1/21.2/21.3）

- 单元：URL 规范化、正文提取、Markdown 转换、标签规范化、搜索 query 解析、导出文件名安全、（v0.2）AI 输出 JSON 解析、repository。
- 集成：保存网页完整流程、提取失败 fallback、搜索流程、导出流程、插件↔本地服务连接、（v0.2）AI 摘要任务。
- E2E（v0.1）：保存网页 → 打开 Inbox → 搜索 → 打开详情 → 导出 Markdown。

## 测试原则

- 核心逻辑必须能脱离 UI 与真实 DB 测试（PRD 9.5）。
- extractor 用 fixture；ai provider 用 mock；repository 用测试 SQLite；service 单测。
- 覆盖正常 + 边界 + 异常路径；无外部网络依赖。
- 测试隔离数据目录到临时路径，测试后清理；不写用户真实数据目录。

## Fixture（PRD 21.4）

- 维护：普通博客、技术文档、GitHub issue、论坛、中文、英文、提取失败页面。
- 位置：`packages/extractor/test/fixtures/`。

## 每阶段必跑检查

见 [09_TEST_PLAN §11](../../docs/09_TEST_PLAN.md)。任务完成前必须运行对应检查并记录结果。

## 构建与 CI（PRD 22.1）

- 每个 PR：install / typecheck / lint / format check / unit test / build 全绿。
- 不允许 `any` 泄漏（除注释说明）；lint/format 必须通过。

## 回归与合并门槛（PRD 29.15）

- 触及核心闭环必须跑相关集成 + E2E。
- **不合并没有测试或没有说明的核心 PR。**
- 数据结构变更必须附迁移测试。

## 性能校验（PRD 18.2）

- 搜索：1 万条资料内关键词搜索 < 500ms（STAGE-08 校验）。
- 保存：插件点击 1s 内反馈。

## 禁止

- 编写或引用不存在的测试命令（未确认前写“待确认”）。
- 未运行检查就声称任务完成。
- 测试污染用户真实数据目录。
- 跳过核心闭环的集成/E2E。

## Open Questions

- OQ-T4 测试框架确认（Vitest + Playwright）。
- OQ-TP2 扩展 E2E 运行方式（随 OQ-A1 确定）。
- OQ-TP3 1 万条性能数据生成方式（建议复用 seed）。
- OQ-TP4 覆盖率门槛是否纳入 CI（建议暂不强制）。
