# Coffee Lab 文档入口

这是 Coffee Lab 项目文档的总入口。开始开发、排查 Bug、设计新功能或修改数据结构前，先阅读本文件，再按任务类型读取对应文档。

## 1. 先判断你正在做什么

| 场景 | 必须先读 | 然后读取 |
| --- | --- | --- |
| 新增产品功能 | PRD.md、FEATURE_ROADMAP.md | DESIGN.md、ARCHITECTURE.md、对应 Work Item |
| 修复 Bug | 当前代码行为、Bug 模板 | ARCHITECTURE.md、USER_MANUAL.md、对应 Work Item |
| 重构代码或服务层 | ARCHITECTURE.md、重构模板 | DESIGN.md、相关 Work Item、决策记录 |
| 修改数据库、RLS、Storage | ARCHITECTURE.md、相关 Work Item | Supabase migration、测试账号规则 |
| 改变用户操作流程 | PRD.md、USER_MANUAL.md | DESIGN.md、对应 Work Item、受影响截图 |
| 修改视觉或响应式布局 | DESIGN.md、USER_MANUAL.md | 对应 Work Item、受影响截图 |
| 发布、部署或分支操作 | DEV_WORKFLOW.md、RUN_WEB_AND_MINIPROGRAM.md | 对应 Work Item、CHANGELOG.md |
| 评估成本、AI 或收费能力 | COST.md、PRD.md | ARCHITECTURE.md、决策记录 |
| 查看当前已有功能 | FEATURE_ROADMAP.md | USER_MANUAL.md、CHANGELOG.md |
| 了解长期技术决策 | decisions/ | ARCHITECTURE.md、关联 Work Item |
| 查看讨论阶段的计划 | plan/ | 已确认的 Work Item、Roadmap |

## 2. 推荐阅读顺序

### 新功能

~~~text
README
  → PRD
  → FEATURE_ROADMAP
  → DESIGN / ARCHITECTURE
  → 日期-feat-中文名.md
  → 代码实现
  → USER_MANUAL / CHANGELOG
~~~

### Bug 修复

~~~text
README
  → 当前代码和复现页面
  → Bug修复模板.md
  → ARCHITECTURE（涉及技术边界时）
  → USER_MANUAL（流程有变化时）
  → CHANGELOG（用户可感知时）
~~~

### 重构或架构决策

~~~text
README
  → ARCHITECTURE
  → 重构任务模板.md
  → 架构决策记录模板.md
  → YYYY-MM-DD-中文决策名.md
  → 相关 Work Item
  → 代码和回归验证
~~~

## 3. 文档职责

| 文档或目录 | 作用 | 什么时候读取 |
| --- | --- | --- |
| PRD.md | 产品定位、用户、范围和核心产品规则 | 判断需求是否属于产品范围 |
| DESIGN.md | 颜色、组件、交互、加载、空数据和错误状态 | 新页面或 UI 改动 |
| ARCHITECTURE.md | 技术栈、目录、数据模型、服务层和开发约束 | 修改代码、数据库或权限 |
| COST.md | API、服务器、时间成本和盈利模式 | 引入付费服务、AI 或部署成本 |
| RUN_WEB_AND_MINIPROGRAM.md | Web 与小程序并行运行方式 | 启动、联调或部署两个端 |
| develop/DEV_WORKFLOW.md | 分支、Work Item、验证和发布 SOP | 任何开发任务开始前 |
| develop/FEATURE_ROADMAP.md | 全部功能状态和未来排期 | 评估新需求优先级和是否重复建设 |
| develop/USER_MANUAL.md | 当前用户实际操作方式 | 修改用户流程或验证页面行为 |
| develop/CHANGELOG.md | 已发布的用户可感知变化 | 发布前后更新记录 |
| develop/TEST_ACCOUNTS.md | 测试账号用途和安全规则 | 需要登录、RLS 或多用户验证 |
| work-items/ | 单项需求的完整需求、方案、实施和验收记录 | 实施具体功能或 Bug |
| plan/ | 用户保存的方案草稿和对话计划，默认由用户维护 | 回顾需求讨论、创建正式 Work Item |
| decisions/ | 跨多个任务的长期产品/技术决策，文件名使用“日期 + 中文决策名” | 需要沿用既有决策或改变架构方向 |
| images/manual/ | 用户手册截图 | UI 或操作流程变更 |

## 4. 哪份文档优先

当文档之间出现不一致时，按以下优先级判断：

1. 当前代码和实际运行行为。
2. 已完成并验证的 Work Item。
3. 已执行的数据库 migration、RLS 和 Storage 配置。
4. FEATURE_ROADMAP.md 中的当前状态。
5. PRD.md、DESIGN.md 和 ARCHITECTURE.md 中的计划或约束。
6. plan/ 中尚未确认或执行的计划草稿。
7. 尚未归档的聊天讨论。

发现冲突时不要静默覆盖旧结论：

- 在当前 Work Item 中记录冲突和实际行为。
- 如果是长期决策，在 decisions/ 下新增或更新中文决策记录。
- 同步修正受影响的 Roadmap、用户手册或架构文档。

## 5. Work Item 命名和状态

任务文档使用：

~~~text
YYYY-MM-DD-feat-中文任务名.md
YYYY-MM-DD-fix-中文问题名.md
YYYY-MM-DD-refactor-中文范围名.md
~~~

示例：

- 2026-09-23-feat-配方双入口与字段拆分.md
- 2026-09-24-fix-库存页移动端布局.md
- 2026-09-25-refactor-配方服务层.md

决策文档使用：

~~~text
YYYY-MM-DD-中文决策名.md
~~~

例如：

- 2026-09-24-继续使用云端数据库作为主后端.md
- 2026-09-24-网站与小程序数据边界.md

状态流转：

~~~text
Draft → In Progress → Ready for Review → Completed
                                  ↘ Superseded
~~~

只有代码、数据、权限、测试、Preview、用户手册、截图和发布记录全部完成后，才能标记 Completed。

## 6. CodingAgent 执行规则

CodingAgent 开始任何任务时：

1. 先读取本 README。
2. 判断任务类型，按照第 1 节读取相关文档。
3. 搜索现有 Roadmap 和 Work Item，确认不是重复需求。
4. 如果 plan/ 中存在同主题计划，读取并判断是否已被后续 Work Item 或决策替代。
5. 新功能、Bug 和重构先建立对应 Work Item，并记录来源计划。
6. 开发前填写目标、范围、方案、测试和验收标准。
7. 开发后填写实际变更和验证结果。
8. 用户流程变化时同步 USER_MANUAL.md 和 images/manual/。
9. 更新 FEATURE_ROADMAP.md 和 CHANGELOG.md。
10. 不把计划内容写成已完成结果。
11. 不在文档、截图或代码中写入密码、数据库连接串、Service Role Key 或其他敏感信息。

## 7. plan 目录规则

- plan/ 保存对话阶段产出的方案草稿，由用户自行新增和整理。
- CodingAgent 默认不创建、移动或修改 plan/ 中的文件，除非用户明确要求。
- 文件名建议使用 YYYY-MM-DD-中文计划名.md。
- plan 文档不代表已经确认、正在开发或已经完成。
- 计划进入开发前，必须转成 work-items/ 下的正式任务文档。
- Work Item 应记录“来源计划”，但以 Work Item 中最终确认的范围和验收标准为准。
- 计划与 Work Item 冲突时，以已确认且状态更新的 Work Item 为准。
- 已执行结果只能写入 Work Item、Roadmap 和 Changelog，不能仅记录在 plan 中。

## 8. 当前文档目录

~~~text
docs/
├── README.md
├── PRD.md
├── DESIGN.md
├── ARCHITECTURE.md
├── COST.md
├── RUN_WEB_AND_MINIPROGRAM.md
├── work-items/
│   ├── 2026-09-22-feat-新手流程与使用说明.md
│   ├── 2026-09-23-feat-多图豆种与配方库.md
│   └── 2026-09-23-feat-配方双入口与字段拆分.md
├── plan/
│   └── YYYY-MM-DD-中文计划名.md
├── develop/
│   ├── DEV_WORKFLOW.md
│   ├── FEATURE_ROADMAP.md
│   ├── USER_MANUAL.md
│   ├── CHANGELOG.md
│   ├── TEST_ACCOUNTS.md
│   └── templates/
├── decisions/
│   └── 2026-09-24-决策记录说明.md
└── images/manual/
~~~

本 README 只负责导航和规则，不复制 PRD、Architecture 或 Work Item 的具体业务方案。
