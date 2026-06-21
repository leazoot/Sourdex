# 01 Project Brief — Sourdex

> Source of truth: [docs/PRD.md](./PRD.md). This brief summarizes; the PRD governs. Do not add scope beyond the PRD.

## 项目名称

Sourdex — 本地优先的全网资料索引库。
口号：Save once. Find forever.

## 项目背景

用户每天在网页、论坛、博客、视频、PDF、公众号、GitHub、技术文档、社交平台看到大量有价值信息，但这些信息被分散保存到收藏夹、Notion、Obsidian、微信收藏、稍后读、截图、聊天记录中。结果是：保存过的资料找不到、收藏后不再读、原网页失效后丢失、AI 总结无来源无法验证、调研/写作/学习时无法复用、知识库越大质量越差。

Sourdex 解决的核心问题是：**让保存过的资料真正能被找回、验证和复用**——把资料从“堆积”变成“可搜索、可引用、可复用的本地资产”。

## 项目目标

1. 让保存动作足够轻（点击即存，1 秒内反馈）。
2. 让资料保存后自动结构化（正文提取、Markdown、索引）。
3. 让用户能快速找回曾保存的内容（本地全文搜索）。
4. 让每条 AI 回答都可追溯到原始来源（v0.2 起）。
5. 让用户可随时导出自己的资料（Markdown / Obsidian）。
6. 让开源社区容易理解、部署、贡献和二次开发。

## 目标用户

核心用户：
- 程序员 / 开发者：收藏技术文档、issue、解决方案，后续搜索找回。
- 产品经理 / 创业者：收藏竞品、需求洞察、调研，复用为证据。
- 自媒体 / 内容创作者：收藏选题、素材、案例，写作时复用并保留来源。
- 学生 / 研究者：收藏论文、网页、PDF，引用时需要来源与页码。

次级用户：投资者、跨境卖家、设计师、家庭用户。

## 核心价值

1. 保存来源，而不是只保存链接。
2. 建立索引，而不是堆积资料。
3. 支持溯源，而不是只给 AI 总结。
4. 本地优先，而不是平台锁死。
5. 可导出，而不是封闭知识库。

## MVP 范围（v0.1，P0）

v0.1 闭环：**浏览器插件保存网页 → 提取正文 → 本地 SQLite 入库 → 全文搜索 → 阅读 → 导出 Markdown**。

P0 功能（PRD 5.1）：
1. 浏览器插件保存当前网页（Chrome / Edge，Manifest V3）。
2. 保存选中文本（右键菜单）。
3. 正文提取（Readability 类）+ HTML 清洗 + HTML→Markdown + 原始快照保存。
4. 本地资料库（SQLite + 本地文件目录，可配置数据目录）。
5. Inbox（标题/域名/时间/类型/摘要预览，已读/归档/删除）。
6. 全文搜索（FTS5，关键词高亮、排序、类型/域名/标签筛选）。
7. 阅读器（清洗正文、来源、时间、标签、摘要、复制 Markdown、打开原网页、归档、删除）。
8. Markdown 导出（单条/批量、Obsidian frontmatter、文件名安全处理）。
9. 设置页（数据目录、主题、语言、AI 入口、导出、隐私、服务状态）。

v0.1 信息架构先实现：Inbox、Library、Search、Settings（Ask/Tags/Export 完整化在 v0.2）。

## 非 MVP 范围

PRD 2.3 明确 v0.1 不做：团队协作、云同步、手机 App、复杂知识图谱、公开分享社区、付费墙绕过、视频下载器、通用 AI 聊天、复杂权限系统、多租户 SaaS。

延后版本（进入 Future Backlog，禁止在当前 Batch 实现）：
- v0.2（P1）：AI 摘要、AI 自动标签、语义检索（sqlite-vec）、Ask 页面、高亮与备注。
- v0.3+（P2）：PDF 解析/页码、视频字幕摘要、截图 OCR、重复/死链检测、WebDAV/S3 同步、Tauri 桌面端、移动伴侣、团队库、周报、收藏夹/Pocket/Raindrop/Omnivore 导入、API 与插件系统。

## 当前阶段目标

项目处于**文档初始化阶段**，尚未开始业务代码开发。当前阶段目标是建立可持续开发的文档体系、任务体系、规则体系与 Claude Code 执行体系，使后续开发可分阶段、可恢复、可检查、可持续推进。

下一开发阶段（Batch-01 / STAGE-01）目标：搭建 monorepo 与工程基线（不在本次任务中执行）。

## Open Questions

- OQ-01：前端轻量状态管理选 Zustand 还是 Jotai？（PRD 7.2.2 二选一）默认 **Zustand**。影响范围小，非阻塞。
- OQ-02：UI 组件用 shadcn/ui 还是自定义组件库？默认 **shadcn/ui**。非阻塞。
- OQ-03：v0.1 后台任务队列实现方式？默认 **进程内轮询 worker + `jobs` 表持久化/重试**（不引入外部队列）。非阻塞。
- OQ-04：开源 License 选 AGPL-3.0 还是 Apache-2.0？**已解决（STAGE-10，用户决定）：采用 Apache-2.0**（用户在 PRD §20.1 两候选中选定，覆盖 PRD 的 AGPL 推荐）。
- OQ-05：v0.1 终端用户如何启动本地服务？默认 **文档指导手动 `pnpm dev` / node 启动**，桌面打包延后到 v0.3 Tauri。
- OQ-06：插件↔本地服务的 token 与首次连接握手机制细节（PRD 17.3）？进入 STAGE-06 前必须明确（详见 [03_ARCHITECTURE.md](./03_ARCHITECTURE.md) Open Questions）。
- OQ-07：v0.1 是否采集页面截图？默认 **不采集，仅保存 raw HTML 快照**（截图/OCR 属 P2）。
- OQ-08：Node / pnpm / Turborepo 版本基线？默认 Node LTS + pnpm 最新稳定 + Turborepo 最新稳定，STAGE-01 启动时确认锁定。
