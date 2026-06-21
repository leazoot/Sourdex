# 03 Architecture — Sourdex

> Serves [docs/PRD.md](./PRD.md) sections 7–10. Architecture must not over-engineer. Where the PRD is silent, defaults are marked and unknowns go to Open Questions.

## 1. 总体架构

本地优先（local-first）分层架构（PRD 7.1）：

```text
Browser Extension  ──HTTP(127.0.0.1)+token──▶  Local API Service (Fastify)
                                                      │
                          ┌───────────────────────────┼───────────────────────────┐
                          ▼                           ▼                           ▼
                   Application Services          Job Worker (in-proc)        (v0.2) AI Jobs
                          │                           │
                          ▼                           ▼
                Domain (packages/core)        Extractor (packages/extractor)
                          │
                          ▼
                Repositories (packages/db) ──▶ SQLite (+FTS5) + Local File Storage
                          ▲
Web UI (apps/web) ──HTTP──┘ (only via server API; never touches SQLite directly)
```

数据落地遵循 PRD 16.1 的数据目录结构。

## 2. 分层与依赖方向（PRD 9.1, 9.2）

```text
UI Layer → API Layer → Application Service Layer → Domain Layer → Repository Layer → Infrastructure Layer
```

依赖**只能从外向内**。允许：`web → server API`、`server → service`、`service → repository`、`service → extractor`、`service → ai provider interface`、`repository → db`。
禁止：`db → service`、`extractor → web`、`ai → web`、`core → server`。

执行层面的硬约束：
- `apps/web` 不得直接访问 SQLite，只通过 server API（PRD 8.3）。
- `apps/extension` 不得包含数据库逻辑、AI 调用逻辑、复杂业务判断（PRD 8.1）。
- `packages/core` 不得依赖 `apps/server` 或任何上层。
- service 不得直接 `new` 具体 Provider/Extractor，依赖接口 + 工厂注入（PRD 9.3, 10.6）。

## 3. 前端架构（apps/web）

- React + Vite + Tailwind + shadcn/ui（默认，见 OQ-02）。
- 目录（PRD 11.2）：`pages/`（页面编排）、`features/`（capture/item-list/search/tags/export，组合 hooks+API）、`components/{ui,layout}`（无业务请求的展示组件）、`hooks/`、`lib/`。
- 服务端数据用 TanStack Query；轻量本地状态用 Zustand（默认，见 OQ-01）。
- 所有展示组件不得发起业务请求；Feature 组件组合 hooks 与 API；Page 组件只做编排。
- i18n 统一文件，文案不硬编码。
- v0.1 页面：Inbox、Library、Reader、Search、Settings。
- 详见 [.claude/rules/frontend.md](../.claude/rules/frontend.md)。

## 4. 后端架构（apps/server）

- Node.js + Fastify + Zod（PRD 7.2.4）。
- 职责（PRD 8.2）：本地 API、任务队列、编排 extractor/db/ai/search/exporter。
- 结构分层：
  - **routes**：仅请求校验（Zod）与响应映射，不含业务逻辑。
  - **services**（application）：编排业务流程（如 `CaptureService`、`ItemService`、`SearchService`、`ExportService`），依赖注入 repository / extractor / jobQueue 接口。
  - **infrastructure**：Fastify server、config、logger、job worker、文件存储适配。
- 后台任务：v0.1 采用进程内轮询 worker，状态持久化到 `jobs` 表（PRD 12.7），支持 `attempts`/`max_attempts`/`error`（默认，见 OQ-03）。任务建模为 command（PRD 10.5）：`ExtractContentJob`（v0.1），`GenerateSummaryJob`/`GenerateEmbeddingJob`/`ExportMarkdownJob`/`DetectDuplicateJob`（v0.2+）。
- 保存优先：`POST /api/captures/webpage` 同步写 `items`+`captures`（原始内容落盘）并返回 `itemId`，提取作为异步 job（保存不被提取/AI 阻塞，PRD 18.1）。
- 详见 [.claude/rules/backend.md](../.claude/rules/backend.md)。

## 5. 数据层架构（packages/db）

- SQLite + Drizzle ORM + FTS5（PRD 7.2.5）；v0.2 引入 sqlite-vec。
- 职责（PRD 8.5）：schema、migration、repository、transaction helper、seed dev data。不含 UI/AI 逻辑。
- Repository 模式（PRD 10.1）：所有 DB 访问经 repository（`ItemRepository`/`CaptureRepository`/`TagRepository`/`JobRepository`/`SearchRepository`）。service 中禁止拼 SQL，唯一例外是明确的复杂搜索模块（FTS/混合检索）。
- 数据模型严格遵循 PRD 12，不得擅自增删表/字段。
- 详见 [.claude/rules/database.md](../.claude/rules/database.md)。

## 6. 第三方服务依赖

- v0.1：无强制外部网络依赖（完全本地可用）。
- v0.2：AI Provider（OpenAI-compatible、Ollama），通过 `packages/ai` 的 Provider 抽象接入（PRD 14.2），用户显式配置后才使用。
- 浏览器扩展运行于 Chrome / Edge（Manifest V3，WXT），通过 HTTP 调本地服务。

## 7. 模块边界（PRD 8）

| 模块 | 职责 | 禁止 |
|------|------|------|
| apps/extension | 保存当前页/选中文本、与本地服务通信、Popup、权限 | DB 逻辑、AI 逻辑、复杂业务判断 |
| apps/server | 本地 API、任务队列、编排各 package | 直接耦合具体 Provider 实现 |
| apps/web | Inbox/Library/Search/Reader/Settings UI | 直接访问 SQLite |
| packages/core | 公共类型、领域模型、枚举、工具、错误类型 | 依赖任何上层 |
| packages/db | schema/migration/repository/事务/seed | UI/AI 逻辑 |
| packages/extractor | 正文提取、HTML 清洗、HTML→MD、元数据 | 依赖具体数据库 |
| packages/ai (v0.2) | LLM/Embedding Provider 抽象、summary/tag/embedding/RAG、prompt | 直接操作 UI |
| packages/search | FTS/向量/混合检索、排序、高亮片段 | — |
| packages/exporter | Markdown/Obsidian/JSON/CSV 导出 | — |

## 8. 接口优先（PRD 9.3）

需接口隔离：LLM Provider、Embedding Provider、Extractor、Storage、Exporter、Search Engine、Job Queue、Logger。示例：

```ts
export interface ContentExtractor { extract(input: ExtractInput): Promise<ExtractResult> }
export interface JobQueue { enqueue(job: JobInput): Promise<string> }
export interface Storage { write(path: string, data: Buffer | string): Promise<string> }
```

设计模式（PRD 10）：Repository、Adapter（Provider 接入）、Strategy（按内容类型提取）、Factory（`createLLMProvider`/`createExtractor`/`createExporter`）、Command（后台任务）、Dependency Injection（service 依赖接口）。

## 9. 关键流程说明

### 9.1 保存网页（save flow）
```text
Extension popup/contextmenu → POST /api/captures/webpage (url,title,html,selectedText,favicon,capturedAt)
  → CaptureService: 校验 → 计算 source_hash → 重复判定 → 写 items(status=inbox) + captures(原始落盘)
  → enqueue ExtractContentJob → 返回 {itemId, status:'saved', jobIds}
Job Worker: ExtractContentJob → extractor.extract(raw html)
  → 写 readable html/markdown/plain text + 更新 items(word_count/reading_time) + 写/更新 FTS 索引
  → 失败则 captures.extraction_status='failed' 并保留 raw html（资料仍可用）
```

### 9.2 搜索（search flow）
```text
GET /api/search?q&type&tag&domain&from&to&mode=keyword
  → SearchService → SearchRepository(FTS5 MATCH) → 排序(时间/相关性) → 高亮片段 → results[]
v0.2: mode=semantic/hybrid 走向量检索 + 混合 rerank（PRD 15.3 排序公式）
```

### 9.3 导出（export flow）
```text
POST /api/export/markdown {itemIds, format} → ExportService → exporter.toMarkdown(item, capture, tags)
  → frontmatter + 正文 → 文件名安全处理 → 写 files/exports/ → 单条返回路径 / 批量打 zip
```

## 10. 数据流说明

- 原始内容（raw/readable HTML、markdown、plain text）落本地文件，`captures` 仅存路径；元数据落 `items`。
- 可搜索纯文本进入 FTS5 虚拟表（PRD 15.2 字段：title/plain_text/summary/tags/annotations）。
- 软删除仅改 `items.status='deleted'`，文件保留（PRD 5.1.3：删除应用不静默删除用户资料）。

## 11. 错误处理策略（PRD 11.5）

- 明确错误类型：`CaptureError`/`ExtractionError`/`AIProviderError`/`DatabaseError`。
- 不吞错误；不向 UI 暴露底层错误；用户错误可读，开发错误可追踪。
- 后台任务失败必记录原因（`jobs.error`）与重试次数（`attempts`）。
- 提取失败不阻断保存；AI 失败不阻断保存与搜索。

## 12. 扩展点

- 新内容类型：新增 `ExtractStrategy`（webpage/selection/pdf/video）。
- 新 AI Provider：实现 `LLMProvider`/`EmbeddingProvider` + 工厂注册（v0.2）。
- 新导出格式：实现 Exporter 接口（Markdown/Obsidian/JSON/CSV）。
- 新搜索模式：keyword → semantic → hybrid（向量与混合 rerank 为预留扩展）。
- 存储后端：Storage 接口预留（v0.2+ WebDAV/S3）。

## 13. Open Questions

- ~~OQ-A1：插件↔本地服务握手与鉴权细节（PRD 17.3）~~ ✅ **已定（2026-06-20，方案B 配对码换取 token）**：服务首次启动在数据目录 `config/auth.json` 生成持久长随机 token（文件权限 600）。配对流程：扩展 Options「开始配对」→ `POST /api/pair/initiate`（localhost-only、免 token）服务生成 6 位短时配对码（5 分钟、单次使用、打印到服务终端，**不经响应回传**）→ 用户输入配对码 `POST /api/pair/complete`（localhost-only、免 token）换取长 token → 扩展存 `chrome.storage.local`。此后所有业务请求带 `Authorization: Bearer <token>`，服务 `requireToken` 中间件校验失败返回 401；CORS 仅放行 `chrome-extension://` 与本地 Web UI。（STAGE-06 落地）
- OQ-A2：v0.1 是否同步提取还是异步 job 提取？建议异步（保存优先）。若异步，Inbox 需展示提取中/失败状态。
- OQ-A3：FTS5 索引更新策略——触发器 vs 应用层显式写入？建议应用层在 repository 写入（更可控、易测）。
- OQ-A4：`source_hash` 计算口径（用于重复检测）——基于 canonical_url、还是 url+内容 hash？建议 canonical_url 优先 + 内容 hash 兜底，STAGE-03/04 确定。
- OQ-A5：v0.1 是否建立 `chunks`/`ai_outputs`/`annotations`/`provider_configs` 空表？建议建表（迁移一次到位）但功能在 v0.2 启用，避免后续大迁移。
- OQ-A6：Storage 在 v0.1 是否抽象为接口，还是先直接本地 FS？建议先本地 FS 实现但置于 `Storage` 接口后，便于 v0.2 扩展。
