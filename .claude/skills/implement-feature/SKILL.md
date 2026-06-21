---
name: implement-feature
description: 一次只实现一个明确任务（TASK-xxx），遵守架构与规则，写测试并运行检查。开始任何编码任务时使用。
---

# Skill: implement-feature

## 何时使用

- 需要实现 `docs/08_TASKS.md` 中的某一个具体任务。

## 先读取（Starting Protocol）

1. `CLAUDE.md`
2. `docs/08_TASKS.md`、`docs/12_PROGRESS.md`
3. 当前任务相关：`docs/02_REQUIREMENTS.md` / `03_ARCHITECTURE.md` / `04_TECH_STACK.md` / `09_TEST_PLAN.md`
4. 当前任务领域对应的 `.claude/rules/*.md`
5. 需追溯需求时读 `docs/PRD.md`
6. **若任务涉及 UI**：必读 `design/Sourdex.dc.html` + 对应 `design/screenshots/*` + `screenshots/11-design-system.png`（设计稿是 UI 视觉 source of truth，必须严格还原）

## 执行步骤

1. 走 Starting Protocol，确定**唯一**目标任务，确认无阻塞（依赖完成、相关 Open Question 已确认）。
2. 若有硬阻塞（如 OQ-A1 之于 STAGE-06），输出 Decision Required 并停止。
3. 将任务状态置 `IN_PROGRESS`。
4. 按架构与领域规则实现：遵守分层/依赖方向/接口隔离/设计模式；TS strict、no-any、Zod 校验外部输入；组件 <150 行、函数尽量 <50 行；明确错误类型；日志不含正文/Key。**UI 任务必须严格还原 `design/` 设计稿（布局/组件/颜色/间距/浅深色），不得自由发挥。**
5. 编写/更新该任务要求的测试（单元/集成；必要时 fixture/mock）。
6. 运行该阶段必跑检查（09_TEST_PLAN §11）。
7. 核对任务验收标准是否全部满足。
8. 调用 closing-protocol 完成收尾。

## 禁止

- 一次实现多个无关任务。
- 未阅读任务文档就写代码。
- 扩大 PRD 范围或实现 Future Backlog。
- 修改与当前任务无关的文件。
- 新增依赖不说明原因。
- 未运行检查就声称完成；未满足验收标准就标记 DONE。

## 输出要求

- 实现的任务编号与完成内容。
- 修改的文件列表。
- 运行的检查与结果。
- 验收标准逐项是否满足。
- 下一步建议。
