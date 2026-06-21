# Rules — Backend (apps/server, packages/extractor, packages/ai, packages/search, packages/exporter)

> 适用范围：本地 API 服务与服务端 packages。须符合 [docs/03_ARCHITECTURE.md](../../docs/03_ARCHITECTURE.md) §4/§7/§8。

## 技术约束

- Node.js + Fastify + Zod + Drizzle（PRD 7.2.4）。
- TypeScript strict；禁止 `any`（必须时注释原因）。
- **所有外部输入必须用 Zod 校验**（API 请求、扩展上送数据、配置）。

## 分层与职责

- **routes**：仅请求校验（Zod）与响应映射，无业务逻辑。
- **services（application）**：编排业务流程（CaptureService/ItemService/SearchService/ExportService），通过构造函数注入 repository / extractor / jobQueue / storage **接口**。
- **infrastructure**：Fastify、config、logger、job worker、storage 实现。
- 依赖方向只能从外向内：`route → service → repository/extractor/contract`。service **不得**直接 `new` 具体 Provider/Extractor（用工厂 + DI，PRD 9.3/10.6）。

## 接口优先 / 设计模式（PRD 9.3, 10）

- 对可变外部能力使用接口：ContentExtractor、JobQueue、Storage、Exporter、SearchEngine、Logger、（v0.2）LLMProvider/EmbeddingProvider。接口定义在 `packages/core/contracts`。
- Adapter（Provider 接入）、Strategy（按内容类型提取）、Factory（`createExtractor`/`createExporter`/`createLLMProvider`）、Command（后台任务）。

## 保存优先（PRD 18.1）

- `POST /api/captures/webpage` 必须**先持久化原始资料**（items + captures + 原始落盘）再入队提取 job，保存动作不被提取/AI 阻塞，1s 内反馈。
- 提取失败、AI 失败不得影响保存成功与全文搜索（PRD 14.1, 26.1）。

## 后台任务（PRD 10.5, 12.7）

- v0.1：进程内轮询 worker + `jobs` 表（OQ-03）。任务 command 化（ExtractContentJob 等）。
- 必须记录 `attempts`/`max_attempts`/`error`；可重试任务记录重试次数。

## 错误处理（PRD 11.5）

- 使用明确错误类型：CaptureError/ExtractionError/AIProviderError/DatabaseError。
- 不吞错误；不把底层错误原样返回给客户端；用户错误可读，开发错误可追踪（含 request_id/job_id）。

## 日志（PRD 11.6, 17）

- 分级 debug/info/warn/error。
- **默认不记录用户正文；禁止记录 API Key 与隐私字段**；错误日志含 request_id/job_id；导出日志脱敏。

## API 设计

- 遵循 PRD 13 的端点与请求/响应结构（captures/items/search/export，AI 为 v0.2）。
- 软删除：DELETE 进入 `deleted` 状态。
- 分页参数 page/pageSize；列表筛选 status/type/tag/domain/q/sort。

## 模块边界

- extractor/ai/exporter/search 的输入输出为明确 DTO，不依赖具体数据库。
- service 通过 repository 访问数据，不直接拼 SQL（复杂搜索模块除外，见 database 规则）。

## 禁止

- service 直接实例化具体 Provider/Extractor。
- 在 service 中直接拼业务 SQL（搜索模块例外）。
- 让 AI/提取阻塞保存主流程。
- 默认监听 0.0.0.0（见 security 规则）。
- 在日志输出正文或 API Key。

## Open Questions

- OQ-03 任务队列实现（默认进程内轮询）。
- OQ-A2 同步 vs 异步提取（建议异步）。
- OQ-A4 source_hash 计算口径。
- OQ-A6 Storage 是否抽象接口（建议是）。
