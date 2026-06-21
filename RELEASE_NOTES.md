# Sourdex v0.1.0 — Release Notes

**Save once. Find forever.** Sourdex v0.1.0 是首个 MVP 版本，闭合了本地优先的
**保存 → 提取 → 入库/索引 → 搜索 → 阅读 → 导出** 核心闭环。

> 完整变更见 [CHANGELOG.md](CHANGELOG.md)。

## 亮点

- **浏览器插件（MV3）**：一键保存当前网页与选中文本；首次连接经配对码换取 token。
- **本地服务（Fastify + SQLite/FTS5）**：仅监听 `127.0.0.1`；保存优先（先持久化再提取），保存不被提取/AI 阻塞。
- **正文提取 + Markdown**：按内容类型策略提取可读正文并转 Markdown，失败有兜底。
- **全文搜索**：SQLite FTS5（unicode61 + 中文按字分词），bm25 排序、片段高亮。
- **Web UI（React + Vite + Tailwind）**：Inbox / Library / Reader / Search / Settings，浅/深主题，i18n（EN / 简中），严格按 `design/` 实现。
- **导出**：单条 `.md` 与批量（Obsidian 风格、按域名分文件夹）zip，含 YAML frontmatter 与安全文件名。
- **质量**：单元/集成（Vitest 152）+ 端到端（Playwright，五步关键链路）测试；每个 PR 跑 CI。

## 隐私

数据默认保存在本地，**默认不上传任何资料内容**。AI 功能为 v0.2、可选、默认关闭。详见 [docs/PRIVACY.md](docs/PRIVACY.md)。

## 安装

见 [README.md](README.md)（从源码运行：本地服务 + Web UI + 浏览器插件）。

## License

[Apache-2.0](LICENSE)。

---

## 发布清单（维护者执行）

> 本环境未初始化 git / 无 GitHub 远程，以下步骤需由维护者在已授权环境执行。

1. License 已确定为 Apache-2.0（如需再变更须在发布前完成）。
2. 初始化与提交（首次）：
   ```bash
   git init
   git add -A          # 确认 .gitignore 已排除 node_modules/dist/dist-release/.output/数据库
   git commit -m "chore: release v0.1.0"   # 须包含 pnpm-lock.yaml（CI 用 --frozen-lockfile）
   git branch -M main
   git remote add origin <github-repo-url>
   git push -u origin main
   ```
3. 触发发布（二选一）：
   - 打 tag 触发 `.github/workflows/release.yml`：
     ```bash
     git tag v0.1.0 && git push origin v0.1.0
     ```
   - 或本地手动发布：
     ```bash
     bash scripts/package-release.sh
     gh release create v0.1.0 dist-release/* --title "Sourdex v0.1.0" --notes-file RELEASE_NOTES.md
     ```
4. 核对 GitHub release 已发布、产物（扩展 zip + web 包）齐全 → PRD §28 第 20 项满足。
