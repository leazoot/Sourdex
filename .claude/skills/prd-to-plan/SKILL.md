---
name: prd-to-plan
description: 从 PRD 生成或刷新需求、架构、技术栈、任务与当前 Batch 阶段计划。当 PRD 更新、需要重建任务体系、或规划新 Batch 的需求拆解时使用。
---

# Skill: prd-to-plan

## 何时使用

- 首次基于 `docs/PRD.md` 建立文档与任务体系。
- PRD 发生变更，需要同步刷新需求/架构/技术栈/任务。
- 需要把一段需求拆解为可执行的阶段与任务（面向实际开发）。

## 先读取

1. `docs/PRD.md`
2. `CLAUDE.md`
3. `docs/01_PROJECT_BRIEF.md` / `docs/02_REQUIREMENTS.md` / `docs/03_ARCHITECTURE.md` / `docs/04_TECH_STACK.md`
4. `docs/08_TASKS.md` / `docs/12_PROGRESS.md`

## 执行步骤

1. 通读 PRD，判断是否存在阻塞决策（技术栈/架构/数据库/权限/支付/部署/核心流程冲突/MVP 范围/第三方依赖/安全合规/矛盾需求/验收标准缺失）。
2. 若存在阻塞决策，输出 **Decision Required**（阻塞问题 / 推荐决策 / 不同选择影响 / 建议 / 确认后下一步），停止，不创建完整体系、不写代码。
3. 若无阻塞，更新/创建 01–04 文档：项目简介、需求（功能/非功能/角色/流程/权限/数据/边界/异常）、架构（分层/依赖方向/模块边界/扩展点）、技术栈（含选型理由/备选）。
4. PRD 不明确但不阻塞的内容写入各文档 Open Questions，并标注推荐默认值。
5. 规划**当前 Batch**：≤10 个阶段，按依赖排序，聚焦 MVP/核心闭环；超出部分写 Future Backlog。
6. 拆任务：每个任务含编号/名称/说明/Batch/Stage/优先级/状态/依赖/涉及文件/验收标准/是否需人工确认/备注。
7. 写入 `docs/08_TASKS.md`，并同步 `docs/12_PROGRESS.md`、`docs/14_STAGE_SUMMARY.md`。

## 禁止

- 不写业务代码、不安装依赖、不初始化框架。
- 不新增 PRD 之外的业务需求。
- 不擅自定死关键技术/架构决策（应进 Decision Required 或 Open Questions）。
- 不为凑满 10 个阶段过度拆分，也不把过大阶段压成一个。
- 不虚构已完成内容；不把 Future Backlog 当当前任务。

## 输出要求

- 是否存在阻塞决策的结论。
- 创建/更新了哪些文件。
- 当前 Batch 的阶段数、任务总数、阶段计划概览。
- Future Backlog 与 Open Questions 列表。
- 下一步建议与下一次提示词。
