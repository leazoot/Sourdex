---
name: architecture-review
description: 审查实现或计划是否符合 PRD 架构、是否过度设计、是否偏离分层与依赖方向。在合并核心改动前、或对架构有疑虑时使用。
---

# Skill: architecture-review

## 何时使用

- 实现某模块/服务前后，需确认是否符合架构。
- 怀疑出现过度设计、跨层依赖、模块边界破坏。
- 引入新依赖或新抽象前评估其必要性。

## 先读取

1. `docs/03_ARCHITECTURE.md`
2. `docs/04_TECH_STACK.md`
3. `docs/PRD.md`（§7–10）
4. `.claude/rules/backend.md` / `frontend.md` / `database.md`
5. 相关代码（被审查范围）

## 执行步骤

1. 明确审查范围（某 PR / 某模块 / 某计划）。
2. 核对分层与依赖方向：仅外向内；web 不直连 SQLite；core 不依赖上层；service 不 new 具体 Provider。
3. 核对模块边界（PRD 8）：extension/server/web/core/db/extractor/ai/search/exporter 职责不越界。
4. 核对接口隔离与设计模式（Repository/Adapter/Strategy/Factory/Command/DI）是否到位且未滥用。
5. 检查过度设计：是否引入与 MVP 无关的抽象/依赖/通用框架；是否违背“架构服务于 PRD，不过度设计”。
6. 检查是否偏离 PRD 范围（混入 Future Backlog 能力）。
7. 列出问题（按严重度）与最小修正建议；将新出现的不确定项写入 Open Questions。

## 禁止

- 不写业务代码（仅审查与建议；修复交由 implement-feature/test-and-fix）。
- 不批准破坏分层、跨层依赖或越界模块的设计。
- 不引入 PRD 之外的需求或重型依赖。

## 输出要求

- 审查范围与结论（通过 / 需修改 / 阻塞）。
- 问题清单（位置 + 违反的规则/原则 + 严重度）。
- 最小修正建议。
- 新增 Open Questions（如有）。
- 下一步建议。
