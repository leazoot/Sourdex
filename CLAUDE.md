# CLAUDE.md — Sourdex 执行规约

> 本文件约束 Claude Code 在本项目的所有开发行为。每次开始任务前必读。规则冲突时：PRD > 本文件 > 其他文档。

## 1. 项目背景

Sourdex 是**本地优先的全网资料索引库**（Save once. Find forever.）。用户通过浏览器插件一键保存网页/选中文本，系统提取正文、生成 Markdown、本地 SQLite 入库、建立全文索引，可选 AI 摘要与可溯源问答。当前目标版本 **v0.1 MVP** 闭环：保存 → 提取 → 入库 → 全文搜索 → 阅读 → 导出 Markdown。

技术栈：TypeScript monorepo（pnpm + Turborepo）；前端 React+Vite+Tailwind+shadcn/ui+Zustand+TanStack Query；插件 WXT+MV3；后端 Node+Fastify+Zod+Drizzle+SQLite(FTS5)。详见 [docs/04_TECH_STACK.md](docs/04_TECH_STACK.md)。

## 2. 每次开始任务前必读文档

1. 本文件 `CLAUDE.md`
2. [docs/08_TASKS.md](docs/08_TASKS.md)
3. [docs/12_PROGRESS.md](docs/12_PROGRESS.md)
4. 与当前任务相关的：[02_REQUIREMENTS](docs/02_REQUIREMENTS.md) / [03_ARCHITECTURE](docs/03_ARCHITECTURE.md) / [04_TECH_STACK](docs/04_TECH_STACK.md) / [09_TEST_PLAN](docs/09_TEST_PLAN.md)
5. 当前任务领域对应的规则：[.claude/rules/](.claude/rules/)（frontend/backend/database/testing/security）
6. 需要追溯需求时读 [docs/PRD.md](docs/PRD.md)
7. **涉及任何 UI 的任务**：先查阅设计稿 `design/`（`Sourdex.dc.html` + `screenshots/`，规范页见 `screenshots/11-design-system.png`）

## 3. Starting Protocol（每次开始任务前必须执行）

1. 阅读 `CLAUDE.md`。
2. 阅读 `docs/08_TASKS.md`。
3. 阅读 `docs/12_PROGRESS.md`。
4. 阅读与当前任务相关的需求、架构、技术栈、测试文档与对应规则文件。
5. 判断当前应执行哪个任务（依据 PROGRESS 的“当前任务”与 TASKS 的依赖/优先级/状态）。
6. 确认该任务是否存在阻塞问题（依赖未完成、相关 Open Question 未确认、需求矛盾）。
7. 若存在阻塞，输出 **Decision Required**（阻塞问题 / 推荐决策 / 不同选择影响 / 建议 / 确认后下一步），**不要开始编码**。
8. 若无阻塞，**只执行一个明确任务**。
9. **未阅读任务文档不得开始写代码。**

## 4. 开发工作流

1. 走 Starting Protocol，锁定单个任务。
2. 将该任务状态改为 `IN_PROGRESS`。
3. 按架构与规则实现（遵守分层、依赖方向、接口隔离、Repository/Adapter/Strategy/Factory/Command/DI 模式）。
4. 编写/更新该任务要求的测试。
5. 运行该阶段必跑检查（见 [09_TEST_PLAN](docs/09_TEST_PLAN.md) §11）。
6. 核对任务验收标准。
7. 走 Closing Protocol。
8. 给出下一步建议，等待指示。

## 5. 编码规则

- **设计稿一致性（强制）**：所有 UI——Web UI、未来桌面 app、浏览器插件——的布局/组件/颜色/间距/状态必须**严格按 `design/` 设计稿实现**，不得自由发挥。设计稿是界面的视觉 source of truth（PRD 管功能范围，设计稿管界面呈现）。实现 UI 前对照 `design/Sourdex.dc.html` 与对应 `design/screenshots/*`，并遵循 `screenshots/11-design-system.png` 的设计系统（颜色/字号/圆角/间距/组件）。当前 Batch 只实现 v0.1 页面，但实现时仍按设计稿；设计稿与本项目文档冲突时先提出 Decision Required，不擅自取舍。
- 严格遵守 [docs/03_ARCHITECTURE.md](docs/03_ARCHITECTURE.md) 的分层与依赖方向，以及 [.claude/rules/](.claude/rules/) 各领域规则。
- TypeScript strict；禁止 `any`（必须时注释说明原因）；所有外部输入用 Zod 校验。
- 文件 kebab-case；React 组件 PascalCase；类型 PascalCase；常量 UPPER_CASE/清晰 camelCase。
- React 组件 < 150 行；函数尽量 < 50 行；early return；避免深层嵌套、神级函数、隐式副作用、全局可变状态。
- 明确错误类型，不吞错误，不向 UI 暴露底层错误；后台任务记录失败原因与重试次数。
- 注释只写复杂算法/排序公式/安全/迁移/兼容 workaround/AI prompt 约束/脱敏逻辑；不写废话注释。
- 不引入非必要重型依赖；新增依赖必须说明原因。
- 数据模型严格遵循 PRD 12，不得擅自增删表/字段。

## 6. 文档更新规则

- 任何任务/阶段/批次状态变化，必须同步更新 `docs/08_TASKS.md`。
- 每次任务完成，必须更新 `docs/12_PROGRESS.md`。
- 阶段/Milestone/Batch/重要模块完成，必须更新 `docs/14_STAGE_SUMMARY.md`。
- 架构/技术栈/需求发生变更，必须更新对应 `docs/03`/`04`/`02`，并在 PROGRESS 记录。
- 新出现的不确定项写入对应文档的 Open Questions，并在 `08_TASKS.md` 汇总（OQ-* 编号）。
- 文档之间用相对链接互引，保持一致。

## 7. 任务完成后的检查规则

- 必须运行该阶段在 [09_TEST_PLAN](docs/09_TEST_PLAN.md) §11 规定的检查。
- 涉及核心闭环的改动必须跑相关集成测试（及 E2E，若适用）。
- **未运行检查不得声称任务完成；检查未通过不得标记 DONE。**
- 数据结构变更必须附迁移与迁移测试。

## 8. 任务完成后的进度更新规则（Closing Protocol 第 2 步）

更新 `docs/12_PROGRESS.md`，记录：本次完成了什么、修改了哪些文件、运行了哪些检查、检查结果、当前项目进度、明确的下一步。

## 9. Closing Protocol（每次完成任务后必须执行）

1. **更新 `docs/08_TASKS.md`**：任务状态改 `DONE`/`PARTIAL`/`BLOCKED`；记录完成情况；记录验收标准是否满足。**未满足验收标准不得标记 DONE。**
2. **更新 `docs/12_PROGRESS.md`**：完成内容、修改文件、运行的检查、检查结果、当前进度、下一步。
3. **若完成的是阶段/Milestone/Batch/重要模块**：更新 `docs/14_STAGE_SUMMARY.md`（阶段目标是否完成、成果、遗留问题、下一阶段目标、下一步建议）。
4. **最终回复必须包含**：本次完成内容、修改了哪些文件、更新了哪些文档、运行了哪些检查、检查是否通过、当前进度、下一步建议。

## 10. 阶段完成后的总结规则

阶段完成时，在 `docs/14_STAGE_SUMMARY.md` 追加该阶段记录（沿用模板字段），并将该 Stage 在 `08_TASKS.md` 标记完成状态。

## 11. 下一步任务判断规则

- 依据 PROGRESS 的“当前任务”、TASKS 的依赖关系、优先级（P0>P1>P2）、状态选择下一个任务。
- 依赖未完成的任务不得开始。
- 相关 Open Question 未确认且为该任务硬阻塞时，先输出 Decision Required。
- 一次只推进一个任务，不并行实现无关任务。

## 12. Batch Planning Protocol（当前 Batch 完成后必须执行）

1. **不要自动进入下一个 Batch。**
2. 先更新 `docs/14_STAGE_SUMMARY.md`。
3. 基于实际进度重新阅读项目文档。
4. 重新规划下一批 **不超过 10 个阶段**。
5. 把未完成或新增内容写入新的 Batch。
6. 把暂不执行的内容放入 Future Backlog。
7. 输出下一批阶段计划并**等待确认**，除非用户明确要求继续。

## 13. Open Questions 处理规则

- PRD 不明确、且影响实现的内容必须进入 Open Questions，不得擅自定死关键决策。
- 非阻塞模糊项可标注推荐默认值继续，但必须记录为 Open Question。
- 阻塞决策（影响架构/安全/数据结构/对外发布）必须先 Decision Required 并等待确认。
- 当前已知硬阻塞：**OQ-A1**（插件↔服务握手，STAGE-06 前）、**OQ-04**（License，STAGE-10 前）。
- Open Question 一旦确认，更新对应文档并在 PROGRESS 记录结论。

## 14. 禁止事项

1. 不允许完成任务后不更新进度文档。
2. 不允许只口头总结而不写入 `docs/12_PROGRESS.md`。
3. 不允许阶段完成后不更新 `docs/14_STAGE_SUMMARY.md`。
4. 不允许 Batch 完成后不做阶段总结。
5. 不允许跳过下一步建议。
6. 不允许一次实现多个无关任务。
7. 不允许随意扩大 PRD 范围。
8. 不允许未阅读任务文档就开始写代码。
9. 不允许未运行检查就声称任务完成。
10. 不允许修改与当前任务无关的文件。
11. 不允许新增依赖但不说明原因。
12. 不允许把 Future Backlog 当作当前 Batch 任务直接实现。
13. 不允许在存在阻塞决策时继续开发。
14. 不允许未满足验收标准就标记为 DONE。
15. 不允许破坏模块边界、在 UI 写复杂业务、在 service 直 new 具体 Provider、在日志输出正文/API Key、让 AI 阻塞保存主流程（PRD 29）。
16. 不允许 UI 偏离 `design/` 设计稿自由发挥；未参照设计稿不得开始 UI 编码。
