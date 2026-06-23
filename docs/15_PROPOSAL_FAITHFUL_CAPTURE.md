# 15 提案 — 分层忠实捕获（Faithful Capture）

> 状态：**草案，待确认**（2026-06-22）。本提案扩展提取模型（PRD §5.1.2 / §26.1），涉及一处数据模型字段变更，按 CLAUDE.md「架构/数据结构变更先 Decision Required」处理。确认后落入新 Batch（BATCH-03 候选）。

## 1. 背景与问题

实测多站点保存后发现：现有「Readability 提炼正文」对**非文章页失效**，且这是算法本质限制（已调研：Readability/Trafilatura/Mercury 均为文章设计，遇 landing/app 页全面崩溃）。网页实际分三类：

| 类型 | 例子 | 现状 |
| --- | --- | --- |
| 文章类 | 博客 / 新闻 / 文档 | Readability 正常 ✅ |
| 论坛 / 讨论类 | Discourse(linux.do) / V2EX / Reddit | 只拿主楼或前几楼，丢回复 |
| 应用 / 工具类 | spaceship / Gmail / 后台 | 无「文章」，提取必然为空 |

**核心反转**：插件已上送「渲染后完整 DOM」，原料一直都在，只是 Readability 失败时被丢弃。可行性已用真实文件验证：spaceship 全文兜底捞回实际搜索结果（531 字），V2EX 捞回主楼 + 全部回复（1400+ 字）。

## 2. 目标 / 非目标

**目标**
- 任何页面保存后都**有可读、可全文搜索的内容**，不再出现「什么也没有」。
- 文章类继续给干净 Markdown（不回退）；非文章类给忠实全文。

**非目标（诚实边界）**
- 不承诺把应用页变成结构化文章（不可能）。
- 不承诺抓全「几百回复 + 虚拟滚动」长帖的所有回复（物理限制）。
- 本提案不含截图/OCR（列为 Tier 3 后续）。

## 3. 设计 — 分层捕获模型

- **Tier 1 · 可读正文（已有）**：Readability + 平台适配（Discourse 预载）。成功即用，产出干净 Markdown。
- **Tier 2 · 忠实全文兜底（本提案新增）**：Tier 1 失败/过短时，从已存的原始 DOM 去除 `script/style/noscript/template/svg/nav/footer/header/iframe` 及噪声节点，块级元素间插入换行，取 `body` 文本，归一化空白，作为内容存储与索引。**不抛错、不丢内容。**
- **Tier 3 · 视觉快照（后续 backlog）**：自包含 HTML 快照（SingleFile 思路）或截图，给应用页留「所见即所存」。本提案不实现，仅预留。

### 内容种类标记
新增「内容种类」`contentKind`：`article`（Tier 1）/ `fulltext`（Tier 2）/ `none`（确实无文本，如纯图/被墙）。Reader 据此渲染与标注（全文模式显式标注「完整网页文本，非提炼正文」并保留「打开原网页」）。

## 4. 数据模型影响（PRD §12，需 Decision）

- `captures` 增加一列 `content_kind TEXT`（取值 `article|fulltext|none`）。列为 TEXT，**Drizzle 加列 + 幂等 migration**；旧行回填 `article`（已成功）或按现状推断。
- 复用现有 `extraction_status`：Tier 2 成功记 `success`（内容种类由 `content_kind` 区分），真失败仍 `failed`。
- 不新增表。`originalTextPath`/`markdownPath` 等沿用：Tier 2 也写 `text`/`markdown`（Markdown 为纯文本段落）。

> 备选：不加列，用 `extraction_status` 增值 `fulltext`。缺点是把「状态」与「种类」耦合。推荐加 `content_kind`，语义更清晰。两案均无需建表。

## 5. 各层改动点

- **extractor**（`packages/extractor`）：新增 `fulltextFromHtml()`（块级分隔 + 去噪 + 归一化）；`WebpageExtractStrategy` 在 Readability/Discourse 失败或正文过短/疑似样板时回退到全文，返回带 `contentKind:"fulltext"` 的结果（扩展 `ExtractResult`）。保留对纯空页面的 `none`。
- **core**（`packages/core`）：`ExtractResult` 增 `contentKind`；`ExtractionStatus` 不变。
- **server**：`extract-content-job` 写 `content_kind`；`item-service.getContent` 返回 `contentKind`；content 路由响应加该字段（Zod 输出）。
- **db**：schema 加列 + migration + 迁移测试；`CaptureRepository.updateExtraction` 支持 `contentKind`。
- **web**：`ItemContent` 类型加 `contentKind`；Reader 在 `fulltext` 时渲染纯文本并显示「完整网页文本」标注；i18n 文案（en/zh）。

## 6. 边界与噪声处理

- **空白黏连**（flex 布局如 spaceship）：块级元素间插入分隔符缓解；不追求完美排版。
- **噪声**（广告/推广，如 V2EX 的 SCDN 推广）：Tier 2 做保守去噪（已知容器/角色），但全文本就偏「完整」，容忍少量噪声优于丢内容。
- **体积上限**：全文设上限（如 200KB 文本）防超大页；超限截断并标注。
- **隐私**：全文仅本地存储/索引，不外发；与现有隐私边界一致（PRD §17）。

## 7. 阶段计划（BATCH-03 候选，≤10 阶段）

1. **STAGE-21**：`fulltextFromHtml()` + 单测（fixtures：spaceship/V2EX/纯空页/中文）。
2. **STAGE-22**：`ExtractResult.contentKind` + `WebpageExtractStrategy` 回退逻辑 + 单测。
3. **STAGE-23**：db 加 `content_kind` 列 + migration + 迁移测试 + repository 支持。
4. **STAGE-24**：`extract-content-job` 写种类；content API/service 返回 `contentKind`（含集成测试）。
5. **STAGE-25**：Reader 全文渲染 + 标注 + i18n；ReaderPage 测试。
6. **STAGE-26**：回归（核心闭环：保存→提取→全文搜索→阅读→导出）+ 三类页面 E2E 验证 + 文档更新。

（Tier 3 视觉快照、长帖更全回复抓取另列 backlog，不在本批。）

## 8. 工作量评估

- 中等。改动跨 core/db/extractor/server/web，但每处都小且边界清晰；无新表、无破坏性迁移。约 6 个阶段、与一个 v0.1/v0.2 阶段量级相当。

## 9. 风险

- 全文质量参差（噪声/空白）——以「有胜于无 + 可搜索」为验收基线，不以排版完美为标准。
- 迁移风险低（加列 + 回填），但必须附迁移测试（PRD §23.3）。

## 10. Open Questions

- **OQ-FC1**：内容种类用新增 `content_kind` 列 vs 复用 `extraction_status` 增值（推荐前者）。
- **OQ-FC2**：Tier 2 触发条件（仅 Readability 失败 vs 也覆盖「短+样板」降级）——建议两者都回退到全文，删除当前「直接判无正文」的临时降级。
- **OQ-FC3**：全文文本体积上限取值（建议 200KB）。
- **OQ-FC4**：Tier 3（快照/截图）形态与时机（SingleFile 式自包含 HTML vs 截图+OCR）——后续单独评估。
