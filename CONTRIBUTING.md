# Contributing to Sourdex

感谢你对 Sourdex 的兴趣！本仓库采用**文档驱动**的开发流程。贡献前请先阅读 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) 与 [CLAUDE.md](CLAUDE.md)，并遵守 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## 开始之前

1. 阅读 [docs/02_REQUIREMENTS.md](docs/02_REQUIREMENTS.md) 与 [docs/03_ARCHITECTURE.md](docs/03_ARCHITECTURE.md)，了解范围与分层。
2. 查看 [docs/08_TASKS.md](docs/08_TASKS.md) 与 [docs/12_PROGRESS.md](docs/12_PROGRESS.md)，了解当前进度与未完成项。
3. 较大的改动请先开 issue 讨论，避免与 PRD 范围或既定架构冲突。

## 开发约定

- TypeScript strict；**禁止 `any`**（必须时加注释说明并 `eslint-disable` 注明原因）。
- 文件 kebab-case；React 组件 PascalCase；类型 PascalCase。
- React 组件 < 150 行；函数尽量 < 50 行；优先 early return。
- 所有外部输入用 Zod 校验；不吞错误，不向 UI 暴露底层堆栈。
- **所有 UI 必须严格按 `design/` 设计稿实现**，不得自由发挥。
- 不擅自扩大 PRD 范围；不引入非必要重型依赖（新增依赖须说明原因）。
- 数据模型严格遵循 PRD §12，不擅自增删表 / 字段。

详见 [.claude/rules/](.claude/rules/)（frontend / backend / database / testing / security）。

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)，例如：

```text
feat(search): add CJK segmentation to FTS index
fix(server): keep save flow non-blocking on extraction failure
docs: add privacy policy
test(e2e): cover save → search → export loop
```

## Pull Request

提 PR 前请确保本地全绿：

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build
```

- 触及核心闭环（保存 / 提取 / 索引 / 搜索 / 导出）的改动须附相关集成测试，必要时附 E2E。
- 数据结构变更必须附 migration + 迁移测试。
- PR 描述请说明动机、改动点与测试结果。**CI 检查通过后才能合并；无测试或无说明的核心 PR 不予合并。**

## Issue / Feature Request / Bug Report

> issue / PR 模板与 CODEOWNERS 将在后续完善（见 [docs/08_TASKS.md](docs/08_TASKS.md) Future Backlog BACKLOG-017）。

提交前请尽量提供：复现步骤、期望与实际行为、环境信息（OS / Node / 浏览器）；功能建议请说明使用场景与是否在 PRD 范围内。

## License

贡献即表示你同意你的贡献以本项目的许可证（[Apache-2.0](LICENSE)）发布。
