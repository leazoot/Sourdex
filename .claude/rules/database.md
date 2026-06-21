# Rules — Database (packages/db)

> 适用范围：schema、migration、repository、事务、seed。须符合 [docs/03_ARCHITECTURE.md](../../docs/03_ARCHITECTURE.md) §5 与 PRD 12。

## 技术约束

- SQLite + Drizzle ORM + FTS5（v0.1）；sqlite-vec（v0.2）。
- 本地文件系统保存快照/导出（路径存表，二进制/长文本落盘，PRD 16.1）。

## Schema 规范（PRD 12）

- 数据模型严格遵循 PRD 12，**不得擅自增删表或字段**；任何调整须经 Decision Required。
- v0.1 启用：`items`、`captures`、`tags`、`item_tags`、`jobs` + FTS5 虚拟表。
- 建表但 v0.2 启用：`chunks`、`annotations`、`ai_outputs`、`provider_configs`（建议一次建全，OQ-A5）。
- 字段命名 snake_case；时间字段统一 ISO 字符串（TEXT），与 PRD 12 一致。
- 主键统一字符串 id（如 `item_xxx`），由 core 的 id 工具生成。
- 外键按 PRD 定义保留（item_id / tag_id / chunk_id）。

## Migration

- 由 Drizzle 管理；migration 文件纳入版本控制。
- 必须可从空库迁移成功、可重复执行幂等。
- **数据结构变更必须附 migration + 迁移测试**（PRD 23.3）。
- 首次启动自动建库到用户数据目录。

## Repository 模式（PRD 10.1）

- 所有 DB 访问经 repository（ItemRepository/CaptureRepository/TagRepository/JobRepository/SearchRepository）。
- repository 返回领域 DTO（来自 `packages/core`），不泄漏 Drizzle 内部类型到上层。
- 提供事务 helper；跨表写入（如保存网页写 items+captures）使用事务。
- **service 不得绕过 repository 拼 SQL**；唯一例外是明确的复杂搜索模块（FTS/混合检索）。

## 全文索引（FTS5，PRD 15.2）

- 索引字段：title、plain_text、summary、tags（annotations v0.2）。
- 索引读写在 SearchRepository；写入/更新/删除与主表保持一致（策略 OQ-A3，建议应用层显式维护）。
- 软删除（status=deleted）的资料应从搜索结果排除。

## 数据安全与迁移性

- 软删除：改 `items.status='deleted'`，**不物理删除用户文件**（PRD 5.1.3）。
- 所有文件路径必须可迁移（相对数据目录），支持用户更换数据目录。
- `provider_configs` 不存明文 API Key；敏感字段走 Keychain/加密存储（PRD 12.9, 17.2，v0.2）。

## 测试（PRD 21.1）

- repository 用测试 SQLite（内存/临时库）单测 CRUD + 软删除 + 索引读写。
- 迁移有从空库到当前 schema 的测试。

## 禁止

- 擅自增删表/字段或偏离 PRD 12。
- 在 repository 之外访问数据库。
- 物理删除用户资料文件。
- 明文存储 API Key。

## Open Questions

- OQ-A3 FTS 更新策略（触发器 vs 应用层，建议应用层）。
- OQ-A4 source_hash 计算口径。
- OQ-A5 是否一次建全部表（建议是）。
