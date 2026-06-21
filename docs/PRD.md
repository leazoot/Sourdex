# Sourdex PRD

版本：v0.1
产品名称：Sourdex
产品定位：本地优先的全网资料索引库
产品口号：Save once. Find forever.
目标平台：Chrome / Edge 插件、Web 本地端、后续桌面端
项目性质：开源项目，可长期商业化扩展
默认语言：英文优先，中文同步支持
文档状态：MVP 开发版

---

## 1. 产品概述

### 1.1 背景

用户每天会在网页、论坛、博客、视频平台、PDF、公众号、GitHub、技术文档、社交平台中看到大量有价值的信息，但这些信息通常被分散保存到浏览器收藏夹、Notion、Obsidian、微信收藏、稍后读、文件夹、截图、聊天记录中。

长期下来会出现几个问题：

1. 保存过的资料找不到。
2. 收藏后从不再读。
3. 原网页失效后资料丢失。
4. AI 总结没有来源，无法验证。
5. 写文章、做调研、写 PRD、学习复盘时无法快速复用资料。
6. 知识库越来越大，但信息质量越来越差。

Sourdex 解决的是“资料保存后变成可搜索、可引用、可复用资产”的问题。

### 1.2 产品定义

Sourdex 是一个本地优先的全网资料索引库。用户可以通过浏览器插件一键保存网页、选中文本、PDF、视频链接和截图，系统会自动提取正文、生成 Markdown、保存来源、建立全文索引，并可选调用大模型生成摘要、标签和可溯源问答。

Sourdex 不是普通收藏夹，也不是普通 AI 知识库。它的核心价值是：

1. 保存来源，而不是只保存链接。
2. 建立索引，而不是堆积资料。
3. 支持溯源，而不是只给 AI 总结。
4. 本地优先，而不是平台锁死。
5. 可导出，而不是封闭知识库。

### 1.3 一句话描述

Sourdex helps you save web sources, search them locally, and reuse them with verifiable citations.

中文描述：

Sourdex 帮你一键保存全网资料，并把它们变成可搜索、可引用、可复用的本地资料库。

---

## 2. 核心目标

### 2.1 MVP 目标

v0.1 版本必须完成一个最小闭环：

用户通过浏览器插件保存网页 → Sourdex 提取正文 → 本地 SQLite 入库 → 支持全文搜索 → 支持阅读和导出 Markdown。

### 2.2 产品目标

1. 让用户保存资料的动作足够轻。
2. 让资料保存后自动结构化。
3. 让用户可以快速找回曾经保存的内容。
4. 让每条 AI 回答都可以追溯到原始来源。
5. 让用户可以随时导出自己的资料。
6. 让开源社区可以容易理解、部署、贡献和二次开发。

### 2.3 非目标

v0.1 不做以下内容：

1. 不做团队协作。
2. 不做云同步。
3. 不做手机 App。
4. 不做复杂知识图谱。
5. 不做公开分享社区。
6. 不做付费墙绕过。
7. 不做视频下载器。
8. 不做通用 AI 聊天工具。
9. 不做复杂权限系统。
10. 不做多租户 SaaS。

---

## 3. 目标用户

### 3.1 核心用户

#### 3.1.1 程序员 / 开发者

场景：

1. 收藏技术文档、GitHub issue、博客、论坛帖子。
2. 保存解决方案和错误排查记录。
3. 后续通过搜索找回代码片段、命令、配置方案。

痛点：

1. 之前看过解决方案，但找不到。
2. 收藏夹太乱。
3. 技术文章失效。
4. AI 回答不可靠，需要原文证据。

#### 3.1.2 产品经理 / 创业者

场景：

1. 收藏竞品、需求洞察、用户反馈、调研文章。
2. 做 PRD、竞品分析、产品方案时复用资料。
3. 把不同来源的信息整理成结构化文档。

痛点：

1. 信息来源分散。
2. 做调研时需要反复找链接。
3. 很难把资料变成可引用证据。

#### 3.1.3 自媒体 / 内容创作者

场景：

1. 收藏选题、爆款文章、素材、观点、案例。
2. 写文章时从资料库中提取素材。
3. 保留来源，避免内容失真。

痛点：

1. 素材散落在多个平台。
2. 收藏后没有整理。
3. 写作时找不到曾经保存的内容。

#### 3.1.4 学生 / 研究者

场景：

1. 收藏论文、网页、PDF、教程。
2. 做笔记、写报告、写论文时引用资料。
3. 查询某个概念在不同资料中的解释。

痛点：

1. PDF、网页和笔记分散。
2. 需要来源和页码。
3. 资料管理工具太重。

### 3.2 次级用户

1. 投资者：收藏公告、研报、新闻、观点。
2. 跨境卖家：收藏平台规则、竞品、法规资料。
3. 设计师：收藏设计灵感、组件、案例。
4. 家庭用户：收藏育儿、装修、租房、医疗科普、合同注意事项。

---

## 4. 核心使用场景

### 4.1 保存网页

用户在浏览器中看到一篇有价值的网页，点击 Sourdex 插件按钮。系统立即保存当前网页，并在后台完成正文提取、Markdown 转换、索引建立和可选 AI 摘要。

用户感知：

1. 点击保存。
2. 插件提示“Saved to Sourdex”。
3. 打开 Sourdex 后可以看到这条资料。

### 4.2 保存选中文本

用户在网页中选中一段关键内容，右键选择“Save selection to Sourdex”。系统保存选中文本、来源 URL、页面标题、上下文和保存时间。

用户感知：

1. 保存的是关键片段，不是整篇文章。
2. 后续搜索时能找到这段话。
3. 可以跳回原网页。

### 4.3 搜索资料

用户打开 Sourdex，输入关键词，比如“SQLite 向量检索”。系统返回相关资料、原文片段、标签、来源和保存时间。

搜索必须支持：

1. 标题搜索。
2. 正文搜索。
3. 标签搜索。
4. 域名过滤。
5. 类型过滤。
6. 时间过滤。

### 4.4 阅读资料

用户点击某条资料，进入阅读页面。页面展示清洗后的正文、来源链接、摘要、标签、保存时间、原网页快照和导出按钮。

### 4.5 导出资料

用户可以把单条资料或多条资料导出为 Markdown。导出的 Markdown 需要包含：

1. 标题。
2. 原始 URL。
3. 保存时间。
4. 摘要。
5. 标签。
6. 正文。
7. 用户备注。

### 4.6 基于资料问答

v0.2 开始支持。用户询问自己的资料库，系统只能基于已保存资料回答，并且必须附带来源。

示例：

用户问：

“我之前保存过哪些关于浏览器插件 Manifest V3 的资料？”

系统回答：

1. 相关资料列表。
2. 每条资料的摘要。
3. 来源链接。
4. 引用片段。
5. 不足证据说明。

---

## 5. 功能范围

### 5.1 P0 功能

P0 是 v0.1 必须完成的功能。

#### 5.1.1 浏览器插件保存当前网页

功能描述：

用户点击插件按钮保存当前页面。

要求：

1. 支持 Chrome。
2. 支持 Edge。
3. 获取当前页面 URL。
4. 获取页面标题。
5. 获取页面 DOM。
6. 获取 favicon。
7. 获取选中的文本。
8. 发送到本地 Sourdex 服务。
9. 保存动作必须在 1 秒内给出反馈。
10. 后台处理失败时允许重试。

验收标准：

1. 用户点击插件后，资料能出现在 Sourdex Inbox 中。
2. 即使 AI 摘要失败，原始资料仍然保存成功。
3. 页面保存重复时提示已存在或创建新版本。

#### 5.1.2 正文提取

功能描述：

系统从网页 DOM 中提取可读正文。

要求：

1. 默认使用 Readability 类正文提取算法。
2. 提取标题、作者、正文、摘要、站点信息。
3. 将正文转换为 Markdown。
4. 保存原始 HTML 快照。
5. 保存清洗后的 HTML。
6. 保存纯文本。
7. 支持手动保存选中文本作为备用方案。

验收标准：

1. 主流博客、文档站、论坛文章可以正确提取正文。
2. 提取失败时保留原始 HTML 和用户选中文本。
3. 数据库中必须能看到可搜索的纯文本内容。

#### 5.1.3 本地资料库

功能描述：

所有资料默认保存到本地 SQLite 数据库和本地文件目录。

要求：

1. 元数据保存到 SQLite。
2. 大文本内容可以保存到 SQLite 或本地文件。
3. 原始快照、Markdown、截图等二进制或长文本文件保存到本地 workspace。
4. 所有路径必须可迁移。
5. 用户可以配置数据目录。

验收标准：

1. 关闭网络后仍可查看已保存资料。
2. 用户能找到本地数据目录。
3. 删除应用不应静默删除用户资料。

#### 5.1.4 Inbox

功能描述：

新保存的资料默认进入 Inbox。

要求：

1. 展示标题。
2. 展示来源域名。
3. 展示保存时间。
4. 展示内容类型。
5. 展示自动摘要，没有摘要时展示正文前 200 字。
6. 支持标记已读。
7. 支持归档。
8. 支持删除。

验收标准：

1. 用户保存网页后能在 Inbox 看到。
2. 用户可以将资料从 Inbox 移到 Archive。
3. 删除前需要二次确认。

#### 5.1.5 全文搜索

功能描述：

用户可以搜索标题、正文、标签、来源。

要求：

1. 使用 SQLite FTS5 或等价全文检索能力。
2. 支持关键词高亮。
3. 支持按保存时间排序。
4. 支持按相关性排序。
5. 支持类型筛选。
6. 支持域名筛选。
7. 支持标签筛选。

验收标准：

1. 搜索正文中的关键词能返回相关资料。
2. 搜索结果显示命中的片段。
3. 搜索响应在 1 万条资料以内应保持流畅。

#### 5.1.6 阅读器

功能描述：

用户可以打开一条资料进行阅读。

要求：

1. 显示清洗后的正文。
2. 显示原始链接。
3. 显示保存时间。
4. 显示标签。
5. 显示摘要。
6. 支持复制 Markdown。
7. 支持打开原网页。
8. 支持删除资料。
9. 支持归档资料。

验收标准：

1. 阅读体验干净。
2. 正文不应包含明显广告、导航、推荐列表。
3. 打开原网页按钮可用。

#### 5.1.7 Markdown 导出

功能描述：

用户可以将资料导出为 Markdown。

要求：

1. 支持单条导出。
2. 支持批量导出。
3. 支持导出到 Obsidian 风格目录。
4. 文件名需要安全处理。
5. Markdown frontmatter 需要包含元数据。

导出格式示例：

```md
---
title: "Example"
url: "https://example.com"
domain: "example.com"
saved_at: "2026-06-20T10:00:00Z"
type: "webpage"
tags: ["ai", "research"]
---

# Example

Source: https://example.com

## Summary

...

## Content

...
```

验收标准：

1. 导出的 Markdown 可被 Obsidian 正常打开。
2. 中文标题、特殊字符不会导致导出失败。
3. 批量导出时目录结构清晰。

#### 5.1.8 设置页

功能描述：

提供基础设置能力。

要求：

1. 数据目录设置。
2. 主题设置：浅色 / 深色 / 跟随系统。
3. 语言设置：英文 / 中文。
4. AI Provider 设置入口。
5. 导出设置。
6. 隐私设置。
7. 本地服务状态。

验收标准：

1. 用户能看到数据保存位置。
2. 用户能关闭 AI 功能。
3. 用户能切换深色模式。

---

### 5.2 P1 功能

P1 是 v0.2 应完成的功能。

#### 5.2.1 AI 摘要

功能描述：

系统调用大模型为保存的资料生成摘要。

要求：

1. AI 摘要必须可关闭。
2. 支持 OpenAI-compatible API。
3. 支持 Ollama 本地模型。
4. 摘要任务后台执行。
5. 摘要失败不影响资料保存。
6. 摘要结果必须标记模型名称和生成时间。

输出结构：

```json
{
  "one_sentence": "一句话总结",
  "summary": "150 字以内摘要",
  "key_points": ["要点 1", "要点 2", "要点 3"],
  "useful_for": ["调研", "写作"],
  "risk_notes": ["资料可能过时，需要验证"],
  "suggested_tags": ["AI", "工具", "教程"]
}
```

验收标准：

1. 配置 API 后能生成摘要。
2. 不配置 API 时功能隐藏或提示配置。
3. 摘要不得覆盖原文。
4. 用户可重新生成摘要。

#### 5.2.2 AI 自动标签

功能描述：

AI 根据资料内容生成标签。

要求：

1. 每条资料默认生成 3 到 7 个标签。
2. 优先复用已有标签。
3. 新标签需要规范化。
4. 支持用户手动修改。
5. 支持用户禁用自动标签。

验收标准：

1. 标签数量不过度膨胀。
2. 同义标签需要尽量合并。
3. 用户手动标签优先级高于 AI 标签。

#### 5.2.3 语义检索

功能描述：

通过 embedding 支持语义搜索。

要求：

1. 支持 OpenAI-compatible embedding。
2. 支持本地 embedding 模型扩展。
3. 长文需要分块。
4. 每个 chunk 保存来源 item_id。
5. 向量检索结果必须能追溯到原文片段。
6. v0.2 可使用 sqlite-vec。
7. 向量索引失败不影响全文搜索。

验收标准：

1. 用户用相近表达能搜到相关资料。
2. 搜索结果展示原文片段。
3. 关闭 AI 后全文搜索仍然可用。

#### 5.2.4 Ask 页面

功能描述：

用户可以基于自己的资料库提问。

要求：

1. 只能基于已保存资料回答。
2. 回答必须附带来源。
3. 证据不足时必须说明。
4. 支持选择范围：全部资料、当前标签、当前文件夹、选中资料。
5. 支持复制回答。
6. 支持导出为 Markdown。

验收标准：

1. AI 回答中每个关键结论都有引用。
2. 没有资料支撑时不允许编造。
3. 用户可以点击引用跳转到原资料。

#### 5.2.5 高亮与备注

功能描述：

用户阅读资料时可以高亮文本并添加备注。

要求：

1. 支持选中文本高亮。
2. 支持备注。
3. 支持按颜色分类。
4. 支持在搜索中搜备注。
5. 支持导出高亮和备注。

验收标准：

1. 高亮不会破坏原文。
2. 备注能关联到对应资料。
3. 导出 Markdown 时包含高亮内容。

---

### 5.3 P2 功能

P2 是后续增强功能。

1. PDF 解析。
2. PDF 页码引用。
3. 视频字幕摘要。
4. 截图 OCR。
5. 重复资料检测。
6. 死链检测。
7. WebDAV 同步。
8. S3 同步。
9. 桌面端 Tauri 封装。
10. 移动端伴侣应用。
11. 团队资料库。
12. 资料周报。
13. 导入浏览器收藏夹。
14. 导入 Pocket / Raindrop / Omnivore 导出数据。
15. API 和插件系统。

---

## 6. 用户体验设计

### 6.1 设计原则

1. 轻：保存动作必须非常快。
2. 静：不打扰用户，不频繁弹窗。
3. 清：界面要像资料库，不像复杂后台。
4. 稳：保存成功比 AI 处理成功更重要。
5. 可控：用户知道数据在哪里、哪些内容会发送给 AI。
6. 可导出：用户永远可以带走自己的资料。

### 6.2 信息架构

主导航：

1. Inbox
2. Library
3. Search
4. Ask
5. Tags
6. Export
7. Settings

v0.1 可先实现：

1. Inbox
2. Library
3. Search
4. Settings

Ask、Tags、Export 可以在 v0.2 完善。

### 6.3 页面说明

#### 6.3.1 Inbox 页面

用途：

处理新保存的资料。

内容：

1. 新保存资料列表。
2. 快速搜索。
3. 类型筛选。
4. 批量归档。
5. 批量删除。
6. 阅读状态。

空状态文案：

“Save your first source from the browser extension.”

#### 6.3.2 Library 页面

用途：

查看所有资料。

内容：

1. 资料列表。
2. 标签筛选。
3. 域名筛选。
4. 类型筛选。
5. 时间筛选。
6. 排序：最新、最旧、相关性、标题。

#### 6.3.3 Reader 页面

用途：

阅读单条资料。

布局：

1. 顶部：标题、来源、保存时间、操作按钮。
2. 左侧或正文区域：清洗后的正文。
3. 右侧：摘要、标签、相关资料、备注。
4. 底部：导出、删除、打开原网页。

#### 6.3.4 Search 页面

用途：

集中搜索资料。

要求：

1. 搜索框居中突出。
2. 支持高级筛选。
3. 搜索结果展示片段。
4. 命中词高亮。
5. 支持保存搜索条件。

#### 6.3.5 Ask 页面

用途：

基于资料库问答。

要求：

1. 输入框提示“Ask your saved sources”。
2. 明确提示“Answers are based only on your saved sources”。
3. 每条回答必须展示引用。
4. 支持重新生成。
5. 支持复制回答。

#### 6.3.6 Settings 页面

用途：

管理数据、AI、导出和隐私。

分区：

1. General
2. Data
3. AI Providers
4. Search
5. Export
6. Privacy
7. About

---

## 7. 技术架构

### 7.1 总体架构

Sourdex 采用本地优先架构。

```text
Browser Extension
        ↓
Local API Service
        ↓
Extractor / Parser / AI Jobs / Search Index
        ↓
SQLite + Local File Storage
        ↓
Web UI / Desktop UI
```

### 7.2 推荐技术栈

#### 7.2.1 语言

TypeScript 为主。

原因：

1. 插件、Web UI、本地服务可共享类型。
2. 前后端统一开发体验。
3. 开源贡献门槛较低。
4. 生态完整。

#### 7.2.2 前端

1. React
2. Vite
3. Tailwind CSS
4. shadcn/ui 或自定义组件库
5. Zustand 或 Jotai 管理轻量状态
6. TanStack Query 管理服务端数据状态

#### 7.2.3 浏览器插件

1. WXT
2. React
3. TypeScript
4. Manifest V3
5. Chrome / Edge 首发

#### 7.2.4 本地服务

1. Node.js
2. Fastify
3. Zod
4. Drizzle ORM
5. SQLite

#### 7.2.5 数据库

1. SQLite
2. FTS5
3. sqlite-vec 作为 v0.2 向量检索方案
4. 本地文件系统保存快照和导出文件

#### 7.2.6 桌面端

v0.3 后使用 Tauri 2 封装。

前期不强制桌面化，先用本地服务 + Web UI 验证核心价值。

#### 7.2.7 AI 接入

1. OpenAI-compatible API
2. Ollama
3. 后续支持 Anthropic、Gemini、LM Studio
4. Provider 抽象层统一接入

---

## 8. 项目结构

推荐使用 monorepo。

```text
sourdex/
  apps/
    extension/
    web/
    server/
    desktop/
  packages/
    core/
    db/
    extractor/
    ai/
    search/
    exporter/
    config/
    shared-ui/
    logger/
  docs/
    PRD.md
    ARCHITECTURE.md
    CONTRIBUTING.md
    PRIVACY.md
    ROADMAP.md
  scripts/
  tests/
  package.json
  pnpm-workspace.yaml
  turbo.json
```

### 8.1 apps/extension

职责：

1. 浏览器插件入口。
2. 保存当前页面。
3. 保存选中文本。
4. 与本地服务通信。
5. 展示插件 Popup。
6. 管理插件权限。

不得包含：

1. 数据库逻辑。
2. AI 调用逻辑。
3. 复杂业务判断。

### 8.2 apps/server

职责：

1. 本地 API。
2. 任务队列。
3. 调用 extractor。
4. 调用 db。
5. 调用 ai。
6. 调用 search。
7. 调用 exporter。

### 8.3 apps/web

职责：

1. Inbox UI。
2. Library UI。
3. Search UI。
4. Reader UI。
5. Settings UI。

不得直接访问 SQLite，只通过 server API 获取数据。

### 8.4 packages/core

职责：

1. 公共类型。
2. 领域模型。
3. 业务枚举。
4. 通用工具。
5. 错误类型。

示例：

```ts
export type SourceType = "webpage" | "selection" | "pdf" | "video" | "screenshot"

export type ItemStatus = "inbox" | "read" | "archived" | "deleted"
```

### 8.5 packages/db

职责：

1. 数据库 schema。
2. migration。
3. repository。
4. transaction helper。
5. seed dev data。

不得包含 UI 逻辑和 AI 逻辑。

### 8.6 packages/extractor

职责：

1. 网页正文提取。
2. HTML 清洗。
3. HTML 转 Markdown。
4. 元数据提取。
5. PDF 解析扩展。
6. 视频元数据扩展。

输入和输出必须是明确 DTO，不依赖具体数据库。

### 8.7 packages/ai

职责：

1. LLM Provider 抽象。
2. Summary service。
3. Tag service。
4. Embedding service。
5. RAG answer service。
6. Prompt 模板管理。

不得直接操作 UI。

### 8.8 packages/search

职责：

1. FTS 搜索。
2. 向量搜索。
3. 混合检索。
4. 排序。
5. 高亮片段生成。

### 8.9 packages/exporter

职责：

1. Markdown 导出。
2. Obsidian 导出。
3. JSON 导出。
4. CSV 导出。

---

## 9. 架构原则

### 9.1 分层原则

项目必须保持清晰分层：

```text
UI Layer
  ↓
API Layer
  ↓
Application Service Layer
  ↓
Domain Layer
  ↓
Repository Layer
  ↓
Infrastructure Layer
```

说明：

1. UI 只负责展示和交互。
2. API 只负责请求校验和响应。
3. Service 负责编排业务流程。
4. Domain 保存核心规则。
5. Repository 负责数据读写。
6. Infrastructure 封装第三方能力。

### 9.2 依赖方向

依赖只能从外向内。

允许：

```text
web → server API
server → service
service → repository
service → extractor
service → ai provider interface
repository → db
```

禁止：

```text
db → service
extractor → web
ai → web
core → server
```

### 9.3 接口优先

对可能变化的外部能力必须使用接口隔离。

需要接口化的模块：

1. LLM Provider
2. Embedding Provider
3. Extractor
4. Storage
5. Exporter
6. Search Engine
7. Job Queue
8. Logger

示例：

```ts
export interface ContentExtractor {
  extract(input: ExtractInput): Promise<ExtractResult>
}
```

### 9.4 组合优于继承

代码中不应设计复杂继承树。优先使用：

1. 函数组合。
2. 策略模式。
3. 适配器模式。
4. 工厂函数。
5. 显式依赖注入。

### 9.5 可测试性

核心业务逻辑必须可以脱离 UI 和真实数据库测试。

要求：

1. extractor 可用 fixture 测试。
2. ai provider 可 mock。
3. repository 可用测试 SQLite。
4. service 可单元测试。
5. UI 组件可 storybook 或独立渲染测试。

---

## 10. 设计模式要求

### 10.1 Repository Pattern

所有数据库访问必须经过 repository。

示例：

```ts
interface ItemRepository {
  create(input: CreateItemInput): Promise<Item>
  findById(id: string): Promise<Item | null>
  search(input: SearchInput): Promise<SearchResult>
}
```

禁止在 service 中直接拼 SQL，除非是明确的复杂搜索模块。

### 10.2 Adapter Pattern

外部服务通过 adapter 接入。

示例：

```ts
class OpenAICompatibleProvider implements LLMProvider {}
class OllamaProvider implements LLMProvider {}
```

### 10.3 Strategy Pattern

不同内容类型使用不同提取策略。

示例：

```ts
class WebpageExtractStrategy {}
class SelectionExtractStrategy {}
class PdfExtractStrategy {}
class VideoExtractStrategy {}
```

### 10.4 Factory Pattern

Provider、Extractor、Exporter 等使用工厂创建。

示例：

```ts
createLLMProvider(config)
createExtractor(sourceType)
createExporter(format)
```

### 10.5 Command Pattern

后台任务建议建模为 command。

示例任务：

1. ExtractContentJob
2. GenerateSummaryJob
3. GenerateEmbeddingJob
4. ExportMarkdownJob
5. DetectDuplicateJob

### 10.6 Dependency Injection

Service 层依赖接口，不直接 new 具体实现。

示例：

```ts
class CaptureService {
  constructor(
    private readonly itemRepo: ItemRepository,
    private readonly extractor: ContentExtractor,
    private readonly jobQueue: JobQueue
  ) {}
}
```

---

## 11. 代码风格要求

### 11.1 基础规范

1. 使用 TypeScript strict mode。
2. 禁止使用 any，确实需要时必须说明原因。
3. 所有外部输入必须用 Zod 校验。
4. 函数命名必须表达意图。
5. 文件命名使用 kebab-case。
6. React 组件使用 PascalCase。
7. 类型使用 PascalCase。
8. 常量使用 UPPER_CASE 或清晰 camelCase。
9. 不写超过 150 行的 React 组件。
10. 单个函数尽量不超过 50 行。
11. 避免深层嵌套，优先 early return。
12. 避免神级工具函数。
13. 避免隐式副作用。
14. 避免全局可变状态。

### 11.2 组件抽取规范

组件分为：

1. page components
2. feature components
3. shared UI components
4. primitive components

目录示例：

```text
apps/web/src/
  pages/
    inbox/
    library/
    reader/
    settings/
  features/
    capture/
    item-list/
    search/
    tags/
    export/
  components/
    ui/
    layout/
  hooks/
  lib/
```

抽取原则：

1. 组件重复出现 2 次以上可以考虑抽取。
2. 组件承担多个职责时必须拆分。
3. UI 组件不得包含业务请求。
4. Feature 组件可以组合 hooks 和 API。
5. Page 组件只做页面编排。

### 11.3 Hooks 规范

Hook 用于复用状态和副作用。

示例：

1. useItems
2. useSearch
3. useCaptureStatus
4. useAISettings
5. useExport

要求：

1. hooks 不直接操作 DOM。
2. hooks 返回明确状态。
3. 异步状态包含 loading、error、data。
4. hooks 不混入 unrelated business logic。

### 11.4 注释规范

注释不允许遍地都是。代码应优先通过命名表达意图。

应该写注释的地方：

1. 复杂算法。
2. 检索排序公式。
3. 安全相关逻辑。
4. 数据迁移逻辑。
5. 浏览器兼容性 workaround。
6. AI Prompt 约束。
7. 隐私和脱敏逻辑。

不应该写注释的地方：

1. 简单赋值。
2. 明显的 if 判断。
3. 重复函数名含义。
4. 无意义的块注释。
5. 生成式废话注释。

好注释示例：

```ts
// Keep raw HTML for source verification even if readability extraction fails.
```

坏注释示例：

```ts
// Set title to item title
item.title = title
```

### 11.5 错误处理规范

必须使用明确错误类型。

示例：

```ts
class CaptureError extends Error {}
class ExtractionError extends Error {}
class AIProviderError extends Error {}
class DatabaseError extends Error {}
```

要求：

1. 不吞错误。
2. 不直接把底层错误暴露给 UI。
3. 用户错误要可读。
4. 开发错误要可追踪。
5. 后台任务失败必须记录原因。
6. 可重试任务必须记录重试次数。

### 11.6 日志规范

日志分级：

1. debug
2. info
3. warn
4. error

要求：

1. 默认不记录用户正文内容。
2. 不记录 API Key。
3. 不记录隐私字段。
4. 错误日志要包含 request_id 或 job_id。
5. 本地日志可由用户手动导出。

---

## 12. 数据模型

### 12.1 items

资料主表。

```sql
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inbox',
  title TEXT NOT NULL,
  url TEXT,
  canonical_url TEXT,
  domain TEXT,
  author TEXT,
  published_at TEXT,
  saved_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  summary TEXT,
  one_sentence TEXT,
  thumbnail_path TEXT,
  source_hash TEXT,
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0,
  ai_status TEXT DEFAULT 'none'
);
```

### 12.2 captures

原始捕获表。

```sql
CREATE TABLE captures (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  raw_html_path TEXT,
  readable_html_path TEXT,
  markdown_path TEXT,
  screenshot_path TEXT,
  original_text_path TEXT,
  extraction_status TEXT NOT NULL,
  extraction_error TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id)
);
```

### 12.3 chunks

分块表。

```sql
CREATE TABLE chunks (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  heading TEXT,
  start_offset INTEGER,
  end_offset INTEGER,
  token_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id)
);
```

### 12.4 tags

标签表。

```sql
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL
);
```

### 12.5 item_tags

资料标签关联表。

```sql
CREATE TABLE item_tags (
  item_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  confidence REAL,
  source TEXT NOT NULL DEFAULT 'manual',
  PRIMARY KEY (item_id, tag_id),
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

### 12.6 annotations

高亮和备注表。

```sql
CREATE TABLE annotations (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  chunk_id TEXT,
  selected_text TEXT NOT NULL,
  note TEXT,
  color TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (chunk_id) REFERENCES chunks(id)
);
```

### 12.7 jobs

后台任务表。

```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT
);
```

### 12.8 ai_outputs

AI 输出表。

```sql
CREATE TABLE ai_outputs (
  id TEXT PRIMARY KEY,
  item_id TEXT,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  output TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id)
);
```

### 12.9 provider_configs

AI Provider 配置表。

敏感字段不得明文保存到普通数据库，API Key 应使用系统 Keychain 或加密存储。

```sql
CREATE TABLE provider_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  base_url TEXT,
  chat_model TEXT,
  embedding_model TEXT,
  enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## 13. API 设计

### 13.1 Capture API

#### POST /api/captures/webpage

请求：

```json
{
  "url": "https://example.com",
  "title": "Example",
  "html": "<html>...</html>",
  "selectedText": "",
  "faviconUrl": "https://example.com/favicon.ico",
  "capturedAt": "2026-06-20T10:00:00Z"
}
```

响应：

```json
{
  "itemId": "item_xxx",
  "status": "saved",
  "jobIds": ["job_extract_xxx"]
}
```

### 13.2 Item API

#### GET /api/items

参数：

1. status
2. type
3. tag
4. domain
5. q
6. sort
7. page
8. pageSize

#### GET /api/items/:id

返回 item 详情、capture、tags、summary。

#### PATCH /api/items/:id

支持修改：

1. title
2. status
3. summary
4. tags

#### DELETE /api/items/:id

软删除，进入 deleted 状态。

### 13.3 Search API

#### GET /api/search

参数：

1. q
2. type
3. tag
4. domain
5. from
6. to
7. mode: keyword | semantic | hybrid

响应：

```json
{
  "results": [
    {
      "itemId": "item_xxx",
      "title": "Example",
      "url": "https://example.com",
      "snippet": "...matched text...",
      "score": 0.92,
      "matchedFields": ["title", "content"]
    }
  ]
}
```

### 13.4 AI API

#### POST /api/ai/summarize/:itemId

触发摘要任务。

#### POST /api/ai/embed/:itemId

触发 embedding 任务。

#### POST /api/ask

请求：

```json
{
  "question": "What did I save about SQLite vector search?",
  "scope": {
    "tagIds": [],
    "itemIds": [],
    "type": "all"
  }
}
```

响应：

```json
{
  "answer": "...",
  "citations": [
    {
      "itemId": "item_xxx",
      "chunkId": "chunk_xxx",
      "title": "Example",
      "url": "https://example.com",
      "quote": "original quote"
    }
  ],
  "confidence": "medium"
}
```

### 13.5 Export API

#### POST /api/export/markdown

请求：

```json
{
  "itemIds": ["item_xxx"],
  "format": "obsidian"
}
```

响应：

```json
{
  "exportId": "export_xxx",
  "path": "/exports/sourdex-export.zip"
}
```

---

## 14. AI 设计

### 14.1 AI 原则

1. AI 是增强能力，不是基础依赖。
2. 不配置 AI 时，保存、阅读、全文搜索、导出必须正常工作。
3. 所有 AI 功能必须可关闭。
4. 所有发送给 AI 的内容必须让用户知道。
5. AI 输出不得覆盖原文。
6. AI 回答必须基于来源。
7. 证据不足时必须说明。
8. 默认不上传用户隐私内容。

### 14.2 Provider 抽象

```ts
export interface LLMProvider {
  chat(input: ChatInput): Promise<ChatOutput>
}

export interface EmbeddingProvider {
  embed(input: EmbedInput): Promise<EmbedOutput>
}
```

Provider 类型：

1. openai-compatible
2. ollama
3. anthropic
4. gemini
5. lm-studio

v0.1 只预留配置结构。
v0.2 实现 openai-compatible 和 ollama。

### 14.3 摘要 Prompt 要求

摘要必须输出 JSON。

字段：

1. one_sentence
2. summary
3. key_points
4. useful_for
5. risk_notes
6. suggested_tags

约束：

1. 不允许编造。
2. 不允许超出原文。
3. 不允许输出 Markdown 包裹。
4. 内容不足时返回空字段和原因。

### 14.4 标签生成策略

标签生成规则：

1. 优先从已有标签中选择。
2. 最多新增 3 个新标签。
3. 单条资料最多 7 个标签。
4. 标签不得超过 20 个字符。
5. 标签需要统一大小写和空格。
6. 禁止生成过泛标签，如“文章”“资料”“内容”。

### 14.5 RAG 问答策略

流程：

```text
User Question
  ↓
Query Normalize
  ↓
Keyword Search
  ↓
Semantic Search
  ↓
Hybrid Rerank
  ↓
Context Packing
  ↓
LLM Answer
  ↓
Citation Validation
```

约束：

1. 没有引用不得回答。
2. 引用必须来自 chunks。
3. 每个结论至少关联一个 citation。
4. 答案中不能出现资料库外的事实。
5. 如果模型回答包含无引用结论，需要后处理删除或要求重新生成。

### 14.6 Embedding 策略

1. 长文按 chunk 分块。
2. 每个 chunk 建立 embedding。
3. chunk 大小建议 500 到 900 tokens。
4. chunk overlap 建议 80 到 120 tokens。
5. embedding 模型变化后需要支持重建索引。
6. embedding 任务后台低优先级执行。

---

## 15. 搜索设计

### 15.1 搜索模式

支持三种模式：

1. keyword：关键词搜索。
2. semantic：语义搜索。
3. hybrid：混合搜索。

v0.1 实现 keyword。
v0.2 实现 semantic 和 hybrid。

### 15.2 关键词搜索

使用 SQLite FTS5。

索引字段：

1. title
2. plain_text
3. summary
4. tags
5. annotations

### 15.3 混合搜索排序

建议排序因子：

```text
final_score =
  0.40 * keyword_score
+ 0.35 * semantic_score
+ 0.10 * tag_score
+ 0.10 * recency_score
+ 0.05 * user_signal_score
```

说明：

1. keyword_score 来自 FTS 排名。
2. semantic_score 来自向量相似度。
3. tag_score 来自标签匹配。
4. recency_score 来自保存时间。
5. user_signal_score 来自高亮、备注、收藏、阅读次数。

### 15.4 搜索体验

搜索结果必须展示：

1. 标题。
2. 来源域名。
3. 类型。
4. 命中片段。
5. 标签。
6. 保存时间。
7. 相关性分数可隐藏，但调试模式可显示。

---

## 16. 本地存储设计

### 16.1 数据目录

默认数据目录：

macOS：

```text
~/Library/Application Support/Sourdex
```

Windows：

```text
%APPDATA%/Sourdex
```

Linux：

```text
~/.local/share/sourdex
```

目录结构：

```text
Sourdex/
  sourdex.db
  files/
    raw-html/
    readable-html/
    markdown/
    screenshots/
    exports/
  logs/
  backups/
  config/
```

### 16.2 数据备份

v0.1 提供手动备份。

备份内容：

1. SQLite 数据库。
2. files 目录。
3. config 非敏感配置。

v0.2 支持自动备份。

### 16.3 数据导入

v0.1 不做复杂导入。
v0.2 支持浏览器书签导入。
v0.3 支持 Pocket / Raindrop / Omnivore / Markdown 文件夹导入。

---

## 17. 隐私与安全

### 17.1 隐私原则

1. 默认本地存储。
2. 默认不上传资料内容。
3. 用户主动配置 AI Provider 后，才允许发送资料片段给模型。
4. 发送前应在设置中明确说明。
5. API Key 必须加密保存。
6. 日志不得记录正文和 Key。
7. 导出的诊断日志必须脱敏。

### 17.2 API Key 存储

优先级：

1. 系统 Keychain。
2. 本地加密文件。
3. 环境变量。

禁止：

1. 明文写入普通配置文件。
2. 明文写入日志。
3. 明文发送到前端长期保存。

### 17.3 本地服务安全

本地服务要求：

1. 默认监听 127.0.0.1。
2. 不允许默认监听 0.0.0.0。
3. 插件访问本地服务需要 token。
4. 第一次连接需要用户确认。
5. CORS 只允许插件 ID 和本地 Web UI。
6. 所有 API 输入必须校验。

### 17.4 内容版权边界

Sourdex 只保存用户当前可访问内容。

要求：

1. 不做付费墙绕过。
2. 不提供公共资源分享库。
3. 不默认下载视频。
4. 不帮助用户批量抓取受限内容。
5. 导出内容保留来源 URL。
6. 文档中明确用户需要遵守原网站条款。

---

## 18. 性能要求

### 18.1 保存性能

1. 插件点击后 1 秒内反馈保存状态。
2. 正文提取可后台执行。
3. AI 摘要不得阻塞保存。
4. 大页面保存不得导致浏览器卡死。

### 18.2 搜索性能

目标数据量：

1. v0.1：1 万条资料内流畅。
2. v0.2：5 万条资料可用。
3. v0.3：10 万条资料可优化支持。

要求：

1. 普通关键词搜索响应小于 500ms。
2. 搜索结果分页。
3. 长列表虚拟滚动。
4. 大批量导入使用后台任务。

### 18.3 UI 性能

1. 首屏加载小于 2 秒。
2. 列表滚动不卡顿。
3. Reader 页面长文需要懒加载或虚拟化。
4. 避免一次性渲染大量 Markdown。

---

## 19. 可访问性与国际化

### 19.1 国际化

v0.1 支持：

1. English
2. 简体中文

要求：

1. 文案不得硬编码在组件中。
2. 使用统一 i18n 文件。
3. 默认语言跟随系统。
4. 用户可手动切换。

### 19.2 可访问性

要求：

1. 支持键盘导航。
2. 按钮必须有可读 label。
3. 搜索框自动聚焦但不打断用户。
4. 深色模式对比度合格。
5. 状态提示不只依赖颜色。
6. 支持 reduced motion。

---

## 20. 开源策略

### 20.1 License 建议

建议初期使用 AGPL-3.0 或 Apache-2.0 二选一。

如果核心目标是防止别人直接套壳商业化，建议 AGPL-3.0。
如果核心目标是最大化传播和贡献，建议 Apache-2.0。

推荐方案：

1. 主应用：AGPL-3.0。
2. 可复用 SDK 或小工具包：后续可单独 MIT / Apache-2.0。
3. 商业版本：后续可采用双许可证。

最终许可证在首次公开发布前必须明确，发布后不要频繁变更。

### 20.2 Repo 必备文件

1. README.md
2. LICENSE
3. CONTRIBUTING.md
4. CODE_OF_CONDUCT.md
5. SECURITY.md
6. PRIVACY.md
7. ROADMAP.md
8. docs/PRD.md
9. docs/ARCHITECTURE.md
10. docs/DEVELOPMENT.md

### 20.3 README 结构

README 必须包含：

1. 产品截图。
2. 一句话定位。
3. 核心功能。
4. 安装方式。
5. 本地运行。
6. 浏览器插件安装。
7. 隐私说明。
8. Roadmap。
9. Contributing。
10. License。

### 20.4 贡献规范

要求：

1. issue 模板。
2. feature request 模板。
3. bug report 模板。
4. PR 模板。
5. conventional commits。
6. changeset 或 release notes。
7. CI 检查通过后才能合并。

---

## 21. 测试策略

### 21.1 单元测试

必须覆盖：

1. URL 规范化。
2. 正文提取。
3. Markdown 转换。
4. 标签规范化。
5. 搜索 query 解析。
6. 导出文件名安全处理。
7. AI 输出 JSON 解析。
8. 数据库 repository。

### 21.2 集成测试

必须覆盖：

1. 保存网页完整流程。
2. 提取失败 fallback。
3. 搜索流程。
4. 导出流程。
5. AI 摘要任务。
6. 插件与本地服务连接。

### 21.3 E2E 测试

v0.1 至少覆盖：

1. 用户保存网页。
2. 用户打开 Inbox。
3. 用户搜索关键词。
4. 用户打开资料详情。
5. 用户导出 Markdown。

### 21.4 Fixture

需要维护网页 fixture：

1. 普通博客。
2. 技术文档。
3. GitHub issue。
4. 论坛帖子。
5. 中文文章。
6. 英文文章。
7. 提取失败页面。

---

## 22. CI/CD

### 22.1 CI 检查

每次 PR 必须执行：

1. install
2. typecheck
3. lint
4. format check
5. unit test
6. build

### 22.2 Release

版本号采用 SemVer。

发布产物：

1. server package
2. web build
3. extension zip
4. desktop installer，v0.3 后
5. changelog

### 22.3 自动化

建议使用：

1. GitHub Actions
2. pnpm
3. Turborepo
4. Changesets

---

## 23. 开发规范

### 23.1 分支规范

1. main：稳定分支。
2. develop：开发分支，可选。
3. feature/*：功能分支。
4. fix/*：修复分支。
5. chore/*：工程任务。

### 23.2 Commit 规范

采用 Conventional Commits。

示例：

```text
feat(extension): add save current page action
fix(extractor): fallback when readability returns empty content
refactor(db): extract item repository
docs: update privacy policy
```

### 23.3 PR 要求

PR 必须说明：

1. 改了什么。
2. 为什么改。
3. 如何测试。
4. 是否影响数据结构。
5. 是否影响隐私和安全。
6. 截图或录屏，涉及 UI 时必须提供。

---

## 24. MVP 开发计划

### 24.1 Milestone 1：项目初始化

目标：

搭好 monorepo 和基础工程。

任务：

1. 初始化 pnpm workspace。
2. 初始化 apps/web。
3. 初始化 apps/server。
4. 初始化 apps/extension。
5. 初始化 packages/core。
6. 配置 TypeScript strict。
7. 配置 ESLint。
8. 配置 Prettier。
9. 配置 CI。
10. 编写 README 初版。

验收：

1. pnpm install 成功。
2. pnpm build 成功。
3. pnpm typecheck 成功。
4. CI 正常运行。

### 24.2 Milestone 2：本地数据库和 API

目标：

完成 item/capture 基础数据模型。

任务：

1. 设计 SQLite schema。
2. 接入 Drizzle。
3. 实现 migration。
4. 实现 ItemRepository。
5. 实现 CaptureRepository。
6. 实现 POST /api/captures/webpage。
7. 实现 GET /api/items。
8. 实现 GET /api/items/:id。
9. 实现 PATCH /api/items/:id。
10. 实现 DELETE /api/items/:id。

验收：

1. API 可创建资料。
2. API 可查询资料。
3. API 可更新状态。
4. API 可软删除资料。

### 24.3 Milestone 3：浏览器插件保存

目标：

完成从浏览器保存当前页面到本地服务。

任务：

1. WXT 插件初始化。
2. Popup UI。
3. 获取当前 tab。
4. 获取页面 HTML。
5. 获取选中文本。
6. 发送到本地服务。
7. 显示保存成功。
8. 显示连接失败提示。
9. 添加右键菜单。
10. 添加快捷键。

验收：

1. Chrome 可加载插件。
2. 当前页面可保存。
3. 选中文本可保存。
4. 本地服务关闭时提示清晰。

### 24.4 Milestone 4：正文提取和 Markdown

目标：

保存的网页可以转成可读正文。

任务：

1. 实现 ContentExtractor 接口。
2. 集成 Readability。
3. 实现 HTML 清洗。
4. 实现 HTML 转 Markdown。
5. 保存 raw HTML。
6. 保存 readable HTML。
7. 保存 Markdown。
8. 保存 plain text。
9. 实现提取失败 fallback。
10. 添加 fixture 测试。

验收：

1. 普通网页能提取正文。
2. 技术文档能提取正文。
3. 中文网页能提取正文。
4. 提取失败时资料仍保存。

### 24.5 Milestone 5：Web UI

目标：

完成基础资料库 UI。

任务：

1. Layout。
2. Inbox 页面。
3. Library 页面。
4. Reader 页面。
5. Settings 页面。
6. Item list 组件。
7. Item card 组件。
8. Tag display 组件。
9. Empty state。
10. Loading 和 error state。

验收：

1. 用户能看到保存的资料。
2. 用户能打开资料详情。
3. 用户能归档资料。
4. 用户能删除资料。
5. 深色模式可用。

### 24.6 Milestone 6：全文搜索

目标：

完成本地全文搜索。

任务：

1. 创建 FTS 表。
2. 写入索引。
3. 更新索引。
4. 删除索引。
5. 实现搜索 API。
6. 实现搜索页面。
7. 实现结果高亮。
8. 实现筛选。
9. 实现排序。
10. 添加搜索测试。

验收：

1. 标题可搜。
2. 正文可搜。
3. 搜索结果有片段。
4. 搜索性能可接受。

### 24.7 Milestone 7：Markdown 导出

目标：

资料可导出。

任务：

1. 实现 Exporter 接口。
2. 实现单条 Markdown 导出。
3. 实现批量 Markdown 导出。
4. 实现 Obsidian frontmatter。
5. 实现文件名安全处理。
6. 实现导出 API。
7. 实现导出 UI。
8. 添加导出测试。

验收：

1. 单条资料可导出。
2. 多条资料可导出 zip。
3. Obsidian 可打开导出文件。
4. 特殊字符不导致失败。

### 24.8 Milestone 8：v0.1 发布

目标：

完成第一个可公开测试版本。

任务：

1. 完善 README。
2. 完善隐私文档。
3. 完善安装文档。
4. 添加截图和 GIF。
5. 打包插件 zip。
6. 发布 GitHub release。
7. 撰写开源推广文案。
8. 收集反馈。

验收：

1. 新用户可按文档跑起来。
2. 插件可手动安装。
3. Web UI 可使用。
4. 核心保存搜索导出链路稳定。

---

## 25. 成功指标

### 25.1 v0.1 指标

1. GitHub Stars：首月 300+
2. 有效 issue：20+
3. 外部贡献者：3+
4. 插件成功保存率：95%+
5. 正文提取成功率：80%+
6. 搜索响应：1 万条内小于 500ms
7. 用户首次保存成功时间：5 分钟内

### 25.2 v0.2 指标

1. AI 摘要成功率：90%+
2. 语义搜索满意度：主观反馈 70%+
3. 导出使用率：20%+
4. 周活留存：30%+
5. 社区 PR：10+

---

## 26. 风险与应对

### 26.1 网页提取失败

风险：

不同网站 DOM 差异大，正文提取不稳定。

应对：

1. 保存 raw HTML。
2. 支持选中文本保存。
3. 支持手动编辑正文。
4. 维护站点适配器。
5. 提供反馈入口。

### 26.2 AI 成本过高

风险：

大量资料摘要和 embedding 会产生费用。

应对：

1. AI 默认关闭。
2. 后台批量处理。
3. 支持本地模型。
4. 限制默认处理长度。
5. 用户可选择仅手动触发 AI。

### 26.3 用户担心隐私

风险：

用户资料可能包含敏感信息。

应对：

1. 本地优先。
2. 明确隐私文档。
3. AI 可关闭。
4. API Key 本地保存。
5. 日志脱敏。
6. 提供离线模式。

### 26.4 变成收藏夹垃圾堆

风险：

用户保存很多，但不整理。

应对：

1. Inbox 工作流。
2. 自动标签。
3. 未读提醒。
4. 重复检测。
5. 周报整理。
6. 搜索体验优先。

### 26.5 开源代码质量下降

风险：

多人贡献后代码混乱。

应对：

1. 强制 typecheck。
2. 强制 lint。
3. 模块边界清晰。
4. PR 模板。
5. 架构文档。
6. CODEOWNERS。
7. 测试覆盖核心逻辑。

---

## 27. 后续商业化方向

Sourdex 开源版必须足够可用，商业化不应破坏开源信任。

可商业化功能：

1. 多设备同步。
2. 加密云备份。
3. 高级 OCR。
4. 视频转录。
5. 团队资料库。
6. 协作批注。
7. 自动周报。
8. 企业私有部署。
9. 浏览器插件商店托管版本。
10. 高级导入导出。
11. 企业合规审计。
12. 长期网页快照服务。

不建议收费的基础功能：

1. 本地保存。
2. 本地全文搜索。
3. 基础 Markdown 导出。
4. 基础插件保存。
5. 基础阅读器。

---

## 28. v0.1 验收清单

发布 v0.1 前必须满足：

1. 插件可以保存当前网页。
2. 插件可以保存选中文本。
3. 本地服务可启动。
4. SQLite 数据库可迁移。
5. 网页正文可提取。
6. Markdown 可生成。
7. Inbox 可查看资料。
8. Library 可查看资料。
9. Reader 可阅读资料。
10. 搜索可用。
11. 单条 Markdown 可导出。
12. 批量 Markdown 可导出。
13. 设置页可查看数据目录。
14. 深色模式可用。
15. README 可指导新用户运行。
16. 隐私文档清晰。
17. CI 通过。
18. 核心测试通过。
19. 插件 zip 可构建。
20. GitHub release 可发布。

---

## 29. 开发时必须遵守的硬性要求

1. 不为了快而破坏模块边界。
2. 不在 UI 组件中直接写复杂业务逻辑。
3. 不在 service 中直接调用具体 Provider，必须通过接口。
4. 不在日志中输出用户正文和 API Key。
5. 不让 AI 功能阻塞保存主流程。
6. 不让单个文件无限膨胀。
7. 不写大而全的万能函数。
8. 不写无意义注释。
9. 不引入没有必要的重型依赖。
10. 不在 v0.1 做云同步和账号系统。
11. 不为了功能完整牺牲保存体验。
12. 不做绕过付费墙或违规抓取能力。
13. 不把用户数据锁死在私有格式中。
14. 不默认上传任何资料内容。
15. 不合并没有测试或没有说明的核心 PR。

---

## 30. 推荐开源推广文案

标题：

【开源】Sourdex：我受够了收藏夹吃灰，做了一个本地优先的全网资料索引库

正文核心：

Sourdex 是一个本地优先的全网资料索引库。它不是普通收藏夹，也不是普通 AI 知识库。你可以用浏览器插件一键保存网页、帖子、PDF、视频链接和选中文本，Sourdex 会自动提取正文、保存来源、生成 Markdown、建立全文搜索索引，并支持导出到 Obsidian。

核心功能：

1. 一键保存网页。
2. 保存选中文本。
3. 自动提取正文。
4. 本地 SQLite 存储。
5. 全文搜索。
6. Markdown / Obsidian 导出。
7. 后续支持 AI 摘要、标签和可溯源问答。
8. 默认本地优先，不绑定平台。

一句话：

Save once. Find forever.

---

## 31. 总结

Sourdex 的第一性原理不是“做一个 AI 知识库”，而是“让用户保存过的资料真的能被找回、验证和复用”。

v0.1 只需要做好四件事：

1. 保存顺滑。
2. 正文可靠。
3. 搜索好用。
4. 导出自由。

只要这四件事做到足够好，Sourdex 就不是一个概念项目，而是一个真实有人会长期使用的开源工具。

