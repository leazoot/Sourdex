# 08 Tasks — Sourdex

> Structure: Batch → Stage → Task. Only the **current Batch** is planned (max 10 stages). Everything beyond goes to Future Backlog. Re-plan the next Batch only after the current one completes. Do not invent completed work. Do not pull Future Backlog into the current Batch.

Status legend: `TODO` / `IN_PROGRESS` / `DONE` / `PARTIAL` / `BLOCKED`
Priority: `P0` (v0.1 must-have) / `P1` (v0.2) / `P2` (later)

---

## Current Batch

- **Batch ID**: BATCH-02
- **Batch Name**: Sourdex v0.2 — 抓取质量硬化 + AI 价值层（摘要 / 标签 / 语义检索 / Ask）
- **Batch Goal**: 先把「存进来的东西干净完整」（动态页/Discourse/占位噪声），再叠加 AI 价值层让工具作用显性化。抓取硬化排在 AI 之前。
- **Batch Status**: IN_PROGRESS（STAGE-11 进行中）
- **Batch Acceptance Criteria**: 动态/论坛页提取干净完整（无占位 byline 噪声）；AI 摘要/标签/语义检索/Ask 可用且默认关闭、可溯源；API Key 安全存储；CI/核心测试通过。
- 计划见下方「## BATCH-02 Stages」。

### 上一 Batch

- **BATCH-01**（Sourdex v0.1 MVP）— **DONE**：STAGE-01 ~ STAGE-10 全部完成，v0.1.0 已发布到 GitHub（`leazoot/Sourdex`），PRD §28 全 20 项满足。

---

## Stages

> 本 Batch 共 10 个阶段，按依赖顺序排列。阶段映射 PRD 24 的 Milestone 1–8（M2 拆为 DB 与 API 两个阶段以降低单阶段体积）。

### STAGE-01：工程初始化与基线

- 阶段目标：搭建 monorepo 与工程基线，使 install/build/typecheck/CI 可运行。
- 阶段状态：DONE（2026-06-20）
- 决策（已确认默认）：OQ-T5 → Node 22 LTS / pnpm 10.30.3 / Turborepo ^2；OQ-T4 → Vitest + Playwright。已落地：实测 Node v22.22.0 / pnpm 10.30.3 / turbo 2.9.18 / typescript 5.9.3 / eslint 9 / prettier 3 / vitest 3 / @playwright/test 1.61。
- 是否需要人工确认：是（OQ-T5/OQ-T4 已采用默认确认；License OQ-T6 延后到 STAGE-10）
- 阶段验收标准：`pnpm install` / `pnpm build` / `pnpm typecheck` 成功 ✅；ESLint + Prettier 配置生效 ✅；CI 在 PR 上正常运行（工作流已编写，六步与本地一致并本地全绿；GitHub 实跑待首次 push，本环境无远程仓库无法触发）；README 初版存在 ✅。
- 验证结果（2026-06-20，本地）：install ✅ / typecheck ✅ / lint ✅ / format:check ✅ / test ✅(1 passed) / build ✅(emit dist)。

#### TASK-001：初始化 pnpm workspace 与 Turborepo
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：建立 monorepo 骨架（apps/、packages/、docs/、scripts/、tests/），配置 pnpm-workspace.yaml、turbo.json、根 package.json，按 PRD 8 的目录约定。
- 依赖：无
- 涉及文件：`package.json`、`pnpm-workspace.yaml`、`turbo.json`、`.npmrc`、`.nvmrc`、`apps/*`（占位 .gitkeep）、`packages/*`（占位 .gitkeep）、`packages/core`（最小占位包）
- 验收标准：`pnpm install` 成功 ✅；turbo 任务可执行 ✅（turbo run build/typecheck 正常）。
- 是否需要人工确认：是（OQ-T5 已采用默认：Node 22 / pnpm 10.30.3 / turbo ^2）
- 备注：仅安装基线 devDeps；apps 与其余 packages 为 .gitkeep 占位，由后续阶段填充；packages/core 仅含版本占位（域模型在 STAGE-02）。

#### TASK-002：TypeScript strict 基线与共享 tsconfig
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：根 tsconfig 启用 strict；各 package/app 继承；禁止 any 基线。
- 依赖：TASK-001
- 涉及文件：`tsconfig.base.json`、`packages/core/tsconfig.json`
- 验收标准：`pnpm typecheck` 成功且 strict 生效 ✅（base 含 strict + noUncheckedIndexedAccess + noUnusedLocals/Parameters 等）。
- 是否需要人工确认：否
- 备注：no-any 由 ESLint `@typescript-eslint/no-explicit-any: error` 强制（TASK-003）。

#### TASK-003：ESLint + Prettier 配置
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：统一 lint/format 规则，对齐 PRD 11 代码风格（no-any 等）。
- 依赖：TASK-001
- 涉及文件：`eslint.config.mjs`（ESLint 9 flat + typescript-eslint + eslint-config-prettier）、`.prettierrc.json`、`.prettierignore`、`.editorconfig`
- 验收标准：`pnpm lint` ✅、`pnpm format:check` ✅ 可运行并通过。
- 是否需要人工确认：否
- 备注：Markdown 排除出 Prettier 管控（docs 为 prose，且不修改用户 PRD.md）；kebab-case/PascalCase 命名约定写在规则文档，未来视需要加 lint 规则。

#### TASK-004：测试框架基线（Vitest + Playwright）
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：配置 Vitest（单元/集成）与 Playwright（E2E）骨架，提供 `pnpm test` 入口。
- 依赖：TASK-001
- 涉及文件：`vitest.config.ts`、`playwright.config.ts`、`tests/e2e/.gitkeep`、`packages/core/src/index.test.ts`（冒烟测试）
- 验收标准：`pnpm test` 可运行 ✅（vitest run，1 passed）；命令已写入 09_TEST_PLAN。
- 是否需要人工确认：是（OQ-T4 已采用默认：Vitest + Playwright）
- 备注：E2E 关键链路在 STAGE-10/TASK-048 实现；Playwright 浏览器二进制需在跑 E2E 前 `pnpm exec playwright install`。

#### TASK-005：CI 流水线（GitHub Actions）
- 状态：DONE（2026-06-20，本地等价验证全绿；GitHub 实跑待首次 push）
- 优先级：P0
- 说明：PR 触发 install/typecheck/lint/format check/unit test/build（PRD 22.1）。
- 依赖：TASK-002, TASK-003, TASK-004
- 涉及文件：`.github/workflows/ci.yml`
- 验收标准：CI 在 PR 上全绿运行 —— 工作流已编写（pnpm/action-setup + setup-node@22 + frozen-lockfile，六步与本地命令一致）；六步本地全绿；本环境无 GitHub 远程，实际 PR 运行待首次 push 验证。
- 是否需要人工确认：否
- 备注：CI 用 `--frozen-lockfile`，需将 `pnpm-lock.yaml` 纳入首次提交。

#### TASK-006：README 初版
- 状态：DONE（2026-06-20）
- 优先级：P1
- 说明：初版 README（定位/核心功能/本地运行/仓库结构/开发约定/隐私/License 占位），完整版在 STAGE-10。
- 依赖：TASK-001
- 涉及文件：`README.md`
- 验收标准：README 存在并能指引基本结构 ✅。
- 是否需要人工确认：否
- 备注：完整 README + 隐私/安装/CONTRIBUTING/SECURITY/ROADMAP 在 STAGE-10/TASK-047。

---

### STAGE-02：核心领域模型与共享类型（packages/core）

- 阶段目标：建立全局类型、领域枚举、错误类型与通用工具，作为各模块共享基础。
- 阶段状态：DONE（2026-06-20）
- 是否需要人工确认：否
- 阶段验收标准：core 可被其他包引用 ✅（构建产物 dist 含 .d.ts/.js，node 实测可 import）；类型 typecheck 通过 ✅；core 不依赖任何上层 ✅（grep 校验无 @sourdex/* 上层依赖）。
- 验证结果（2026-06-20，本地）：typecheck ✅ / lint ✅ / format:check ✅ / test ✅(12 passed, 2 files) / build ✅(emit dist)；dist import 冒烟 ✅。

#### TASK-007：领域类型与枚举
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：定义 `SourceType`、`ItemStatus`、`AiStatus`、Item/Capture/Tag/Job/Search 等 DTO，及 v0.2 实体类型（Chunk/Annotation/AiOutput/ProviderConfig/SummaryOutput）。
- 依赖：TASK-002
- 涉及文件：`packages/core/src/types/{item,capture,tag,job,search,chunk,annotation,ai,index}.ts`
- 验收标准：类型覆盖 v0.1 实体 ✅；无 any ✅（ESLint no-explicit-any 通过）。
- 是否需要人工确认：否
- 备注：camelCase 域模型对应 PRD 12 snake_case 列；映射由 packages/db 的 repository 负责（STAGE-03）。

#### TASK-008：错误类型与通用工具
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：`SourdexError` 基类 + `CaptureError`/`ExtractionError`/`AIProviderError`/`DatabaseError`/`NotFoundError`/`ValidationError`（含 code 与 cause，PRD 11.5）；URL 规范化/域名提取、id 生成、时间工具。
- 依赖：TASK-007
- 涉及文件：`packages/core/src/errors/{errors,index}.ts`、`packages/core/src/utils/{url,id,time,index}.ts`、`packages/core/src/utils/url.test.ts`
- 验收标准：URL 规范化有单测 ✅（11 个用例，覆盖大小写/默认端口/tracking 参数/排序/fragment/trailing slash/幂等/非法输入）。
- 是否需要人工确认：否
- 备注：core 不依赖 server ✅；id 用 Web Crypto（跨运行时）；时间统一 ISO 8601。

#### TASK-009：共享接口契约（Storage / JobQueue / ContentExtractor 等）
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：定义接口隔离的能力契约（PRD 9.3）：`ContentExtractor`+`ExtractStrategy`、`JobQueue`、`Storage`、`Exporter`、`SearchEngine`、`Logger`，并预留 v0.2 的 `LLMProvider`/`EmbeddingProvider`。
- 依赖：TASK-007
- 涉及文件：`packages/core/src/contracts/{extractor,job-queue,storage,exporter,search-engine,logger,ai,index}.ts`
- 验收标准：契约可被各实现包引用并实现 ✅（barrel 导出，typecheck/build 通过）。
- 是否需要人工确认：否
- 备注：仅定义接口，不实现；Storage 用 Uint8Array 保持跨运行时。

---

### STAGE-03：数据库与持久层（packages/db）

- 阶段目标：建立 SQLite schema、迁移与 repository，覆盖 v0.1 实体。
- 阶段状态：DONE（2026-06-20）
- 决策（已确认默认）：OQ-A5 → 一次建全部 9 表；OQ-A3 → FTS 由 SearchRepository 应用层维护；OQ-A4 → source_hash = 规范化 canonical_url 优先 + 内容 hash 兜底（sha256）。
- 是否需要人工确认：是（OQ-A3/A4/A5 已采用推荐默认确认）
- 阶段验收标准：迁移可运行 ✅（:memory: 与 on-disk 均验证，幂等，重开后空操作）；repository CRUD 有测试 SQLite 单测 ✅（37 用例）；schema 与 PRD 12 一致 ✅（DDL 逐字对应 PRD §12）。
- 验证结果（2026-06-20，本地）：typecheck ✅ / lint ✅ / format:check ✅ / test ✅(37 passed, 9 files) / build ✅；better-sqlite3+FTS5 ✅；on-disk 持久化+dedup+FTS 冒烟 ✅。

#### TASK-010：SQLite schema 与 Drizzle 接入
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：按 PRD 12 定义 9 张表（v0.1 启用 items/captures/tags/item_tags/jobs；v0.2 表 chunks/annotations/ai_outputs/provider_configs 一次建好，OQ-A5）+ FTS5 虚拟表；Drizzle 客户端（better-sqlite3，WAL + foreign_keys ON）。
- 依赖：TASK-007
- 涉及文件：`packages/db/src/schema.ts`、`client.ts`、`mappers.ts`、`package.json`、`tsconfig.json`
- 验收标准：schema 字段与 PRD 12 完全一致 ✅（枚举列 `$type` 绑定 core 类型；DDL 在迁移中逐字对应）。
- 是否需要人工确认：是（OQ-A5 已确认：一次建全表）
- 备注：未擅自增删字段；word_count/reading_time/ai_status 保留 PRD 的 DEFAULT，映射时 `?? 0/none`。

#### TASK-011：Migration 机制
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：显式 SQL 迁移（FTS5/虚拟表需 raw SQL）+ 幂等 runner（`_sourdex_migrations` 跟踪，逐条事务执行）。Drizzle 用于类型化查询；drizzle-kit 可后续叠加。
- 依赖：TASK-010
- 涉及文件：`packages/db/src/migrate.ts`、`packages/db/src/migrations/{0000_init,index}.ts`、`migrate.test.ts`
- 验收标准：从空库迁移成功 ✅；可重复运行幂等 ✅（:memory: 与 on-disk 均验证，重开后返回 []）。
- 是否需要人工确认：否
- 备注：决策——v0.1 采用手写 SQL 迁移（PRD 28.4 数据库可迁移）。
- 备注2：apps/server 首次启动自动建库到数据目录（PRD 16.1）在 STAGE-04/TASK-015 接线。

#### TASK-012：FTS5 虚拟表与索引读写
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：FTS5 虚拟表 `items_fts`(item_id UNINDEXED,title,plain_text,summary,tags; unicode61)；SearchRepository 提供 index/removeFromIndex/search（snippet + rank）。
- 依赖：TASK-010
- 涉及文件：`packages/db/src/migrations/0000_init.ts`（FTS DDL）、`packages/db/src/repositories/search-repository.ts`、`search-repository.test.ts`
- 验收标准：可写入并 MATCH 查询 ✅（3 用例：命中+snippet、重索引去重、移除）。
- 是否需要人工确认：是（OQ-A3 已确认：应用层维护，非触发器）
- 备注：CJK 分词（unicode61 对中文不理想）记为 OQ-A7，留待 STAGE-08 搜索调优；查询解析/转义在 STAGE-08。

#### TASK-013：ItemRepository / CaptureRepository / TagRepository / JobRepository
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：实现 v0.1 repository（Item: create/findById/findBySourceHash/list[筛选+分页+标签]/update/softDelete；Capture: create/findByItemId/updateExtraction；Tag: upsert/attach/detach/listByItem；Job: create/claimNext/markCompleted/markFailed[重试]）+ 事务 helper + source-hash 工具。
- 依赖：TASK-010, TASK-011
- 涉及文件：`packages/db/src/repositories/{item,capture,tag,job}-repository.ts`、`tx.ts`、`source-hash.ts`、各 `*.test.ts`
- 验收标准：CRUD + 软删除有测试 SQLite 单测 ✅（PRD 21.1；Item 8 / Capture 3 / Tag 4 / Job 4 用例）。
- 是否需要人工确认：否
- 备注：repository 返回 core DTO，不泄漏 Drizzle 类型；软删除不物理删；JobRepository 含 attempts/maxAttempts 重试逻辑。

#### TASK-014：开发 seed 数据
- 状态：DONE（2026-06-20）
- 优先级：P2
- 说明：`seedDevData(db)` 注入示例资料（item+capture+tag+FTS 索引），便于本地开发与 UI 联调。
- 依赖：TASK-013
- 涉及文件：`packages/db/src/seed.ts`、`seed.test.ts`
- 验收标准：seed 可注入示例资料 ✅（测试验证可列出且可搜索）。
- 是否需要人工确认：否
- 备注：仅供 dev/test，文档注明不得对生产数据目录运行。

---

### STAGE-04：本地 API 服务（apps/server）

- 阶段目标：实现本地 Fastify API（capture/item）、配置/数据目录、任务 worker 骨架。
- 阶段状态：DONE（2026-06-20）
- 决策（已确认默认）：OQ-A2 → 异步提取（保存优先）；OQ-A6 → Storage 抽象接口 + LocalStorage 实现；OQ-R1 → 重复 URL 返回 status="exists"，`forceNew` 可新建。
- 是否需要人工确认：是（OQ-A2/A6/R1 已采用推荐默认确认）
- 阶段验收标准：API 可创建/查询/更新/软删除资料 ✅（集成测试 + 实跑 curl）；服务默认监听 127.0.0.1 ✅（lsof 实测仅 127.0.0.1:8799）；输入 Zod 校验 ✅（非法 400）；保存不被提取阻塞 ✅（save-first，立即返回，capture=pending，worker 独立）。
- 验证结果（2026-06-20，本地）：typecheck ✅ / lint ✅ / format:check ✅ / test ✅(49 passed, 12 files) / build ✅；构建产物实跑 boot：health/status/capture/list ✅，raw html 落盘 ✅，仅绑定 127.0.0.1 ✅。

#### TASK-015：Fastify 服务骨架与配置/数据目录
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：Fastify app（CORS 仅扩展+本地 UI、错误处理映射域错误）、config（默认 127.0.0.1:8787，可 env 覆盖）、数据目录创建（PRD 16.1）、container 组合根（开库+迁移+repo+storage+services+worker）、health/status 端点。
- 依赖：TASK-009, TASK-011
- 涉及文件：`apps/server/src/{config,paths,app,container,server}.ts`、`routes/health.ts`
- 验收标准：服务可启动 ✅；数据目录自动创建 ✅；监听 127.0.0.1 ✅（lsof 实测）。
- 是否需要人工确认：否
- 备注：未默认 0.0.0.0；首次启动自动建库+迁移到数据目录（PRD 16.1）已接线。插件 token 握手（OQ-A1）留 STAGE-06。

#### TASK-016：本地文件存储（Storage 实现）
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：`LocalStorage implements Storage`（write/readText/readBytes/exists/remove），相对路径写入数据目录，含路径穿越防护（PRD 16.1/17，OQ-A6）。
- 依赖：TASK-009, TASK-015
- 涉及文件：`apps/server/src/infrastructure/storage/local-storage.ts`、`local-storage.test.ts`
- 验收标准：文件按目录结构写入 ✅（实跑 raw-html 落盘）；路径可迁移 ✅（相对路径）。
- 是否需要人工确认：是（OQ-A6 已确认：抽象接口 + 本地实现）
- 备注：拒绝绝对路径与 `..`（安全）；remove 对缺失文件幂等。

#### TASK-017：任务队列 worker（jobs 表 + 进程内轮询）
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：`JobWorker` 轮询 `jobRepo.claimNext()`，按类型分发到注册 handler；成功 markCompleted，抛错 markFailed（重试）；start/stop/processOnce（PRD 10.5/12.7，OQ-03）。
- 依赖：TASK-013, TASK-015
- 涉及文件：`apps/server/src/infrastructure/jobs/job-worker.ts`、`job-worker.test.ts`
- 验收标准：任务可入队、执行、失败重试并记录原因 ✅（3 用例：成功、无 handler→记录错误并最终失败、抛错→重试）。
- 是否需要人工确认：否
- 备注：保存主流程不被阻塞；extract_content 在 container 注册 no-op 占位，真实提取在 STAGE-05/TASK-026 接线。

#### TASK-018：Capture API（POST /api/captures/webpage）
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：CaptureService：domain/canonical/source_hash → 重复判定（findBySourceHash）→ 写 item + raw html 落盘 + selectedText 落盘 → 写 capture(pending) → 即时 FTS 索引标题 → 入队 extract_content → 返回 itemId/jobIds（PRD 13.1，OQ-A4/R1）。
- 依赖：TASK-013, TASK-016, TASK-017
- 涉及文件：`apps/server/src/routes/captures.ts`、`apps/server/src/services/capture-service.ts`
- 验收标准：可创建资料并返回 itemId ✅；重复 URL 返回 status="exists"（forceNew 新建）✅；AI/提取失败不影响保存成功 ✅（save-first）。
- 是否需要人工确认：是（OQ-R1 已确认：exists + forceNew）
- 备注：保存优先，同步返回不等提取；Zod 校验请求体。

#### TASK-019：Item API（GET 列表/详情、PATCH、DELETE 软删除）
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：ItemService + 路由：`GET /api/items`（筛选+分页）、`GET /api/items/:id`（item+capture+tags）、`PATCH /api/items/:id`（title/status/summary/oneSentence）、`DELETE /api/items/:id`（软删除 + 移出 FTS）（PRD 13.2）。
- 依赖：TASK-013
- 涉及文件：`apps/server/src/routes/items.ts`、`apps/server/src/services/item-service.ts`
- 验收标准：可分页查询 ✅、查详情 ✅、改状态 ✅、软删除（列表排除）✅。
- 是否需要人工确认：否
- 备注：Zod 校验 query/params/body；缺失 → 404；PATCH 暂不含 tags（待标签 UI，记 STAGE-07/未来）。

#### TASK-020：保存网页集成测试
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：Fastify `inject` 集成测试覆盖 health/status、保存→入库→列表→详情、dedup+forceNew、PATCH、软删除、400/404（PRD 21.2）。
- 依赖：TASK-018, TASK-019
- 涉及文件：`apps/server/src/server.integration.test.ts`、`testing.ts`（createTestServer）
- 验收标准：保存→入库→查询链路集成测试通过 ✅（6 集成用例 + storage/worker 单测）。
- 是否需要人工确认：否
- 备注：提取 fallback 集成用例在 STAGE-05/TASK-026 补充。

---

### STAGE-05：正文提取与 Markdown（packages/extractor）

- 阶段目标：把保存的网页转为可读正文与 Markdown，失败有 fallback。
- 阶段状态：DONE（2026-06-20）
- 决策：提取栈 = @mozilla/readability + jsdom + turndown（见 04_TECH_STACK §12.5）；OQ-R4 阅读量度 = Latin 词 + CJK 字符，readingTime≈200wpm；webpage 正文最小长度阈值 25 字符（过滤 boilerplate）。
- 是否需要人工确认：否
- 阶段验收标准：普通/技术文档/中文网页可提取 ✅（extractor.test 英文博客/含代码技术文档/中文文章）；失败时保留 raw HTML + 选中文本，资料仍保存 ✅（job 测试：选中文本 fallback + 失败保留 raw）；DB 中有可搜索纯文本 ✅（job 重建 FTS，search 命中正文词）。
- 验证结果（2026-06-20，本地）：typecheck ✅ / lint ✅ / format:check ✅ / test ✅(68 passed, 16 files) / build ✅；构建产物 live boot：capture→后台 worker 自动提取→success，markdown 落盘，wordCount/readingTime 写入 ✅。

#### TASK-021：ContentExtractor 接口实现与 Strategy
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：`createExtractor()` 工厂返回 `CompositeExtractor`（按 sourceType 分发），WebpageExtractStrategy + SelectionExtractStrategy（PRD 9.3/10.3/10.4/8.6）。
- 依赖：TASK-009
- 涉及文件：`packages/extractor/src/{extractor,strategies/webpage,strategies/selection,index}.ts`
- 验收标准：webpage/selection 策略可用 ✅；输入输出为 core DTO，不依赖数据库 ✅。
- 是否需要人工确认：否
- 备注：pdf/video → ExtractionError（v0.2 扩展点）；extractor 不依赖 db。

#### TASK-022：Readability 集成 + HTML 清洗 + 元数据
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：jsdom + @mozilla/readability 提取 title/byline/excerpt/正文/站点；sanitizeHtml 清洗（移除 script/style/iframe/事件处理器/javascript:）；正文最小长度阈值过滤 boilerplate（PRD 5.1.2/17）。
- 依赖：TASK-021
- 涉及文件：`packages/extractor/src/html/{dom,readability,sanitize}.ts`、`sanitize.test.ts`
- 验收标准：主流博客/文档/中文文章可正确提取正文 ✅。
- 是否需要人工确认：否
- 备注：raw HTML 由 server 保留用于来源校验；jsdom 不执行脚本/不加载子资源。

#### TASK-023：HTML → Markdown + plain text + word_count/reading_time
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：turndown HTML→Markdown（atx/fenced）；normalizeWhitespace 纯文本；countWords/readingTimeMinutes（CJK+Latin，OQ-R4）。
- 依赖：TASK-022
- 涉及文件：`packages/extractor/src/markdown/to-markdown.ts`、`text/{plain-text,metrics}.ts`、`metrics.test.ts`
- 验收标准：Markdown 转换可用（代码块保留为 fenced）✅；纯文本入 FTS ✅；metrics 有单测 ✅。
- 是否需要人工确认：否
- 备注：OQ-R4 已定（见阶段决策）。

#### TASK-024：提取失败 fallback
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：job 中提取失败（ExtractionError）→ 若有选中文本则用 SelectionExtractStrategy 兜底（标 success）；否则标 `extraction_status=failed`+error 并保留 raw HTML；非提取类错误才抛出触发重试（PRD 5.1.2/26.1）。
- 依赖：TASK-022
- 涉及文件：`apps/server/src/infrastructure/jobs/extract-content-job.ts`、`extract-content-job.test.ts`
- 验收标准：提取失败资料仍保存且可搜索（选中文本兜底）✅；无选中文本时标 failed 但保留 raw + item 仍在 ✅。
- 是否需要人工确认：否
- 备注：提取失败不抛错（避免重试风暴）。

#### TASK-025：Extractor fixture 测试集
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：内联 fixture（英文博客、含代码技术文档、中文文章、boilerplate 失败页、选中文本）覆盖提取/清洗/Markdown/metrics（PRD 21.4）。
- 依赖：TASK-022, TASK-023, TASK-024
- 涉及文件：`packages/extractor/src/extractor.test.ts`、`html/sanitize.test.ts`、`text/metrics.test.ts`
- 验收标准：fixture 提取测试通过 ✅（7+ 用例）；失败 fixture 触发 fallback（在 job 测试覆盖）✅。
- 是否需要人工确认：否
- 备注：fixture 以内联常量形式置于 *.test.ts（构建排除）；GitHub issue/论坛归类为通用 webpage，未单列。

#### TASK-026：ExtractContentJob 接线
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：`createExtractContentJob` 读取 raw html/选中文本 → extractor.extract → 落 readable html/markdown/plain text → captureRepo.updateExtraction + itemRepo.applyExtraction(author/wordCount/readingTime) + searchRepo 重建 FTS（含 tags）；container 注册真实 handler 替换占位（PRD 10.5）。
- 依赖：TASK-017, TASK-021, TASK-012
- 涉及文件：`apps/server/src/infrastructure/jobs/extract-content-job.ts`、`container.ts`；新增 `ItemRepository.applyExtraction`（packages/db）
- 验收标准：保存后异步提取完成并可搜索 ✅（live boot + 集成测试，search 命中正文）。
- 是否需要人工确认：否
- 备注：补全了 fallback/失败集成用例；STAGE-05 期间为接线在 packages/db 新增 applyExtraction（含单测覆盖路径）。

---

### STAGE-06：浏览器插件保存（apps/extension）

- 阶段目标：从 Chrome/Edge 一键保存当前页与选中文本到本地服务。
- 阶段状态：DONE（2026-06-20，TASK-027~031 全部 DONE）
- 是否需要人工确认：是（**OQ-A1 已确认：方案B 配对码换取 token，2026-06-20**）
- 阶段验收标准：Chrome 可加载插件；当前页可保存；选中文本可保存；服务关闭时提示清晰；**插件 UI（Popup/Options）按 `design/` 设计稿实现（参照 browser-extension 截图 09/17）**。

#### TASK-027：WXT 插件初始化（MV3）
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：WXT + React + TS + Manifest V3 骨架，配置最小权限（PRD 7.2.3, 8.1）。
- 依赖：TASK-001
- 涉及文件：`apps/extension/*`（package.json、wxt.config.ts、tsconfig.json、assets/theme.css、components/Logo.tsx、entrypoints/{popup,options}/{index.html,main.tsx,App.tsx}、entrypoints/background.ts）；root package.json（pnpm.overrides vite/plugin-react）、turbo.json（build outputs 加 `.output/**`）。
- 验收标准：Chrome 可加载 dev 插件。✅ `wxt build` 产出有效 `.output/chrome-mv3`（manifest_version=3，最小权限 activeTab/scripting/contextMenus/storage，host_permissions 仅 127.0.0.1/localhost，commands save-page=⌘⇧S）。
- 是否需要人工确认：否
- 备注：扩展不含 DB/AI/复杂业务逻辑。Tailwind v4（@theme 设计 token，浅/深主题）；WXT 0.20 走 vite 6.4.3（override 统一版本，修复 plugin-react@6/vite7 不兼容）。实环境无 GUI 无法手动加载 Chrome，验收以 build 产物 + manifest 校验为准。

#### TASK-028：本地服务连接与 token 握手
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：实现与本地服务的鉴权握手（token + 首次连接确认），CORS 适配（PRD 17.3，OQ-A1=方案B 配对码）。
- 依赖：TASK-027, TASK-015
- 涉及文件：服务端 `apps/server/src/infrastructure/security/auth.ts`（AuthService + loadOrCreateToken）、`routes/pair.ts`（initiate/complete，loopback-only）、`app.ts`（onRequest Bearer 鉴权 + PUBLIC 白名单）、`config.ts`(tokenPath)、`container.ts`(auth)、`testing.ts`(token/authHeaders)、测试 `security/auth.test.ts`+`routes/pair.integration.test.ts`+更新 `server.integration.test.ts`；扩展 `apps/extension/lib/{config,storage,api,i18n}.ts`、`components/{ConnectionStatus,PairingForm}.tsx`、`entrypoints/options/App.tsx`。
- 验收标准：首次连接需用户确认（配对码换取 token）；后续带 token 访问成功。✅ 实跑 HTTP：health 公开 200、无 token 受保护端点 401、initiate 仅回 expiresAt/codeLength（码只打印到服务终端）、complete 换 43 字符 token、带 token 200、同码重放 401（单次）、绑定 127.0.0.1、token 文件 0600。
- 是否需要人工确认：是（OQ-A1 ✅ 已确认方案B）
- 备注：扩展 Options 配对 UI 按设计系统（无专属截图）；扩展文案集中在 `lib/i18n.ts`（EN，简中随 STAGE-07 i18next）。

#### TASK-029：Popup 保存当前页
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：获取当前 tab 的 URL/title/HTML/favicon/选中文本，POST /api/captures/webpage，1s 内反馈（PRD 5.1.1，OQ-R3=outerHTML 2MB）。
- 依赖：TASK-028, TASK-018
- 涉及文件：`apps/extension/lib/capture-payload.ts`（纯逻辑 + 2MB 上限 + truncated）、`lib/capture.ts`（readActiveTab via scripting.executeScript、saveWebpage）、`entrypoints/popup/App.tsx`（ready/saving/saved/error 状态机）、`components/{SourceCard,PopupOutcome,icons}.tsx`、测试 `lib/capture-payload.test.ts`；`vitest.config.ts`（include 扩展 lib/components/entrypoints）。
- 验收标准：点击后资料出现在 Inbox；显示 "Saved to Sourdex"。✅ 实跑：配对取 token → POST /api/captures/webpage=201 saved → GET /api/items?status=inbox 命中（title/domain/status=inbox）；popup 显示 saved 态。
- 是否需要人工确认：是（OQ-R3 ✅ 已确认 2MB）
- 备注：失败可重试（error 态 + Retry）。Popup v0.1 实现 Save Page + Save Selection + Save as(Webpage/Selection) 指示；设计稿中 PDF/Video/Add note/Quick tags 属 v0.2（capture API 无对应字段），v0.1 不实现以免 dead/误导 UI。truncated 仅在 popup 提示用户，不持久化（不改 PRD 12 数据模型）。

#### TASK-030：右键菜单保存选中文本 + 快捷键
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：context menu "Save selection to Sourdex"，保存选中文本+来源；添加快捷键（PRD 4.2, 24.3）。
- 依赖：TASK-029
- 涉及文件：`apps/extension/entrypoints/background.ts`（contextMenus selection 菜单 + commands save-page 快捷键 + saveTab + 角标反馈）、`lib/capture.ts`（新增 `readTab(tabId)`）；`apps/server/.../jobs/extract-content-job.ts`（提取后 FTS 重建保留选中文本，保证可搜回）+ `server.integration.test.ts` 新增用例。
- 验收标准：选中文本可保存并可搜回。✅ 选中保存复用 /api/captures/webpage（selectedText 入 FTS）；新增测试验证：选中文本即使不在正文，提取后仍保留在 FTS 索引（`searchRepo.search` 命中）。
- 是否需要人工确认：否
- 备注：快捷键/右键无 GUI 无法手动触发，验收以 build 产物（background.js 含菜单/命令）+ FTS 索引测试为准。注意：全文搜索 **端点** 在 STAGE-08；本阶段保证“已索引/可搜回”，`/api/items?q` 目前仅 title LIKE。角标反馈代替通知（无 notifications 权限）。

#### TASK-031：连接失败与状态提示
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：本地服务关闭/未配对时给出清晰提示与重试入口（PRD 24.3 验收）。
- 依赖：TASK-029
- 涉及文件：`apps/extension/components/ConnectionNotice.tsx`、`entrypoints/popup/App.tsx`（按连接态 gate 正文：disconnected→离线提示+Retry、unpaired→配对提示+Open settings；保存中失败进 error 态+Retry）、`lib/i18n.ts`（openSettings/pairPrompt）。
- 验收标准：服务关闭时提示清晰，不静默失败。✅ popup 打开即检测连接态：离线显示"Service offline"+重试；未配对显示"Not paired"+打开设置；保存中断网进 error 态+Retry；header 状态点（olive/copper/clay/checking）实时反映。
- 是否需要人工确认：否
- 备注：连接态分支逻辑在 `lib/api.ts getConnectionState`（NotConnected→disconnected、401→unpaired）；UI 行为需 GUI 不可 headless 自动化，验收以 build 产物 + 服务端 health/401 集成测试为准。

---

### STAGE-07：Web UI 基础（apps/web）

- 阶段目标：完成 Inbox/Library/Reader/Settings 与基础组件、深色模式、i18n。
- 阶段状态：DONE（2026-06-20，TASK-032~038 全部 DONE）
- 是否需要人工确认：是 → 已按记录默认确认：OQ-T3=i18next、OQ-01=Zustand、OQ-02=Tailwind 自建基础组件（shadcn 可后续按需引入）、OQ-D1=source-desk→Inbox/library→Library/reader→Reader/settings→Settings、OQ-D2=v0.2 入口（Ask/Export/Tags）占位禁用；新增 **OQ-W1**（Web UI↔本地服务鉴权）默认：复用 Bearer token，dev 用 `VITE_SOURDEX_API_TOKEN` env、prod 由本地服务注入（STAGE-10），鉴权方案不变（见 TASK-033）。
- 阶段验收标准：能看到/打开/归档/删除资料；深色模式可用；EN/中可切换；**界面严格还原 `design/` 设计稿（布局/组件/颜色/间距，浅+深色对照对应截图与 design-system 规范页）**。

#### TASK-032：App Layout + 路由 + 主题 + i18n
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：布局、导航（Inbox/Library/Search/Settings）、主题（浅/深/跟随）、i18n（EN/中，文案不硬编码）（PRD 6.2, 19）。
- 依赖：TASK-001
- 涉及文件：`apps/web/`（package.json、vite.config.ts、tsconfig.json、index.html、src/main.tsx、src/App.tsx、styles/theme.css、lib/{theme,i18n,config}.ts、locales/{en,zh}.ts、i18next.d.ts、components/{Logo,icons}.tsx + components/layout/{AppLayout,TopBar,Rail}.tsx、features/service-status/ServiceStatus.tsx、pages/{inbox,library,reader,search,settings}/*）。
- 验收标准：导航与主题切换可用；i18n 生效。✅ react-router 路由（Inbox/Library/Reader/Search/Settings）；主题 light/dark/system（Zustand+`.dark` class+localStorage）；i18next EN/中切换；顶栏+60px rail 按设计 01/12；service-status 探活 /api/health。typecheck/build 通过。
- 是否需要人工确认：是（OQ-T3 ✅ i18next）
- 备注：Tailwind v4 设计 token（浅/深）；shadcn 未全量引入（自建基础组件，OQ-02）；Ask/Export/Tags rail 占位禁用（OQ-D2）；Search 页占位（STAGE-08）。无 GUI 无法目视核对像素，验收以 build + 设计对照实现为准。

#### TASK-033：API client + TanStack Query + 数据 hooks
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：封装 server API 调用、`useItems`/`useCaptureStatus` 等 hooks（PRD 11.3）。web 不直接访问 SQLite。
- 依赖：TASK-019, TASK-032
- 涉及文件：`apps/web/src/lib/api/{client,items,query-keys}.ts`、`hooks/useItems.ts`、`vite-env.d.ts`。
- 验收标准：hooks 返回 loading/error/data；类型安全。✅ `apiFetch`（Bearer token OQ-W1、ApiError/NotConnectedError、不泄底层错误）；listItems/getItem/getItemContent/updateItem/deleteItem/getStatus（类型复用 @sourdex/core）；useItems/useItem/useItemContent/useStatus/useUpdateItem/useDeleteItem（TanStack Query，mutation 失效列表/详情）。
- 是否需要人工确认：否
- 备注：web 经 server API（不直连 SQLite）。token 投递见 OQ-W1。web hooks 为薄封装，契约由服务端集成测试覆盖；未单测（避免引入 jsdom，window 依赖）。`/api/items/:id/content` 端点在 TASK-037 加。

#### TASK-034：共享 UI 组件（ItemList / ItemCard / TagDisplay / EmptyState / Loading / Error）
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：可复用展示组件（PRD 11.2, 24.5）；UI 组件不含业务请求。
- 依赖：TASK-032
- 涉及文件：`apps/web/src/components/ui/{Button,TypeBadge,TagDisplay,EmptyState,Loading,ErrorState,ConfirmDialog}.tsx`、`features/item-list/{ItemCard,ItemList}.tsx`、`lib/format.ts`；测试 `lib/format.test.ts` + `features/item-list/ItemCard.test.tsx`；`vitest.config.ts` 改为 node/web 双 project（web=jsdom，`@`→src）。
- 验收标准：组件可独立渲染；空/加载/错误态完备。✅ 纯展示无业务请求；render 测试覆盖 ItemCard（标题/域名/摘要、点击 onOpen、删除 stopPropagation）+ format 工具；EmptyState/Loading/ErrorState 三态齐备。
- 是否需要人工确认：否
- 备注：组件 < 150 行。卡片不显标签（list API 不返回 tags，Reader 详情显示）。新增 jsdom + @testing-library/react 测试栈（OQ-02 自建组件）。

#### TASK-035：Inbox 页面
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：新资料列表（标题/域名/时间/类型/摘要预览），标记已读、归档、删除（二次确认）（PRD 5.1.4, 6.3.1）。
- 依赖：TASK-033, TASK-034
- 涉及文件：`apps/web/src/pages/inbox/InboxPage.tsx`、`features/item-list/useItemActions.ts`、测试 `pages/inbox/InboxPage.test.tsx`。
- 验收标准：保存后可见；可归档/删除；空状态文案正确。✅ 按设计 source-desk(01/12)：eyebrow/标题/标语 + 搜索入口 + “数据在本地”横幅 + inbox 列表（useItems status=inbox）；归档=切换 archived、删除=ConfirmDialog 二次确认；loading/error/empty 三态。render 测试覆盖加载列表 + 空态。
- 是否需要人工确认：否
- 备注：标记已读在 Reader 打开时处理（TASK-037）；卡片 hover 归档/删除。

#### TASK-036：Library 页面
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：所有资料列表 + 标签/域名/类型/时间筛选 + 排序（PRD 6.3.2）。
- 依赖：TASK-033, TASK-034
- 涉及文件：`apps/web/src/pages/library/LibraryPage.tsx`、`features/item-list/VirtualItemList.tsx`、`components/ui/Select.tsx`、测试 `pages/library/LibraryPage.test.tsx`。
- 验收标准：筛选与排序可用；长列表虚拟滚动。✅ 按设计 02/13：标题/副标题、状态 tab（All/Unread/Archived + 计数）、类型筛选 Select、排序 Select（最新/最早/标题）；列表用 `@tanstack/react-virtual` 动态高度虚拟滚动；归档/删除（确认）；三态。render 测试覆盖标题+tab。
- 是否需要人工确认：否
- 备注：v0.1 选中即打开 Reader（设计的右侧预览分栏简化为整页 Reader，记为 v0.1 简化）；标签筛选 UI 待 list API 返回 tags（v0.2）；pageSize 100 + 虚拟滚动，分页超 100 后续补。

#### TASK-037：Reader 页面
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：清洗正文、来源、时间、标签、摘要、复制 Markdown、打开原网页、归档、删除（PRD 5.1.6, 6.3.3）。
- 依赖：TASK-033, TASK-034
- 涉及文件：`apps/web/src/pages/reader/ReaderPage.tsx`、`styles/theme.css`(.reader-content)、测试 `pages/reader/ReaderPage.test.tsx`；服务端新增 `GET /api/items/:id/content`（`ItemService.getContent` 经 Storage 读 markdown/readableHtml/plainText）+ `routes/items.ts`/`container.ts`/`item-service.ts` + 集成测试。
- 验收标准：阅读干净无广告/导航；打开原网页可用；长文懒加载。✅ 按设计 03/14：← Library/READING、复制 Markdown/打开原网页/归档/删除（确认）、类型/域名/标题/作者·字数·时长、标签；正文渲染服务端已 sanitize 的 readableHtml（.reader-content prose 样式）→ 退回 plainText → noContent；打开时自动标记已读。
- 是否需要人工确认：否
- 备注：AI 摘要/要点侧栏属 v0.2（aiStatus none 时不显）。正文为服务端 sanitize 后的 HTML（extractor 已移除 script/handler）。实跑：worker 提取后 content 端点返回 markdown（含标题）+ plainText。长文“懒加载”：当前整篇渲染于滚动容器；超长虚拟化后续按需。

#### TASK-038：Settings 页面
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：数据目录、主题、语言、AI 入口（占位）、导出设置、隐私、本地服务状态（PRD 5.1.8, 6.3.6）。
- 依赖：TASK-033
- 涉及文件：`apps/web/src/pages/settings/SettingsPage.tsx`、测试 `SettingsPage.test.tsx`。
- 验收标准：可见数据位置；可切换深色；AI 可关闭（占位说明）。✅ 按设计 08：左侧 sub-nav（Appearance/Language/Data location/AI providers/Privacy/About）+ 右侧内容；Appearance 三态卡（浅/深/跟随，写 useTheme）；Language EN/中；Data location 显示 `/api/status` dataDir；AI providers 占位说明（默认关闭，v0.2）；About 显示版本 + 本地服务 host:port 状态。render 测试：默认外观三选、点 Dark 应用 `.dark`、切到 Data location 显示目录。
- 是否需要人工确认：否
- 备注：AI Provider 实际配置在 v0.2；数据目录“Change”/Export/Search index 子项 v0.1 不实现（桌面/后续）。

---

### STAGE-08：全文搜索（FTS + Search API + Search UI）

- 阶段目标：完成关键词全文搜索闭环。
- 阶段状态：DONE（2026-06-20，TASK-039~042 全部 DONE）
- 是否需要人工确认：否
- 决策（已确认默认，解决 OQ-A7）：CJK 分词采用 **unicode61 + 索引/查询期 CJK 逐字切分**（`segmentCjk`），snippet 返回前去除字间空格并合并相邻高亮；相比 trigram（≥3 字符门槛）能支持中文常见 2 字词与任意长度子串匹配，且无需更改 FTS schema/迁移。
- 阶段验收标准：标题/正文可搜；结果有命中片段；性能可接受（1 万条内 < 500ms）。

#### TASK-039：Search API（GET /api/search, mode=keyword）
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：实现 keyword 搜索（q/type/tag/domain/from/to），返回 snippet/score/matchedFields（PRD 13.3, 15.1）。
- 依赖：TASK-012, TASK-019
- 涉及文件：`packages/search/`（package.json、tsconfig、src/index.ts、src/query.ts：buildMatchExpression/tokenizeQuery/cleanSnippet/normalizeScores）；`packages/core/src/utils/text.ts`（segmentCjk + HIGHLIGHT 标记，+ text.test.ts，utils/index.ts 导出）；`packages/core/src/types/search.ts`（SearchInput.sort）；`packages/db/src/repositories/search-repository.ts`（index 期 CJK 分词 + 新增 queryItems：JOIN items + 过滤 + bm25 + snippet + matchedFields）；`apps/server/src/services/search-service.ts`、`routes/search.ts`、`app.ts`/`container.ts` 接线；`apps/server/src/routes/search.integration.test.ts`；root `vitest.config.ts`（@sourdex/search alias）、`apps/server/package.json`（dep）。
- 验收标准：关键词命中返回相关资料与片段。✅ 集成测试：英文 dolphinmarker 命中（snippet 含高亮标记 + matchedFields=content + score>0）；中文 2 字「机器」子串命中（OQ-A7，snippet 去分词空格后自然显示）；type 过滤生效；软删除排除；缺 q 返回 400。
- 是否需要人工确认：否
- 备注：semantic/hybrid 为 v0.2 扩展点。FTS MATCH 执行在 db.SearchRepository，纯查询逻辑（解析/高亮/打分）在 packages/search，编排在 server.SearchService（实现 core 的 SearchEngine 契约）。排序/筛选高亮细化与 query 解析单测在 TASK-040。

#### TASK-040：排序、筛选、高亮片段
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：按时间/相关性排序；类型/域名/标签筛选；命中词高亮（PRD 5.1.5, 15.4）。
- 依赖：TASK-039
- 涉及文件：`apps/server/src/routes/search.ts`（sort 参数 relevance/newest/oldest）；`packages/search/src/query.test.ts`（query 解析单测）；`packages/db/src/repositories/search-repository.test.ts`（queryItems 单测：matchedFields/snippet 高亮、type 过滤、软删除排除、newest/oldest 排序）。
- 验收标准：排序/筛选/高亮正确；query 解析有单测（PRD 21.1）。✅ 排序：bm25 相关性（默认）+ saved_at newest/oldest；筛选：type/domain/tag/from/to（TASK-039 落地，040 补排序与单测）；高亮：snippet 用私有区标记包裹命中词，cleanSnippet 去 CJK 字间空格 + 合并相邻高亮（UI 映射 `<mark>`）；query 解析单测覆盖分词/短语/CJK 切分/引号转义/算子中和/空输入 + normalizeScores。
- 是否需要人工确认：否
- 备注：标签筛选依赖 list/item 已有标签数据；命中词高亮标记由前端（TASK-041）渲染为 `<mark>`。

#### TASK-041：Search 页面
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：突出搜索框、高级筛选、结果片段、命中高亮（PRD 6.3.4）。
- 依赖：TASK-039, TASK-033
- 涉及文件：`apps/web/src/pages/search/SearchPage.tsx`(+test)、`features/search/{SearchResultCard,SearchFilters}.tsx`、`components/ui/Highlight.tsx`、`lib/api/search.ts`、`lib/api/query-keys.ts`(search key)、`hooks/useSearch.ts`、`locales/{en,zh}.ts`(search.*)；服务端 `packages/core/src/types/search.ts`（SearchResultItem 增 domain/type/savedAt，PRD §15.4 展示字段）、`apps/server/src/services/search-service.ts`（映射展示字段）。
- 验收标准：可搜索并展示高亮片段；分页流畅。✅ 按设计 search(04/15)：62px 大搜索框（自动聚焦、防抖 250ms、URL ?q 同步）、keyword/semantic 模式切换（semantic 禁用占位 v0.2）、结果区（计数 + relevance/newest 排序）+ 命中卡片（类型/域名/时间/匹配分 + 标题/片段 `<mark>` 高亮）+ 右侧筛选（类型 + 时间 Any/Past week/Past month → from）；prompt/loading/error/no-results 态齐备。render 测试：URL q 渲染结果、片段命中包裹 `<mark>`。
- 是否需要人工确认：否
- 备注：高亮标记由服务端私有区码点 → 前端 `<mark>`；标签筛选待 list/search 返回标签（v0.2）；语义模式 v0.2；最近搜索（可选增强）未做；pageSize 20，分页加载后续按需。

#### TASK-042：搜索测试与性能校验
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：搜索流程集成测试 + 1 万条数据性能校验（PRD 18.2, 21.2）。
- 依赖：TASK-039, TASK-040
- 涉及文件：`packages/db/src/repositories/search-repository.perf.test.ts`（1 万条性能）；`apps/server/src/routes/search.integration.test.ts`（新增 save→extract→search→open content 全流程用例）。
- 验收标准：1 万条内关键词搜索 < 500ms。✅ 性能测试：单事务播种 10,000 条 items + FTS 行，warm-up 后 `queryItems` 关键词检索断言 < 500ms（实测整测 ~65ms）；流程集成测试：保存→后台提取→/api/search 命中→/api/items/:id/content 读取正文，全链路通过。
- 是否需要人工确认：否
- 备注：OQ-TP3（1 万条数据生成）以单事务 prepared 批量播种实现；流程经 Fastify inject（真实 app+worker+sqlite）验证，与 live boot 等价。

---

### STAGE-09：Markdown 导出（packages/exporter + API + UI）

- 阶段目标：单条/批量导出 Markdown，Obsidian 可打开。
- 阶段状态：DONE（2026-06-20，TASK-043~046 全部 DONE）
- 是否需要人工确认：是 → 已按推荐默认确认 **OQ-R2**：批量导出单条失败时**跳过该项并在响应中报告**（不整体失败），导出成功项正常打包。
- 阶段验收标准：单条/批量导出；Obsidian 可打开；中文/特殊字符不失败。

#### TASK-043：Exporter 接口 + Markdown/Obsidian frontmatter
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：实现 Exporter 接口，生成含 frontmatter（title/url/domain/saved_at/type/tags）的 Markdown（PRD 5.1.7, 8.9）。
- 依赖：TASK-009, TASK-013
- 涉及文件：`packages/exporter/`（package.json、tsconfig、src/index.ts、src/frontmatter.ts、src/to-markdown.ts、src/to-markdown.test.ts）。
- 验收标准：导出格式符合 PRD 示例；可被 Obsidian 打开。✅ `buildFrontmatter`（YAML 双引号转义 title/url/domain/saved_at/type/author/tags）+ `toMarkdownDocument`（frontmatter + `# Title` + Source + ## Summary + ## Content，按 PRD §5.1.7 示例）；单测覆盖字段、空 url/tags、引号/反斜杠转义、中文标题、空内容兜底。
- 是否需要人工确认：否
- 备注：纯逻辑（DTO 进出，不碰 DB/文件）；JSON/CSV 为 v0.2；文件名安全 → TASK-044；落盘/zip → TASK-045。

#### TASK-044：文件名安全处理
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：中文/特殊字符/超长标题安全成文件名（PRD 5.1.7）。
- 依赖：TASK-043
- 涉及文件：`packages/exporter/src/filename.ts`(+test)、`src/index.ts`（导出）。
- 验收标准：文件名安全处理有单测（PRD 21.1）。✅ `safeFilename`（剥离非法字符 `\/:*?"<>|`+控制字符、折叠空白、去首尾点/空格、按 UTF-8 字节截断不切多字节、避开 Windows 保留名、空→untitled、保留中文、自定义扩展名）+ `uniqueFilename`（批量去重 -1/-2）；9 单测覆盖。
- 是否需要人工确认：否
- 备注：批量唯一化供 TASK-045 zip 内防重名。

#### TASK-045：Export API（POST /api/export/markdown）+ 批量 zip
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：单条返回路径；批量打 zip，目录结构清晰；单条失败策略按 OQ-R2（PRD 13.5）。
- 依赖：TASK-043, TASK-044
- 涉及文件：`apps/server/src/services/export-service.ts`、`routes/export.ts`、`app.ts`/`container.ts` 接线、`routes/export.integration.test.ts`；core `contracts/exporter.ts`（ExportResult 增 count/failed + ExportFailure）；`apps/server/package.json`（@sourdex/exporter + fflate 依赖）；root `vitest.config.ts`（@sourdex/exporter alias）。
- 验收标准：批量导出 zip 可用；失败项按策略处理并报告。✅ 单条→`files/exports/<id>/<safe>.md`；多条→zip（obsidian 按域名分文件夹、`uniqueFilename` 防重名）；缺失/软删除项跳过并在 `failed[]` 报告（OQ-R2）；空 itemIds→400。集成测试解压校验内容/frontmatter/目录结构/失败上报。
- 是否需要人工确认：是（OQ-R2 ✅ 已确认：跳过并报告）
- 备注：新增依赖 **fflate**（理由：极小、零依赖、ESM 具名导出兼容 verbatimModuleSyntax，`zipSync` 内存打包，写盘走 Storage）；json/csv 为 v0.2，路由仅接受 markdown/obsidian。

#### TASK-046：Export UI + 导出测试
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：Reader 单条导出 + Library 批量导出入口；导出流程集成测试（PRD 21.2）。
- 依赖：TASK-045, TASK-037, TASK-036
- 涉及文件：`apps/web/src/lib/api/export.ts`、`hooks/useExport.ts`、`pages/reader/ReaderPage.tsx`(+test export 用例)、`pages/library/LibraryPage.tsx`、`locales/{en,zh}.ts`(exportUi.*)；导出流程集成测试已在 `apps/server/src/routes/export.integration.test.ts`（TASK-045）。
- 验收标准：UI 可触发导出；测试通过。✅ Reader 工具栏「Export」按钮（单条 markdown，成功后显示「Exported to <path>」横幅）；Library 头部「Export all」按钮（当前筛选列表批量导出 obsidian zip + 成功横幅）；render 测试：Reader 点 Export → POST /api/export/markdown → 显示产出路径。
- 是否需要人工确认：否
- 备注：v0.1 无浏览器下载端点，导出文件写入数据目录 `files/exports/`，UI 展示产出路径（本地优先、诚实 MVP）；浏览器内下载/Export 专页属 v0.2（OQ-D2，Export rail 占位禁用）。Library 批量入口 = 导出当前筛选列表（无多选 UI，v0.1 简化）。

---

### STAGE-10：v0.1 发布准备

- 阶段目标：完成文档、打包、E2E、发布物，达成 PRD 28 验收清单。
- 阶段状态：DONE（2026-06-21）——TASK-047/048/049/050 全部完成；v0.1.0 已发布到 GitHub（`leazoot/Sourdex`，release.yml 运行 success，附扩展 zip + web 包）。
- 是否需要人工确认：是（OQ-04 由用户决定 = Apache-2.0；release 经用户授权 leazoot 凭据后推 tag 触发，已发布）
- 阶段验收标准：新用户可按文档跑通 ✅；插件 zip 可构建 ✅；E2E 通过 ✅；CI 通过 ✅（GitHub Actions 首次 push 触发）；GitHub release 可发布 ✅（v0.1.0 已发布）。PRD §28 全 20 项满足。

#### TASK-047：完善 README / 安装 / 隐私文档 + License
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：README（PRD 20.3 结构）、安装、PRIVACY、CONTRIBUTING、SECURITY、ROADMAP，确定 LICENSE（PRD 20.1, 20.2）。
- 依赖：—（建议 STAGE-01~09 基本完成后）
- 涉及文件：`README.md`、`LICENSE`、`CHANGELOG.md`、`docs/{PRIVACY,DEVELOPMENT}.md`、`CONTRIBUTING.md`、`SECURITY.md`、`ROADMAP.md`、`CODE_OF_CONDUCT.md`
- 验收标准：文档齐全 ✅（PRD §20.2 必备文件齐全；README 含 §20.3 全部 10 项：截图/定位/功能/安装/本地运行/插件安装/隐私/Roadmap/Contributing/License）；License 确定 ✅（**Apache-2.0**，官方全文，用户决定，见 OQ-04）。
- 是否需要人工确认：是（OQ-04 已由用户决定 = Apache-2.0）
- 备注：OQ-04 初按 PRD §20.1 推荐采用 AGPL-3.0，后由用户在两候选中改定为 **Apache-2.0**（LICENSE 已换官方全文，README/CONTRIBUTING/RELEASE_NOTES 引用同步更新）。issue/PR 模板属 BACKLOG-017，未纳入本任务。

#### TASK-048：E2E 关键链路（Playwright）
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：保存网页 → 打开 Inbox → 搜索 → 打开详情 → 导出 Markdown（PRD 21.3）。
- 依赖：STAGE-06~09 完成
- 涉及文件：`tests/e2e/save-search-export.spec.ts`、`tests/e2e/test-env.ts`、`playwright.config.ts`、`docs/09_TEST_PLAN.md`
- 验收标准：5 条关键链路 E2E 通过 ✅（单 journey 用例覆盖 save→inbox→search→reader→export 五步，`pnpm test:e2e` → 1 passed）。
- 是否需要人工确认：否
- 备注：真实 server（dist）+ Vite dev 联调；保存经扩展所用 capture API、后台 worker 真实提取+建索引（OQ-TP2 已解决）；鉴权用预写 `auth.json` 固定 token + `VITE_SOURDEX_API_TOKEN`，免交互配对；Vite 需 `--host 127.0.0.1` 以匹配 Playwright/CORS 的 127.0.0.1。

#### TASK-049：插件打包 zip + 发布产物
- 状态：DONE（2026-06-20）
- 优先级：P0
- 说明：构建 extension zip、web build、server package，准备 changelog（PRD 22.2, 28.19）。
- 依赖：STAGE-06, TASK-005
- 涉及文件：`.github/workflows/release.yml`、`scripts/package-release.sh`、`CHANGELOG.md`、`.gitignore`
- 验收标准：插件 zip 可构建 ✅（`pnpm --filter @sourdex/extension zip` → `.output/sourdexextension-0.0.0-chrome.zip` 58KB）；产物齐全 ✅（`scripts/package-release.sh` 生成 `dist-release/`：扩展 zip + web 包 `sourdex-web.tar.gz`；本地实跑成功）。
- 是否需要人工确认：否
- 备注：`release.yml` 在 `v*` tag 触发，`pnpm install --frozen-lockfile` → 打包脚本 → `gh release create … --generate-notes` 上传产物（contents:write）；本地服务按 README 从源码运行（不打自包含 server，因 better-sqlite3 原生依赖，v0.1 范围外）；CHANGELOG 用 Keep a Changelog 0.1.0 条目。实际 tag 触发的 release 由 TASK-050 在用户授权后执行。

#### TASK-050：v0.1 验收清单核对 + Release
- 状态：DONE（2026-06-21）—— 验收清单 20/20 满足；v0.1.0 已发布到 GitHub（`leazoot/Sourdex`）。
- 优先级：P0
- 说明：逐项核对 PRD 28 的 20 项；发布 GitHub release（对外动作需用户确认）。
- 依赖：TASK-047, TASK-048, TASK-049
- 涉及文件：`RELEASE_NOTES.md`、`CHANGELOG.md`、`.github/workflows/release.yml`、`docs/14_STAGE_SUMMARY.md`、`docs/12_PROGRESS.md`
- 验收标准：PRD 28 全部满足 ✅ —— 第 1–16、18、19 项已实现并经测试核对；第 17（CI）GitHub Actions 首次 push 已触发运行；第 20（GitHub release）✅ **v0.1.0 已发布**（release.yml 运行 success，draft=false，附 `sourdexextension-0.0.0-chrome.zip` + `sourdex-web.tar.gz`）。
- 是否需要人工确认：是（对外发布——用户授权 leazoot 凭据后由助手推送 tag 触发）
- 备注：用户提供 GitHub 仓库 `leazoot/Sourdex` 并授权后完成发布：配独立 SSH 别名 `github-leazoot`（专用 key，仅本仓库，不影响其他账号）→ 改写 3 个提交作者为 `leazoot <leazoot@gmail.com>`（去除原本地 git 身份）→ 推 `main`+`v0.1.0` tag → `release.yml` 自动建 release。§28 逐项核对见 `docs/14_STAGE_SUMMARY.md` STAGE-10 条目。issue/PR 模板属 BACKLOG-017（下一 Batch）。

---

## BATCH-02 Stages（v0.2）

> 10 个阶段，抓取硬化在前、AI 价值层在后。未开始阶段保留模板；详细任务在进入该阶段时展开。

### STAGE-11：抓取质量硬化（动态页 / Discourse / 占位噪声过滤）

- 阶段目标：让动态/论坛页「存进来的东西干净完整」——提取器过滤占位/样板噪声、Discourse 页按楼层正文提取、扩展抓取前滚动加载懒内容。
- 阶段状态：DONE（2026-06-21）—— TASK-051/052/053 全部完成；真实 linux.do 原文实测干净完整；test 165 全绿。
- 是否需要人工确认：否（无硬阻塞）
- 阶段验收标准：① Discourse fixture 能提取全部已加载楼层正文且无「仅 byline」占位噪声；② 通用占位/骨架节点在提取前被剔除；③ 扩展抓取前滚动加载逻辑有单测、capture 集成；④ typecheck/lint/format/test/build 全绿。

#### TASK-051：提取器占位/样板噪声过滤
- 状态：DONE（2026-06-21）
- 优先级：P0
- 说明：在 Readability 之前对 DOM 做预清理，剔除虚拟滚动占位/骨架、仅 byline 的空楼层 stub、明显的样板节点，降低噪声。纯逻辑 + fixture + 单测。
- 依赖：—
- 涉及文件：`packages/extractor/src/html/preclean.ts`（新）、`html/dom.ts`、`strategies/webpage.ts`、`packages/extractor/test/fixtures/*`、对应 `*.test.ts`
- 验收标准：占位/骨架/空 byline 节点被剔除；正常文章不受影响（回归）。
- 是否需要人工确认：否

#### TASK-052：Discourse 站点适配器（提取兜底，BACKLOG-016 收编）
- 状态：DONE（2026-06-21）
- 优先级：P0
- 说明：识别 Discourse 页（meta generator / `#main-outlet` / `.topic-post .cooked`），按楼层抽取已加载正文（作者/时间/正文），拼为干净 HTML/Markdown，丢弃占位；webpage 策略检测到 Discourse 时走适配器，否则 Readability。
- 依赖：TASK-051
- 涉及文件：`packages/extractor/src/strategies/adapters/discourse.ts`（新）、`strategies/webpage.ts`、fixture + 测试
- 验收标准：Discourse fixture 提取全部已加载楼层、无占位噪声；非 Discourse 页仍走 Readability（回归）。
- 是否需要人工确认：否

#### TASK-053：扩展抓取前滚动加载动态内容
- 状态：DONE（2026-06-21）
- 优先级：P1
- 说明：capture 前自动滚动到底触发懒加载（循环滚动 + 高度稳定判定 + 次数/时间上限），再取 outerHTML。抽出可测的「是否继续滚动」决策与滚动驱动（依赖注入），单测覆盖。
- 依赖：—
- 涉及文件：`apps/extension/lib/auto-scroll.ts`（新）、`lib/capture.ts`、`auto-scroll.test.ts`
- 验收标准：滚动决策/上限逻辑有单测；capture 在取 HTML 前调用；超时/到底安全退出。
- 是否需要人工确认：否

### STAGE-12：AI 基础设施（Provider 适配 + API Key 安全存储 + 设置）

- 阶段目标：LLMProvider/EmbeddingProvider 适配（OpenAI 兼容 / Ollama）、API Key 安全存储（OQ-T7 已定：本地加密文件 AES-256-GCM）、Settings AI 配置页；AI 默认关闭、发送前明示数据外发。
- 阶段状态：DONE（2026-06-21，TASK-054~058 全部 DONE）
- 是否需要人工确认：OQ-T7 已确认（2026-06-21）：本地加密文件
- 阶段范围说明：仅做「基础设施」——Provider 抽象/适配、密钥安全存储、Provider 配置 CRUD + 设置页。**不含**摘要/标签/embedding/RAG 任务本身（属 STAGE-13~17）。

#### TASK-054：SecretStore（本地加密文件密钥库）— STATUS: DONE
- 契约 `packages/core/contracts/secret-store.ts`：`SecretStore { get/set/delete/has(key) }`（异步）。
- 实现 `apps/server/src/infrastructure/encrypted-file-secret-store.ts`：数据目录 `secrets.enc`，AES-256-GCM；主密钥 scrypt 派生（机器盐 + 持久随机盐，文件权限 600）；仅 `node:crypto`，零原生依赖。
- DI：构造函数注入文件路径 + 主密钥来源，便于临时目录单测。
- 验收：加密/解密往返、缺失键返回 null、覆盖写、删除、文件损坏报明确错误；单测在临时目录、测试后清理；密文不含明文 Key。
- 是否需要人工确认：否

#### TASK-055：packages/ai —— Provider 适配 + 工厂 + 错误类型 — STATUS: DONE
- 新建 `@sourdex/ai`：`OpenAICompatibleProvider`、`OllamaProvider` 实现 `LLMProvider`/`EmbeddingProvider`（Adapter）；`createLLMProvider(config,{apiKey})` / `createEmbeddingProvider(...)` 工厂；`AIProviderError`。
- HTTP 经注入 `fetch`（DI，便于 mock）；不记录正文/Key。
- 验收：工厂按 type 返回对应 Provider、未知 type 抛错；chat/embed 用 mock fetch 单测正常+错误路径；OpenAI 与 Ollama 报文映射各有单测。
- 是否需要人工确认：否

#### TASK-056：ProviderConfig Repository + Service — STATUS: DONE
- `packages/db` ProviderConfigRepository：provider_configs CRUD（返回 core DTO，Key 不入库）；确认 provider_configs 已在迁移中（v0.2 启用）。
- `apps/server` ProviderConfigService：编排配置 CRUD + 通过 `SecretStore` 存取 API Key（DI）；`enabled` 切换；可选「测试连接」用注入的 Provider 工厂。
- 验收：repository 用测试 SQLite 单测 CRUD；service 单测（mock repo + mock SecretStore）：保存配置时 Key 走 SecretStore 不入库、读取不回传明文 Key。
- 是否需要人工确认：否

#### TASK-057：AI Provider 设置 API 路由 — STATUS: DONE
- 路由 `/api/settings/providers`（GET 列表 / POST 新建 / PUT 更新 / DELETE）：Zod 校验；响应**绝不回传明文 API Key**（仅返回是否已配置）；沿用 Bearer 鉴权 + CORS 白名单。
- 验收：路由集成测试覆盖 CRUD + 校验失败 + Key 不出现在响应；错误经统一 errorHandler 映射。
- 是否需要人工确认：否

#### TASK-058：Settings AI 配置页（apps/web）— STATUS: DONE
- 先对照 `design/`（settings 截图 08/系统规范 11）确认 AI 配置区呈现；设计稿若无 AI 区块 → 记 Open Question 后按设计系统 token 最小实现，不自由发挥。
- 功能：Provider 列表/新增/编辑/删除/启停；API Key 输入（写入后不回显）；**数据外发说明**（发送前明示，PRD §14.1/§17.1）；AI 默认关闭。i18n（EN/简中）、浅深主题。
- 验收：TanStack Query 走既有 API 客户端；组件 < 150 行、无硬编码文案/颜色；与设计稿一致；关闭 AI 时保存/搜索/导出不受影响。
- 是否需要人工确认：UI 呈现若与设计稿冲突则 Decision Required

### STAGE-13：AI 摘要（后台任务，可关闭，ai_outputs 启用）— BACKLOG-001

- 阶段目标：用户配置并启用 Provider 后，可对资料生成结构化摘要（PRD §14.3 JSON）；后台任务执行、不阻塞保存；AI 失败不影响保存/搜索/导出；摘要写入 `ai_outputs` + `items.summary/one_sentence/ai_status` 并并入 FTS。
- 阶段状态：DONE（2026-06-21，TASK-059~063 全部 DONE）
- 「可关闭」与数据外发口径（消解既有 OQ，无需新表）：以「存在 enabled 的 provider_config」作为 AI 开关 + 数据外发显式 opt-in（PRD §17.1）；无启用 Provider 时摘要不可用，保存/阅读/搜索/导出照常。**不新增表**，不动 PRD §12 数据模型。
- 是否需要人工确认：否（沿用上面默认口径；如需独立「数据外发总开关」表再单列 Decision）

#### TASK-059：AiOutputRepository + Item 摘要写入（db）— STATUS: DONE
- `mapAiOutput`；`AiOutputRepository`（create / findLatestByItem(itemId,type)）；`ItemRepository.applyAiSummary(id,{summary,oneSentence})` 设 summary/one_sentence/ai_status='done'，`setAiStatus(id,status)`。
- 验收：repo 用测试 SQLite 单测 create/findLatest（按 createdAt 取最新）+ item 摘要字段与 ai_status 更新；ai_outputs 已在迁移中。
- 是否需要人工确认：否

#### TASK-060：摘要 Prompt + JSON 解析（@sourdex/ai）— STATUS: DONE
- `buildSummaryMessages({title,text,lang?})`：system+user，约束 PRD §14.3（仅 JSON、不编造、不超出原文、不 Markdown 包裹、内容不足返回空字段+原因）。
- `parseSummaryOutput(content)`：剥离 ```json 围栏、Zod 校验为 `SummaryOutput`（oneSentence/summary/keyPoints/usefulFor/riskNotes/suggestedTags），非法抛 `AIProviderError`。
- 验收：单测覆盖正常 JSON、带围栏、缺字段、非 JSON（PRD §21.1 AI 输出 JSON 解析）。
- 是否需要人工确认：否

#### TASK-061：generate_summary 后台任务 + SummaryService（server）— STATUS: DONE
- `SummaryService`（DI：providerConfigRepo/secrets/aiOutputRepo/itemRepo/captureRepo/searchRepo/storage/createProvider）：选首个 enabled provider→取 Key→建 provider→读 item 正文（capture 文本文件）→chat→parseSummaryOutput→写 ai_outputs + item 摘要 + 以 summary 重建 FTS；置 ai_status pending→done/failed；记录 attempts/error；**不向保存流程抛错**。
- `createGenerateSummaryJob`（Command）调用 service；container 注册 worker handler。
- 验收：service 单测（mock provider + 测试 db + 临时 storage）：成功写 ai_outputs/summary/done 且 FTS 含 summary；provider 失败→ai_status=failed 且不抛；无 enabled provider→明确不可用。
- 是否需要人工确认：否

#### TASK-062：AI 摘要 API + 详情暴露 — STATUS: DONE
- `POST /api/ai/summarize/:itemId`：校验存在 enabled provider（否则 409 可读错误），置 ai_status=pending，入队 generate_summary，返回 `{ jobId }`；Zod、沿用 Bearer/CORS。
- `GET /api/items/:id` 详情附最新 summary 结构化输出（keyPoints 等，来自 ai_outputs）。
- 验收：集成测试 CRUD/守卫（无 provider→409；有 provider→入队+pending；worker 处理后详情含摘要）；响应不含 Key。
- 是否需要人工确认：否

#### TASK-063：Reader 摘要 UI（apps/web）— STATUS: DONE
- 对照设计稿 reader（03/14）摘要区：展示 summary/one_sentence/keyPoints；「生成摘要」动作（无 enabled provider 时禁用并提示去设置）；轮询/失效刷新 ai_status；i18n EN/简中、浅深主题。
- 验收：组件 < 150 行、无硬编码文案/颜色；TanStack Query 走既有客户端；jsdom 组件测试（有/无摘要、无 provider 禁用）。
- 是否需要人工确认：UI 与设计稿冲突则 Decision Required

### STAGE-14：AI 自动标签（规范化复用）— BACKLOG-002

- 阶段目标：AI 启用时为资料自动生成标签（PRD §5.2.2 / §14.4）：复用摘要任务同一次模型输出的 `suggested_tags`（不额外调用 LLM）；规范化、优先复用已有标签、最多新增 3 个、单条最多 7 个、长度 ≤20、过滤过泛词；用户手动标签优先（占位且永不被移除）；标签写为 `tags.type='ai'` + `item_tags.source='ai'`，并入 FTS。
- 阶段状态：DONE（2026-06-21，TASK-064~065 全部 DONE）
- 口径（无需新表，不动 PRD §12）：沿用 STAGE-13「enabled provider = AI 开关 + 数据外发 opt-in」；自动标签随摘要任务（generate_summary）一并产出，无独立 LLM 调用。AI 标签失败不撤销已成功的摘要。
- 是否需要人工确认：否（「单独禁用自动标签」的功能级开关粒度记为非阻塞 OQ-A8，默认由 AI 总开关覆盖 + 用户可手改/删标签，留待未来设置项）

#### TASK-064：AutoTagService + 标签规范化复用（server/db）— STATUS: DONE
- `TagRepository.findByNormalizedName(name)`（只读查不创建，用于「复用 vs 新建」判定）。
- `AutoTagService.applySuggestedTags(itemId, suggested, {provider,model})`：规范化（trim/折叠空白/小写匹配）、丢弃空/超长（>20）/过泛词、按规范名去重；已有全局标签优先复用，新建上限 3，结合既有 item 标签满足单条 ≤7；以 `tags.type='ai'`/`item_tags.source='ai'` 关联；写 `ai_outputs(type='tags')` 溯源。
- 验收：单测（测试 SQLite）覆盖规范化/去重、过泛+超长过滤、新建上限 3+复用不受限、7 上限+不删既有、跳过已在 item 上的标签且无应用时不写 output。
- 是否需要人工确认：否

#### TASK-065：摘要管线集成 + 接线（server）— STATUS: DONE
- `SummaryService` 注入可选 `autoTagService`，在 `applyAiSummary` 后、重建 FTS 前调用 `applySuggestedTags`（独立 try/catch，标签失败不撤销摘要）；重建索引含新标签。container 接线 `AutoTagService`。
- 验收：summary-service 集成测试改用共享 TagRepository + AutoTagService，断言 `suggested_tags` 落库为 item 标签且写 `ai_outputs(type='tags')`；既有摘要测试保持通过。Reader 经既有 `TagDisplay` 自动展示标签（轮询失效刷新），无新 UI。
- 是否需要人工确认：否

### STAGE-15：语义检索基础（chunks 分块 + embedding + sqlite-vec）— BACKLOG-003

- 阶段目标：AI 启用且配置 embedding 模型时，为资料分块（PRD §14.6：500–900 tokens、overlap 80–120）、为每个 chunk 生成 embedding 并存储、可按语义检索且结果可追溯到原文片段（PRD §5.2.3 / §14.6）；embedding 后台执行、失败不影响全文搜索（§5.2.3.7）。
- 阶段状态：DONE（2026-06-21，TASK-066~068 全部 DONE）
- 口径（无需新表，不动 PRD §12）：chunks/ai_outputs 表已在迁移中；embedding 存 `ai_outputs(type='embedding', item_id, output=JSON{chunkId,vector})`（可溯源、可重建）；**向量检索默认 brute-force 余弦**（零原生依赖、可测、v0.2 规模足够）；**sqlite-vec ANN 加速降级为非阻塞 OQ-A9**（PRD §5.2.3.6 为「可使用」非必须）。AI 开关沿用「enabled provider + 配置 embeddingModel」。
- 是否需要人工确认：否（sqlite-vec 加速与「低优先级队列」均为非阻塞优化，记 OQ-A9；PRD 已允许）

#### TASK-066：分块/向量工具 + ChunkRepository + 嵌入存取（core/db）— STATUS: DONE
- core：`chunkText`（段落优先打包到 token 目标、超大段按句/空白硬切、相邻 chunk overlap、字符 offset 可溯源）+ `estimateTokens`（Latin 词+CJK 字，无依赖）+ `cosineSimilarity`（长度不等/零向量→0 优雅降级）。
- db：`ChunkRow`/`mapChunk`；`ChunkRepository`（replaceForItem 事务幂等、listByItem、findById、deleteByItem）；`AiOutputRepository.listByItemAndType`/`deleteByItemAndType`（重建用）；`SearchRepository.listEmbeddingCandidates`（join items 排除软删，复杂搜索模块例外）。
- 验收：core 单测（分块空/短/长+overlap+offset、硬切、token；余弦同向/正交/反向/降级）+ db 单测（chunk CRUD 幂等、ai_output list/delete by type）。
- 是否需要人工确认：否

#### TASK-067：EmbeddingService + generate_embedding 后台任务（server）— STATUS: DONE
- `EmbeddingService`（DI）：`enabledProvider()`（首个 enabled 且有 embeddingModel）；`embedItem`（读正文截断→chunkText→replaceForItem→deleteByItemAndType('embedding')→分批 embed→存 ai_outputs；无 provider/正文→no-op；AIProviderError→吞错不抛、infra 错上抛重试；幂等重建支持模型变更 §14.6.5）；`embedQuery`（查询向量）。
- `createGenerateEmbeddingJob`（Command）+ container 注册 worker（FIFO，embedding 自然后置≈低优先级，无 priority 列改动）。
- 验收：service 单测（mock embed provider）：每 chunk 一条 embedding、重跑幂等、无 embeddingModel no-op、provider 失败不抛且 FTS 不受影响。
- 是否需要人工确认：否

#### TASK-068：语义检索服务 + API（server）— STATUS: DONE
- `SemanticSearchService`：embedQuery→`listEmbeddingCandidates`→余弦排序→每 item 取最佳 chunk→top-K，回填 chunk 文本 snippet（可溯源 §5.2.3.5）；`enabledProvider()`。
- API：`GET /api/search/semantic?q&limit`（无 embedding provider→409 NO_AI_PROVIDER；否则 results）；`POST /api/ai/embed/:itemId`（404/409/202 入队 generate_embedding）。keyword `/api/search` 契约不变；hybrid 合并属 STAGE-16。
- 验收：service 单测（余弦排序+可溯源 snippet、软删排除、无 provider 返回空）；集成测试（semantic 409 守卫、embed 404/409/202 入队）。
- 是否需要人工确认：否

### STAGE-16：混合搜索排序（keyword+semantic+tag+recency）— BACKLOG-007
### STAGE-17：Ask 页面（RAG，强制引用，证据不足说明）— BACKLOG-004
### STAGE-18：高亮与备注（annotations 启用，导出含高亮）— BACKLOG-005
### STAGE-19：Tags 页面 / Export 页面完整化 — BACKLOG-006
### STAGE-20：v0.2 测试/文档/发布 + 仓库治理（issue/PR 模板等 BACKLOG-017）

---

## Future Backlog

> 当前 Batch 不实现。下一 Batch 再基于实际进度规划（≤10 阶段）。

- BACKLOG-001：AI 摘要（OpenAI-compatible / Ollama，后台执行，可关闭）— PRD 5.2.1 / 14.3
- BACKLOG-002：AI 自动标签（3–7 个，复用已有，规范化）— PRD 5.2.2 / 14.4
- BACKLOG-003：语义检索（embedding + sqlite-vec，chunk 分块）— PRD 5.2.3 / 14.6
- BACKLOG-004：Ask 页面（RAG，强制引用，证据不足说明）— PRD 5.2.4 / 14.5
- BACKLOG-005：高亮与备注（annotations 启用，导出含高亮）— PRD 5.2.5
- BACKLOG-006：Tags 页面 / Export 页面完整化 — PRD 6.2
- BACKLOG-007：混合搜索排序公式（keyword+semantic+tag+recency+signal）— PRD 15.3
- BACKLOG-008：自动备份 / 浏览器书签导入 — PRD 16.2 / 16.3
- BACKLOG-009：PDF 解析与页码引用 — PRD 5.3
- BACKLOG-010：视频字幕摘要 / 截图 OCR — PRD 5.3
- BACKLOG-011：重复资料检测 / 死链检测 — PRD 5.3 / 26.4
- BACKLOG-012：WebDAV / S3 同步 — PRD 5.3
- BACKLOG-013：Tauri 桌面端封装（v0.3）— PRD 7.2.6
- BACKLOG-014：移动端伴侣 / 团队资料库 / 周报 — PRD 5.3
- BACKLOG-015：Pocket / Raindrop / Omnivore / Markdown 导入；API 与插件系统 — PRD 5.3
- BACKLOG-016：站点适配器（提取兜底）— PRD 26.1
- BACKLOG-017：CODEOWNERS / issue·PR 模板 / changesets 完整化 — PRD 20.4

## Open Questions

> 汇总自各文档；详见 [01](./01_PROJECT_BRIEF.md) / [02](./02_REQUIREMENTS.md) / [03](./03_ARCHITECTURE.md) / [04](./04_TECH_STACK.md)。带 ⛔ 的为对应阶段的硬阻塞项。

- ~~OQ-01 Zustand vs Jotai~~ ✅ 已定（2026-06-20）：Zustand（theme/轻量 UI 状态）（STAGE-07 落地）
- ~~OQ-02 shadcn/ui vs 自定义~~ ✅ 已定（2026-06-20）：v0.1 用 Tailwind v4 自建基础组件（设计 token 还原），shadcn/Radix 复杂原语（Dialog/Select）后续按需引入（STAGE-07 落地）
- ~~OQ-W1（新增）Web UI↔本地服务鉴权~~ ✅ 已定（2026-06-20）：复用 STAGE-06 Bearer token 方案（鉴权机制不变）；token 投递——dev 用 `VITE_SOURDEX_API_TOKEN` env，prod 由本地服务注入（STAGE-10 落地）。安全模型不变（127.0.0.1 + CORS 白名单 + Bearer）。
- OQ-03 v0.1 任务队列实现（默认进程内轮询 + jobs 表）— 影响 STAGE-04
- OQ-04 License AGPL-3.0 vs Apache-2.0 — **已解决（用户决定）：Apache-2.0**（PRD §20.1 两候选中由用户改定，覆盖 PRD 的 AGPL 推荐；LICENSE 官方全文 + 文档引用已落地）
- OQ-05 v0.1 服务启动方式（默认手动启动）— 影响 STAGE-10 文档
- ~~OQ-A1 ⛔ 插件↔服务握手/鉴权机制~~ ✅ 已定（2026-06-20）：**方案B 配对码换取 token**。服务首次启动在数据目录 `config/auth.json` 生成持久长随机 token（文件权限 600）；扩展 Options 点"开始配对"→服务端 `POST /api/pair/initiate` 生成 6 位短时配对码（5 分钟、单次、打印到服务终端，不经响应回传）→用户输入配对码 `POST /api/pair/complete` 换取长 token →扩展存 `chrome.storage.local`；之后请求带 `Authorization: Bearer <token>`，服务中间件校验 + CORS 白名单。配对/换取端点 localhost-only 且不要求 token。（STAGE-06 落地）
- ~~OQ-A2 同步 vs 异步提取~~ ✅ 已定：异步（保存优先，extract_content job）（STAGE-04 落地）
- ~~OQ-A3 FTS 更新策略~~ ✅ 已定：应用层 SearchRepository 维护（STAGE-03 落地）
- ~~OQ-A4 source_hash 计算口径~~ ✅ 已定：规范化 canonical_url 优先 + 内容 hash 兜底 sha256（STAGE-03 落地）
- ~~OQ-A5 是否一次建全部表~~ ✅ 已定：一次建全部 9 表（STAGE-03 落地）
- ~~OQ-A7（新增）FTS5 CJK 分词策略~~ ✅ 已定（2026-06-20）：保留 unicode61 + 索引/查询期 CJK 逐字切分（`segmentCjk`），snippet 返回前去字间空格并合并相邻高亮；相比 trigram（≥3 字符门槛）支持中文常见 2 字词与任意长度子串，且无需更改 FTS schema/迁移（STAGE-08 落地）
- ~~OQ-A6 Storage 是否抽象接口~~ ✅ 已定：是（core 接口 + LocalStorage 实现）（STAGE-04 落地）
- OQ-A8（新增，非阻塞）AI 功能级开关粒度（单独禁用「自动标签」而不关摘要）— 当前默认：由 AI 总开关（enabled provider）统一覆盖；用户可手动改/删标签、手动标签优先。若后续需要功能级独立开关，再评估新增设置项（不动 PRD §12 现有表）。STAGE-14 不阻塞。
- OQ-A9（新增，非阻塞）向量检索后端与队列优先级 — 当前默认：embedding 存 `ai_outputs(type='embedding')`，语义检索用 **brute-force 余弦**（零原生依赖、可测、v0.2 规模足够）；**sqlite-vec ANN** 作为后续规模化加速（PRD §5.2.3.6「可使用」非必须）。jobs 表无 priority 列，embedding「低优先级」（§14.6.6）以 FIFO 后置近似；若需严格优先级再评估（不动 PRD §12）。STAGE-15 不阻塞。
- ~~OQ-R1 重复 URL 默认行为~~ ✅ 已定：status="exists" + forceNew 新建（STAGE-04 落地）
- ~~OQ-R2 批量导出单条失败策略~~ ✅ 已定（2026-06-20）：批量单条失败**跳过并在响应 `failed[]` 报告**，不整体失败（STAGE-09 落地）
- ~~OQ-R3 插件发送 DOM 范围与体积上限~~ ✅ 已定（2026-06-20）：发送 `documentElement.outerHTML`，**上限 2MB**，超限截断并在元数据标记 `truncated=true`；清理交服务端 extractor；选中文本单独字段。（STAGE-06 落地）
- ~~OQ-R4 word_count/reading_time 计算口径~~ ✅ 已定：Latin 词 + CJK 字符计数，readingTime≈200wpm（STAGE-05 落地）
- ~~OQ-T3 i18n 库选型~~ ✅ 已定（2026-06-20）：i18next + react-i18next（EN/简中）（STAGE-07 落地）
- ~~OQ-T4 测试框架~~ ✅ 已定：Vitest + Playwright（STAGE-01 落地）
- ~~OQ-T5 Node/pnpm/Turborepo 版本基线~~ ✅ 已定：Node 22 / pnpm 10.30.3 / turbo ^2（STAGE-01 落地）
- ~~OQ-T7 API Key 加密存储实现~~ ✅ 已定（2026-06-21，用户决定）：**本地加密文件**（数据目录 `secrets.enc`，AES-256-GCM 加密，主密钥 scrypt 派生，仅依赖 `node:crypto`；零原生依赖、跨平台一致、临时目录即可测）。系统 Keychain 留作后续增强。影响 STAGE-12。
- ~~OQ-D1 设计稿页面命名与 PRD/IA 映射~~ ✅ 已定（2026-06-20）：source-desk→Inbox、library→Library、reader→Reader、search→Search、settings→Settings（STAGE-07 落地）
- ~~OQ-D2 v0.2 页面（ask/tags/export）v0.1 是否预留入口~~ ✅ 已定（2026-06-20）：rail 渲染但禁用占位（"Coming in v0.2"），不实现功能（STAGE-07 落地）

---

## Task Count Summary

- 当前 Batch：BATCH-01
- 阶段数：10（STAGE-01 ~ STAGE-10）
- 任务总数：50（TASK-001 ~ TASK-050）
- Future Backlog：17 项
- Open Questions：22 项（已解决 OQ-T4/T5/A2/A3/A4/A5/A6/R1/R4/A1/R3/A7/R2/TP2/04；OQ-04 = Apache-2.0，用户决定）
- 进度：**STAGE-01 ~ STAGE-10 全部 DONE；BATCH-01（v0.1 MVP）完成。v0.1.0 已发布到 GitHub（`leazoot/Sourdex`），PRD §28 全 20 项满足。** License = Apache-2.0。下一步：按 Batch Planning Protocol 规划 BATCH-02（v0.2）。
- UI 约束：所有界面严格按根目录 `design/` 设计稿实现（见 [CLAUDE.md](../CLAUDE.md) §5 与 [.claude/rules/frontend.md](../.claude/rules/frontend.md)）
