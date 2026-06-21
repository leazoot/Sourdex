---
name: closing-protocol
description: 任务完成后的标准收尾——更新任务状态、进度、阶段总结，并给出规范的最终回复。每个任务结束时必须使用。
---

# Skill: closing-protocol

## 何时使用

- 完成任意一个任务后，进行收尾与文档更新。

## 先读取

1. `CLAUDE.md`（§9 Closing Protocol）
2. `docs/08_TASKS.md`、`docs/12_PROGRESS.md`、`docs/14_STAGE_SUMMARY.md`

## 执行步骤

1. **更新 `docs/08_TASKS.md`**：把当前任务状态改为 `DONE`/`PARTIAL`/`BLOCKED`；记录完成情况与验收标准是否满足。**未满足验收标准不得标 DONE**（应 PARTIAL/BLOCKED 并说明原因）。
2. **更新 `docs/12_PROGRESS.md`**：本次完成了什么、修改了哪些文件、运行了哪些检查、检查结果、当前进度（Batch/Stage/Task）、明确的下一步。
3. **若完成的是阶段/Milestone/Batch/重要模块**：更新 `docs/14_STAGE_SUMMARY.md`（阶段目标是否完成、成果、遗留问题、下一阶段目标、下一步建议）。
4. 若有新出现的不确定项，写入对应文档 Open Questions 并在 08_TASKS 汇总。
5. 若刚完成的是整个 Batch，切换到 stage-planning（执行 Batch Planning Protocol），不要自动进入下一 Batch。
6. 输出规范最终回复。

## 禁止

- 完成任务后不更新进度文档。
- 只口头总结不写入 12_PROGRESS。
- 阶段完成不更新 14_STAGE_SUMMARY；Batch 完成不做阶段总结。
- 跳过下一步建议。
- 把未满足验收标准的任务标记 DONE。

## 输出要求（最终回复必须包含）

1. 本次完成内容。
2. 修改了哪些文件。
3. 更新了哪些文档。
4. 运行了哪些检查。
5. 检查是否通过。
6. 当前进度（Batch / Stage / Task）。
7. 下一步建议（及建议的下一次提示词）。
