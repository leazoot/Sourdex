---
name: code-review
description: 审查改动是否符合架构、编码规范、测试、安全与文档规则。合并核心改动前或自检时使用。
---

# Skill: code-review

## 何时使用

- 完成一个任务、准备收尾或合并前的自检。
- 审查他人/历史改动是否符合项目规则。

## 先读取

1. `CLAUDE.md`
2. `docs/03_ARCHITECTURE.md`
3. `.claude/rules/`（frontend/backend/database/testing/security 全部）
4. `docs/09_TEST_PLAN.md`
5. 被审查的改动

## 执行步骤

1. **架构**：分层与依赖方向、模块边界、接口隔离、设计模式、是否过度设计/越界。
2. **编码规范**：TS strict、no-any、Zod 校验、命名、组件 <150 行、函数 <50 行、early return、错误类型、注释克制、无非必要依赖。
2b. **设计稿一致性（UI 改动）**：界面是否严格还原 `design/` 设计稿（布局/组件/颜色/间距/浅深色，对照对应截图与 design-system 规范页），有无自由发挥偏离。
3. **测试**：必测范围是否覆盖；正常/边界/异常；核心闭环是否有集成/E2E；数据结构变更是否附迁移测试。
4. **安全**：127.0.0.1 默认、CORS 白名单、输入校验、日志无正文/Key、API Key 不明文、软删除不物理删、版权边界。
5. **文档**：08_TASKS / 12_PROGRESS / 14_STAGE_SUMMARY 是否按 Closing Protocol 更新；Open Questions 是否记录。
6. **范围**：是否扩大 PRD、是否混入 Future Backlog、是否改无关文件。
7. 汇总问题（按严重度）与必改/建议项。

## 禁止

- 不在 review 中顺手实现新功能（交 implement-feature）。
- 不放行违反架构/安全/测试硬规则的改动。
- 不忽略文档与进度更新缺失。

## 输出要求

- 审查结论（通过 / 需修改 / 阻塞）。
- 分维度问题清单（架构/编码/测试/安全/文档/范围）+ 位置 + 严重度。
- 必改项与建议项。
- 下一步建议。
