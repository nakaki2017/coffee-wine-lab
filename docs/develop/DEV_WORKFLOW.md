# 开发工作流与研发文档规范

> 适用范围：Coffee Lab Web 项目。小程序是后续独立端，但产品需求、功能状态和重要技术决策仍进入同一套文档体系。

## 1. 文档职责

| 文档 | 唯一职责 |
| --- | --- |
| ../PRD.md | 产品定位、长期目标、核心规则和产品范围 |
| ../README.md | 文档入口、阅读顺序和事实来源优先级 |
| ../DESIGN.md | 视觉、组件、交互和页面状态规范 |
| ../ARCHITECTURE.md | 技术架构、数据模型、服务层和开发约束 |
| FEATURE_ROADMAP.md | 全部功能的状态、优先级、版本和计划日期 |
| ../work-items/*.md | 单次需求的完整方案、实施记录和验收报告 |
| ../plan/*.md | 用户保存的讨论阶段计划草稿，默认只读 |
| USER_MANUAL.md | 当前已经可用功能的用户操作说明 |
| CHANGELOG.md | 面向用户的已发布变化摘要 |
| templates/ | 新建 Work Item 和决策记录的标准模板 |
| ../decisions/ | 跨任务、长期有效的产品或技术决策 |

文档追踪关系：

~~~text
PRD → FEATURE_ROADMAP → Work Item → USER_MANUAL / CHANGELOG
                         ↓
                    决策记录
~~~

FEATURE_ROADMAP.md 只做全局功能索引，不复制完整需求。单项需求的完整事实记录以 Work Item 为准。

## 2. 分支与环境

| 分支 | 用途 | 部署 |
| --- | --- | --- |
| main | 可发布代码 | Vercel Production |
| develop | 日常开发、联调和验收 | Vercel Preview |
| feat/* / fix/* / refactor/* | 单个任务实现 | 本地或临时 Preview |

推荐开始方式：

~~~bash
cd /Users/naka/Mine/study/ai/coffeelab-web/project
git fetch origin
git switch main
git pull --ff-only origin main
git switch develop
git pull --ff-only origin develop
git switch -c feat/<short-name>
~~~

如果任务直接在 develop 实施，也必须先建立 Work Item，不能只靠聊天记录追踪。

## 3. Work Item 规则

### 3.1 命名和编号

~~~text
YYYY-MM-DD-[feat|fix|refactor]-中文任务名.md
~~~

示例：

~~~text
2026-09-23-feat-配方双入口与字段拆分.md
2026-09-24-fix-库存页移动端布局.md
2026-09-25-refactor-配方服务层.md
~~~

每个任务还必须有唯一编号，例如：

~~~text
WI-20260923-RECIPE-KIND-SPLIT
~~~

同时填写关联 Roadmap ID，例如：

~~~text
RECIPE-007、RECIPE-008
~~~

### 3.2 状态流转

~~~text
Draft → In Progress → Ready for Review → Completed
                                  ↘ Superseded
~~~

- Draft：需求和验收标准仍在确认。
- In Progress：正在开发或迁移。
- Ready for Review：实现完成，等待代码、Preview 或产品验收。
- Completed：代码、数据、文档和发布验证全部完成。
- Superseded：被新的任务或方案替代，保留历史记录。

### 3.3 计划和结果分离

每个 Work Item 分为两部分：

- 需求与实施计划：开发前填写，包括背景、目标、范围、流程、方案、测试和验收标准。
- 实际执行记录：开发后填写，包括真实改动、命令结果、迁移记录、截图、Preview 和发布信息。

未执行或未验证的内容必须写成“待执行”或“待验证”，不能直接勾选完成。

## 4. 标准开发 SOP

1. 先阅读 ../README.md，判断任务类型和需要读取的文档。
2. 从 main 同步代码，确认工作区状态。
3. 切换或创建 develop 和任务分支。
4. 检查 ../plan/ 是否存在同主题计划；存在时读取并在正式任务中记录来源。
5. 复制对应模板，在 ../work-items/ 创建任务文档。
6. 填写任务编号、Roadmap ID、来源计划、背景、用户需求、目标和不在范围内。
7. 明确页面、用户流程、字段、状态、空数据、错误和加载表现。
8. 明确是否涉及 migration、RLS、Storage、Auth、环境变量和数据迁移。
9. 先补齐测试计划和验收标准，再开始代码实现。
10. 实施代码和数据库变更，所有用户可见文案进入 src/lib/i18n.ts。
11. 验证桌面端、移动端、中英文、浅色、深色、加载、空数据和错误状态。
12. 执行工程检查：

~~~bash
npm run typecheck
npm run build
git diff --check
~~~

13. 涉及数据库时，在目标 Supabase 项目执行 migration，记录迁移文件、执行时间、结果和回滚考虑。
14. 判断是否改变用户流程；如果是，更新 USER_MANUAL.md 和 ../images/manual/ 中的受影响截图。
15. 更新 FEATURE_ROADMAP.md 的状态、版本、日期、Work Item 链接和最后验证日期。
16. 更新 CHANGELOG.md，只写用户可感知的变化。
17. 推送任务分支并合并到 develop，验证 Vercel Preview。
18. 验收通过后创建 develop -> main Pull Request。
19. 合并并正式部署后，补填 Work Item 的发布记录，状态才可改为 Completed。

plan/ 由用户维护，CodingAgent 默认只读取，不自动创建、移动或修改。计划文件不能替代 Work Item，也不能作为功能已完成的证明。

## 5. 用户流程变化判定

满足任一条件即视为改变用户操作流程：

- 新增、删除、移动入口或导航项。
- 前置条件、字段必填性、状态流转或跳转路径改变。
- 用户看到的页面、按钮、提示或错误处理发生变化。
- 数据录入方式、图片上传方式或账号恢复方式改变。

流程变化时必须记录：

- 受影响页面和用户角色。
- 手册章节和操作步骤。
- 受影响截图。
- 兼容旧数据和旧用户的方式。
- 是否需要上线说明或 Changelog。

纯视觉调整也要检查手册截图；截图中的入口、布局或关键状态失真时必须替换。

## 6. 完成定义 Definition of Done

只有以下条件全部满足，Work Item 才能标记为 Completed：

- 代码实现完成。
- 数据库、RLS、Storage、Auth 变更已完成并验证。
- 中英文文案完成。
- 加载、空数据和错误状态完成。
- 桌面端和移动端完成验证。
- npm run typecheck 通过。
- npm run build 通过。
- git diff --check 通过。
- Vercel Preview 验证通过。
- 用户手册已同步，或确认无需同步并记录原因。
- 受影响截图已同步，或确认无需截图并记录原因。
- CHANGELOG.md 已更新。
- 发布后验证已完成。

## 7. 数据与安全要求

- 前端只使用 Supabase publishable key。
- 不在代码、Markdown、截图、Issue 或 commit message 中记录 service role key、数据库密码、验证码和真实用户凭据。
- 用户业务表必须保持 user_id 过滤和 RLS；新表必须同时提交 migration、RLS 和验收记录。
- 图片上传必须记录类型、大小、路径、权限和失败回滚策略。
- 破坏性 schema 变更先设计迁移和回滚，再修改页面。
- 测试账号可以记录账号标识，但密码和密钥必须通过安全渠道管理，不写入公开文档。

## 8. 模板选择

| 任务 | 模板 |
| --- | --- |
| 新功能、产品流程调整 | templates/功能需求模板.md |
| Bug 修复 | templates/Bug修复模板.md |
| 内部架构、服务层或依赖重构 | templates/重构任务模板.md |
| 跨任务的长期产品/技术决策 | templates/架构决策记录模板.md |

模板只提供结构，具体需求必须结合当前代码、PRD、Design 和 Architecture 填写，不能保留关键规则的空白占位符。

正式决策文档放在 `../decisions/`，文件名统一为：

~~~text
YYYY-MM-DD-中文决策名.md
~~~

不使用英文短名或带英文编号前缀的文件名格式。

## 9. 交叉引用规范

- develop/ 中引用任务文档：../work-items/<file>.md。
- work-items/ 中引用开发规范：../develop/DEV_WORKFLOW.md。
- work-items/ 中引用产品文档：../PRD.md、../DESIGN.md、../ARCHITECTURE.md。
- USER_MANUAL.md 中引用截图：../images/manual/<file>.png。

文档优先级：当前代码行为 > 已验收任务记录 > Roadmap 计划 > PRD 未来设想。发现不一致时先在 Work Item 或决策记录中说明，再修正相应文档。
