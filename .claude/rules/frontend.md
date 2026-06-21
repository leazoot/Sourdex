# Rules — Frontend (apps/web, apps/extension UI)

> 适用范围：`apps/web` 全部，`apps/extension` 的 UI（Popup/Options）。须符合 [docs/03_ARCHITECTURE.md](../../docs/03_ARCHITECTURE.md) §3 与 [docs/04_TECH_STACK.md](../../docs/04_TECH_STACK.md)。

## 设计稿一致性（强制，最高优先）

- 所有界面必须**严格按 `design/` 设计稿实现**，不得自由发挥布局/视觉。设计稿是 UI 的视觉 source of truth。
- 实现前必读：`design/Sourdex.dc.html`（完整页面）、`design/screenshots/` 对应截图、`design/screenshots/11-design-system.png`（设计系统：颜色/字号/圆角/间距/组件规范）、`design/support.js`。
- 截图与页面对应（浅/深）：source-desk(01/12)、library(02/13)、reader(03/14)、search(04/15)、ask(05/16)、tags(06)、export(07)、settings(08)、onboarding(10)、browser-extension(09/17)。
- 用 Tailwind/shadcn 还原设计 token（颜色/间距/圆角/字号/阴影）；浅色与深色都按对应截图实现。
- 设计稿含 v0.2 页面（ask/tags/export）；当前 Batch 仅实现 v0.1 页面（Inbox/Library/Reader/Search/Settings），但实现时仍严格对照设计稿。页面命名与设计稿（如 source-desk）映射不确定时记入 Open Question 并确认，不擅自更名或改版。
- 设计稿与 PRD/架构冲突时：先提 Decision Required，不擅自取舍。

## 技术约束

- React + Vite + Tailwind + shadcn/ui（默认，OQ-02）；轻量状态 Zustand（默认，OQ-01）；服务端数据 TanStack Query。
- TypeScript strict；禁止 `any`（必须时注释原因）。
- **`apps/web` 不得直接访问 SQLite**，只通过 server API。
- 扩展 UI 不得包含 DB 逻辑、AI 调用、复杂业务判断。

## 组件分层（PRD 11.2）

- `pages/`：仅做页面编排，不写业务请求细节。
- `features/`：组合 hooks + API 的业务组件（capture/item-list/search/tags/export）。
- `components/ui/`、`components/layout/`：纯展示，**不得发起业务请求**。
- 抽取原则：重复出现 ≥2 次可抽取；承担多职责必须拆分；组件 < 150 行。

## Hooks 规范（PRD 11.3）

- 复用状态/副作用用 hooks（如 `useItems`/`useSearch`/`useCaptureStatus`）。
- 异步状态必须含 `loading`/`error`/`data`。
- hooks 不直接操作 DOM；不混入无关业务逻辑。

## 数据与状态

- 所有服务端数据走 TanStack Query；缓存键统一管理。
- 本地 UI 状态用 Zustand，避免全局可变状态滥用。
- API 客户端集中封装在 `apps/web/src/lib/api/`；类型从 `packages/core` 复用。

## 样式与 UX

- 仅用 Tailwind + shadcn/ui；不引入额外 UI 框架。
- 主题：浅/深/跟随系统；深色对比度合格。
- 长列表虚拟滚动；Reader 长文懒加载/虚拟化，避免一次性渲染大量 Markdown（PRD 18.3）。
- 首屏 < 2s 为目标。

## 国际化与可访问性（PRD 19）

- 文案**不得硬编码**，统一 i18n 文件（库见 OQ-T3，默认 i18next）。
- 默认语言跟随系统，可手动切换（EN/简中）。
- 键盘可导航；按钮有可读 label；搜索框自动聚焦但不打断；状态提示不只依赖颜色；支持 reduced motion。

## 错误处理

- UI 只展示可读的用户级错误，不暴露底层堆栈。
- 网络/服务错误给出明确提示与重试入口（尤其插件连接失败）。

## 禁止

- **UI 偏离 `design/` 设计稿自由发挥；未参照设计稿就开始 UI 编码。**
- 在 UI 组件写复杂业务逻辑或直接拼接业务请求逻辑。
- 直接访问数据库或绕过 server API。
- 硬编码文案、硬编码颜色绕过主题、超过 150 行的组件。

## Open Questions

- OQ-01 Zustand vs Jotai（默认 Zustand）。
- OQ-02 shadcn/ui vs 自定义（默认 shadcn/ui）。
- OQ-T3 i18n 库（默认 i18next）。
