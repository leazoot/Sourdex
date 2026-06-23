# 16 提案 — Tier 3 自包含 HTML 快照（Faithful Capture 续）

> 状态：**草案，待确认**（2026-06-22）。BATCH-04 候选。承接 [15_PROPOSAL_FAITHFUL_CAPTURE](15_PROPOSAL_FAITHFUL_CAPTURE.md) 的 Tier 3。已确认决策：OQ-FC4 = 自包含 HTML 快照（SingleFile 式）。本提案含一处数据模型字段变更，按 CLAUDE.md「数据结构变更先 Decision Required」处理。

## 1. 背景与目标

- BATCH-03 已让任何页面「有可读、可搜索的内容」（article / fulltext / none）。但**视觉呈现**仍丢失：app/动态页即便有 fulltext，也看不到原貌。
- PRD §194 明确阅读页应展示「原网页快照」；PRD §291 区分 原始快照 / Markdown / 截图。
- **目标**：保存时额外生成「自包含 HTML 快照」（CSS/图片内联为单文件），阅读页可切换查看「所见即所存」的原网页，离线可看、读时不外发请求。
- **非目标**：截图 PNG + OCR（PRD §5.3 P2，留后续）；高级 OCR / 长期快照服务（PRD §2455 商业/未来）；不引入 SingleFile 等重型依赖（自写最小内联器）。

## 2. 设计

### 2.1 快照生成（扩展端，唯一可行点）

MV3 content script 仅在保存时运行，**只能在抓取当下生成**自包含快照：

- 克隆渲染后 DOM → 移除 `script`；把 `<link rel=stylesheet>`/`<style>` 内联，`<img>`/CSS `url()` 资源转 data URI（优先读浏览器缓存，同源/已加载资源）。
- **保存优先（PRD §18.1）**：快照为 **best-effort**——内联设**时间预算 + 体积上限**，超限/超时则放弃快照（不影响保存与 raw HTML）。点击保存 1s 内反馈不被快照阻塞。
- 隐私：内联只取页面已加载/同源资源，不新增对外抓取；快照自包含后，阅读时 iframe 零网络请求（PRD §17）。

### 2.2 传输与存储

- capture API 请求体新增**可选** `snapshotHtml`（Zod 校验，受体积上限约束）。raw HTML 仍照常先持久化（保存不被快照阻塞）。
- 快照写入 `files/snapshot-html/<itemId>.html`（路径相对数据目录，可迁移）。
- **数据模型（需 Decision）**：`captures` 新增 `snapshot_path TEXT`（migration `0002`，幂等 ALTER）。**不复用 `screenshot_path`**（后者语义为 P2 图片截图，保留）。

### 2.3 阅读页

- 新增 `GET /api/items/:id/snapshot`：有快照返回 HTML（`text/html`）或在 content/detail 暴露 `hasSnapshot` 标记。
- Reader 增加「正文 / 原网页快照」切换；快照用 **sandbox iframe**（`sandbox` 不开 scripts、`srcdoc` 注入），自包含故无外部请求。
- 快照与 `contentKind` 正交：article/fulltext/none 都可带快照；`none` 类尤其受益。

## 3. 数据模型影响（PRD §12，需 Decision）

- `captures` 加 `snapshot_path TEXT`（可空）。幂等 migration `0002`；旧行 null。**不新增表**。
- 备选：复用 `screenshot_path` 存 HTML 路径——否决（语义错位，且挤占 P2 截图用途）。

## 4. 各层改动点

- **extension**：最小资源内联器（CSS/img→data URI，预算/上限/超时，best-effort）；capture payload 加 `snapshotHtml`。
- **core**：`Capture.snapshotPath`；capture API DTO 加可选 `snapshotHtml`。
- **db**：schema 加列 + migration `0002` + mapper + `CaptureRepository`（create/update 支持 snapshotPath）+ 迁移测试。
- **server**：capture 路由 Zod 加 `snapshotHtml`；`CaptureService` 保存 raw 后写 snapshot 文件、落 `snapshot_path`；`GET /api/items/:id/snapshot` + item-service；集成测试。
- **web**：content/detail 加 `hasSnapshot`；Reader 正文/快照切换 + sandbox iframe + i18n（en/zh）；ReaderPage 测试。

## 5. 阶段计划（BATCH-04，5 阶段，≤10）

1. **STAGE-27**：扩展自包含快照内联器（best-effort + 预算/上限）+ capture payload `snapshotHtml` + 扩展单测。
2. **STAGE-28**：db `snapshot_path` 列 + migration `0002` + `Capture`/mapper/repository 贯通 + 迁移测试。
3. **STAGE-29**：server 接收并存储快照（capture Zod + CaptureService 写文件落列）+ `GET /api/items/:id/snapshot` + 集成测试。
4. **STAGE-30**：Reader 正文/原网页快照切换（sandbox iframe）+ web 类型（hasSnapshot）+ i18n + ReaderPage 测试。
5. **STAGE-31**：回归（核心闭环）+ E2E（含快照链路）+ 三类页面快照验证 + 文档 + BATCH-04 收官。

## 6. 风险与边界

- **保存延迟**：内联在扩展端有成本——以预算/上限/超时严格兜底，超限放弃快照，**绝不阻塞保存**（PRD §18.1）。
- **体积**：data URI 使快照偏大——设上限（建议 5MB，超限不存快照并标注）；快照独立于全文检索，不进 FTS。
- **保真度**：内联器为最小实现，复杂 CSS（外部字体/跨域资源/CSP 限制）可能不完美——以「大致还原 + 离线可看」为基线，不追求像素级，与截图方案的取舍已在 OQ-FC4 选定。
- **迁移**：加列 + 回填 null，低风险，必附迁移测试。
- **仅新保存生效**：已存条目无快照，需重新保存。

## 7. Open Questions

- **OQ-T3-1**（需 Decision）：新增 `captures.snapshot_path` 列（推荐）vs 复用 `screenshot_path`。
- **OQ-T3-2**：快照体积上限取值（建议 5MB）。
- **OQ-T3-3**：内联器自写最小实现（推荐）vs 引入 `single-file-core`（重依赖，倾向不引入）。
- **OQ-T3-4**：快照暴露方式——独立 `GET /snapshot` 端点（推荐）vs 并入 content 响应（大 payload，不推荐）。
