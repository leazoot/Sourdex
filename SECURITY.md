# Security Policy — Sourdex

## 支持的版本

Sourdex 处于早期开发阶段（v0.1）。安全修复仅针对 `main` 分支上的最新版本。

## 报告漏洞

如发现安全问题，**请勿公开提交 issue**。请通过私密渠道报告：

- 使用 GitHub 的 **Private vulnerability reporting**（仓库 Security 页 → Report a vulnerability），或
- 通过仓库维护者主页公开的联系方式私下联系。

报告请尽量包含：影响范围、复现步骤、受影响版本 / 组件，以及可能的修复建议。我们会尽快确认并在修复后致谢（如你愿意）。

## 安全设计要点

Sourdex 本地优先，安全边界以「不泄露本地数据」为核心：

- 本地服务**默认仅监听 `127.0.0.1`**，不默认监听 `0.0.0.0`。
- 插件访问本地服务需 Bearer token；**首次连接需用户通过配对码确认**（配对码仅在服务端控制台显示、单次使用、5 分钟过期、不经网络返回）。
- CORS 仅允许浏览器插件与本地 Web UI 来源。
- **所有 API 输入用 Zod 校验**；不向客户端暴露底层错误堆栈。
- 默认**不上传任何资料内容**；AI 功能默认关闭，仅在用户显式配置后按操作发送片段。
- 日志**默认不记录用户正文，不记录 API Key / 隐私字段**。
- token 文件以 0600 权限写入；`provider_configs` 不存明文 API Key（v0.2 走 Keychain / 加密存储）。

详见 [docs/PRIVACY.md](docs/PRIVACY.md) 与 [.claude/rules/security.md](.claude/rules/security.md)。

## 范围说明

Sourdex 不绕过付费墙、不协助违规批量抓取受限内容。请仅用于保存你当前可访问的内容，并遵守原网站条款。
