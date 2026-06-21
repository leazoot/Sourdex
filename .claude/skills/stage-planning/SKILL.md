---
name: stage-planning
description: 当前 Batch 完成后，基于实际进度重新规划下一批不超过 10 个阶段。执行 Batch Planning Protocol 时使用。
---

# Skill: stage-planning

## 何时使用

- 当前 Batch 全部阶段完成，需要规划下一个 Batch。
- 需要把 Future Backlog 中的内容择优纳入新 Batch。

## 先读取

1. `CLAUDE.md`（§12 Batch Planning Protocol）
2. `docs/08_TASKS.md`（含 Future Backlog、Open Questions）
3. `docs/12_PROGRESS.md`、`docs/14_STAGE_SUMMARY.md`
4. `docs/PRD.md`、`docs/02_REQUIREMENTS.md`、`docs/03_ARCHITECTURE.md`

## 执行步骤

1. 确认当前 Batch 确已完成（所有阶段 DONE，验收满足）；先更新 `docs/14_STAGE_SUMMARY.md`。
2. 基于实际进度重读文档，盘点：未完成项、新增需求、Future Backlog 优先级。
3. 规划下一 Batch：**≤10 个阶段**，按依赖排序，聚焦下一个可交付闭环（如 v0.2：AI 摘要/标签/语义检索/Ask/高亮）。
4. 把未纳入的内容保留在 Future Backlog；无法明确验收标准的放 Open Questions，不强行排期。
5. 为每个阶段定义目标、对应任务编号、验收标准、是否需人工确认。
6. 写入 `docs/08_TASKS.md`（新 Batch），同步 `docs/12_PROGRESS.md`、`docs/14_STAGE_SUMMARY.md`。
7. **输出阶段计划并等待确认**，除非用户明确要求继续。

## 禁止

- 不自动进入下一 Batch 开始编码。
- 不超过 10 个阶段；不为凑数过度拆分；不把过大阶段压成一个。
- 不把无法明确验收的需求强行排成开发任务。
- 不虚构已完成内容。

## 输出要求

- 当前 Batch 完成确认与阶段总结要点。
- 下一 Batch 的阶段计划（目标/任务/验收/是否需确认）。
- 仍留在 Future Backlog 的内容。
- 新增/未决 Open Questions。
- 等待确认的明确提示。
