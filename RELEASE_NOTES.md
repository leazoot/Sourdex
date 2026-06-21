# Sourdex v0.2.0 — Release Notes

**Save once. Find forever.** v0.2.0 在 v0.1 本地优先闭环之上，叠加**可选、默认关闭**的 AI
价值层，并完善抓取质量、高亮备注与 Tags / Export 页面。不配置 AI 时，保存、阅读、搜索、
导出全部照常工作。

> 完整变更见 [CHANGELOG.md](CHANGELOG.md)。

## 亮点

- **抓取质量硬化**：抓取前自动滚动加载动态/懒内容；Discourse 站点适配器按楼层提取干净正文；
  提取前预清理占位/骨架/样板噪声。
- **AI 基础设施（可选、默认关闭）**：OpenAI 兼容 / Ollama Provider 适配；API Key 以本地加密
  文件存储（AES-256-GCM，仅 `node:crypto`）；设置页含明确的数据外发说明。
- **AI 摘要**：后台生成结构化 JSON 摘要并并入搜索；失败不影响保存/搜索/导出。
- **AI 自动标签**：3–7 个规范化标签、优先复用已有标签，与摘要同一次模型调用产出；手动标签优先。
- **语义检索**：分块 embedding（brute-force 余弦）+ 可溯源片段；后台执行，无 Provider 时优雅降级。
- **混合搜索排序**：keyword + semantic + tag + recency + user_signal，无 embedding 时回退关键词。
- **Ask 页面（RAG）**：回答仅引用你保存的资料，证据不足时明确说明、不编造。
- **高亮与备注**：选区高亮 + 颜色 + 备注，独立存储不改原文；备注可全文搜索、随 Markdown 导出。
- **Tags 页面**：标签云 + 管理（重命名 / 合并 / 删除，变更后重建全文索引）。
- **Export 页面**：Markdown / Obsidian / JSON / CSV，可按整库 / 状态 / 标签范围导出。

## 隐私

仍为本地优先：**在你配置并启用 AI Provider 之前不会向任何外部发送内容**，且外发前会明示。
详见 [docs/PRIVACY.md](docs/PRIVACY.md)。

## 升级

v0.2 不改动数据模型（PRD §12 的 9 张表在 v0.1 已一次建全），从 v0.1 升级无需数据迁移。

## 安装

见 [README.md](README.md)（从源码运行：本地服务 + Web UI + 浏览器插件）。

## License

[Apache-2.0](LICENSE)。
