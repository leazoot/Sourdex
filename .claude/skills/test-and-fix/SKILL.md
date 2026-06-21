---
name: test-and-fix
description: 运行该阶段/任务要求的检查（typecheck/lint/format/test/build），定位并修复失败，直到全绿。任务收尾前或检查失败时使用。
---

# Skill: test-and-fix

## 何时使用

- 完成实现后需要运行检查并修复问题。
- CI/本地检查失败需要定位修复。

## 先读取

1. `docs/09_TEST_PLAN.md`（尤其 §11 每阶段必跑检查）
2. `.claude/rules/testing.md`
3. 当前任务相关代码与测试

## 执行步骤

1. 确定当前阶段/任务应运行的检查集（09_TEST_PLAN §11）。
2. 依次运行：typecheck → lint → format check → unit test → 相关集成测试 →（适用时）E2E → build。
3. 对每个失败：定位根因，做**最小修复**，不顺手改无关代码。
4. 缺测试时按 testing 规则补测（覆盖正常/边界/异常；extractor 用 fixture，provider 用 mock，repository 用测试 SQLite）。
5. 重跑直到全绿；记录命令与结果。
6. 若失败源于需求/架构不明确，写入 Open Questions 并视情况输出 Decision Required。

## 禁止

- 引用或编造不存在的测试命令（未确认写“待确认”）。
- 为通过检查而删除/跳过有效断言。
- 修改与失败无关的文件。
- 未全绿就声称任务完成。
- 让测试写入用户真实数据目录。

## 输出要求

- 运行的检查命令清单。
- 每项结果（通过/失败→修复内容）。
- 最终是否全绿。
- 修改的文件列表。
- 下一步建议。
