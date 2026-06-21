# Sourdex

**Save once. Find forever.**

[English](#english) · [中文](#中文)

---

## English

Sourdex keeps an index of the things you read on the web. Clip a page or a
selection from your browser, and Sourdex pulls out the readable text, turns it
into Markdown, keeps the original snapshot, and adds it to a local full-text
search index. Later you can search, read, or export what you saved.

Everything stays on your own machine. Nothing is uploaded.

> This is **v0.2**, a developer preview — you run it from source.

### What it does

- Clip a web page or selected text from the browser (Chrome / Edge, MV3).
- Extract readable content, convert to Markdown, keep the original HTML snapshot.
- Store everything in a local SQLite database (data dir is configurable).
- Full-text search across your library (Chinese and English).
- Read clips in a built-in reader; browse them in Inbox and Library.
- Highlight passages and attach notes; notes are searchable and travel with exports.
- Manage tags on a dedicated page — rename, merge, delete.
- Export to Markdown, Obsidian, JSON or CSV — a single item, your whole library, or a scope.

**Optional AI (off by default)** — only after you configure a provider (OpenAI-compatible
or Ollama): background summaries and auto-tags, semantic search, and an **Ask** page that
answers from your saved sources with citations. Saving, reading, search and export all work
fully without AI, and nothing is sent anywhere until you enable it.

### Requirements

Node ≥ 22 and pnpm 10.x.

```bash
git clone https://github.com/leazoot/Sourdex.git
cd Sourdex
pnpm install
pnpm build
```

### Running it

Sourdex has three parts: the local service, the web UI, and the browser
extension.

```bash
# 1. Local service — listens on 127.0.0.1:8787 only
pnpm --filter @sourdex/server start

# 2. Web UI (pass the paired token in dev)
VITE_SOURDEX_API_TOKEN=<token> pnpm --filter @sourdex/web dev

# 3. Browser extension — build, then load unpacked
pnpm --filter @sourdex/extension zip
# Chrome/Edge → chrome://extensions → Developer mode → Load unpacked
# → apps/extension/.output/chrome-mv3/
```

The data directory defaults to `~/Library/Application Support/Sourdex` (macOS),
`%APPDATA%\Sourdex` (Windows), or `~/.local/share/sourdex` (Linux). Override it
with `SOURDEX_DATA_DIR`.

**First connection:** start pairing in the extension; the local service prints a
6-digit code to its console; type it into the extension to exchange it for an
access token. The code is shown only on the server console, expires in 5
minutes, and is never sent over the network.

### Privacy

Local by default — no content leaves your machine. The service binds to
loopback; the extension needs a token and a one-time confirmation to connect.
See [docs/PRIVACY.md](docs/PRIVACY.md).

### License

[Apache-2.0](LICENSE).

---

## 中文

Sourdex 帮你给读过的网页建一份索引。用浏览器插件剪藏一个页面或一段划选，
Sourdex 会提取正文、转成 Markdown、留存原始快照，并写入本地全文索引。之后你
可以搜索、阅读，或导出保存过的内容。

所有数据都在你自己的电脑上，不会上传。

> 这是 **v0.2** 开发者预览版，从源码运行。

### 功能

- 用浏览器插件剪藏网页或选中文本（Chrome / Edge，MV3）。
- 提取正文、转 Markdown、保留原始 HTML 快照。
- 存入本地 SQLite 数据库（数据目录可配置）。
- 全文搜索（支持中英文）。
- 内置阅读器；用 Inbox 和 Library 浏览。
- 高亮正文、添加备注；备注可被搜索，并随导出一并带出。
- 专门的标签页管理标签——重命名、合并、删除。
- 导出 Markdown / Obsidian / JSON / CSV——单条、整个库，或按范围。

**可选 AI（默认关闭）**——仅在你配置 Provider（OpenAI 兼容或 Ollama）后启用：后台摘要与
自动标签、语义检索，以及基于你保存资料、带引用作答的 **Ask** 页面。不开 AI 时保存、阅读、
搜索、导出全部正常可用；在你启用前不会向任何外部发送内容。

### 环境要求

Node ≥ 22，pnpm 10.x。

```bash
git clone https://github.com/leazoot/Sourdex.git
cd Sourdex
pnpm install
pnpm build
```

### 运行

Sourdex 分三部分：本地服务、Web UI、浏览器插件。

```bash
# 1. 本地服务——仅监听 127.0.0.1:8787
pnpm --filter @sourdex/server start

# 2. Web UI（开发期传入配对得到的 token）
VITE_SOURDEX_API_TOKEN=<token> pnpm --filter @sourdex/web dev

# 3. 浏览器插件——先构建，再加载
pnpm --filter @sourdex/extension zip
# Chrome/Edge → chrome://extensions → 开发者模式 → 加载已解压的扩展程序
# → apps/extension/.output/chrome-mv3/
```

数据目录默认在 `~/Library/Application Support/Sourdex`（macOS）、
`%APPDATA%\Sourdex`（Windows）或 `~/.local/share/sourdex`（Linux），可用
`SOURDEX_DATA_DIR` 覆盖。

**首次连接：** 在插件里发起配对，本地服务会在控制台打印一个 6 位配对码，把它
输入插件即可换取访问 token。配对码只显示在服务端控制台、5 分钟内有效、不经网络
传输。

### 隐私

默认本地存储，内容不外传。服务只监听回环地址；插件需 token 且首次连接需确认。
详见 [docs/PRIVACY.md](docs/PRIVACY.md)。

### 许可证

[Apache-2.0](LICENSE)。

---

更多文档：[Roadmap](ROADMAP.md) · [Contributing](CONTRIBUTING.md) ·
[开发指南](docs/DEVELOPMENT.md) · [Security](SECURITY.md) ·
[Changelog](CHANGELOG.md)
