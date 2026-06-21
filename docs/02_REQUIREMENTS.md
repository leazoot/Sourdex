# 02 Requirements — Sourdex

> Derived strictly from [docs/PRD.md](./PRD.md). No business requirement is added beyond the PRD. Engineering constraints implied by the PRD are surfaced explicitly. Unknowns go to Open Questions.

## 1. 功能需求

### 1.1 P0（v0.1 必做）

| ID | 功能 | 说明 | PRD |
|----|------|------|-----|
| FR-P0-01 | 插件保存网页 | 点击插件保存当前页 URL/title/DOM/favicon/选中文本，发送本地服务，1s 内反馈，失败可重试 | 5.1.1 |
| FR-P0-02 | 保存选中文本 | 右键 "Save selection to Sourdex"，保存选中文本+来源 URL+标题+上下文+时间 | 4.2, 5.1.1 |
| FR-P0-03 | 正文提取 | Readability 类提取标题/作者/正文/摘要/站点信息；HTML 清洗；HTML→Markdown；保存 raw HTML、readable HTML、纯文本；提取失败 fallback | 5.1.2 |
| FR-P0-04 | 本地资料库 | 元数据入 SQLite，长文本/二进制入本地 workspace；路径可迁移；数据目录可配置 | 5.1.3 |
| FR-P0-05 | Inbox | 列表展示标题/域名/时间/类型/摘要(无则正文前200字)；标记已读、归档、删除（删除二次确认） | 5.1.4 |
| FR-P0-06 | 全文搜索 | FTS5；关键词高亮；按时间/相关性排序；类型/域名/标签筛选 | 5.1.5 |
| FR-P0-07 | 阅读器 | 显示清洗正文/原链接/时间/标签/摘要；复制 Markdown；打开原网页；删除；归档 | 5.1.6 |
| FR-P0-08 | Markdown 导出 | 单条/批量；Obsidian 目录；文件名安全；frontmatter 含元数据 | 5.1.7 |
| FR-P0-09 | 设置页 | 数据目录、主题(浅/深/跟随)、语言(EN/中)、AI 入口、导出设置、隐私、本地服务状态 | 5.1.8 |
| FR-P0-10 | 本地 API 服务 | Capture/Item/Search/Export API，输入校验，软删除，后台任务编排 | 13 |

### 1.2 P1（v0.2，Future Backlog，当前 Batch 不实现）

AI 摘要（FR-P1-01）、AI 自动标签（FR-P1-02）、语义检索（FR-P1-03）、Ask 页面（FR-P1-04）、高亮与备注（FR-P1-05）。详见 PRD 5.2。

### 1.3 P2（后续增强，Future Backlog）

PDF 解析/页码、视频字幕、截图 OCR、重复/死链检测、WebDAV/S3 同步、Tauri、移动端、团队库、周报、各类导入、API/插件系统。详见 PRD 5.3。

## 2. 非功能需求

### 2.1 性能（PRD 18）
- 插件点击后 1s 内反馈保存状态。
- 正文提取后台执行，AI 不阻塞保存，大页面不卡死浏览器。
- 关键词搜索响应 < 500ms（1 万条资料内）。
- 搜索结果分页；长列表虚拟滚动。
- 首屏 < 2s；Reader 长文懒加载/虚拟化，避免一次性渲染大量 Markdown。

### 2.2 隐私与安全（PRD 17）
- 默认本地存储，默认不上传资料内容；仅用户配置 AI 后才允许发送片段，且发送前明确说明。
- API Key 加密保存（Keychain > 加密文件 > 环境变量）；禁止明文写配置/日志/前端长期保存。
- 日志不记录正文与 Key；导出诊断日志脱敏。
- 本地服务默认监听 127.0.0.1，禁止默认 0.0.0.0；插件访问需 token；首次连接需用户确认；CORS 仅允许插件 ID 与本地 Web UI；所有 API 输入校验。
- 内容版权边界：不绕过付费墙、不分享公共资源库、不默认下载视频、不批量抓取受限内容、导出保留来源 URL。

### 2.3 可访问性与国际化（PRD 19）
- v0.1 支持 English + 简体中文；文案不硬编码，统一 i18n；默认跟随系统，可手动切换。
- 键盘导航；按钮可读 label；搜索框自动聚焦但不打断；深色对比度合格；状态提示不只依赖颜色；支持 reduced motion。

### 2.4 代码与架构质量（PRD 9–11, 29）
- TypeScript strict；禁止 any（必须时说明原因）；外部输入用 Zod 校验。
- 严格分层与依赖方向（仅外向内）；可变外部能力接口隔离；Repository 模式访问数据库。
- React 组件 < 150 行；函数尽量 < 50 行；文件 kebab-case；组件 PascalCase。
- 明确错误类型；不吞错误；后台任务记录失败原因与重试次数；日志分级。

### 2.5 可测试性（PRD 9.5, 21）
- extractor 可用 fixture 测试；ai provider 可 mock；repository 可用测试 SQLite；service 可单测；UI 组件可独立渲染测试。

## 3. 用户角色

v0.1 为**单机单用户**，无账号系统、无权限分级（PRD 2.3 明确不做权限系统）。角色仅为产品意义上的使用画像（开发者/产品/创作者/研究者），不映射到系统权限。

## 4. 核心用户流程

1. **保存网页**：浏览页面 → 点击插件 → "Saved to Sourdex" → Inbox 出现该资料（即使 AI 摘要失败原始资料仍保存成功；重复保存提示已存在或建新版本）。
2. **保存选中文本**：选中文本 → 右键保存 → 保存关键片段+来源 → 后续可搜到并跳回原网页。
3. **搜索资料**：进入 Search → 输入关键词 → 返回相关资料/命中片段/标签/来源/时间，支持筛选与排序。
4. **阅读资料**：点击资料 → Reader 显示清洗正文/来源/摘要/标签/操作。
5. **导出资料**：选择单条或多条 → 导出 Markdown（含标题/URL/时间/摘要/标签/正文/备注），可被 Obsidian 打开。
6. **（v0.2）基于资料问答**：在 Ask 提问，仅基于已保存资料回答并附来源，证据不足需说明。

## 5. 权限需求

- v0.1 无登录、无多用户、无角色权限。
- 唯一的“访问控制”是本地服务的 token + CORS 白名单 + 首次连接确认（属安全边界，见 2.2 与 [security 规则](../.claude/rules/security.md)）。
- AI 数据外发为用户显式授权行为（配置 Provider 即授权，且发送前明确说明）。

## 6. 数据需求

数据模型完全遵循 PRD 12（不得擅自增删表/字段，调整须经 Decision Required）：
- `items`（资料主表）、`captures`（原始捕获）、`chunks`（分块，v0.2 语义检索用）、`tags`、`item_tags`、`annotations`（高亮备注，v0.2）、`jobs`（后台任务）、`ai_outputs`（AI 输出，v0.2）、`provider_configs`（AI Provider 配置，敏感字段不明文）。
- v0.1 主要使用：`items`、`captures`、`tags`、`item_tags`、`jobs`，以及 FTS5 虚拟表（索引 title/plain_text/summary/tags/annotations，见 PRD 15.2）。`chunks`/`ai_outputs`/`annotations`/`provider_configs` 表结构可在 v0.1 建立但功能在 v0.2 启用。
- 本地文件目录结构遵循 PRD 16.1：`sourdex.db` + `files/{raw-html,readable-html,markdown,screenshots,exports}` + `logs/` + `backups/` + `config/`。
- 软删除：DELETE 进入 `deleted` 状态（PRD 13.2）。

## 7. 边界条件

- 资料量级：v0.1 目标 1 万条内流畅（PRD 18.2）。
- 大页面 HTML 体积可能很大，需限制/流式处理避免浏览器与服务卡死。
- 中文标题、特殊字符、超长标题需文件名安全处理（PRD 5.1.7）。
- 重复保存同一 URL：提示已存在或创建新版本（PRD 5.1.1）。
- 离线：关闭网络后仍可查看已保存资料、全文搜索、导出（AI 功能除外）。
- chunk 大小建议 500–900 tokens，overlap 80–120 tokens（v0.2 embedding，PRD 14.6）。

## 8. 异常场景

- 正文提取失败：保留 raw HTML + 用户选中文本，资料仍保存成功，记录 `extraction_status`/`extraction_error`。
- 本地服务未启动：插件给出清晰连接失败提示并允许重试。
- AI 调用失败（v0.2）：不影响资料保存与全文搜索；可重新触发。
- 任务失败：写入 `jobs.error`，按 `max_attempts` 重试，记录 `attempts`。
- 导出失败：特殊字符/中文不得导致整体失败；单条失败不应中断批量其余项（具体策略见 Open Questions）。

## 9. Open Questions

- OQ-R1：重复 URL 保存的默认行为——“提示已存在”还是“创建新版本”？两者都被允许，需要确定 v0.1 默认。建议默认提示已存在并提供“仍然新建版本”选项。
- OQ-R2：批量导出中单条失败的处理策略——跳过并报告 vs 整体失败？建议跳过失败项并在结果中报告。
- OQ-R3：插件保存时是否发送完整 DOM 还是仅可见区域/简化 DOM？PRD 要求“获取页面 DOM”，但需定义体积上限与裁剪策略。建议发送序列化后的完整 outerHTML 并设置大小上限（超限降级为选中文本+元数据）。
- OQ-R4：`reading_time`/`word_count` 计算口径（中英文混排）？建议按字符/词混合估算，STAGE-05 确定。
- OQ-R5：v0.1 是否在保存时即同步提取，还是入库后由 `jobs` 异步提取？建议异步（保存优先），见 [03_ARCHITECTURE.md](./03_ARCHITECTURE.md)。
