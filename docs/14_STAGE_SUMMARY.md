# Stage Summary — Sourdex

> Updated at the end of every Stage / Milestone / Batch / important module, per the Closing Protocol in [CLAUDE.md](../CLAUDE.md). Keep template form for not-yet-started stages. Do not fabricate completed business features.

## 当前阶段

- 阶段名称：阶段 0 — 项目文档与执行体系初始化（Bootstrap，非 PRD 业务阶段）
- 阶段状态：DONE
- 开始时间：2026-06-20
- 完成时间：2026-06-20

### 阶段目标

- 阅读 PRD，判断是否存在阻塞决策。
- 建立可持续开发的文档体系、任务体系、规则体系与 Claude Code 执行体系。
- 规划当前 Batch（BATCH-01）的阶段计划（≤10 阶段）。

### 已完成内容

- 完成 PRD 评估：无阻塞决策；非阻塞 Open Questions 已记录。
- 文档体系：01/02/03/04/08/09/12/14 全部创建。
- 执行体系：CLAUDE.md（Starting / Closing / Batch Planning Protocol、禁止事项）。
- 规则体系：frontend / backend / database / testing / security 五份规则。
- Skills：prd-to-plan / architecture-review / implement-feature / test-and-fix / code-review / stage-planning / closing-protocol 七个。
- 任务体系：BATCH-01 = 10 阶段 / 50 任务 + 17 项 Future Backlog + 19 项 Open Questions。

### 关键产出

- BATCH-01 阶段计划（STAGE-01 ~ STAGE-10），映射 PRD Milestone 1–8。
- 完整任务清单（TASK-001 ~ TASK-050），含验收标准、依赖、涉及文件、是否需人工确认。
- 跨文档一致的 Open Questions 编号体系（OQ-*）。

### 重要决策

- 判定 PRD 无阻塞决策，直接进入完整初始化（PRD 技术栈/架构/数据模型/API 高度完整）。
- 对非阻塞模糊项采用标注默认值 + Open Question，而非擅自定死：Zustand（OQ-01）、shadcn/ui（OQ-02）、进程内任务队列（OQ-03）、Vitest+Playwright（OQ-T4）等。
- 将 PRD Milestone 2 拆为 STAGE-03（DB）+ STAGE-04（API），避免单阶段过大。
- 识别两个硬阻塞 Open Question：OQ-A1（插件握手，STAGE-06 前）、OQ-04（License，STAGE-10 前）。

### 遗留问题

- 19 项 Open Questions 待在进入对应阶段前确认（见 [08_TASKS.md](./08_TASKS.md) / [12_PROGRESS.md](./12_PROGRESS.md)）。
- 工程尚未初始化，所有业务任务为 TODO。

### 下一阶段目标

- 进入 **STAGE-01：工程初始化与基线**：搭建 monorepo（pnpm + Turborepo）、TS strict、ESLint/Prettier、测试基线、CI、README 初版。
- 验收：`pnpm install`/`build`/`typecheck` 成功；CI 全绿。

### 下一步建议

1. 确认 STAGE-01 相关 Open Questions（OQ-T5 版本、OQ-T4 测试框架）。
2. 执行 TASK-001，按 Starting/Closing Protocol 推进。

---

## 阶段记录归档（按完成倒序追加）

> 每个 PRD 业务阶段（STAGE-01 ~）完成后，在此追加一条记录，沿用上方模板字段。

### BATCH-03（STAGE-21~26）：分层忠实捕获（Faithful Capture）— 收官

- 阶段状态：DONE
- 开始/完成时间：2026-06-22 / 2026-06-22
- 阶段目标：解决「多类网站保存后什么也没有」——在 Tier 1 可读正文（Readability/Discourse）之上加 Tier 2 忠实全文兜底，任何页面保存后都有可读、可全文搜索的内容并诚实标注。方案见 [15_PROPOSAL_FAITHFUL_CAPTURE](15_PROPOSAL_FAITHFUL_CAPTURE.md)。
- 已完成内容：
  - STAGE-21（TASK-087）：`packages/extractor` 新增纯函数 `fulltextFromHtml()`——复用 `precleanDocument` + 去结构 chrome（svg/iframe/nav/footer/header/aside）+ 块级元素分隔 + 归一化 + 200KB 截断；8 例单测。
  - STAGE-22（TASK-088）：core 新增 `ContentKind`（article|fulltext|none）+ `ExtractResult.contentKind`；`WebpageExtractStrategy` 重构为 Tier1（达标返 article）→ Tier2（失败/过短/短+样板 → fulltext）→ 全文空才抛错（保持书签）；删除原临时「短+样板直接判无正文」抛错（FC2）。
  - STAGE-23（TASK-089）：db `captures.content_kind TEXT` + 幂等 migration `0001`（ALTER + 把既有 success 行回填 article）；schema/mapper/`Capture`/`CaptureRepository.updateExtraction` 贯通；迁移测试 + repository 测试。
  - STAGE-24（TASK-090）：`extract_content` job 写 `contentKind`；`ItemContent`/`getContent` 返回；content 路由透传；集成测试（article + app 页 fulltext）。
  - STAGE-25（TASK-091）：web `ItemContent.contentKind`；Reader 在 fulltext 时显示「完整网页文本，非提炼正文」标注（设计系统 token，保留纯文本渲染与打开原网页）；i18n（en/zh）；ReaderPage fulltext 用例。
  - STAGE-26（TASK-092）：核心闭环回归 + E2E + 三类页面验证 + 本总结 + Batch Planning。
- 关键产出：分层捕获模型落地（article / fulltext / none），保存任何页面均「有内容、可搜索、有诚实标注」；数据模型仅加 `content_kind` 一列（FC1），无新表、无破坏性迁移。
- 验证结果（本地）：typecheck ✅ / lint ✅ / format:check ✅ / build ✅ / **test 336/337**（唯一失败为既有 `provider-config-repository` 同毫秒 updatedAt flake，跨阶段既有、与本批无关）/ **E2E 1 passed**（save→inbox→search→reader→export）；三类页面经 `createExtractor` 验证：文章→article、Discourse 预载→article（主楼+回复回收）、app 页内容被回收（小内容→article，样板重→fulltext，后者单测覆盖）。
- 重要决策：FC1 = 新增 `content_kind` 列（语义清晰、状态与种类解耦）；FC2 = Readability/Discourse 失败与「短+样板」降级都回退 Tier 2 全文（取代临时判空）；FC3 = 全文上限 200KB。Tier 3（视觉快照/截图）留 backlog。
- 遗留问题：① 既有 `provider-config` 同毫秒 flake 仍非确定性偶发（建议后续给 updatedAt 加单调保证，单独小修）；② OQ-FC4（Tier 3 形态）待评估；③ fulltext 排版以「有胜于无 + 可搜索」为基线，flex 布局可能轻微黏连，不追求完美排版；④ 修复仅对新保存/重新提取生效，用户已存坏条目需重新保存。
- 下一阶段目标：按 Batch Planning Protocol 规划 BATCH-04（或继续 Faithful Capture Tier 3）。**不自动进入下一 Batch**，输出候选计划等待确认。
- 下一步建议：见下方「BATCH-03 收官 — 下一批候选」。

### STAGE-20：v0.2 测试/文档/发布 + 仓库治理 — BATCH-02（收官）

- 阶段状态：DONE
- 开始/完成时间：2026-06-21 / 2026-06-21
- 阶段目标：收官 BATCH-02（v0.2）——全量回归 + E2E、发布文档更新、仓库治理（BACKLOG-017）、版本 bump 与 v0.2.0 发布（PRD §20 / §21–22 / §28）。
- 已完成内容：
  - TASK-083：全量回归——typecheck/lint/format ✅、**vitest 322/322**、build 9/9 ✅、**E2E 关键链路 1 passed**（save→inbox→search→reader→export）。
  - TASK-084：README（EN+中）补 v0.2 功能 + 版本号；ROADMAP v0.1 全勾、v0.2 勾选完成；CHANGELOG [0.1.0] 标记已发布 + 新增 [0.2.0]；RELEASE_NOTES 改写 v0.2.0。
  - TASK-085：`.github/ISSUE_TEMPLATE/{bug_report,feature_request}.md + config.yml`、`PULL_REQUEST_TEMPLATE.md`、`CODEOWNERS`。
  - TASK-086：版本 0.0.0→0.2.0（root/web/extension）；frozen-lockfile 有效；本地打包脚本产出 0.2.0 扩展 zip + web 包；打 `v0.2.0` tag 推送触发 release.yml。
- 关键产出：v0.2.0 发布（AI 价值层可选默认关闭 + 抓取硬化 + 高亮备注 + Tags/Export 完整化）；仓库治理文件齐备；发布文档反映 v0.2。
- 验证结果（本地）：typecheck/lint/format ✅ / **test 322/322** / build 9/9 ✅ / **E2E 1 passed** / 打包脚本产出齐全。**无 schema/迁移改动、无新增运行期依赖**。
- 重要决策：版本 bump 到 0.2.0（用户面产物 root/web/extension）；changeset 以 RELEASE_NOTES + CHANGELOG 替代；发布沿用 v0.1 既有 leazoot/Sourdex 授权 + `release.yml`（`v*` tag 触发，RELEASE_NOTES 作 notes）。
- 遗留问题：provider-config 同毫秒计时 flake（非确定性、非阻塞，跨阶段既有）；OQ-A9（sqlite-vec ANN）/OQ-A11（annotations 专用 FTS 列 + 正文内联高亮）/OQ-A12（标签增长时间序列、导出目标路径选择）均为 v0.3+ 优化项。
- **BATCH-02（STAGE-11~20）收官**：抓取硬化 + AI 价值层（摘要/标签/语义/Ask）+ 高亮备注 + Tags/Export 完整化 + v0.2.0 发布。
- 下一阶段目标：按 Batch Planning Protocol 规划 BATCH-03（≤10 阶段，候选见 Future Backlog：PDF/视频/OCR、备份/书签导入、去重/死链、WebDAV/S3 同步、第三方导入、Tauri 桌面端等）。
- 下一步建议：**不自动进入下一 Batch**；待用户下发 /goal 后，基于实际进度重读文档并输出 BATCH-03 阶段计划等待确认。**当前按 /goal 停在 STAGE-20。**

### STAGE-19：Tags 页面 / Export 页面完整化 — BATCH-02

- 阶段状态：DONE
- 开始/完成时间：2026-06-21 / 2026-06-21
- 阶段目标：把 v0.1 占位的 Tags / Export 两个导航页按设计稿（tags 06 / export 07）做完整——标签管理（重命名/合并/删除）+ 四种导出格式（Markdown/Obsidian/JSON/CSV）+ 导出范围（PRD §6.2 / §8.9 / BACKLOG-006）。
- 已完成内容：
  - TASK-079：`TagRepository`（listAllWithCounts/findById/itemIdsForTag/rename/mergeInto/deleteTag）+ core `TagWithCount` + 共享 `reindexItem` 助手（AnnotationService 复用）+ `TagService` + REST `/api/tags`（GET/PATCH/POST merge/DELETE）。tag-repo +4 / service 6 / 集成 4 测试。
  - TASK-080：`@sourdex/exporter` `toJsonExport`/`toCsvExport` + core `ExportInput.scope`（all/status/tag，itemIds 改可选）+ `ExportService` 范围解析与按 format 分支 + route 扩展。structured 4 / export 集成 +5 测试。
  - TASK-081：Tags 页（标签云 + Recently added + All/AI/Manual 过滤 + 行内重命名/合并/删除）+ api/hooks/icons/i18n。TagsPage 3 测试。
  - TASK-082：Export 页（四格式卡 + 范围 全部/仅收件箱/按标签 + 预览 + 目标路径 + 导出结果）+ `runExport`/useExport(scope) + i18n；Rail 将 Tags/Export 移入主导航 + 路由。ExportPage 2 测试。
- 关键产出：标签治理闭环（计数/重命名/合并/删除且 FTS 随之重建）；导出四格式 + 三种范围；两个导航页从占位转为可用。
- 验证结果（本地）：typecheck 全部 ✅ / eslint 0 / prettier --check 全绿 / **test 321/322（67 文件，295→322，+27；1 失败 = provider-config 同毫秒计时 flake，非本阶段、单独亦随机复现）** / `pnpm build` 9/9 ✅。**无 schema/迁移改动**（不动 PRD §12）。
- 重要决策：标签变更经共享 `reindexItem` 重建受影响 item 的 FTS（tags 在 FTS 列）；rename 到已存在标签名即合并；导出范围在服务端解析为 itemIds（保留 itemIds 兼容 Reader/Library 入口）；JSON/CSV 为单文件聚合；目标路径展示数据目录（无浏览器下载/原生目录选择器）。
- 遗留问题：OQ-A12（非阻塞）「Recently growing」真实增长需 item_tags 时间戳（属 schema 变更，延后，当前以最近创建标签近似、不编造增量）；Export 目标路径选择/浏览器下载留待 v0.2+；标签合并目标经行内 Select 选择（无搜索式选择器）。
- 下一阶段目标：STAGE-20 v0.2 测试/文档/发布 + 仓库治理（issue/PR 模板等 BACKLOG-017）。
- 下一步建议：进入 STAGE-20 前明确 v0.2 发布范围（CHANGELOG/RELEASE_NOTES、版本号、扩展/web 打包）、回归测试与文档更新清单。**当前按 /goal 停在 STAGE-19，等待用户下发 /goal 再进入 STAGE-20。**

### STAGE-18：高亮与备注（annotations 启用，导出含高亮）— BATCH-02

- 阶段状态：DONE
- 开始/完成时间：2026-06-21 / 2026-06-21
- 阶段目标：阅读时高亮文本 + 备注 + 颜色分类（PRD §5.2.5）；高亮不破坏原文；备注关联资料；备注可搜索；导出 Markdown 含高亮备注。启用 annotations 表。
- 已完成内容：
  - TASK-075：`AnnotationRepository`（CRUD/三态 update/count）+ `mapAnnotation` + `FtsIndexInput.annotations`。3 测试。
  - TASK-076：`AnnotationService`（变更重建 FTS 含笔记 → 可搜）+ REST API + `HybridSearchService` user_signal（annotation 数）。service 4 + 集成 3 + hybrid 1 测试。
  - TASK-077：导出「## Highlights & Notes」区块 + ExportService 收集 annotations。2 测试。
  - TASK-078：Reader 工具栏 Highlight/Note + `HighlightsPanel`（颜色/引用/备注编辑/删除）+ api/hooks/i18n。2 测试。
- 关键产出：高亮/备注闭环——独立存储不改原文、关联资料、备注可全文搜、导出含高亮；混合排序 user_signal 信号落地（消解 STAGE-16 预留）。
- 验证结果（本地）：typecheck 全部 ✅ / eslint 0 / prettier --check 全绿 / **test 295（62 文件，280→295，+15）** / `pnpm build` 9/9 ✅。**无 schema/迁移改动**（annotations 已在 0000_init）。
- 重要决策：备注搜索折叠进 FTS `summary` 列（应用层，避免重建 items_fts 虚表 + 全量重提取，OQ-A11）；高亮以 selectedText 独立存储、永不改原文（满足 §5.2.5.1）；user_signal=min(1, annotationCount/3) 接入混合排序；导出高亮区块置于正文前；Reader 以工具栏 Highlight/Note + HighlightsPanel 呈现（正文内联高亮渲染延后，OQ-A11）。
- 遗留问题：OQ-A11（非阻塞）专用 annotations FTS 列与正文内联高亮渲染延后；备注命中当前归为 summary match（matchedFields 粒度）；备注编辑为行内 input（无富文本）。
- 下一阶段目标：STAGE-19 Tags 页面 / Export 页面完整化（PRD §6.2 / BACKLOG-006）。
- 下一步建议：进入 STAGE-19 前对照设计稿 tags(06)/export(07)，明确标签管理（重命名/合并/删除）与导出范围选择（全部/标签/选中）UI 与既有 API 的衔接。**当前按 /goal 停在 STAGE-18，等待用户下发 /goal 再进入 STAGE-19。**

### STAGE-17：Ask 页面（RAG，强制引用，证据不足说明）— BATCH-02

- 阶段状态：DONE
- 开始/完成时间：2026-06-21 / 2026-06-21
- 阶段目标：用户基于自己资料库提问（PRD §5.2.4 / §14.5）：仅基于已保存资料、每结论有引用、引用来自 chunks、证据不足说明、不编造、引用可跳转；支持复制；scope（全部/标签/选中）。
- 已完成内容：
  - TASK-072：`@sourdex/ai` `buildAnswerMessages`/`parseAnswerOutput`（强制引用、JSON 解析）+ core `AskScope/AskCitation/AskResult/AnswerConfidence`。6 测试。
  - TASK-073：`AskService`（semantic+keyword 取证 chunk、scope 过滤、引用校验、无有效引用→证据不足、答案存 ai_outputs）+ `POST /api/ask` + container 接线。service 5 + 集成 3 测试。
  - TASK-074：Ask 页面（AnswerCard 内联引用 chip + 证据 quote + 复制；提问栏 + scope；rail/路由启用）。3 测试。
- 关键产出：可溯源问答闭环——答案仅来自用户资料、每条引用回链到具体 chunk、无引用不作答（改返回证据不足）、不编造库外事实；AI opt-in。
- 验证结果（本地）：typecheck 全部 ✅ / eslint 0 / prettier --check 全绿 / **test 280（58 文件，263→280，+17）** / `pnpm build` 9/9 ✅。**无 schema/迁移改动**（ai_outputs 已建）。
- 重要决策：引用强制以「校验后无有效引用即不展示答案、返回证据不足」落实 PRD §14.5 rule 1（杜绝未引用结论）；Ask 为同步请求（非后台 job）；答案存 `ai_outputs(type='answer', item_id=null)`；检索 semantic 优先 + keyword 兜底（按 token 重叠选 item 内最佳 chunk）；provider 错误上抛走 502（与后台任务吞错不同——Ask 是前台请求）；core 搜索/AI 类型新增项均为 additive、不动 DB。
- 遗留问题：OQ-A10（非阻塞）scope 的「当前标签/选中」上下文来源（API 已支持 scope.tagIds/itemIds，UI 待从 Library/Reader 带入；当前 all 完整可用）；keyword 兜底仅在已有 chunk（embedding 跑过）时提供证据，纯无 embedding 库 Ask 多走「证据不足」；导出回答为 Markdown（PRD §5.2.4.6）随导出阶段统一（当前提供复制引用）。
- 下一阶段目标：STAGE-18 高亮与备注（annotations 启用，导出含高亮，PRD §5.2.5 / BACKLOG-005）。
- 下一步建议：进入 STAGE-18 前明确 annotations 写入/读取与 Reader 选区交互、导出含高亮格式、user_signal 接入混合排序（STAGE-16 预留）。**当前按 /goal 停在 STAGE-17，等待用户下发 /goal 再进入 STAGE-18。**

### STAGE-16：混合搜索排序（keyword+semantic+tag+recency）— BATCH-02

- 阶段状态：DONE
- 开始/完成时间：2026-06-21 / 2026-06-21
- 阶段目标：按 PRD §15.3 公式融合 keyword/semantic/tag/recency/user_signal 排序，提供混合搜索；无 embedding provider 时优雅降级为 keyword（不报错）；满足 §15.4 展示与 §15.4.7 调试分数。
- 已完成内容：
  - TASK-069：`@sourdex/search` `hybridScore`/`HYBRID_WEIGHTS`/`recencyScore`/`tagScore`/`normalizeSimilarities`。5 测试。
  - TASK-070：`HybridSearchService`（keyword∪semantic 合并、统一结构化过滤、tag/recency/signal 打分、排序分页、debug 明细）+ `/api/search?mode=hybrid` 分发 + container 接线。service 4 + 集成 1 测试。
  - TASK-071：SearchPage 启用 keyword/hybrid 切换（设计稿原 semantic 占位），选 semantic→`mode=hybrid`。组件 +1 测试。
- 关键产出：单一相关性排序融合关键词与语义信号；无 AI 时自动退化为关键词排序、零错误；调试模式可见各信号分量。
- 验证结果（本地）：typecheck 全部 ✅ / eslint 0 / prettier --check 全绿 / **test 263（55 文件，252→263，+11）** / `pnpm build` 9/9 ✅。**无 schema/迁移改动**。
- 重要决策：纯打分逻辑下沉 `@sourdex/search`（可测、无 IO）、编排在 server service；hybrid 不 409（semantic 缺失记 0，§5.2.3.7 优雅降级）；keyword `/api/search` 默认行为不变，hybrid 经 `mode` 分发；recency 用 30 天半衰期指数衰减；core 搜索类型新增可选 `debug`/`scoreBreakdown`（additive 非破坏，非 DB 改动）；UI 复用设计稿既有切换、不新增元素。
- 遗留问题：`user_signal`（高亮/备注/收藏/阅读次数）暂为 0，待 STAGE-18 annotations/收藏数据落地接入；hybrid 候选各取 top-50 后合并（极大库可调候选数/引入 ANN，关联 OQ-A9）；调试分数仅后端暴露，UI 暂不展示（§15.4.7「可显示」非必须）；provider-config 测试存在既有同毫秒计时 flake（非本阶段）。
- 下一阶段目标：STAGE-17 Ask 页面（RAG，强制引用 chunks，证据不足说明，PRD §14.5 / BACKLOG-004）。
- 下一步建议：进入 STAGE-17 前明确 RAG 检索（复用 hybrid/semantic 取证据 chunk）、引用强制与「证据不足」判定口径、答案存 `ai_outputs(type='answer')`、Ask UI 对照设计稿 05/16。**当前按 /goal 停在 STAGE-16，等待用户下发 /goal 再进入 STAGE-17。**

### STAGE-15：语义检索基础（chunks 分块 + embedding + sqlite-vec）— BATCH-02

- 阶段状态：DONE
- 开始/完成时间：2026-06-21 / 2026-06-21
- 阶段目标：AI 启用且配置 embedding 模型时，为资料分块（PRD §14.6）、为每 chunk 生成并存储 embedding、可按语义检索且结果可追溯到原文片段（§5.2.3）；embedding 后台执行、失败不影响全文搜索（§5.2.3.7）。
- 已完成内容：
  - TASK-066：core `chunkText`/`estimateTokens`/`cosineSimilarity`；db `ChunkRepository`（幂等 replaceForItem）+ `mapChunk`/`ChunkRow` + `AiOutputRepository.listByItemAndType`/`deleteByItemAndType` + `SearchRepository.listEmbeddingCandidates`（排除软删）。core 8 + db 4 测试。
  - TASK-067：`EmbeddingService`（enabledProvider/embedItem 幂等重建/embedQuery，provider 失败吞错、infra 错重试）+ `generate_embedding` 任务；container 接线。4 测试。
  - TASK-068：`SemanticSearchService`（余弦排序、每 item 最佳 chunk、可溯源 snippet、软删排除）+ `GET /api/search/semantic` + `POST /api/ai/embed/:itemId`。service 3 + 集成 4 测试。
- 关键产出：embedding 存 `ai_outputs(type='embedding', output JSON{chunkId,vector})`（可溯源、可重建）；语义检索可用且结果追溯到 chunk；全程 AI opt-in、失败不破坏 FTS/保存。
- 验证结果（本地）：typecheck 全部 ✅ / eslint 0 / prettier --check 全绿 / **test 252（53 文件，229→252，+23）** / `pnpm build` 9/9 ✅。**无 schema/迁移改动**（chunks/ai_outputs 已在 0000_init）。
- 重要决策：向量检索默认 **brute-force 余弦**（零原生依赖、可测、v0.2 规模足够），sqlite-vec ANN 降级为非阻塞 OQ-A9（PRD §5.2.3.6「可使用」非必须）；embedding 落 `ai_outputs` 而非新增向量列（不动 PRD §12）；分块用近似 token 计数避免引入 tokenizer 重依赖；keyword `/api/search` 契约保持不变，语义走独立端点（hybrid 合并留 STAGE-16）；jobs 无 priority 列，「低优先级」以 FIFO 后置近似。
- 遗留问题：OQ-A9（非阻塞）sqlite-vec/ANN 加速与严格队列优先级；语义检索每次全量加载 embedding 余弦（大规模需 ANN）；embedding 仅手动触发（无自动 embedding 流水线）；查询向量与库内维度不一致时按 0 处理（待模型变更后重建）。
- 下一阶段目标：STAGE-16 混合搜索排序（keyword+semantic+tag+recency 合并打分，PRD §15.3 / BACKLOG-007）。
- 下一步建议：进入 STAGE-16 前明确混合打分公式与各信号权重、semantic 与 keyword 结果的归一化与去重合并口径、是否在 `/api/search` 以 `mode=hybrid` 统一。**当前按 /goal 停在 STAGE-15，等待用户下发 /goal 再进入 STAGE-16。**

### STAGE-14：AI 自动标签（规范化复用）— BATCH-02

- 阶段状态：DONE
- 开始/完成时间：2026-06-21 / 2026-06-21
- 阶段目标：AI 启用时为资料自动生成标签（PRD §5.2.2 / §14.4）：复用已有标签、规范化、最多新增 3 个、单条最多 7 个、长度 ≤20、过滤过泛词、手动标签优先；不额外调用 LLM。
- 已完成内容：
  - TASK-064：`TagRepository.findByNormalizedName`（只读判定复用 vs 新建）+ `AutoTagService.applySuggestedTags`（规范化/去重→丢弃空/超长/过泛→优先复用全局标签→新建≤3→结合既有满足单条≤7→`tags.type='ai'`/`item_tags.source='ai'`→写 `ai_outputs(type='tags')`）。5 测试。
  - TASK-065：`SummaryService` 注入可选 `autoTagService`，在 applyAiSummary 后、重建 FTS 前调用（独立 try/catch，标签失败不撤销摘要），索引含新标签；container 接线。summary-service 集成测试断言 suggested_tags 落库 + ai_outputs(tags)。Reader 经既有 `TagDisplay` 自动展示标签，无新 UI。
- 关键产出：摘要任务同一次模型输出顺带产出规范化标签（零额外 LLM 调用）；标签可搜索；手动标签优先且 AI 标签可被用户改/删。
- 验证结果（本地）：typecheck 全部 ✅ / eslint 0 / prettier --check 全绿 / **test 229（48 文件，223→229，+6）** / `pnpm build` 9/9 ✅。
- 重要决策：复用 summary 的 `suggested_tags` 而非新增 `generate_tags` 任务/二次 LLM 调用（呼应阶段名「复用」、省成本）；confidence=null（模型未给分，不编造）；既有 item 标签占位并永不移除以保证手动优先（PRD §5.2.2.3）；不新增表、不动 PRD §12。
- 遗留问题：OQ-A8（非阻塞）功能级「单独禁用自动标签」开关粒度——默认由 AI 总开关覆盖 + 用户可手改/删，留待未来设置项；自动标签仅随手动触发的摘要任务产出（无自动摘要触发）；过泛词表为小型内置集（中英常见词），未来可扩充/可配置。
- 下一阶段目标：STAGE-15 语义检索基础（chunks 分块 + embedding + sqlite-vec，PRD §14.6 / BACKLOG-003）。
- 下一步建议：进入 STAGE-15 前明确分块策略与 sqlite-vec 集成方式（原生依赖/扩展加载）、embedding provider 接线（复用 `createEmbeddingProvider`）；保持 AI opt-in 与不阻塞主流程。**当前按 /goal 停在 STAGE-14，等待用户下发 /goal 再进入 STAGE-15。**

### STAGE-13：AI 摘要（后台任务，可关闭，ai_outputs 启用）— BATCH-02

- 阶段状态：DONE
- 开始/完成时间：2026-06-21 / 2026-06-21
- 阶段目标：用户启用 Provider 后可对资料生成结构化摘要（PRD §14.3 JSON）；后台执行、不阻塞保存；AI 失败不影响保存/阅读/搜索/导出；摘要写入 ai_outputs + items.summary/one_sentence/ai_status 并并入 FTS。
- 已完成内容：
  - TASK-059：`AiOutputRepository`（create/findLatestByItem，createdAt+rowid 取最新）+ `mapAiOutput` + `ItemRepository.applyAiSummary`/`setAiStatus`。4 测试。
  - TASK-060：`@sourdex/ai` `buildSummaryMessages`（§14.3 约束）+ `parseSummaryOutput`（剥围栏/恢复 JSON/snake|camel/缺字段默认/非法抛 AIProviderError，无新依赖）。6 测试。
  - TASK-061：`SummaryService`（选 enabled provider→取 Key→建 provider→读正文截断→chat→parse→写 ai_outputs+item 摘要+重建 FTS；无 provider=none、失败=failed 不抛、infra 错上抛重试）+ `generate_summary` 任务；container 接线。4 测试。
  - TASK-062：`POST /api/ai/summarize/:itemId`（404/409 NO_AI_PROVIDER/202 pending+入队）+ `ItemDetail.summary` 暴露最新结构化摘要。5 集成测试。
  - TASK-063：Reader 摘要侧栏（设计 03/14）展示 summary+keyPoints、生成按钮（无 provider 禁用+提示）、pending 轮询、failed 重试；ReaderPage 双栏；i18n EN/简中。4 组件测试。
- 关键产出：完整「保存→提取→（可选）AI 摘要→阅读/搜索」闭环；摘要可搜索；AI 严格 opt-in 且不破坏离线主流程。
- 验证结果（本地）：typecheck 全部 ✅ / eslint 0 / prettier --check 全绿 / **test 223（47 文件，+23）** / `pnpm build` 9/9 ✅。
- 重要决策：以「存在 enabled provider_config」作 AI 开关 + 数据外发显式 opt-in，消解「设置表」决策、不动 PRD §12（不新增表）；摘要正文截断 12000 字限制 prompt 体积；inputHash=sha256(model+text) 备缓存；摘要重建 FTS 使其可搜（PRD §15.2）。
- 遗留问题：摘要 job 走真实网络（单测 mock 覆盖，集成只验入队/守卫/详情）；未做自动触发（仅手动 API/UI 触发，自动摘要可后续）；多 enabled provider 取首个；keyPoints/usefulFor/riskNotes/suggestedTags 仅存 ai_outputs，UI 暂只展示 summary+keyPoints。
- 下一阶段目标：STAGE-14 AI 自动标签（复用已有标签、规范化、最多新增 3 个/单条最多 7 个，PRD §14.4）。
- 下一步建议：进入 STAGE-14 前明确「自动标签」触发与写入口径（复用 TagRepository 规范化；是否随摘要同任务产出 suggested_tags 落库）；保持 AI opt-in 与不阻塞主流程。

### STAGE-12：AI 基础设施（Provider 适配 + API Key 安全存储 + 设置）— BATCH-02

- 阶段状态：DONE
- 开始/完成时间：2026-06-21 / 2026-06-21
- 阶段目标：搭建 AI 的「基础设施」——Provider 抽象/适配、API Key 安全存储、Provider 配置 CRUD + 设置页；AI 默认关闭、发送前明示数据外发。不含摘要/标签/embedding/RAG（STAGE-13~17）。
- 已完成内容：
  - TASK-054：契约 `core/contracts/secret-store.ts` + `SecretStoreError`；实现 `apps/server/.../encrypted-file-secret-store.ts`——单 `secrets.enc` AES-256-GCM，密钥 scrypt 派生自 0600 `secret.key` + 每文件随机 salt，仅 `node:crypto`；写临时文件再 rename；解密失败/损坏抛 SecretStoreError。5 单测。
  - TASK-055：`@sourdex/ai`——`OpenAICompatibleProvider`/`OllamaProvider`（Adapter，实现 LLM+Embedding）+ `createLLMProvider`/`createEmbeddingProvider` 工厂（未实现类型抛错）+ 可注入 `fetch`；错误统一 `AIProviderError`，不含 Key/正文。9 单测。
  - TASK-056：`ProviderConfigRepository`（CRUD，Key 不入库）+ `ProviderConfigService`（配置经 repo、Key 经 `SecretStore`，返回含 `hasApiKey` 的视图，update apiKey 三态，testConnection）。接入 config/container。repo 6 + service 7 测试。
  - TASK-057：`/api/settings/providers` 路由（GET/POST/PATCH/DELETE/:id/test，Zod 校验，响应绝不回传明文 Key）；errorHandler 加 `AIProviderError→502`。5 集成测试。
  - TASK-058：Settings AI 配置页（apps/web，对照设计稿 08）——provider 类型卡 + endpoint + model + API Key + 启停 + 测试连接 + 删除确认 + 数据外发说明；新增 Input/Switch 组件；i18n EN/简中；组件 < 150 行。3 组件测试。
- 关键产出：用户可配置 AI Provider 并安全保存 Key（不入库/不入日志/不回传），为 STAGE-13+（摘要/标签/语义/RAG）提供 Provider 抽象 + 配置 + 密钥基座；AI 默认关闭，关闭时保存/搜索/导出不受影响。
- 验证结果（本地）：typecheck 全部 ✅ / eslint 0 / prettier --check 全绿 / **test 200（42 文件，+35）** / `pnpm build` 9/9 ✅。
- 重要决策：OQ-T7 = 本地加密文件（非 Keychain，诚实标注威胁模型）；Key 以 config.id 为键存 SecretStore；UI 仅暴露两种已实现 Provider 类型（openai-compatible/ollama），与设计稿一致；摘要/标签/语义/外发开关因无持久化表（PRD §12 不增表）推迟到 STAGE-13+。
- 遗留问题：testConnection 走真实网络（仅单测以 mock 覆盖，集成测试只验 404 路径）；Provider 类型 anthropic/gemini/lm-studio 工厂未实现（lm-studio 走 OpenAI 形已可用，UI 暂不暴露）；`secret.key` 与 `secrets.enc` 同目录，安全性弱于 OS Keychain（后续增强）。
- 下一阶段目标：STAGE-13 AI 摘要（后台任务，ai_outputs 启用，可关闭）。
- 下一步建议：进入 STAGE-13 前确认摘要 prompt/JSON schema 约束（PRD §14.3）与「AI 不阻塞保存主流程」的任务编排；AI 开关/数据外发开关的持久化方式（是否需设置表，PRD §12 不增表的边界）需作为 Open Question 先澄清。

### STAGE-11：抓取质量硬化（动态页 / Discourse / 占位噪声过滤）— BATCH-02

- 阶段状态：DONE
- 开始/完成时间：2026-06-21 / 2026-06-21
- 阶段目标：让动态/论坛页「存进来的东西干净完整」。
- 已完成内容：
  - TASK-051：`packages/extractor/src/html/preclean.ts`——Readability 前按 class/id token 剔除 placeholder/skeleton/ghost/spinner/shimmer/loading 占位骨架 + script/style/noscript/template；token 匹配避免误伤（downloading 等）。接入 `extractArticle`；5 单测。
  - TASK-052：`strategies/adapters/discourse.ts`——检测 Discourse（meta generator/`#main-outlet`+`.topic-post`），按楼层取 `.cooked` 正文 + 作者/时间，跳过无正文的占位楼层；`WebpageExtractStrategy` 优先用适配器、否则 Readability（非论坛页字符串快门快速跳过）。fixture + 4 测试 + 真实 linux.do 1.4MB 实测干净完整。
  - TASK-053：`apps/extension/lib/auto-scroll.ts`——依赖注入版滚动加载（高度稳定/步数/时间预算退出），`capture.ts` 注入脚本内联同算法、常量经 args；4 单测。
- 关键产出：动态/论坛页提取干净完整、占位 byline 噪声消除；为后续 AI 阶段提供更高质量输入。
- 验证结果（本地）：typecheck ✅ / lint ✅ / format:check ✅ / test ✅(165，+13) / build ✅(8)；真实 linux.do 原文实测。
- 重要决策：站点适配器作为 WebpageExtractStrategy 内的兜底优先路径（收编 BACKLOG-016）；自动滚动默认 6s 预算、静态页 ~0.5s 退出以兼顾「保存优先」；注入脚本无法 import，故滚动决策抽成可测纯逻辑 + 注入端镜像。
- 遗留问题：滚动加载在超长帖仍只取时间预算内加载的楼层（非全量）；Discourse 适配器 byline 取首个已加载楼层作者（非楼主，因楼主常未加载）；无 GUI 不能目视核对插件内滚动行为（以单测 + 真实原文提取为准）。
- 下一阶段目标：STAGE-12 AI 基础设施（Provider 适配 + API Key 安全存储 + 设置）。
- 下一步建议：**OQ-T7 已确认（2026-06-21）：本地加密文件**（`secrets.enc`，AES-256-GCM + scrypt 主密钥，仅 `node:crypto`；Keychain 留作后续增强），STAGE-12 阻塞已解除；实现时 AI 默认关闭、发送前明示数据外发。待用户下发 /goal 启动。

### STAGE-10：v0.1 发布准备（文档 / License / E2E / 打包 / 发布）

- 阶段状态：**DONE**（2026-06-21）——v0.1.0 已发布到 GitHub（`leazoot/Sourdex`），PRD §28 全 20 项满足。
- 开始/完成时间：2026-06-20 / 2026-06-21
- 阶段目标：完成文档、打包、E2E、发布物，达成 PRD §28 验收清单。
- 已完成内容：
  - TASK-047：发布版 README（PRD §20.3 全 10 项）+ PRD §20.2 必备文件（`LICENSE` **Apache-2.0** 官方全文、`docs/PRIVACY.md`、`docs/DEVELOPMENT.md`、`CONTRIBUTING.md`、`SECURITY.md`、`ROADMAP.md`、`CODE_OF_CONDUCT.md`）。
  - TASK-048：Playwright E2E `tests/e2e/save-search-export.spec.ts`——真实 server(dist)+Vite dev 联调跑通五步关键链路（save→inbox→search→reader→export），保存经 capture API、worker 真实提取+建索引；预写 auth.json 固定 token 免交互配对。
  - TASK-049：`pnpm --filter @sourdex/extension zip` 产出插件 zip；`scripts/package-release.sh` 汇集 `dist-release/`（扩展 zip + web 包）；`.github/workflows/release.yml`（`v*` tag → 打包 → `gh release create`）；`CHANGELOG.md`。
  - TASK-050：PRD §28 验收清单逐项核对（见下表，20/20）；补 `RELEASE_NOTES.md`；发布到 GitHub `leazoot/Sourdex`（独立 SSH 别名、提交作者改写为 leazoot、推 main+v0.1.0 tag、release.yml 自动发布 success）。
- PRD §28 验收核对（20 项）：

  | # | 项 | 状态 | 依据 |
  | --- | --- | --- | --- |
  | 1 | 插件保存网页 | ✅ | capture API + server 集成测试 / E2E |
  | 2 | 插件保存选中文本 | ✅ | selectedText 重索引测试（TASK-030） |
  | 3 | 本地服务可启动 | ✅ | server.ts 监听 127.0.0.1:8787；E2E 实启 |
  | 4 | SQLite 可迁移 | ✅ | 迁移测试（空库→schema，幂等） |
  | 5 | 网页正文可提取 | ✅ | extractor + worker；E2E 轮询 content |
  | 6 | Markdown 可生成 | ✅ | HTML→MD；content 端点 markdown |
  | 7 | Inbox 可查看 | ✅ | InboxPage；E2E |
  | 8 | Library 可查看 | ✅ | LibraryPage |
  | 9 | Reader 可阅读 | ✅ | ReaderPage；E2E |
  | 10 | 搜索可用 | ✅ | FTS5；E2E；性能 <500ms |
  | 11 | 单条 MD 导出 | ✅ | export single；E2E |
  | 12 | 批量 MD 导出 | ✅ | obsidian zip；导出集成测试 |
  | 13 | 设置页查看数据目录 | ✅ | SettingsPage ← /api/status dataDir |
  | 14 | 深色模式 | ✅ | theme light/dark/system |
  | 15 | README 指导新用户 | ✅ | README（TASK-047） |
  | 16 | 隐私文档清晰 | ✅ | docs/PRIVACY.md |
  | 17 | CI 通过 | ✅ | ci.yml 六步本地全绿；GitHub Actions 首次 push 已触发运行 |
  | 18 | 核心测试通过 | ✅ | test 152 + e2e 1 全绿 |
  | 19 | 插件 zip 可构建 | ✅ | wxt zip |
  | 20 | GitHub release 可发布 | ✅ | v0.1.0 已发布（`leazoot/Sourdex`，release.yml success，draft=false，附扩展 zip + web 包） |

- 验证结果（本地）：typecheck ✅(13) / lint ✅ / format:check ✅ / test ✅(152) / build ✅(8) / e2e ✅(1，五步)。
- 重要决策：**OQ-04 = Apache-2.0（用户决定）**——初按 PRD §20.1 推荐采用 AGPL-3.0，后由用户在两候选中改定为 Apache-2.0（LICENSE 官方全文 + 文档引用已更新）；**OQ-TP2** E2E 经 capture API 覆盖保存路径（headless 加载 MV3 脆弱），扩展 UI 由单测/集成覆盖；Vite dev 需 `--host 127.0.0.1` 以匹配 Playwright/CORS。
- 发布执行：用户提供 GitHub 仓库 `leazoot/Sourdex` 并授权；配独立 SSH 别名 `github-leazoot`（专用 key、`ssh.github.com:443`、`IdentitiesOnly`，仅本仓库，不影响其他账号）；`git filter-branch` 改写 3 个提交作者为 `leazoot <leazoot@gmail.com>`（去除原本地 git 身份）；推 `main` + `v0.1.0` tag → `release.yml` 自动发布（success）。
- 遗留问题：issue/PR 模板、CODEOWNERS、changesets 属 BACKLOG-017（下一 Batch）；CI 工作流首次 push 已触发，结果以 GitHub Actions 为准。
- 下一阶段目标：BATCH-01 已完成；按 Batch Planning Protocol 规划下一 Batch（v0.2：AI 摘要/标签/语义检索/Ask 等）。
- 下一步建议：v0.1.0 已发布。进入 Batch Planning Protocol，输出 BATCH-02 计划并等待确认，不自动进入下一阶段。

---

### STAGE-09：Markdown 导出（packages/exporter + API + UI）

- 阶段状态：DONE
- 开始/完成时间：2026-06-20 / 2026-06-20
- 阶段目标：单条/批量导出 Markdown，Obsidian 可打开，中文/特殊字符不失败。
- 已完成内容：
  - TASK-043：`@sourdex/exporter` 包——`buildFrontmatter`（YAML 转义 title/url/domain/saved_at/type/author/tags）+ `toMarkdownDocument`（frontmatter + 标题 + Source + Summary + Content，PRD §5.1.7 示例）。
  - TASK-044：`safeFilename`（剥离非法/控制字符、折叠空白、去首尾点/空格、UTF-8 字节截断不切多字节、避开 Windows 保留名、保留中文、空→untitled）+ `uniqueFilename`（批量去重）。
  - TASK-045：Export API（POST /api/export/markdown）——单条→.md、多条→fflate zip（obsidian 按域名分文件夹）、缺失/软删除项跳过并 `failed[]` 报告（OQ-R2）；core ExportResult 增 count/failed。
  - TASK-046：Reader 单条导出 + Library 批量导出入口（导出当前筛选列表）+ 成功路径提示；导出流程集成测试（解压校验内容/目录/失败上报）。
- 关键产出：v0.1 导出闭环（单条/批量、Obsidian 风格、文件名安全），完成 v0.1 全闭环（保存→提取→索引→搜索→阅读→导出）。
- 验证结果（本地）：typecheck ✅(13) / lint ✅ / format:check ✅ / test ✅(152) / build ✅(8)；导出集成测试解压验证 frontmatter/内容/obsidian 域名文件夹/缺失项上报。
- 重要决策：OQ-R2=批量单条失败跳过并 `failed[]` 报告（不整体失败）；新增依赖 **fflate**（极小零依赖、ESM 具名导出兼容 verbatimModuleSyntax、`zipSync` 内存打包）；分层——纯逻辑在 packages/exporter，落盘/zip 在 server ExportService。
- 遗留问题：v0.1 无浏览器下载端点，导出写入数据目录 `files/exports/`、UI 展示路径；JSON/CSV 导出、Export 专页、Library 多选导出为 v0.2；无 GUI 不能目视核对像素。
- 下一阶段目标：STAGE-10 v0.1 发布准备（文档/License/E2E/打包/发布），首任务 TASK-047。
- 下一步建议：⛔ 进入 STAGE-10 前必须确认 **OQ-04**（License AGPL-3.0 vs Apache-2.0，硬阻塞）；发布为对外动作需用户确认；E2E 关键链路（保存→Inbox→搜索→详情→导出）+ 插件 zip + GitHub release。

---

### STAGE-08：全文搜索（FTS + Search API + Search UI）

- 阶段状态：DONE
- 开始/完成时间：2026-06-20 / 2026-06-20
- 阶段目标：完成关键词全文搜索闭环（标题/正文可搜、命中片段、1 万条 < 500ms）。
- 已完成内容：
  - TASK-039：Search API（GET /api/search，keyword）——新增 `@sourdex/search` 包（buildMatchExpression/tokenizeQuery/cleanSnippet/normalizeScores 纯逻辑）；core 新增 `segmentCjk` + HIGHLIGHT 标记；SearchRepository 索引期 CJK 分词 + `queryItems`（JOIN items + 过滤 + bm25 + snippet + matchedFields）；SearchService 实现 core SearchEngine 契约。
  - TASK-040：排序（relevance/newest/oldest）、筛选（type/domain/tag/from/to）、命中高亮；query 解析单测 + queryItems 单测。
  - TASK-041：Search 页面（design 04/15）——62px 大搜索框（自动聚焦+防抖+URL ?q）、keyword/semantic 切换（semantic 占位 v0.2）、结果计数+排序、命中卡片（类型/域名/时间/匹配分 + 标题/片段 `<mark>` 高亮）、类型+时间筛选侧栏。
  - TASK-042：搜索流程集成测试 + 1 万条性能校验（< 500ms）。
- 关键产出：v0.1 关键词搜索闭环（保存→提取→索引→搜索→阅读），中文 2 字词可搜。
- 验证结果（本地）：typecheck ✅(11) / lint ✅ / format:check ✅ / test ✅(131，含 10k 性能测试 + Search 页 render 测试) / build ✅(7)；性能实测整测 ~65ms（远低于 500ms）。
- 重要决策：OQ-A7=保留 unicode61 + 索引/查询期 CJK 逐字切分（非 trigram，支持 2 字词与任意长度子串，无需 FTS 迁移），snippet 返回前去字间空格 + 合并相邻高亮；分层——MATCH 执行在 db.SearchRepository、纯查询逻辑在 packages/search、编排在 server.SearchService；SearchResultItem 按 PRD §15.4 增 domain/type/savedAt 展示字段。
- 遗留问题：无 GUI 不能目视核对像素（以 build + render 测试 + 设计对照为准）；标签筛选/最近搜索/语义搜索为 v0.2 或可选增强；分页加载（pageSize 20 之后）按需补。
- 下一阶段目标：STAGE-09 Markdown 导出（packages/exporter + API + UI），首任务 TASK-043。
- 下一步建议：进入 STAGE-09 前确认 **OQ-R2**（批量导出单条失败策略，建议跳过并报告）；导出含 frontmatter（Obsidian 可打开）+ 文件名安全处理。

---

### STAGE-07：Web UI 基础（apps/web）

- 阶段状态：DONE
- 开始/完成时间：2026-06-20 / 2026-06-20
- 阶段目标：Inbox/Library/Reader/Settings + 基础组件 + 深色模式 + i18n，严格按 design/ 还原。
- 已完成内容：
  - TASK-032：App 壳——Vite+React+Tailwind v4+react-router；顶栏（logo+搜索 pill+服务状态+语言/主题切换）+ 60px rail（Inbox/Library/Search/Settings，Ask/Export/Tags 占位禁用）；主题 light/dark/system（Zustand+`.dark`）；i18next EN/中（文案集中，类型安全）。
  - TASK-033：API client（apiFetch + Bearer token OQ-W1 + ApiError/NotConnectedError）+ TanStack Query hooks（useItems/useItem/useItemContent/useStatus/useUpdateItem/useDeleteItem）。
  - TASK-034：共享组件 Button/TypeBadge/TagDisplay/EmptyState/Loading/ErrorState/ConfirmDialog/ItemCard/ItemList/VirtualItemList + format 工具；引入 jsdom+@testing-library/react（vitest node/web 双 project）。
  - TASK-035 Inbox（desk hero + 数据本地横幅 + inbox 列表 + 归档/删除确认 + 空态）。
  - TASK-036 Library（状态 tab+计数、类型/排序筛选、`@tanstack/react-virtual` 虚拟滚动）。
  - TASK-037 Reader（服务端新增 `/api/items/:id/content`；正文渲染 sanitize 后 readableHtml、复制 Markdown、打开原网页、归档/删除、打开标记已读）。
  - TASK-038 Settings（外观三态、语言、数据位置、AI 占位、隐私、关于+服务状态）。
- 关键产出：本地 Web UI 完整四页闭环（看/读/归档/删除/导航/主题/i18n），经 server API（不直连 SQLite）。
- 验证结果（本地）：typecheck ✅(9) / lint ✅ / format:check ✅ / test ✅(98，含 web jsdom render 测试) / build ✅(6)；服务端 `/api/items/:id/content` 实跑 HTTP 验证（worker 提取后返回 markdown+plainText）。
- 重要决策：OQ-T3=i18next、OQ-01=Zustand、OQ-02=Tailwind 自建组件（shadcn 后续按需）、OQ-D1 页面映射、OQ-D2 v0.2 占位禁用、OQ-W1 Web 复用 Bearer（dev env / prod 注入，安全模型不变）。
- 遗留问题：无 GUI 不能目视核对像素（以 build + render 测试 + 设计对照为准）；Library 右侧预览分栏简化为整页 Reader；列表卡片不显标签（list API 不返回 tags）；Search 页占位（STAGE-08）；长文虚拟化/分页超 100 后续；数据目录 Change/Export 子项 v0.2。
- 下一阶段目标：STAGE-08 全文搜索（FTS 查询解析 + Search API + Search UI），首任务 TASK-039。
- 下一步建议：STAGE-08 关注 OQ-A7（FTS5 CJK 分词，unicode61 对中文不理想）；把 `/api/items?q` 升级为真正 FTS 检索端点。

---

### STAGE-06：浏览器插件保存（apps/extension）

- 阶段状态：DONE
- 开始/完成时间：2026-06-20 / 2026-06-20
- 阶段目标：从 Chrome/Edge 一键保存当前页与选中文本到本地服务，连接异常有清晰提示。
- 已完成内容：
  - TASK-027：WXT + React + TS + MV3 骨架，最小权限（activeTab/scripting/contextMenus/storage），Tailwind v4 设计 token（浅/深），popup/options/background entrypoints。
  - TASK-028：握手鉴权（OQ-A1=方案B 配对码换取 token）——服务端 AuthService + 数据目录 token(0600) + 配对码(5min/单次/loopback-only/码只打印终端) + onRequest Bearer 鉴权 + CORS 白名单；扩展 api/storage/i18n + Options 配对 UI。
  - TASK-029：Popup 保存当前页——content scripting 取 outerHTML(≤2MB,OQ-R3)+选中文本，POST /api/captures/webpage，ready/saving/saved/error 状态机，按设计 09/17。
  - TASK-030：右键菜单"Save selection"+ ⌘⇧S 快捷键（background），选中文本保存并保留进 FTS 索引（提取后仍可搜回）。
  - TASK-031：连接失败/未配对清晰提示 + 重试/打开设置入口，不静默失败；header 状态点实时反映。
- 关键产出：完整「插件保存→本地服务鉴权→入库→后台提取→Inbox/全文索引」前端入口闭环；可加载的 `.output/chrome-mv3` MV3 产物。
- 验证结果（本地）：typecheck ✅(8) / lint ✅ / format:check ✅ / test ✅(84) / build ✅(5)；服务端实跑 HTTP：health 公开、无 token 401、配对换 token、带 token 200、单次码重放 401、绑定 127.0.0.1、token 0600；popup 式 capture→Inbox 命中；选中文本提取后仍在 FTS。
- 重要决策：OQ-A1=方案B（配对码换取 token）、OQ-R3=outerHTML 2MB 上限；vite 统一 6.4.3（override 修复 WXT/plugin-react 版本冲突）；v0.1 popup 仅实现 Save Page/Selection，PDF/Video/Add note/Quick tags（v0.2，capture API 无字段）不实现；扩展文案集中 lib/i18n.ts（EN，简中随 STAGE-07 i18next）。
- 遗留问题：插件 UI 实际加载/右键/快捷键需 GUI，本环境以构建产物 + 服务端集成测试验收；全文搜索端点属 STAGE-08（当前 /api/items?q 仅 title LIKE）；扩展 i18n 简中待 STAGE-07。
- 下一阶段目标：STAGE-07 Web UI 基础（apps/web：Inbox/Library/Reader/Settings + 深色 + i18n），首任务 TASK-032。
- 下一步建议：进入 STAGE-07 前确认 OQ-D1（设计稿页面命名↔IA 映射）、OQ-01/02/T3（Zustand/shadcn/i18next 默认）；UI 严格按 design/ 设计稿。

---

### STAGE-05：正文提取与 Markdown（packages/extractor）

- 阶段状态：DONE
- 开始/完成时间：2026-06-20 / 2026-06-20
- 阶段目标：把保存的网页转为可读正文与 Markdown，失败有 fallback，纯文本可搜索。
- 已完成内容：
  - 提取器（TASK-021/022/023）：createExtractor 工厂 + webpage/selection 策略；jsdom+readability 提取、sanitize 清洗、turndown→Markdown、CJK+Latin 阅读量度。
  - fallback（TASK-024）：失败→选中文本兜底→否则标 failed 保留 raw。
  - fixtures/测试（TASK-025）：英文/中文/技术文档/失败/sanitize/metrics。
  - 接线（TASK-026）：extract_content job 接入 worker，落 readable/markdown/text + applyExtraction + 重建 FTS；container 注册真实 handler；db 新增 ItemRepository.applyExtraction。
- 关键产出：完整的「保存→后台提取→可读正文/Markdown/可搜索全文」链路（extractor 纯净、不依赖 db）。
- 验证结果（本地）：typecheck ✅ / lint ✅ / format:check ✅ / test ✅(68 passed, 16 files) / build ✅；live boot 端到端：capture→worker 自动提取 success、markdown 落盘、wordCount/readingTime 写入 ✅。
- 重要决策：提取栈 = readability+jsdom+turndown（04_TECH_STACK §12.5）；OQ-R4 阅读量度口径；webpage 正文最小长度阈值 25 过滤 boilerplate；提取失败不抛错（避免重试风暴）。
- 遗留问题：CJK 分词 OQ-A7 留 STAGE-08；GitHub issue/论坛 fixture 归类为通用 webpage 未单列。
- 下一阶段目标：STAGE-06 浏览器插件保存（apps/extension），首任务 TASK-027。
- 下一步建议：⛔ 先确认硬阻塞 OQ-A1（插件握手/鉴权）再开工；STAGE-06 起 UI 严格按 design/ 设计稿。

---

### STAGE-04：本地 API 服务（apps/server）

- 阶段状态：DONE
- 开始/完成时间：2026-06-20 / 2026-06-20
- 阶段目标：实现本地 Fastify API（capture/item）、配置/数据目录、任务 worker、本地存储。
- 已完成内容：
  - 骨架/配置/组合根（TASK-015）：config（默认 127.0.0.1）、paths、app（CORS+错误处理）、container、server 入口、health/status。
  - 本地存储（TASK-016）：LocalStorage（Storage 实现 + 路径穿越防护）。
  - 任务 worker（TASK-017）：JobWorker（轮询/分发/重试）。
  - Capture API（TASK-018）：CaptureService save-first + dedup + forceNew + 即时 FTS 标题索引 + 入队提取。
  - Item API（TASK-019）：list/detail/patch/softDelete（Zod 校验）。
  - 集成测试（TASK-020）：inject 全链路 + storage/worker 单测。
- 关键产出：可运行的本地 API 服务（保存→入库→查询→更新→软删除），保存优先、提取异步、仅绑定 127.0.0.1。
- 验证结果（本地）：typecheck ✅ / lint ✅ / format:check ✅ / test ✅(49 passed, 12 files) / build ✅；构建产物 boot 实跑 + lsof 确认 127.0.0.1 ✅。
- 重要决策：OQ-A2 异步提取（保存优先）；OQ-A6 Storage 抽象+LocalStorage；OQ-R1 重复=exists+forceNew；extract_content 暂为 no-op 占位（STAGE-05 接入真实提取）。
- 遗留问题：真实提取未接入（STAGE-05）；插件 token 握手 OQ-A1 留 STAGE-06；PATCH 暂不含 tags。
- 下一阶段目标：STAGE-05 正文提取与 Markdown（packages/extractor），首任务 TASK-021。
- 下一步建议：确认提取依赖选型后开始 TASK-021，并在 TASK-026 接线 extract_content job。

---

### STAGE-03：数据库与持久层（packages/db）

- 阶段状态：DONE
- 开始/完成时间：2026-06-20 / 2026-06-20
- 阶段目标：建立 SQLite schema、迁移与 repository，覆盖 v0.1 实体。
- 已完成内容：
  - schema（TASK-010）：9 表（PRD §12，枚举 `$type` 绑定 core）+ better-sqlite3/Drizzle 客户端（WAL+FK）+ 行→DTO mappers。
  - 迁移（TASK-011）：幂等 SQL runner + 0000_init（PRD §12 逐字 DDL + FTS5）。
  - FTS（TASK-012）：items_fts + SearchRepository（应用层维护，snippet+rank）。
  - repositories（TASK-013）：Item/Capture/Tag/Job + 事务 helper + source-hash 工具。
  - seed（TASK-014）：seedDevData。
- 关键产出：可用、可迁移、有测试覆盖的本地持久层 `@sourdex/db`，供 STAGE-04 服务层接线。
- 验证结果（本地）：typecheck ✅ / lint ✅ / format:check ✅ / test ✅(37 passed, 9 files) / build ✅；on-disk 迁移+持久化+dedup+FTS 冒烟 ✅。
- 重要决策：OQ-A5 一次建全表；OQ-A3 FTS 应用层维护；OQ-A4 source_hash=canonical_url 优先+内容兜底 sha256；v0.1 采用手写 SQL 迁移（FTS5 需 raw SQL）；better-sqlite3 经 pnpm onlyBuiltDependencies 允许原生构建。
- 遗留问题：OQ-A7（FTS CJK 分词）留 STAGE-08；首次启动自动建库到数据目录在 STAGE-04 接线。
- 下一阶段目标：STAGE-04 本地 API 服务（apps/server），首任务 TASK-015。
- 下一步建议：确认 OQ-A2/A6/R1 默认取值后开始 TASK-015。

---

### STAGE-02：核心领域模型与共享类型（packages/core）

- 阶段状态：DONE
- 开始/完成时间：2026-06-20 / 2026-06-20
- 阶段目标：建立全局类型、领域枚举、错误类型、通用工具与能力契约，作为各模块共享基础。
- 已完成内容：
  - 领域类型（TASK-007）：item/capture/tag/job/search + v0.2 实体（chunk/annotation/ai），枚举齐全。
  - 错误与工具（TASK-008）：SourdexError 基类 + 6 子类（code/cause）；normalizeUrl/extractDomain/createId/nowIso；URL 规范化 11 用例单测。
  - 能力契约（TASK-009）：ContentExtractor/ExtractStrategy、JobQueue、Storage、Exporter、SearchEngine、Logger，预留 LLM/Embedding（PRD §9.3）。
- 关键产出：可被全仓库引用的最内层 `@sourdex/core`（camelCase 域模型对应 PRD §12，contracts 供后续各包实现）。
- 验证结果（本地）：typecheck ✅ / lint ✅ / format:check ✅ / test ✅(12 passed) / build ✅(emit dist)；dist import 冒烟 ✅；无上层依赖 ✅。
- 重要决策：v0.2 实体类型一次性定义（与 OQ-A5 一致思路）；id 用 Web Crypto 保持跨运行时；normalizeUrl 去 tracking 参数/排序/去 fragment/去尾斜杠（www 仅在 extractDomain 去除）。
- 遗留问题：无新增阻塞。STAGE-03 需先确认 OQ-A3/A4/A5。
- 下一阶段目标：STAGE-03 数据库与持久层（packages/db），首任务 TASK-010。
- 下一步建议：确认 OQ-A3/A4/A5 默认取值后开始 TASK-010。

---

### STAGE-01：工程初始化与基线

- 阶段状态：DONE
- 开始/完成时间：2026-06-20 / 2026-06-20
- 阶段目标：搭建 monorepo 与工程基线，使 install/build/typecheck/lint/format/test 可运行，CI 就绪。
- 已完成内容：
  - monorepo 工具链（pnpm workspace + Turborepo + 根 package.json，packageManager pnpm@10.30.3，engines node>=22）。
  - TS strict 基线（tsconfig.base.json）+ packages/core 继承。
  - ESLint 9 flat + Prettier 3（no-explicit-any:error；Markdown 排除出 Prettier）。
  - 测试基线（Vitest root config + Playwright config + tests/e2e；core 冒烟测试）。
  - CI 工作流（install/typecheck/lint/format/test/build）。
  - README 初版。
  - PRD 8 目录骨架（apps/* 与 packages/* 占位，core 为最小占位包）。
- 关键产出：可一键 `pnpm install/typecheck/lint/format:check/test/build` 全绿的 TypeScript monorepo 基线。
- 验证结果（本地）：install ✅ / typecheck ✅ / build ✅(emit dist) / lint ✅ / format:check ✅ / test ✅(1 passed)。CI 本地等价全绿，GitHub 实跑待首次 push。
- 重要决策：OQ-T5 定为 Node 22 / pnpm 10.30.3 / turbo ^2；OQ-T4 定为 Vitest + Playwright；Markdown 不纳入 Prettier（保护用户 PRD.md 等 authored 文档）；git init 到 main（未提交）。
- 遗留问题：CI 需首次提交（含 pnpm-lock.yaml）后在 GitHub 实跑验证；Playwright 浏览器二进制待 E2E 阶段安装；apps 与多数 packages 仍为占位。
- 下一阶段目标：STAGE-02 核心领域模型与共享类型（packages/core），首任务 TASK-007。
- 下一步建议：（可选）用户首次 git 提交并推送；随后开始 STAGE-02 / TASK-007。

---

### STAGE-10：未开始（TODO）。
