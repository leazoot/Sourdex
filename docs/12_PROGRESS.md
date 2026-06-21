# 12 Progress — Sourdex

> Living progress log. Updated on every task completion per the Closing Protocol in [CLAUDE.md](../CLAUDE.md). Never claim completed work that wasn't done. Newest update on top.

## 当前项目状态

**BATCH-02（v0.2）进行中 — STAGE-16（混合搜索排序）已完成。** v0.1.0 已发布（`leazoot/Sourdex`，BATCH-01 DONE）。STAGE-11~15 = DONE（抓取硬化 / AI 基础设施 / AI 摘要 / AI 自动标签 / 语义检索基础）。STAGE-16 = DONE（TASK-069~071）：`@sourdex/search` 混合打分（PRD §15.3 权重 + recency 半衰期 + tagScore + 相似度归一化）；`HybridSearchService` 融合 keyword∪semantic、统一过滤、排序分页、debug 明细；`/api/search?mode=hybrid`（无 provider 优雅降级不 409）；Web 搜索启用 keyword/hybrid 切换；user_signal 暂 0（待 STAGE-18）；core 加可选 `debug`/`scoreBreakdown`（非破坏）；**test 263 全绿**。按 /goal 停在 STAGE-16。

### STAGE-16 进度记录（2026-06-21，混合搜索排序 DONE）

#### TASK-069（混合打分逻辑 @sourdex/search）— DONE
- `HYBRID_WEIGHTS`（0.40/0.35/0.10/0.10/0.05）+ `hybridScore`；`recencyScore`（半衰期 30 天指数衰减，非法日期→0）；`tagScore`（查询 token 命中标签比例，子串/不区分大小写）；`normalizeSimilarities`（cosine 相对最优归一化、非正→0）。测试 5。检查：build/typecheck ✅，eslint 0。

#### TASK-070（HybridSearchService + API server）— DONE
- `HybridSearchService`：keyword 候选（FTS top-50 + normalizeScores）∪ semantic（启用时 top-50 + normalizeSimilarities）合并去重；统一应用结构化过滤（type/domain/from/to/tag，覆盖 semantic-only 命中）；每 item 计 tag/recency/signal(0)→hybridScore→排序(relevance/newest/oldest)→分页；debug 回传 scoreBreakdown。route `/api/search?mode=hybrid` 分发，无 embedding provider 时 semantic 贡献 0、不 409（§5.2.3.7 优雅降级）。container 接线。
- 测试：service 单测 4（融合、降级、debug 明细、过滤 semantic-only）+ 集成 1（hybrid 降级 + debug.keyword>0）。

#### TASK-071（搜索 UI 接入混合模式 apps/web）— DONE
- SearchPage 将设计稿原「semantic（即将推出）」占位启用为 keyword/hybrid 双态切换；选 semantic→请求带 `mode=hybrid`；对照设计稿不新增元素、无硬编码。
- 测试：组件测试 +1（点击 semantic→发出 `mode=hybrid` 请求）；既有 2 个搜索测试保持通过。
- STAGE-16 收尾全量检查：typecheck 全部 ✅；eslint 0；prettier `--check` 全绿（已 format）；**vitest 263/263（55 文件，252→263，+11）**；`pnpm build` 9/9 ✅。
- 备注：provider-config-repository 有一处既有计时 flake（同毫秒 create/update 致 updatedAt 相等，单独跑通过），非 STAGE-16 改动、按规则不动无关文件；user_signal 信号待 STAGE-18 annotations/收藏落地后接入。

### STAGE-15 进度记录（2026-06-21，语义检索基础 DONE）

#### TASK-066（分块/向量工具 + ChunkRepository + 嵌入存取 core/db）— DONE
- core utils：`chunkText`（段落优先打包到 token 目标、超大段按句/空白硬切、相邻 overlap、字符 offset 可溯源）+ `estimateTokens`（Latin 词+CJK 字，无依赖，规避 core→extractor 依赖）+ `cosineSimilarity`（长度不等/零向量→0 优雅降级，§14.6.5/§5.2.3.7）。
- db：`ChunkRow`/`mapChunk`；`ChunkRepository`（replaceForItem 事务幂等 / listByItem / findById / deleteByItem）；`AiOutputRepository.listByItemAndType` + `deleteByItemAndType`（重建路径）；`SearchRepository.listEmbeddingCandidates`（join items 排除 status=deleted，属复杂搜索模块例外）。
- 测试：core 8（chunk 5 + vector 3）；db 4（chunk repo 3 + ai-output +1）。检查：core/db build+typecheck ✅，eslint 0。

#### TASK-067（EmbeddingService + generate_embedding 后台任务 server）— DONE
- `EmbeddingService`：`enabledProvider()`（首个 enabled 且配置 embeddingModel）；`embedItem`（读正文截断 200k→chunkText→replaceForItem→deleteByItemAndType('embedding')→分批 64 embed→存 ai_outputs；无 provider/正文→no-op；AIProviderError→吞错不抛、infra 错上抛重试；幂等重建支持模型变更）；`embedQuery`。
- `createGenerateEmbeddingJob`（Command）+ container 接线 worker（FIFO 后置≈低优先级，无 priority 列改动）。
- 测试 4（mock embed provider）：每 chunk 一条 embedding、重跑幂等、无 embeddingModel no-op、provider 失败不抛且 FTS 不受影响。

#### TASK-068（语义检索服务 + API server）— DONE
- `SemanticSearchService`：embedQuery→listEmbeddingCandidates→余弦排序→每 item 最佳 chunk→top-K，回填 chunk 文本 snippet（可溯源 §5.2.3.5）；`enabledProvider()`。
- API：`GET /api/search/semantic?q&limit`（无 embedding provider→409 NO_AI_PROVIDER）；`POST /api/ai/embed/:itemId`（404/409/202 入队）。keyword `/api/search` 契约不变；hybrid 合并留 STAGE-16。
- 测试：service 单测 3（余弦排序+可溯源 snippet、软删排除、无 provider 空）；集成 +4（semantic 409、embed 404/409/202）。
- STAGE-15 收尾全量检查：typecheck 全部 ✅；eslint 0；prettier `--check` 全绿（已 format）；**vitest 252/252（53 文件，229→252，+23）**；`pnpm build` 9/9 ✅。
- 非阻塞 OQ-A9 记录：向量检索默认 brute-force 余弦，sqlite-vec ANN + 严格队列优先级留作后续优化（PRD §5.2.3.6「可使用」）。

### STAGE-14 进度记录（2026-06-21，AI 自动标签 DONE）

#### TASK-064（AutoTagService + 标签规范化复用 server/db）— DONE
- `TagRepository.findByNormalizedName`（只读查不创建，用于复用 vs 新建判定）。
- `AutoTagService.applySuggestedTags(itemId, suggested, {provider,model})`：规范化/折叠空白/去重；丢弃空、超长（>20，PRD §14.4.4）、过泛词（文章/资料/内容/article/content… §14.4.6）；已有全局标签优先复用（rule 1），新建上限 3（rule 2），结合既有 item 标签满足单条 ≤7（rule 3，既有标签占位且永不移除——手动优先 §5.2.2.3）；关联 `tags.type='ai'`/`item_tags.source='ai'`（confidence=null，模型未给分）；应用非空时写 `ai_outputs(type='tags')` 溯源。无新表、不动 PRD §12。
- 测试（5）：规范化+去重+ai output、过泛+超长过滤、新建上限 3+复用不受限、7 上限+不删既有、跳过已在 item 的标签且无应用不写 output。
- 检查：db build ✅；vitest 5/5 ✅；typecheck ✅；eslint 0。

#### TASK-065（摘要管线集成 + 接线 server）— DONE
- `SummaryService` 注入可选 `autoTagService`，在 `applyAiSummary` 后、重建 FTS 前调用 `applySuggestedTags`（独立 try/catch，标签失败不撤销已成功摘要）；重建索引含新标签。container 接线 `AutoTagService`。
- summary-service 测试改用共享 `TagRepository` + `AutoTagService`，新增断言：`suggested_tags`（"sqlite"）落库为 item 标签且写 `ai_outputs(type='tags')`；既有摘要测试保持通过。Reader 经既有 `TagDisplay` 展示标签（SummaryPanel 轮询失效刷新），无新 UI（符合设计稿）。
- 检查：typecheck 全部 ✅；eslint 0；prettier `--check` 全绿（已 format）；**vitest 229/229（48 文件，223→229，+6：AutoTagService 5 + 摘要集成 1）**；`pnpm build` 9/9 ✅。
- 非阻塞 OQ-A8 记录：功能级「单独禁用自动标签」开关粒度——默认由 AI 总开关覆盖 + 用户可手改/删、手动优先，留待未来设置项。
- **OQ-T7 已确认（2026-06-21，用户决定）：API Key 安全存储 = 本地加密文件**（数据目录 `secrets.enc`，AES-256-GCM + scrypt 派生主密钥，仅依赖 `node:crypto`；零原生依赖、跨平台一致、临时目录即可测）；系统 Keychain 留作后续增强。已同步 08_TASKS / 04_TECH_STACK / security 规则。STAGE-12（AI 基础设施）阻塞已解除，待用户下发 /goal 启动。
- 今日另提交：UI/bug 修复（Select 箭头间距、设置外观预览、capture 32MB 体积上限+413）已推送 `e6c5f97`。

### STAGE-13 进度记录（2026-06-21，AI 摘要 DONE）

#### TASK-063（Reader 摘要 UI apps/web）— DONE
- api `ItemDetail` 加 `summary: SummaryOutput|null`；新增 `lib/api/ai.ts`（summarizeItem）+ `hooks/useSummarize.ts`（触发后失效 item 查询）。
- `features/reader/SummaryPanel.tsx`（对照设计稿 03/14 右栏）：有摘要展示 summary + 编号 Key Points；无摘要显示「生成摘要」按钮（无 enabled provider 则禁用 + 提示去设置，经 useProviders 判定）；ai_status=pending 显示「生成中…」并定时失效 item 查询轮询结果；failed 显示重试文案。ReaderPage 改双栏（正文 + 右侧 aside，lg 显示）。
- i18n：reader.summarize/summarizing/noSummary/summaryFailed/aiOff（EN/简中）；无硬编码文案/颜色；组件 < 150 行。
- 测试 `SummaryPanel.test.tsx`（4）：展示 summary+keyPoints+编号、无 provider 时禁用+提示、有 provider 时启用、pending 态文案；既有 ReaderPage 测试仍通过（防御 providers 非数组）。
- 检查：web typecheck ✅；vitest 6/6（含既有 ReaderPage）✅；eslint 0。

#### STAGE-13 收尾全量检查（2026-06-21）
- typecheck 全部 ✅；eslint 0；prettier `--check` 全绿（已 format）；**vitest 223/223（47 文件，200→223，+23）**；`pnpm build` 9/9 ✅。
- 测试增量：ai-output repo 4、summary 解析 6、summary-service 4、ai 路由 5、SummaryPanel 4 = 23。

### STAGE-13 任务明细（TASK-059~062）

> 口径：以「存在 enabled 的 provider_config」为 AI 开关 + 数据外发显式 opt-in，无新增表（不动 PRD §12）。

#### TASK-059（AiOutputRepository + Item 摘要写入）— DONE
- schema 加 `AiOutputRow`；mappers 加 `mapAiOutput`；新增 `AiOutputRepository`（create / findLatestByItem，按 createdAt desc + rowid desc 取最新，规避同毫秒并列）；`ItemRepository.applyAiSummary`（写 summary/one_sentence + ai_status='done'）与 `setAiStatus`；barrel 导出。ai_outputs 表已在迁移中。
- 测试（4）：create + findLatest 取最新、无输出返回 null、applyAiSummary 字段+done、setAiStatus pending/failed。
- 检查：db build ✅；vitest 4/4 ✅；typecheck ✅；eslint 0。

#### TASK-060（摘要 Prompt + JSON 解析 @sourdex/ai）— DONE
- `summary.ts`：`buildSummaryMessages`（system+user，PRD §14.3 约束：仅 JSON、不编造、不超出原文、不 Markdown 包裹、不足返回空字段+原因、标签 ≤20 字符且具体）；`parseSummaryOutput`（剥离 ```json 围栏、回退取最外层 {...}、接受 snake_case 或 camelCase、数组过滤非字符串、缺字段空默认；非 JSON/非对象抛 `AIProviderError`）。无新增依赖（手写校验）。
- 测试（6）：干净 snake_case、围栏+camelCase、夹杂文本中恢复 JSON、缺字段空默认+丢弃非字符串项、非 JSON/数组抛错。
- 检查：typecheck ✅；vitest 6/6 ✅；eslint 0；build ✅。

#### TASK-061（generate_summary 后台任务 + SummaryService）— DONE
- `SummaryService`（DI）：选首个 enabled provider→取 Key→建 provider（默认 `@sourdex/ai`，可注入）→读 capture.originalTextPath 文本（截断 12000 字）→chat(buildSummaryMessages)→parseSummaryOutput→写 ai_outputs(type summary) + `applyAiSummary`(summary/oneSentence/done) + 以 summary 重建 FTS。无 enabled provider→ai_status=none 且不动数据；正文缺失或 AIProviderError/解析失败→ai_status=failed 且**不抛**；非 AI（基础设施）错误才上抛重试。inputHash=sha256(model+text)。
- `createGenerateSummaryJob`（Command）委托 service；container 注册 `generate_summary` worker + AiOutputRepository + SummaryService 接线。
- 测试（4，mock provider + 测试 db + 临时 storage）：成功写 ai_outputs/summary/done 且 FTS 可搜到 summary；provider 错误→failed 不抛；非 JSON 输出→failed；无 enabled provider→none 且无副作用。
- 检查：server typecheck ✅；vitest 4/4 ✅；eslint 0。

#### TASK-062（AI 摘要 API + 详情暴露）— DONE
- `routes/ai.ts`：`POST /api/ai/summarize/:itemId`——item 不存在 404；无 enabled provider → 409 `NO_AI_PROVIDER`（可读提示去设置）；否则置 ai_status=pending、入队 `generate_summary`、返回 202 `{jobId,status}`。Zod、沿用鉴权/CORS。
- `ItemService.get` 扩展 `ItemDetail.summary: SummaryOutput|null`（取 `aiOutputRepo.findLatestByItem(summary)` 并安全 JSON.parse，损坏返回 null）；container 给 ItemService 注入 aiOutputRepo。
- 集成测试（5）：缺 item→404、无 provider→409、有 provider→202+pending+入队 generate_summary、详情含结构化 summary、无摘要时 summary=null。
- 检查：server typecheck ✅；vitest 5/5 ✅；eslint 0。

### STAGE-12 进度记录（2026-06-21，AI 基础设施 DONE）

#### TASK-058（Settings AI 配置页 apps/web）— DONE
- 对照设计稿 settings 08（AI providers 区：provider 类型卡 + endpoint + API key + model）实现，不自由发挥。摘要/自动标签/语义/数据外发开关属 STAGE-13+ 功能（无持久化表，PRD §12 不增表），本阶段不做，仅保留**数据外发说明**文案。
- API 客户端 `lib/api/providers.ts`（list/create/update/delete/test，`ProviderConfigView` 不含明文 Key）；`query-keys` 加 providers；hooks `useProviders.ts`（增删改查 + 测试连接，invalidate）。
- UI 组件：`components/ui/Input.tsx`、`Switch.tsx`（设计 token）；`features/settings/ProviderForm.tsx`（类型卡 openai-compatible/ollama、name/endpoint/model/apiKey/enabled，新建/编辑；ollama 不显示 Key；编辑留空保持原 Key）、`ProviderRow.tsx`（启停 switch、测试连接结果、编辑、删除、Key 徽章）、`ProvidersSection.tsx`（列表 + 新增 + 删除确认 + 外发说明）；接入 SettingsPage aiProviders 区。组件均 < 150 行。
- i18n：en/zh 新增 settings.ai* 与 provider.* 文案；无硬编码文案/颜色；浅深主题用 token。
- 测试：`ProvidersSection.test.tsx`（3，jsdom + QueryClient + i18n）：空态 + 外发说明 + 新增按钮、打开表单含两种已实现类型、已配置项显示 Key 徽章与操作；既有 SettingsPage 测试不受影响。
- 检查：web typecheck ✅；vitest 6/6（含既有）✅；eslint 0；web build ✅。

#### STAGE-12 收尾全量检查（2026-06-21）
- typecheck 全部 ✅；eslint 0；prettier `--check` 全绿（已 format）；**vitest 200/200（42 文件，165→200，+35）**；`pnpm build` 9/9 ✅。
- 测试增量：secret-store 5、ai 9、provider-config repo 6、provider-config service 7、provider routes 5、providers-section 3 = 35。

#### TASK-054（SecretStore：本地加密文件密钥库）— DONE
- 新增契约 `packages/core/src/contracts/secret-store.ts`：`SecretStore { get/set/delete/has }`（异步）；core errors 新增 `SecretStoreError`；contracts barrel 导出。
- 新增实现 `apps/server/src/infrastructure/security/encrypted-file-secret-store.ts`：单 blob `secrets.enc`，AES-256-GCM；密钥 scrypt 派生自 0600 `secret.key`（默认随机生成）+ 每文件随机 salt；仅 `node:crypto`、零原生依赖；写临时文件再 rename 防半写；解密失败/损坏抛 `SecretStoreError`。诚实注释：非 Keychain 替代，防偶发泄漏/库内明文，Keychain 留作后续增强（OQ-T7）。
- DI：`keyMaterial` 可注入，单测用固定密钥、临时目录、测试后清理。
- 测试 `encrypted-file-secret-store.test.ts`（5）：跨实例往返 + 缺失键 null、覆盖/幂等删除、磁盘无明文（值与键名均不出现）、错误密钥 → SecretStoreError、文件损坏 → SecretStoreError。
- 检查：`@sourdex/core` build ✅；vitest 5/5 ✅；core+server typecheck ✅；eslint 0。

#### TASK-055（packages/ai：Provider 适配 + 工厂）— DONE
- 新建 `@sourdex/ai`（package.json/tsconfig，移除占位 .gitkeep）。
- `src/http.ts`：`FetchLike`（可注入 fetch，默认全局）+ `postJson`（传输/HTTP/解析失败统一映射 `AIProviderError`，错误不含请求体/Key）+ `readString` 安全取值。
- `providers/openai-compatible.ts`：`OpenAICompatibleProvider` 实现 LLMProvider+EmbeddingProvider（`/chat/completions`、`/embeddings`，Bearer Key）；`providers/ollama.ts`：`OllamaProvider`（`/api/chat`、`/api/embed`，无 Key，默认 127.0.0.1:11434）。
- `factory.ts`：`createLLMProvider`/`createEmbeddingProvider`（type→适配器；openai-compatible/lm-studio→OpenAI 形，ollama→Ollama，anthropic/gemini 未实现抛错）+ `isProviderImplemented`。错误用 core `AIProviderError`。
- 测试 `ai.test.ts`（9，mock fetch 记录调用）：工厂分派 + 未实现类型抛错 + isProviderImplemented；openai chat/embed 报文映射 + URL/Bearer；HTTP 错误/缺内容/无模型 → AIProviderError；ollama chat/embed + 默认 baseUrl。
- 检查：typecheck ✅；vitest 9/9 ✅；eslint 0；build ✅。

#### TASK-056（ProviderConfig Repository + Service）— DONE
- `packages/db`：schema 加 `ProviderConfigRow`；mappers 加 `mapProviderConfig`；新增 `ProviderConfigRepository`（create/findById/list/update/delete，create 默认 enabled=false，update 支持以 null 显式清空可空字段，Key 不入库）；barrel 导出。provider_configs 表已在 0000_init 迁移中。
- `apps/server`：新增 `ProviderConfigService`（list/get/create/update/remove/testConnection）——配置经 repo、API Key 经注入 `SecretStore`（key=config.id），返回 `ProviderConfigView`（含 `hasApiKey`，**绝不含明文 Key**）；update 的 apiKey：string 改写 / null 清除 / undefined 不动；testConnection 经注入工厂（默认 `@sourdex/ai` createLLMProvider）做最小 chat ping。
- 接线：server package 加依赖 `@sourdex/ai`；config 加 `secretsPath`（`config/secrets.enc`）；container 创建 `EncryptedFileSecretStore` + repo + service 并导出；testing.ts 同步 secretsPath。
- 测试：repo 6（CRUD + 默认禁用 + null 清空 + 缺失更新返回 null + 删除幂等）；service 7（Key 入 SecretStore 不入视图、无 Key 创建、update 三态、remove 连带删 Key、list 反映 hasApiKey、testConnection ok/NotFound）。
- 检查：db+server typecheck ✅；vitest 13/13 ✅；eslint 0；db build ✅。

#### TASK-057（AI Provider 设置 API 路由）— DONE
- 新增 `routes/providers.ts`：`GET /api/settings/providers`（列表）、`GET /:id`、`POST`（201）、`PATCH /:id`（部分更新，house style）、`DELETE /:id`、`POST /:id/test`（测试连接）。全部 Zod 校验；响应仅含非密配置 + `hasApiKey`，**绝不回传明文 Key**；apiKey 字段：string 改写 / null 清除 / 省略不变。
- `app.ts`：注册路由；errorHandler 新增 `AIProviderError → 502`（消息安全可读，无 Key/正文）。沿用既有 Bearer 鉴权 + CORS 白名单（providers 路由不在 PUBLIC_PATHS）。
- 集成测试 `providers.integration.test.ts`（5）：完整 CRUD 生命周期且任何响应不含明文 Key、null 清空 Key、非法输入（坏 type/坏 URL/缺 name）400、无 token 401、test 缺失 id 404。
- 检查：server typecheck ✅；vitest 5/5 ✅；eslint 0。

### STAGE-11 进度记录（2026-06-21）

#### TASK-053（扩展抓取前滚动加载动态内容）— DONE
- 新增 `apps/extension/lib/auto-scroll.ts`：依赖注入版 `autoScroll(env,opts)`——滚动到底循环，按「高度不再增长 N 次 / 步数上限 / 时间预算」退出；默认 maxScrolls 30 / stableThreshold 2 / stepDelay 250ms / maxDuration 6s（静态页约 0.5s 退出，动态页才持续）。
- `capture.ts` 注入脚本内联同一算法（注入脚本不能 import），常量经 `args` 传入单一来源；滚动后取 outerHTML，再滚回顶部。
- `auto-scroll.test.ts`（4 用例：静态页快速停、增长到稳定、步数上限、时间预算）。
- 检查：auto-scroll test ✅、扩展 typecheck ✅。

#### TASK-052（Discourse 站点适配器）— DONE
- 新增 `packages/extractor/src/strategies/adapters/discourse.ts`：`extractDiscourseArticle`——字符串快门 + `meta generator=Discourse`/`#main-outlet+.topic-post` 检测；遍历 `.topic-post` 取 `.cooked` 正文 + 作者(`[data-user-card]`/`.username`)/时间(`.relative-date`/`.post-date title`)，**跳过无 `.cooked` 的占位楼层**；拼为干净 Article（content/textContent/byline/title）。
- 接入 `WebpageExtractStrategy`：`extractDiscourseArticle(...) ?? extractArticle(...)`（Discourse 走适配器，其余 Readability，非论坛页经字符串快门快速跳过）。
- fixture `test/fixtures/discourse-topic.html`（2 真实楼层 + 1 placeholder 类 + 1 无 cooked stub）；`discourse.test.ts`（4 用例：非 Discourse 返 null、提取已加载楼层、丢弃占位、策略集成）。
- **真实 linux.do 1.4MB 原文实测**：检测 true、标题正确、正文（「一键最小化」「menubar」段）提取到、byline-only 噪声消除。
- 检查：extractor test 25 全绿、typecheck/lint/format ✅。收编 BACKLOG-016。

#### TASK-051（提取器占位/样板噪声过滤）— DONE
- 新增 `packages/extractor/src/html/preclean.ts`：Readability 前对 DOM 预清理——按 class/id token 剔除 placeholder/skeleton/ghost/spinner/shimmer/loading 等占位骨架，并移除 script/style/noscript/template；按 token 匹配（避免误伤 downloading/preloading-tips 等）。
- 接入 `extractArticle`（preclean → Readability）；`index.ts` 导出；新增 `preclean.test.ts`（5 用例：占位类/ id 剔除、脚本样式剔除、近似词不误删、正常文章不变）。
- 检查：extractor test 21 全绿、typecheck/lint/format/build ✅。

---

- 当前 Batch：**BATCH-01**（Sourdex v0.1 MVP）— **DONE**
- 已完成 Stage：**STAGE-01 ~ STAGE-10 全部 DONE**
- PRD §28 验收：1–16、18、19 ✅；17（CI）GitHub Actions 首次 push 已触发；20（release）✅ v0.1.0 已发布。
- 最终检查全绿：typecheck(13) / lint / format / test(152) / build(8) / e2e(1，五步关键链路)。
- **OQ-04（License）= Apache-2.0（用户决定）**：初按 PRD §20.1 采用 AGPL-3.0，后由用户改定为 Apache-2.0。
- 发布过程：用户提供 `leazoot/Sourdex` 并授权 → 配独立 SSH 别名 `github-leazoot`（专用 key，仅本仓库）→ 改写 3 个提交作者为 `leazoot <leazoot@gmail.com>`（去除原本地 git 身份）→ 推 main + v0.1.0 tag → release.yml 自动发布。
- 下一步：按 Batch Planning Protocol 规划 BATCH-02（v0.2：AI 摘要/标签/语义检索/Ask 等），输出计划并等待确认。
- **v0.1 核心闭环已全部贯通并经 E2E 验证：保存 → 提取 → 入库/索引 → 搜索 → 阅读 → 导出 Markdown。**
- 已确认 OQ：OQ-R2=批量单条失败跳过并 `failed[]` 报告（STAGE-09）；OQ-TP2=E2E 经 capture API 覆盖保存路径、扩展 UI 由单测/集成覆盖（STAGE-10/TASK-048）。
- **v0.1 核心闭环已全部贯通并经 E2E 验证：保存 → 提取 → 入库/索引 → 搜索 → 阅读 → 导出 Markdown。** UI 严格按 `design/`。

## STAGE-10 进度记录（2026-06-20 ~ 06-21）

### TASK-050（v0.1 验收清单核对 + Release）— DONE（2026-06-21，已发布）
- 逐项核对 PRD §28（20 项）全部满足（核对表见 `docs/14_STAGE_SUMMARY.md` STAGE-10 条目）。
- 最终全套检查全绿：`typecheck`✅(13) `lint`✅ `format:check`✅ `test`✅(152) `build`✅(8) `test:e2e`✅(1, 五步)。
- 发布交付物：`RELEASE_NOTES.md`（v0.1.0 发布说明）、`release.yml` 用 `--notes-file`、`CHANGELOG.md`。
- License：用户改定 Apache-2.0 → LICENSE 官方全文 + README/CONTRIBUTING/RELEASE_NOTES 引用更新。
- **发布到 GitHub `leazoot/Sourdex`**：① 用户提供仓库 + 授权；② 配独立 SSH 别名 `github-leazoot`（专用 key `id_ed25519_leazoot`、`ssh.github.com:443`、`IdentitiesOnly`，仅本仓库 remote 用，不影响其他账号/key）；③ 用 `git filter-branch` 把 3 个提交 author/committer 全部改写为 `leazoot <leazoot@gmail.com>`（去除原本地 git 身份，并清理 refs/original 备份）；④ `v0.1.0` tag 移到改写后 HEAD `7e3f184`；⑤ 推 `main` + `v0.1.0`。
- **结果**：release.yml 运行 **success**，Release `Sourdex v0.1.0`（draft=false，published）附 `sourdexextension-0.0.0-chrome.zip` + `sourdex-web.tar.gz`；CI 工作流首次 push 已触发运行。§28#20 ✅ 满足。
- 注：含旧账号信息的会话级文档备注未提交、不入公开仓库；公开历史作者均为 leazoot。
- 文件：`RELEASE_NOTES.md`、`.github/workflows/release.yml`、`docs/08_TASKS.md`、`docs/12_PROGRESS.md`、`docs/14_STAGE_SUMMARY.md`。

### TASK-047（README / 安装 / 隐私文档 + License）— DONE
- README 重写为发布版，含 PRD §20.3 全部 10 项：产品截图（引用 design/screenshots）、一句话定位、核心功能、安装、本地运行（server/web）、插件安装+配对流程、隐私、Roadmap、Contributing、License。
- 新增 PRD §20.2 必备文件：`LICENSE`（**Apache-2.0** 官方全文 verbatim）、`docs/PRIVACY.md`、`docs/DEVELOPMENT.md`、`CONTRIBUTING.md`、`SECURITY.md`、`ROADMAP.md`、`CODE_OF_CONDUCT.md`（Contributor Covenant 2.1）。
- **OQ-04 决策落地**：初按 PRD §20.1 推荐采用 AGPL-3.0，随后**用户在两候选中改定为 Apache-2.0**（用户决定覆盖 PRD 推荐）；LICENSE 换为 Apache-2.0 官方全文，README/CONTRIBUTING/RELEASE_NOTES 的 License 引用同步更新。
- 范围：issue/PR 模板、CODEOWNERS、changesets 属 BACKLOG-017，未纳入本任务。
- 检查：`format:check`✅ `lint`✅；PRD §20.2 必备文件齐全（README/LICENSE/CONTRIBUTING/CODE_OF_CONDUCT/SECURITY/PRIVACY/ROADMAP + docs/PRD/ARCHITECTURE/DEVELOPMENT）。
- 文件：`README.md`、`LICENSE`、`docs/PRIVACY.md`、`docs/DEVELOPMENT.md`、`CONTRIBUTING.md`、`SECURITY.md`、`ROADMAP.md`、`CODE_OF_CONDUCT.md`、`docs/08_TASKS.md`、`docs/12_PROGRESS.md`。

### TASK-049（插件打包 zip + 发布产物）— DONE
- 验证插件 zip 可构建：`pnpm --filter @sourdex/extension zip`（WXT）→ `.output/sourdexextension-0.0.0-chrome.zip`（58KB）。
- 新增 `scripts/package-release.sh`：`pnpm build` → 扩展 zip → web `dist` 打 `sourdex-web.tar.gz`，汇入 `dist-release/`；本地实跑成功（扩展 zip 57K + web 包 105K）。
- 新增 `.github/workflows/release.yml`：`v*` tag 触发，install(frozen) → 打包脚本 → `gh release create … --generate-notes` 上传 `dist-release/*`（permissions contents:write，用 `github.token`）。
- 新增 `CHANGELOG.md`（Keep a Changelog，v0.1.0 Unreleased 条目，概述 save→extract→index→search→read→export 闭环 + 隐私默认本地）；`.gitignore` 追加 `dist-release/`。
- 决策/范围：本地服务按 README 从源码运行，不打自包含 server（better-sqlite3 原生依赖，v0.1 范围外）；实际 tag 触发的 GitHub release 留待 TASK-050 用户授权后执行（本环境非 git 仓库、无远程）。
- 检查：`format:check`✅ `lint`✅；打包脚本本地实跑✅（产物齐全）。
- 文件：`.github/workflows/release.yml`、`scripts/package-release.sh`、`CHANGELOG.md`、`.gitignore`、`docs/08_TASKS.md`、`docs/12_PROGRESS.md`。

### TASK-048（E2E 关键链路 Playwright）— DONE
- 新增 `tests/e2e/save-search-export.spec.ts`：单 journey 用例用 `test.step` 覆盖 PRD §21.3 五步关键链路——① 保存网页（POST `/api/captures/webpage`，扩展所调端点）② 后台 worker 真实提取+建索引（`expect.poll` 轮询 `/api/items/:id/content` 至关键词出现）③ Inbox 显示该资料 ④ 全文搜索按正文关键词命中 ⑤ 从搜索结果进 Reader 并导出 Markdown（显示「Exported to <path>」）。
- 新增 `tests/e2e/test-env.ts`：在 Playwright 配置加载期预写临时数据目录 `$TMPDIR/sourdex-e2e` 的 `config/auth.json` 固定 token，使真实 server 以已知 token 启动；前端经 `VITE_SOURDEX_API_TOKEN` 注入，免交互配对。
- 改 `playwright.config.ts`：`webServer` 起真实 server（`apps/server/dist/server.js`，临时 dataDir）+ Vite dev（`@sourdex/web`，`--host 127.0.0.1` 以匹配 Playwright/CORS 的 127.0.0.1 检测，端口 5180/8799），单 worker 串行。
- 关键词只置于正文（不入标题），避免搜索高亮 `<mark>` 拆分标题文本节点导致定位失败。
- 决策落地：OQ-TP2=E2E 以扩展所用 capture API 覆盖保存路径（headless 加载 MV3 脆弱），扩展 UI 由单测/集成测试覆盖；写入 `09_TEST_PLAN` §5 + 运行命令（先 `pnpm build` + `playwright install chromium`，再 `pnpm test:e2e`）。
- 检查：`test:e2e`✅(1 passed, 5 步) `typecheck`✅(13) `lint`✅ `format:check`✅ `test`✅(152) `build`✅(8)。
- 文件：`tests/e2e/save-search-export.spec.ts`、`tests/e2e/test-env.ts`、`playwright.config.ts`、`docs/09_TEST_PLAN.md`、`docs/08_TASKS.md`、`docs/12_PROGRESS.md`。

## STAGE-09 进度记录（2026-06-20）

### TASK-043（Exporter 接口 + Markdown/Obsidian frontmatter）— DONE
- 新建 `@sourdex/exporter` 包（纯逻辑）：`frontmatter.ts`（`buildFrontmatter`，YAML 双引号转义 title/url/domain/saved_at/type/author/tags，空 url/domain 省略、空 tags=`[]`）、`to-markdown.ts`（`toMarkdownDocument`：frontmatter + `# Title` + `Source:` + `## Summary`(有则) + `## Content`(空则占位)，按 PRD §5.1.7 示例）。
- 决策落地：OQ-R2=批量单条失败「跳过并报告」（写入 STAGE-09 阶段决策）。
- 测试：`to-markdown.test.ts`（7 用例：字段、空 url/tags、引号/反斜杠转义、中文标题、装配/省略 summary/空内容兜底）。
- 检查：`typecheck`✅(12) `lint`✅ `format:check`✅ `test`✅(138) `build`✅(8)。
- 说明：纯 DTO 进出不碰 DB/文件；JSON/CSV v0.2；文件名安全 TASK-044、落盘/zip TASK-045、UI TASK-046。

### TASK-044（文件名安全处理）— DONE
- `filename.ts`：`safeFilename`（剥离 `\/:*?"<>|`+控制字符、折叠空白、去首尾点/空格、UTF-8 字节截断 ≤100B 不切多字节、避开 Windows 保留名 con/prn/.../lpt9、空→untitled、保留中文、自定义扩展名）+ `uniqueFilename`（批量去重 -1/-2）。
- 测试：`filename.test.ts`（9 用例：非法字符、空白折叠、中文、空/全非法兜底、保留名、超长字节截断、自定义扩展、去重）。
- 检查：`typecheck`✅(12) `lint`✅ `format:check`✅ `test`✅(147) `build`✅(8)。

### TASK-045（Export API + 批量 zip）— DONE
- `ExportService`：单条→`files/exports/<exportId>/<safeFilename>.md`；多条→`fflate.zipSync` 打包（obsidian 按 `safeFilename(domain,"")` 分文件夹、`uniqueFilename` 防重名）；缺失/软删除项跳过并 `failed[]` 报告（OQ-R2）；提取产物缺失则元数据导出（非失败）。
- `routes/export.ts`：POST /api/export/markdown（Zod：itemIds≥1、format markdown|obsidian，默认 markdown）；app/container 接线。
- core：`ExportResult` 增 `count` + `failed: ExportFailure[]`。
- 依赖：新增 `fflate`（极小零依赖、ESM 具名导出兼容 verbatimModuleSyntax）+ `@sourdex/exporter`；vitest alias。
- 测试：`export.integration.test.ts`（4 用例：单条 .md frontmatter+内容、批量 zip obsidian 域名文件夹解压校验、缺失项跳过上报、空 itemIds 400）。
- 检查：`typecheck`✅(13) `lint`✅ `format:check`✅ `test`✅(151) `build`✅(8)。

### TASK-046（Export UI + 导出测试）— DONE
- `apps/web`：`lib/api/export.ts`（exportMarkdown）+ `hooks/useExport.ts`（mutation）；Reader 工具栏「Export」按钮（单条 markdown，成功显示「Exported to <path>」横幅）；Library 头部「Export all」（导出当前筛选列表 obsidian zip + 成功横幅）；locales `exportUi.*`（en/zh）。
- 测试：ReaderPage 新增 export 用例（点 Export → POST /api/export/markdown → 显示产出路径）；导出流程集成测试在 TASK-045。
- 检查：`typecheck`✅(13) `lint`✅ `format:check`✅ `test`✅(152) `build`✅(8)。
- 说明：v0.1 无浏览器下载端点，导出落数据目录 `files/exports/`，UI 展示路径（本地优先 MVP）；下载/Export 专页 v0.2。

**STAGE-09 收尾**：Markdown/Obsidian 导出闭环 —— `@sourdex/exporter`（frontmatter + 文档装配 + 文件名安全/去重）、Export API（单条 .md / 多条 fflate zip、obsidian 域名分文件夹、OQ-R2 缺失项跳过并报告）、Reader 单条 + Library 批量入口。新增依赖 fflate。typecheck/lint/format/test(152)/build 全绿。v0.1 核心闭环（保存→提取→索引→搜索→阅读→导出）全部贯通。

## STAGE-08 进度记录（2026-06-20）

### TASK-039（Search API GET /api/search, keyword）— DONE
- 新建 `@sourdex/search` 包（纯查询逻辑）：`query.ts` —— `buildMatchExpression`（分词 + CJK 切分 + 双引号 FTS 字面量，防注入）、`tokenizeQuery`（保留 "短语"）、`cleanSnippet`（去 CJK 字间空格 + 合并相邻高亮）、`normalizeScores`（bm25→0..1）。
- `packages/core`：`utils/text.ts` 新增 `segmentCjk`（CJK 逐字切分，解决 OQ-A7）+ `HIGHLIGHT_OPEN/CLOSE`（私有区码点，UI 映射 `<mark>`）+ `text.test.ts`（6 用例）；`types/search.ts` 加 `SearchInput.sort`。
- `packages/db` SearchRepository：`index()` 写入前对 title/plainText/summary/tags 做 `segmentCjk`；新增 `queryItems(match, filters, options)` —— JOIN items + 结构化过滤（type/domain/tag/from/to）+ 排除软删除 + `bm25` 排名 + `snippet`（高亮标记）+ 4 列 `highlight()` 推导 matchedFields；保留简单 `search()` 探针（测试用）。
- `apps/server`：`SearchService`（实现 core `SearchEngine` 契约：buildMatchExpression→queryItems→normalizeScores+cleanSnippet+matchedFields）、`routes/search.ts`（Zod 校验 q/type/tag/domain/from/to/mode/page/pageSize，pageSize≤50）、`app.ts`/`container.ts` 接线。
- 决策落地（OQ-A7）：unicode61 + 索引/查询期 CJK 逐字分词（非 trigram），支持中文 2 字词与任意长度子串，无需 FTS schema 迁移；snippet 返回前去分词空格。
- 测试：`routes/search.integration.test.ts`（5 用例：英文命中含高亮/score/matchedFields、中文 2 字子串命中、type 过滤、软删除排除、缺 q 400）。
- 检查：`typecheck`✅(11) `lint`✅ `format:check`✅ `test`✅(109) `build`✅(7)。
- 说明：MATCH 执行在 db，纯逻辑在 packages/search，编排在 server；排序/高亮细化 + query 解析单测在 TASK-040，性能校验在 TASK-042。

### TASK-040（排序、筛选、高亮片段 + query 解析单测）— DONE
- `routes/search.ts`：暴露 `sort` 参数（relevance/newest/oldest，透传 SearchService→queryItems）。
- 单测：`packages/search/src/query.test.ts`（tokenizeQuery/buildMatchExpression[AND/CJK/引号转义/算子中和/空]/cleanSnippet[去字间空格/合并高亮]/normalizeScores）；`search-repository.test.ts` 新增 queryItems（matchedFields + 高亮 snippet、type 过滤、软删除排除、newest/oldest 排序——以显式 UPDATE saved_at 控制时间，避免毫秒碰撞）。
- 检查：`typecheck`✅(11) `lint`✅ `format:check`✅ `test`✅(127) `build`✅(7)。
- 说明：筛选 type/domain/tag/from/to 已在 TASK-039 落地，本任务补排序与单测；高亮标记交前端渲染。

### TASK-041（Search 页面）— DONE
- `apps/web`：`lib/api/search.ts`（searchItems）、`query-keys.ts`（search key）、`hooks/useSearch.ts`（q 非空才启用 + keepPreviousData）；`components/ui/Highlight.tsx`（私有区标记 → `<mark>`）；`features/search/{SearchResultCard,SearchFilters}.tsx`；`pages/search/SearchPage.tsx`（按设计 04/15）。
- 服务端：core `SearchResultItem` 增 domain/type/savedAt（PRD §15.4 结果需展示类型/域名/时间），`SearchService` 映射这些字段。
- 页面：62px 大搜索框（自动聚焦 + 防抖 250ms + URL ?q 同步）、keyword/semantic 切换（semantic 禁用占位 v0.2）、结果计数 + relevance/newest 排序、命中卡片（TypeBadge/域名/相对时间/匹配分 + 标题/片段 `<mark>` 高亮）、右侧筛选（类型 + 时间 → from）、prompt/loading/error/empty 态。
- 测试：`SearchPage.test.tsx`（URL q 渲染结果、片段 `<mark>` 高亮）。
- 检查：`typecheck`✅(11) `lint`✅ `format:check`✅ `test`✅(129) `build`✅(7)。
- 说明：无 GUI 不能目视核对像素，验收以 build + render 测试 + 对照设计实现为准；标签筛选/最近搜索/语义为 v0.2 或可选增强。

### TASK-042（搜索测试与性能校验）— DONE
- 性能：`packages/db/src/repositories/search-repository.perf.test.ts` —— 单事务 prepared 批量播种 10,000 条 items + FTS 行，warm-up 后 `queryItems('"sqlite"')` 断言 < 500ms（PRD §18.2，实测整测 ~65ms）。
- 流程集成：`search.integration.test.ts` 新增 save→后台 extract→/api/search 命中→/api/items/:id/content 读取正文全链路用例。
- 检查：`typecheck`✅(11) `lint`✅ `format:check`✅ `test`✅(131) `build`✅(7)。
- 说明：经 Fastify inject（真实 app+worker+sqlite）验证，与 live boot 等价；OQ-TP3 以单事务批量播种实现。

**STAGE-08 收尾**：完成关键词全文搜索闭环 —— Search API（GET /api/search，q/type/tag/domain/from/to/sort/page）、CJK 逐字分词（OQ-A7，中文 2 字词可搜）、bm25 相关性 + 时间排序、命中片段高亮（私有区标记→`<mark>`）、matchedFields、Search 页面（大搜索框/筛选/高亮卡片）、1 万条 < 500ms 性能校验。新增 `@sourdex/search` 包（纯查询逻辑）。typecheck/lint/format/test(131)/build 全绿。

## STAGE-06 进度记录（2026-06-20）

### TASK-027（WXT 插件初始化 MV3）— DONE
- 新建 `apps/extension`：`package.json`(@sourdex/extension)、`wxt.config.ts`（MV3 最小权限 activeTab/scripting/contextMenus/storage、host_permissions 仅 127.0.0.1+localhost、command save-page=⌘⇧S、Tailwind v4 vite 插件）、`tsconfig.json`(extends .wxt)、`assets/theme.css`（Tailwind v4 `@theme` 设计 token，浅/深主题跟随系统）、`components/Logo.tsx`、`entrypoints/{popup,options}/{index.html,main.tsx,App.tsx}`、`entrypoints/background.ts`（骨架）。
- 工程：root `package.json` 加 `pnpm.overrides`（vite=6.4.3、@vitejs/plugin-react=^4.3.4，统一 vite 版本修复 WXT/plugin-react@6 与 vite7 不兼容）；`turbo.json` build outputs 加 `.output/**`。
- 决策落地：OQ-A1=方案B、OQ-R3=2MB 写入 08_TASKS/03_ARCHITECTURE。
- 检查：`typecheck`✅ `lint`✅ `format:check`✅ `test`✅(68) `build`✅；`wxt build` 产出有效 `.output/chrome-mv3`（manifest_version=3，权限/commands 校验通过）。
- 限制说明：本环境无 GUI，无法手动在 Chrome 加载 dev 插件；验收以构建产物 + manifest 校验为准。

### TASK-028（本地服务连接与 token 握手 + CORS）— DONE
- 服务端鉴权（OQ-A1=方案B 配对码换取 token）：`infrastructure/security/auth.ts`（`loadOrCreateToken` 数据目录 `config/auth.json` 持久 token 文件 0600 + `AuthService` Bearer 常量时间校验 + 配对码 5 分钟/单次）、`routes/pair.ts`（`/api/pair/initiate`、`/api/pair/complete`，loopback-only，码只打印到服务终端不经响应回传）、`app.ts` `onRequest` 全局 Bearer 鉴权 + 公开白名单（health/pair）、`config.tokenPath`、`container.auth`、`testing.ts` 暴露 token/authHeaders。
- 扩展客户端：`lib/config.ts`、`lib/storage.ts`（chrome.storage.local token）、`lib/api.ts`（health/initiate/complete/getConnectionState，区分 NotConnectedError/NotPairedError/ApiError，401 清 token）、`lib/i18n.ts`（集中文案）、`components/{ConnectionStatus,PairingForm}.tsx`、`entrypoints/options/App.tsx`（配对/已连接/离线三态 UI，按设计系统）。
- CORS：沿用 app.ts 白名单（chrome-extension:// + localhost/127.0.0.1）。
- 测试：新增 `security/auth.test.ts`(4)、`routes/pair.integration.test.ts`(5)；更新 `server.integration.test.ts` 带鉴权。
- 检查：`typecheck`✅ `lint`✅ `format:check`✅ `test`✅(77) `build`✅。
- 实跑 HTTP（dist 启动，端口 8791）：health 公开 200；无 token /api/items=401；initiate 仅回 {expiresAt,codeLength}（码只在服务 stdout）；complete 换 43 字符 token；带 token /api/items=200；同码重放=401（单次）；绑定 127.0.0.1；token 文件 `-rw-------`(0600)。

### TASK-029（Popup 保存当前页）— DONE
- 纯逻辑 `lib/capture-payload.ts`：`buildCapturePayload`（OQ-R3 2MB 上限、`capToBytes` 不切断多字节、空 selectedText/favicon 省略、title 兜底 url、truncated 标记）。
- 浏览器侧 `lib/capture.ts`：`readActiveTab`（`tabs.query` + `scripting.executeScript` 取 outerHTML/title/url/选中文本/favicon）、`saveWebpage`（authedFetch POST /api/captures/webpage，truncated 仅 UI 不上送）。
- Popup `entrypoints/popup/App.tsx`：ready/saving/saved/error 状态机，挂载读 tab 信息 + 连接状态；NotPaired→开 Options，NotConnected→离线提示。`components/{SourceCard,PopupOutcome,icons}.tsx` 按设计 09/17。
- 范围：v0.1 popup 实现 Save Page + Save Selection + Save as 指示；PDF/Video/Add note/Quick tags 属 v0.2（capture API 无字段）不实现。
- 测试：`lib/capture-payload.test.ts`(6)；`vitest.config.ts` include 扩展到扩展的 lib/components/entrypoints（之前 `**/src/**` 漏掉扩展测试）。
- 检查：`typecheck`✅(8) `lint`✅ `format:check`✅ `test`✅(83) `build`✅(5)。
- 实跑 E2E（dist 启动，端口 8792）：配对取 token → POST /api/captures/webpage=201 saved → GET /api/items?status=inbox 命中（title=Popup Save Test、domain=example.com、status=inbox）。

### TASK-030（右键菜单保存选中文本 + 快捷键）— DONE
- `entrypoints/background.ts`：onInstalled 建 contextMenus（contexts:["selection"]，"Save selection to Sourdex"）；onClicked 用 `info.selectionText` + `readTab(tab.id)` 保存；commands.onCommand 处理 save-page 快捷键（⌘⇧S）保存活动标签；角标 ✓/! 反馈（无需 notifications 权限）；非 http(s) 标签跳过；NotPaired→开 Options。
- `lib/capture.ts`：抽出 `readTab(tabId)`，`readActiveTab` 复用之。
- 选中可搜回：`extract-content-job.ts` 提取后重建 FTS 时把选中文本并入 plainText（即便不在正文也保留），`server.integration.test.ts` 加用例验证 `searchRepo.search` 命中。
- 检查：`typecheck`✅(8) `lint`✅ `format:check`✅ `test`✅(84) `build`✅(5)。
- 说明：全文搜索端点属 STAGE-08；本阶段保证已索引可搜回。`/api/items?q` 当前仅 title LIKE。无 GUI 无法手动触发右键/快捷键，验收以构建产物 + FTS 索引测试为准。

### TASK-031（连接失败与状态提示）— DONE
- `components/ConnectionNotice.tsx` + `entrypoints/popup/App.tsx`：popup 打开即 `getConnectionState()`，按连接态 gate 正文——disconnected→"Service offline"+Retry（重检）、unpaired→"Not paired"+Open settings、保存中失败→error 态+Retry；header 状态点 olive/copper/clay/checking 实时反映。`lib/i18n.ts` 加 openSettings/pairPrompt。
- 不静默失败：所有失败路径均有可读提示 + 重试/设置入口。
- 检查：`typecheck`✅(8) `lint`✅ `format:check`✅ `test`✅(84) `build`✅(5)。
- 说明：连接态分支在 `lib/api.ts getConnectionState`（NotConnected→disconnected、401→unpaired）；UI 行为需 GUI 不可 headless 自动化，验收以构建产物 + 服务端 health/401 集成测试为准。

**STAGE-06 收尾**：插件最小权限 MV3、配对码 token 握手（127.0.0.1、token 0600、单次码、CORS 白名单）、Popup 保存当前页/选中文本（2MB 上限）、右键菜单 + ⌘⇧S、连接/未配对/离线清晰提示。typecheck/lint/format/test(84)/build 全绿；服务端实跑 HTTP 验证握手 + 保存 + Inbox + 选中可索引。

## STAGE-07 进度记录（2026-06-20）

### TASK-032（App Layout + 路由 + 主题 + i18n）— DONE
- 新建 `apps/web`（Vite + React + Tailwind v4）：package.json、vite.config.ts（@vitejs/plugin-react + @tailwindcss/vite + `@`→src）、tsconfig.json、index.html、main.tsx、App.tsx。
- 主题：`styles/theme.css`（@theme 全色板 + `.dark` 覆盖 + `@custom-variant dark`）、`lib/theme.ts`（Zustand pref light/dark/system + localStorage + matchMedia 同步）。
- i18n：`lib/i18n.ts`（i18next + react-i18next，EN/简中，localStorage/navigator 检测）、`locales/{en,zh}.ts`、`i18next.d.ts` 键类型安全；文案不硬编码。
- 布局（按设计 01/12）：`components/layout/{AppLayout,TopBar,Rail}.tsx` —— 顶栏（logo+搜索 pill+服务状态+语言/主题切换）、60px rail（Inbox/Library/Search/Settings 活动 + Ask/Export/Tags 禁用占位）。
- 路由：react-router（/、/library、/reader/:id、/search、/settings + fallback）；TanStack Query Provider 就位。
- 服务状态：`features/service-status/ServiceStatus.tsx` 探活公开 `/api/health`（connected/offline/checking）。
- 决策：OQ-T3=i18next、OQ-01=Zustand、OQ-02=Tailwind 自建、OQ-D1 映射、OQ-D2 占位、OQ-W1 Web 复用 Bearer（已写 08_TASKS）。
- 检查：`typecheck`✅(9) `lint`✅ `format:check`✅ `test`✅(84) `build`✅(6)。
- 限制：无 GUI 无法目视核对像素，验收以 build + 对照设计实现为准；页面体（Inbox/Library/Reader/Settings）当前为占位，分别在 TASK-035~038 落地。

### TASK-033（API client + TanStack Query hooks）— DONE
- `lib/api/client.ts`：`apiFetch`（Bearer token=OQ-W1 dev env / prod 注入；ApiError + NotConnectedError；不泄底层错误）。
- `lib/api/items.ts`：listItems/getItem/getItemContent/updateItem/deleteItem/getStatus + ItemDetail/ItemContent/StatusResponse 类型（DTO 复用 @sourdex/core）。
- `lib/api/query-keys.ts` + `hooks/useItems.ts`：useItems/useItem/useItemContent/useStatus/useUpdateItem/useDeleteItem（TanStack Query；mutation onSuccess 失效列表/详情）。
- 检查：`typecheck`✅ `lint`✅ `format:check`✅ `test`✅(84) `build`✅(6)。
- 说明：web 经 server API 不直连 SQLite；hooks 薄封装，契约由服务端集成测试覆盖。`/api/items/:id/content` 端点在 TASK-037 加。

### TASK-034（共享 UI 组件）— DONE
- `components/ui/`：Button（primary/secondary/ghost）、TypeBadge（类型色点 pill）、TagDisplay、EmptyState、Loading、ErrorState（NotConnected 友好提示+重试）、ConfirmDialog（删除二次确认，Esc/背景关闭）。
- `features/item-list/`：ItemCard（类型/域名/相对时间/未读点/标题/摘要/阅读时长 + hover 归档/删除）、ItemList。
- `lib/format.ts`：relative time / number 本地化（Intl，跟随语言）。
- 测试栈：引入 jsdom + @testing-library/react；`vitest.config.ts` 改 node/web 双 project（web=jsdom + `@`→src + esbuild automatic jsx）。render 测试：ItemCard（渲染/点击 onOpen/删除 stopPropagation）+ format 工具。
- 检查：`typecheck`✅(9) `lint`✅ `format:check`✅ `test`✅(90，含 web jsdom) `build`✅(6)。
- 说明：list API 不返回 tags，卡片不显标签（Reader 详情显示）。

### TASK-035（Inbox 页面）— DONE
- `pages/inbox/InboxPage.tsx`（设计 01/12）：eyebrow+标题+标语、搜索入口（→/search）、“数据在本地”横幅、inbox 列表（useItems status=inbox/newest）、归档/删除（ConfirmDialog 二次确认）、loading/error/empty。
- `features/item-list/useItemActions.ts`：open(→reader)/archive(切换 archived)/delete(确认) 复用 hook（Inbox+Library）。
- 测试 `InboxPage.test.tsx`（mock fetch）：加载列表渲染 + 空态。
- 检查：`typecheck`✅ `lint`✅ `format:check`✅ `test`✅(92) `build`✅(6)。

### TASK-036（Library 页面）— DONE
- `pages/library/LibraryPage.tsx`（设计 02/13）：状态 tab（All/Unread/Archived + 计数查询）、类型/排序 Select、虚拟滚动列表（`@tanstack/react-virtual` 动态高度，新增依赖）、归档/删除（确认）、三态。
- `components/ui/Select.tsx`、`features/item-list/VirtualItemList.tsx`。
- 测试 `LibraryPage.test.tsx`：标题 + tab 渲染（虚拟列表在 jsdom 无布局，不断言行）。
- v0.1 简化：选中即整页 Reader（设计右侧预览分栏未做）；标签筛选待 list API 返回 tags。
- 检查：`typecheck`✅ `lint`✅ `format:check`✅ `test`✅(93) `build`✅(6)。

### TASK-037（Reader 页面）— DONE
- 服务端新增 `GET /api/items/:id/content`：`ItemService.getContent` 经 Storage 读 markdown/readableHtml/plainText（container 注入 storage）；集成测试覆盖；实跑 HTTP：worker 提取后返回 markdown（含标题）+ plainText。
- `pages/reader/ReaderPage.tsx`（设计 03/14）：← Library/READING、复制 Markdown/打开原网页/归档/删除（确认）、类型/域名/标题/作者·字数·时长、标签；正文渲染服务端 sanitize 的 readableHtml（`.reader-content` prose 样式）→ 退回 plainText → noContent；打开自动标记已读。
- 测试 `ReaderPage.test.tsx`（mock 详情+内容）：标题 + 正文渲染。
- 检查：`typecheck`✅(9) `lint`✅ `format:check`✅ `test`✅(95) `build`✅(6)。

### TASK-038（Settings 页面）— DONE
- `pages/settings/SettingsPage.tsx`（设计 08）：左 sub-nav（Appearance/Language/Data location/AI providers/Privacy/About）+ 右内容；Appearance 三态卡（写 useTheme）、Language EN/中、Data location 显示 `/api/status` dataDir、AI providers 占位（默认关闭 v0.2）、About 版本 + 本地服务 host:port。
- 测试 `SettingsPage.test.tsx`：默认外观三选、点 Dark 应用 `.dark`、切 Data location 显示目录。
- 检查：`typecheck`✅(9) `lint`✅ `format:check`✅ `test`✅(98) `build`✅(6)。

**STAGE-07 收尾**：apps/web 完成 App 壳（顶栏+rail+路由+主题 light/dark/system+i18n EN/中）、API client + TanStack Query hooks、共享组件（Button/TypeBadge/Tag/Empty/Loading/Error/ConfirmDialog/ItemCard/ItemList/VirtualItemList）、Inbox/Library/Reader/Settings 四页；服务端新增 `/api/items/:id/content`。引入 jsdom + @testing-library/react 双 project 测试（98 passed）。UI 按 design/ 还原（无 GUI 不能目视核对像素，以 build + render 测试 + 设计对照为准）。

## STAGE-01 完成记录（2026-06-20）

工程基线全部就位并本地验证全绿（非业务功能代码，仅 monorepo 脚手架 + 一个最小占位包）：

- monorepo：`package.json`(root, packageManager=pnpm@10.30.3, engines node>=22)、`pnpm-workspace.yaml`、`turbo.json`、`.npmrc`、`.nvmrc`。
- TS strict：`tsconfig.base.json`（strict + noUncheckedIndexedAccess 等）+ `packages/core/tsconfig.json`。
- Lint/Format：`eslint.config.mjs`（ESLint 9 flat + typescript-eslint + no-explicit-any:error）、`.prettierrc.json`、`.prettierignore`（排除 Markdown）、`.editorconfig`。
- 测试基线：`vitest.config.ts`、`playwright.config.ts`、`tests/e2e/.gitkeep`、`packages/core/src/index.test.ts`（冒烟）。
- CI：`.github/workflows/ci.yml`（install/typecheck/lint/format/test/build）。
- README 初版：`README.md`。
- 目录骨架：`apps/{extension,web,server,desktop}`、`packages/{core,db,extractor,ai,search,exporter,config,shared-ui,logger}`、`scripts/`、`tests/e2e/`（除 core 外均 .gitkeep 占位）。
- git：已 `git init` 到 `main`（未提交，等待用户决定首次提交）。
- 已确认 Open Questions：OQ-T5（Node 22 / pnpm 10.30.3 / turbo ^2）、OQ-T4（Vitest + Playwright）。

**已运行检查与结果（本地）**：
- `pnpm install` ✅（生成 pnpm-lock.yaml）
- `pnpm typecheck` ✅（turbo，@sourdex/core）
- `pnpm build` ✅（turbo，emit `packages/core/dist`）
- `pnpm lint` ✅（eslint .）
- `pnpm format:check` ✅（prettier，Markdown 已排除）
- `pnpm test` ✅（vitest run，1 passed）
- CI：工作流六步与本地一致，本地全绿；GitHub 实跑待首次 push（本环境无远程仓库）。

## STAGE-05 完成记录（2026-06-20）

`packages/extractor`（纯提取，依赖 core，不依赖 db）+ 接入 server 的提取 job：

- 提取器（TASK-021/022/023）：`createExtractor()` 工厂 + Strategy（webpage/selection）；jsdom+@mozilla/readability 提取，sanitizeHtml 清洗，turndown→Markdown，normalizeWhitespace 纯文本，countWords/readingTime（CJK+Latin，OQ-R4）；webpage 正文最小长度阈值过滤 boilerplate。
- fallback（TASK-024）：提取失败→选中文本兜底；无兜底→标 failed 保留 raw HTML；非提取错误才抛出重试。
- fixtures/测试（TASK-025）：英文博客/含代码技术文档/中文文章/失败页/sanitize/metrics。
- 接线（TASK-026）：`createExtractContentJob` 接入 worker，落 readable/markdown/text + applyExtraction(author/wordCount/readingTime) + 重建 FTS；container 注册真实 handler 替换占位。为此在 packages/db 新增 `ItemRepository.applyExtraction`。
- 依赖：新增 @mozilla/readability/jsdom/turndown（记入 04_TECH_STACK §12.5）。

**已运行检查与结果（本地）**：typecheck ✅ / lint ✅ / format:check ✅ / test ✅（**68 passed，16 files**）/ build ✅。
额外验证：构建产物 live boot（端口 8803）——POST 保存真实文章 → 后台 worker 自动提取 → 详情 `extractionStatus=success`、markdown 落盘（`files/markdown/<id>.md`）、wordCount=104/readingTime=1。
决策落地：OQ-R4（阅读量度口径）；提取栈选型；正文最小长度阈值 25。

## STAGE-04 完成记录（2026-06-20）

`apps/server`：本地 Fastify API + 任务 worker + 本地存储（依赖 core + db）：

- 骨架/配置（TASK-015）：`config.ts`（默认 127.0.0.1:8787，env 覆盖，per-OS 数据目录 PRD §16.1）、`paths.ts`（数据目录结构）、`app.ts`（CORS 仅扩展+本地 UI、错误处理映射 Zod/Validation/NotFound/Sourdex→400/404/500 不泄漏）、`container.ts`（组合根：开库+迁移+repo+storage+services+worker）、`server.ts`（入口+优雅关闭）、`routes/health.ts`。
- 存储（TASK-016，OQ-A6）：`LocalStorage implements Storage`（相对路径 + 路径穿越防护）。
- 任务 worker（TASK-017，OQ-03）：`JobWorker`（claimNext 轮询、handler 注册、成功/失败/重试）。
- Capture API（TASK-018，OQ-A2/R1）：`CaptureService` save-first（写 item+raw html 落盘+capture pending+即时 FTS 标题索引+入队 extract_content），重复 status="exists"，forceNew 新建。
- Item API（TASK-019）：list/detail/patch/softDelete，Zod 校验。
- 集成测试（TASK-020）：`server.integration.test.ts`（inject）+ storage/worker 单测。

**已运行检查与结果（本地）**：typecheck ✅ / lint ✅ / format:check ✅ / test ✅（**49 passed，12 files**）/ build ✅。
额外验证：构建产物实跑 boot（temp 数据目录，端口 8799）——health/status/capture/list 全部正常，raw html 落盘，sqlite+WAL 建库；`lsof` 确认**仅绑定 127.0.0.1**（PRD §17.3）。
新增根 `pnpm.onlyBuiltDependencies` 无变化；新增依赖 fastify/@fastify/cors/zod（apps/server）。决策落地：OQ-A2/A6/R1。

## STAGE-03 完成记录（2026-06-20）

`packages/db`：SQLite + Drizzle + better-sqlite3 持久层（服务端，依赖 core）：

- schema（TASK-010）：`schema.ts` 9 张表（PRD §12，枚举列 `$type` 绑定 core；v0.2 表一次建好 OQ-A5）；`client.ts`（WAL + foreign_keys ON）；`mappers.ts`（行→core DTO）。
- 迁移（TASK-011）：`migrate.ts` 幂等 runner（`_sourdex_migrations` 跟踪，逐条事务）+ `migrations/0000_init.ts`（PRD §12 逐字 DDL + FTS5 虚拟表）。决策：v0.1 手写 SQL 迁移（FTS5 需 raw SQL）。
- FTS（TASK-012，OQ-A3）：`items_fts`(title/plain_text/summary/tags, unicode61)；`SearchRepository` index/remove/search（snippet+rank）。
- repositories（TASK-013）：Item/Capture/Tag/Job + `tx.ts` 事务 helper + `source-hash.ts`（OQ-A4：canonical_url 优先 + 内容兜底 sha256）。
- seed（TASK-014）：`seedDevData(db)` dev 示例数据。

**已运行检查与结果（本地）**：typecheck ✅ / lint ✅ / format:check ✅ / test ✅（**37 passed，9 files**）/ build ✅。
额外验证：better-sqlite3 原生构建（pnpm onlyBuiltDependencies）✅；FTS5 + snippet() ✅；**on-disk** 迁移+持久化+dedup+FTS+重开幂等冒烟 ✅。
新增 Open Question：OQ-A7（FTS CJK 分词，留 STAGE-08）。新增根 `package.json` 的 `pnpm.onlyBuiltDependencies`。

## STAGE-02 完成记录（2026-06-20）

`packages/core` 用真实领域模型替换占位内容（最内层，零上层依赖）：

- 类型（TASK-007）：`types/{item,capture,tag,job,search,chunk,annotation,ai}.ts` + barrel。覆盖 v0.1 实体（Item/Capture/Tag/ItemTag/Job/Search）与枚举（SourceType/ItemStatus/AiStatus/ExtractionStatus/TagType/JobStatus/JobType/SearchMode…），并预留 v0.2 实体（Chunk/Annotation/AiOutput/ProviderConfig/SummaryOutput）。
- 错误与工具（TASK-008）：`errors/errors.ts`（SourdexError 基类 + 6 个子类，带 code/cause）；`utils/{url,id,time}.ts`（normalizeUrl/extractDomain、createId[Web Crypto]、nowIso）；`utils/url.test.ts`（11 用例）。
- 契约（TASK-009）：`contracts/{extractor,job-queue,storage,exporter,search-engine,logger,ai}.ts`（接口隔离 PRD §9.3；预留 LLM/Embedding）。

**已运行检查与结果（本地）**：typecheck ✅ / lint ✅ / format:check ✅ / test ✅（12 passed，2 files）/ build ✅（emit dist 全量 .d.ts+.js）。dist `import` 冒烟 ✅（version/createId/normalizeUrl/CaptureError）。无上层依赖（grep 校验）✅。

## 已完成内容

文档/治理体系初始化 + STAGE-01 工程基线 + STAGE-02 核心包（**无 UI/API 业务功能代码**）：

- 文档体系：`docs/01_PROJECT_BRIEF.md`、`02_REQUIREMENTS.md`、`03_ARCHITECTURE.md`、`04_TECH_STACK.md`、`08_TASKS.md`、`09_TEST_PLAN.md`、`12_PROGRESS.md`、`14_STAGE_SUMMARY.md`。
- 执行体系：根目录 `CLAUDE.md`（含 Starting / Closing / Batch Planning Protocol）。
- 规则体系：`.claude/rules/{frontend,backend,database,testing,security}.md`。
- Skills：`.claude/skills/{prd-to-plan,architecture-review,implement-feature,test-and-fix,code-review,stage-planning,closing-protocol}/SKILL.md`。
- 任务体系：BATCH-01 规划完成，10 个阶段 / 50 个任务，含 Future Backlog 与 Open Questions。

## 未完成内容

- STAGE-06 ~ STAGE-10 全部任务（TASK-027 ~ TASK-050）。
- 其余 app/package 实现（apps/web、apps/extension 与 ai/search/exporter/config/shared-ui/logger 仍为 .gitkeep 占位）。
- 注：search 关键词检索逻辑已在 packages/db 的 SearchRepository 落地（FTS），独立的 packages/search 抽象与 Search API/UI 在 STAGE-08。

## 阻塞问题

⛔ **STAGE-06 被 OQ-A1 阻塞**：进入下一阶段（浏览器插件）前必须先确认插件↔本地服务的 token 握手与首次连接确认机制。这是需要用户决策的硬阻塞项。后续硬阻塞 Open Questions：

- ✅ **OQ-A1**：插件↔本地服务握手/鉴权机制 — 已解决（STAGE-06，方案B 配对码换 token）。
- ✅ **OQ-04**：开源 License — 已解决（STAGE-10，用户决定 = Apache-2.0）。
- 进入各阶段前需确认的非阻塞默认项见 [08_TASKS.md](./08_TASKS.md) Open Questions（如 OQ-T4/T5 影响 STAGE-01，OQ-A3/A4/A5 影响 STAGE-03 等）。

## 设计稿（UI source of truth）

- 位置：根目录 `design/`（`Sourdex.dc.html` + `support.js` + `screenshots/` 17 张浅/深色截图，含 `11-design-system` 规范页）。
- 约定：**所有 UI（Web/桌面 app/插件）必须严格按设计稿实现**，不得自由发挥。已写入 [CLAUDE.md](../CLAUDE.md) §5、[frontend 规则](../.claude/rules/frontend.md)、相关 Skills、STAGE-06/07 验收标准。
- 相关 Open Questions：OQ-D1（设计稿页面命名↔PRD/IA 映射）、OQ-D2（v0.2 页面在 v0.1 是否占位）。

## 最近一次更新记录

- 时间：2026-06-20
- 内容：完成项目文档/任务/规则/执行体系初始化；登记 `design/` 设计稿为 UI 视觉 source of truth 并写入治理体系（CLAUDE.md / frontend 规则 / Skills / 任务验收）。
- 修改过的文件：
  - `docs/01_PROJECT_BRIEF.md`（新建）
  - `docs/02_REQUIREMENTS.md`（新建）
  - `docs/03_ARCHITECTURE.md`（新建）
  - `docs/04_TECH_STACK.md`（新建）
  - `docs/08_TASKS.md`（新建）
  - `docs/09_TEST_PLAN.md`（新建）
  - `docs/12_PROGRESS.md`（新建）
  - `docs/14_STAGE_SUMMARY.md`（新建）
  - `CLAUDE.md`（新建）
  - `.claude/rules/frontend.md`（新建）
  - `.claude/rules/backend.md`（新建）
  - `.claude/rules/database.md`（新建）
  - `.claude/rules/testing.md`（新建）
  - `.claude/rules/security.md`（新建）
  - `.claude/skills/prd-to-plan/SKILL.md`（新建）
  - `.claude/skills/architecture-review/SKILL.md`（新建）
  - `.claude/skills/implement-feature/SKILL.md`（新建）
  - `.claude/skills/test-and-fix/SKILL.md`（新建）
  - `.claude/skills/code-review/SKILL.md`（新建）
  - `.claude/skills/stage-planning/SKILL.md`（新建）
  - `.claude/skills/closing-protocol/SKILL.md`（新建）
- 已运行检查：无（本次仅创建文档，未初始化工程，无可运行检查）。
- 检查结果：N/A。

## 下一步建议

STAGE-05 已完成并停止（遵守 /goal：不进入下一 Stage）。进入 STAGE-06 前：

1. ⛔ **必须先确认 OQ-A1**（插件↔本地服务握手/鉴权机制）。推荐默认方案：服务首次运行在数据目录 `config/` 生成本地随机 token；扩展通过 Options 页填入/或首次连接时在 Web UI 确认配对；之后扩展请求带 `Authorization: Bearer <token>`；服务校验 token + CORS 白名单（chrome-extension://<id> + 本地 UI）。若你认可此默认，我将据此实现 STAGE-06。
2. STAGE-06 为 UI 阶段：插件 Popup/Options 必须严格按 `design/` 设计稿（browser-extension 截图 09/17）实现。
3. 首任务 **TASK-027（WXT 插件初始化 MV3）**；TASK-028 实现 token 握手（依赖 OQ-A1 决策）。
4. （可选）由用户做首次 git 提交（含 `pnpm-lock.yaml`）并推送，触发 GitHub CI 实跑验证。

> 下次提示词建议：先回复 OQ-A1 决策（认可上述默认或给出方案），然后「开始 STAGE-06：执行 TASK-027（WXT 插件初始化），完成后执行 Closing Protocol」。注意：因 OQ-A1 是硬阻塞，若未确认，我会在 STAGE-06 开始时先输出 Decision Required 而非直接编码。
