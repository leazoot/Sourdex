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

### STAGE-10：v0.1 发布准备（文档 / License / E2E / 打包 / 发布）

- 阶段状态：**PARTIAL**（可自动化部分全部完成；唯一剩项 GitHub release 由用户决定「暂不发布」而延后）
- 开始/完成时间：2026-06-20 /（release 用户择期）
- 阶段目标：完成文档、打包、E2E、发布物，达成 PRD §28 验收清单。
- 已完成内容：
  - TASK-047：发布版 README（PRD §20.3 全 10 项）+ PRD §20.2 必备文件（`LICENSE` **Apache-2.0** 官方全文、`docs/PRIVACY.md`、`docs/DEVELOPMENT.md`、`CONTRIBUTING.md`、`SECURITY.md`、`ROADMAP.md`、`CODE_OF_CONDUCT.md`）。
  - TASK-048：Playwright E2E `tests/e2e/save-search-export.spec.ts`——真实 server(dist)+Vite dev 联调跑通五步关键链路（save→inbox→search→reader→export），保存经 capture API、worker 真实提取+建索引；预写 auth.json 固定 token 免交互配对。
  - TASK-049：`pnpm --filter @sourdex/extension zip` 产出插件 zip；`scripts/package-release.sh` 汇集 `dist-release/`（扩展 zip + web 包）；`.github/workflows/release.yml`（`v*` tag → 打包 → `gh release create`）；`CHANGELOG.md`。
  - TASK-050：PRD §28 验收清单逐项核对（见下表）；补 `RELEASE_NOTES.md`（v0.1.0 发布说明 + 发布清单）、`release.yml` 改用 `--notes-file`，发布 turnkey；release 由用户决定「暂不发布」而延后。
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
  | 17 | CI 通过 | ⚠️ | ci.yml 六步本地等价全绿；GitHub 实跑待首次 push（无远程） |
  | 18 | 核心测试通过 | ✅ | test 152 + e2e 1 全绿 |
  | 19 | 插件 zip 可构建 | ✅ | wxt zip |
  | 20 | GitHub release 可发布 | ⏸ | 流程/产物已 turnkey；用户决定「暂不发布」而延后 |

- 验证结果（本地）：typecheck ✅(13) / lint ✅ / format:check ✅ / test ✅(152) / build ✅(8) / e2e ✅(1，五步)。
- 重要决策：**OQ-04 = Apache-2.0（用户决定）**——初按 PRD §20.1 推荐采用 AGPL-3.0，后由用户在两候选中改定为 Apache-2.0（LICENSE 官方全文 + README/CONTRIBUTING/RELEASE_NOTES 引用已更新）；**OQ-TP2** E2E 经 capture API 覆盖保存路径（headless 加载 MV3 脆弱），扩展 UI 由单测/集成覆盖；Vite dev 需 `--host 127.0.0.1` 以匹配 Playwright/CORS；**用户决定 v0.1 暂不对外发布**。
- 遗留问题：GitHub release（§28#20）延后，待用户择期执行（流程 turnkey）：① `git init` + commit（含 `pnpm-lock.yaml`）+ 关联 GitHub 远程 + push；② 打 `v0.1.0` tag 触发 `release.yml`（或 `gh release create`）。issue/PR 模板、CODEOWNERS、changesets 属 BACKLOG-017（下一 Batch）。
- 下一阶段目标：BATCH-01 收尾；按 Batch Planning Protocol 规划下一 Batch（v0.2：AI 摘要/标签/语义检索/Ask 等）。
- 下一步建议：v0.1 功能与质量已全部就绪（License = Apache-2.0），发布按用户意愿延后。进入 Batch Planning Protocol，输出下一 Batch 计划并等待确认，不自动进入下一阶段。

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
