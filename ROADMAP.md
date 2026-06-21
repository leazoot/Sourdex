# Roadmap — Sourdex

> 路线图随实际进度演进；权威范围以 [docs/PRD.md](docs/PRD.md) 为准，任务细节见 [docs/08_TASKS.md](docs/08_TASKS.md)。

## v0.1 — MVP（当前）

**目标：闭合本地优先的「保存 → 提取 → 入库/索引 → 搜索 → 阅读 → 导出」核心闭环。**

- [x] 浏览器插件一键保存网页 / 选中文本（MV3）
- [x] 本地服务（Fastify + SQLite/FTS5），保存优先、127.0.0.1、token 配对
- [x] 正文提取 + HTML→Markdown + 原始快照
- [x] 全文搜索（FTS5，中英文）
- [x] Web UI：Inbox / Library / Reader / Search / Settings（浅 + 深主题，i18n）
- [x] Markdown / Obsidian 导出
- [x] 单元 / 集成 / E2E 测试，CI
- [ ] 发布文档与产物打包（进行中）

## v0.2 — AI 增强（可选、默认关闭）

- AI 摘要（OpenAI 兼容 / Ollama，后台执行，可关闭）
- AI 自动标签（规范化复用已有标签）
- 语义检索（embedding + sqlite-vec，chunk 分块）
- Ask 页面（RAG，强制引用，证据不足时说明）
- 高亮与备注（annotations，导出含高亮）
- Tags / Export 页面完整化
- 混合搜索排序（keyword + semantic + tag + recency）
- API Key 安全存储（系统 Keychain / 加密文件）

## v0.3+ — 扩展

- 桌面端封装（Tauri）
- 自动备份 / 浏览器书签导入
- PDF 解析与页码引用、视频字幕摘要、截图 OCR
- 重复 / 死链检测
- WebDAV / S3 同步
- 第三方导入（Pocket / Raindrop / Omnivore / Markdown）、API 与插件系统

> 更细的待办与 backlog 见 [docs/08_TASKS.md](docs/08_TASKS.md) 的 Future Backlog。
