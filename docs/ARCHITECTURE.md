# 液体风味公式 ARCHITECTURE

【版本】
- 1.0 新建。基于当前 Vite + React + TypeScript + Tailwind + Supabase 实现整理。

## 一、技术栈

| 层 | 技术 |
| --- | --- |
| 前端框架 | React 18 |
| 构建工具 | Vite 5 |
| 语言 | TypeScript |
| 路由 | React Router |
| 样式 | Tailwind CSS |
| 图标 | lucide-react |
| 图表 | recharts |
| 日期 | date-fns |
| 后端 / BaaS | Supabase Auth、Database、Storage |
| 数据库 | PostgreSQL via Supabase |
| 鉴权 | Supabase Auth + RLS |
| 部署形态 | Web App |

【环境约束】
1. 建议 Node 20。
2. 当前依赖对 Node 16 会出现 engine warning。
3. 每次提交前至少跑：
   - `npm run typecheck`
   - `npm run build`

## 二、架构设计

【总体架构】

```text
Browser
  |
  | React UI / React Router / Tailwind
  |
Service Layer: src/lib/utils.ts
  |
Supabase Client: src/lib/supabase.ts
  |
Supabase Auth + Postgres + Storage
```

【架构原则】
1. 前后端分离。前端只通过 Supabase client 访问后端能力。
2. 页面组件不直接散写 Supabase 查询。统一通过 `src/lib/utils.ts`。
3. 类型定义集中在 `src/lib/types.ts`。
4. 用户隔离依赖 Supabase RLS，不在前端假装隔离。
5. 所有业务表必须带 `user_id`，公共只读表除外。

## 三、目录结构

```text
project/
  src/
    App.tsx
    main.tsx
    index.css
    components/
      Layout.tsx
      CuppingSection.tsx
    contexts/
      AuthContext.tsx
      DarkModeContext.tsx
      LanguageContext.tsx
      ToastContext.tsx
    lib/
      supabase.ts
      types.ts
      utils.ts
      i18n.ts
    pages/
      AuthPage.tsx
      Dashboard.tsx
      BeansList.tsx
      BeanForm.tsx
      BeanDetail.tsx
      InventoryList.tsx
      BatchForm.tsx
      BatchDetail.tsx
      BrewsList.tsx
      BrewForm.tsx
      BrewDetail.tsx
      RecipesList.tsx
      RecipeForm.tsx
      Calendar.tsx
      Stats.tsx
  supabase/
    migrations/
```

项目文档统一维护在根目录：

```text
coffeelab-web/
  docs/
    PRD.md
    DESIGN.md
    ARCHITECTURE.md
    COST.md
```

【新增文件规则】
1. 新页面放 `src/pages/`。
2. 可复用 UI 放 `src/components/`。
3. 全局状态放 `src/contexts/`。
4. Supabase 访问函数放 `src/lib/utils.ts`。
5. 类型和枚举 helper 放 `src/lib/types.ts`。
6. 翻译文案放 `src/lib/i18n.ts`。
7. 数据库变更必须新增 migration，不直接改线上表。

## 四、路由结构

| 路由 | 页面 | 鉴权 |
| --- | --- | --- |
| `/auth` | 登录 / 注册 | 未登录可访问 |
| `/` | 首页 Dashboard | 需要 |
| `/beans` | 豆种列表 | 需要 |
| `/beans/new` | 新建豆种 | 需要 |
| `/beans/:id` | 豆种详情 | 需要 |
| `/beans/:id/edit` | 编辑豆种 | 需要 |
| `/inventory` | 库存列表 | 需要 |
| `/inventory/new` | 新建批次 | 需要 |
| `/inventory/:id` | 批次详情 | 需要 |
| `/inventory/:id/edit` | 编辑批次 | 需要 |
| `/brews` | 冲煮列表 | 需要 |
| `/brews/new` | 新建冲煮 | 需要 |
| `/brews/:id` | 冲煮详情 | 需要 |
| `/brews/:id/edit` | 编辑冲煮 | 需要 |
| `/recipes?kind=brew_method` | 冲煮做法列表 | 需要 |
| `/recipes?kind=drink` | 咖啡饮品列表 | 需要 |
| `/recipes/new?kind=brew_method` | 新建冲煮做法 | 需要 |
| `/recipes/new?kind=drink` | 新建咖啡饮品 | 需要 |
| `/recipes/:id/edit` | 编辑做法 | 需要 |
| `/calendar` | 咖啡日历 | 需要 |
| `/stats` | 统计 | 需要 |

【路由约束】
1. 业务页面必须包在 `AuthGuard` 内。
2. 未登录访问业务页面跳转 `/auth`。

## 配方模型约束

`recipes` 同时承载两类内容，但通过 `recipe_kind` 严格区分：

- `brew_method`：必须有 `device`，可保存研磨度、水温、粉量、液量、比例、时间、注水方案和滤纸。
- `drink`：必须有 `drink_type`，`device` 为空，所有冲煮参数为空；可保存饮品原料、制作步骤和说明。
- `drink_type=other` 时使用 `drink_type_custom` 保存自定义类型。
- `name` 兼容旧数据和用户自定义名称；内置配方使用 `name_zh`、`name_en` 提供双语显示。
- 页面通过 `src/lib/types.ts` 的 `getRecipeDisplayName` 选择当前语言名称，服务层在 `src/lib/utils.ts` 统一归一化写入。
- 饮品不能进入库存扣减型冲煮流程；`BrewForm` 只加载 `brew_method`。
3. 无匹配路由跳转 `/`。

## 五、数据模型

### 5.1 枚举

| 枚举 | 值 |
| --- | --- |
| `roast_level` | `light`、`medium_light`、`medium`、`medium_dark`、`dark`、`custom` |
| `batch_status` | `pending`、`resting`、`ready`、`in_use`、`finished`、`archived` |
| `brew_device` | `v60`、`origami`、`kalita`、`french_press`、`aeropress`、`espresso`、`americano`、`latte`、`cold_brew`、`other` |
| `flavor_category` | `fruity`、`nutty`、`floral`、`chocolate`、`spice`、`sweet`、`herbal`、`other` |

### 5.2 表关系

```text
auth.users
  ├─ bean_profiles
  │    ├─ bean_images
  │    └─ batches
  │         └─ brew_records
  │              └─ cupping_records
  ├─ recipes
  │    └─ recipe_images
  └─ daily_entries

flavor_tag_definitions: 公共只读
storage.daily-photos: 用户目录隔离
storage.bean-images: 私有，按 user_id / bean_id 隔离
storage.recipe-images: 私有，区分 builtin 和 user / user_id / recipe_id
```

### 5.3 核心表

【bean_profiles】
- 作用：豆种档案。
- 关键字段：`brand`、`bean_name`、`origin_country`、`process_method`、`roast_level`、`flavor_description`、`recommended_resting_days`。
- 约束：属于单个用户。

【bean_images】
- 作用：豆种图片、顺序和封面。
- 关键字段：`bean_profile_id`、`user_id`、`source_type`、`storage_path`、`external_url`、`sort_order`。
- 约束：排序位只能为 0-2，同一豆种最多 3 张；`sort_order=0` 为封面。

【batches】
- 作用：一次购买记录 / 库存批次。
- 关键字段：`bean_profile_id`、`purchase_date`、`roast_date`、`price`、`weight_grams`、`remaining_grams`、`status`、`opened_date`、`is_repurchase`。
- 状态顺序：`pending -> resting -> ready -> in_use -> finished -> archived`。

【brew_records】
- 作用：一次冲煮记录。
- 关键字段：`batch_id`、`recipe_id`、`brew_date`、`device`、`grind_setting`、`water_temp_c`、`dose_grams`、`yield_ml`、`ratio`、`total_time_seconds`、`pour_scheme`、`rating`。
- 业务规则：新增时按 `dose_grams` 扣减批次 `remaining_grams`。

【cupping_records】
- 作用：冲煮后的杯测记录。
- 关键字段：8 个感官维度、`overall_score`、`flavor_tags`、`comparison_notes`。
- 约束：一条杯测属于一条冲煮记录。

【recipes】
- 作用：内置做法和用户自定义做法。
- 关键字段：`recipe_kind`、`device`、默认参数、`ingredients`、`steps`、说明。
- 公共模板：`user_id = null` 且 `is_default = true`。
- 用户配方：`user_id = auth.uid()` 且 `is_default = false`，仅本人可见。

【recipe_images】
- 作用：配方图片、顺序和封面。
- 关键字段：`recipe_id`、`source_type`、`storage_path`、`external_url`、`sort_order`。
- 约束：排序位只能为 0-4，同一配方最多 5 张；内置图片普通用户只读。

【daily_entries】
- 作用：日历当天照片和备注。
- 关键字段：`entry_date`、`image_url`、`note`。
- 唯一约束：`(user_id, entry_date)`。

## 六、服务层约定

服务层位于 `src/lib/utils.ts`。

【命名规则】
1. 读取列表：`fetchXxxs`。
2. 读取详情：`fetchXxx(id)`。
3. 创建：`createXxx(payload)`。
4. 更新：`updateXxx(id, updates)`。
5. 删除：`deleteXxx(id)`。
6. 特殊查询：使用明确条件，例如 `fetchBrewRecordsByDateRange(startDate, endDate)`。

【错误处理】
1. service 函数遇到 Supabase error 直接 `throw error`。
2. 页面层捕获错误并通过 toast 展示。
3. service 层不做 UI toast。
4. 未登录时 service 层抛 `Not authenticated`。

【数据清洗】
1. 更新 batch / brew 时，必须移除嵌套对象，例如 `bean_profile`、`batch`、`cupping`。
2. 表单空字符串写入数据库前应转为 `null`。
3. 数字字段在页面层 parse，不把字符串传入数据库。

【库存扣减】
1. 当前只在 `createBrewRecord` 后扣减。
2. 扣减公式：`newRemaining = Math.max(0, remaining_grams - dose_grams)`。
3. 编辑冲煮不自动回滚库存。
4. 删除冲煮不自动回滚库存。
5. 若后续要改，需要新增库存流水表，不要直接在现有逻辑里补 patch。

## 七、鉴权与 RLS

【当前规则】
1. 业务表启用 RLS。
2. `bean_profiles`、`batches`、`brew_records`、`cupping_records`、`daily_entries` 都只能访问 `auth.uid() = user_id` 的数据。
3. `recipes` 支持读取自己的做法和公共默认做法。
4. `flavor_tag_definitions` 对 authenticated 用户只读。
5. `daily-photos` storage bucket 按用户 id 文件夹隔离。
6. `bean-images` 和 `recipe-images` 使用私有 Bucket，页面通过 1 小时 signed URL 读取。
7. 普通用户只能写入自己的非内置配方，不能把 `is_default` 改为 true。

【禁止】
1. 禁止在前端绕过 RLS 假设数据安全。
2. 禁止新增无 `user_id` 的个人业务表。
3. 禁止在 service 层查询全量用户数据。

## 八、国际化约定

【当前机制】
- `src/lib/i18n.ts`：维护 `zh` 和 `en` 字典。
- `src/contexts/LanguageContext.tsx`：维护语言状态、`localStorage` 持久化和 `t()`。
- `localStorage` key：`coffee-lab-lang`。
- 默认语言：`zh`。

【开发约束】
1. 所有用户可见文案必须使用 `t(key)`。
2. 新增 key 必须同时补中文和英文。
3. 枚举 label 必须用 translation key。
4. 中文品牌：`液体风味公式`。
5. 英文品牌：`Coffee Lab`。
6. 不允许页面里硬编码英文按钮、标题、toast、confirm。

## 九、AI 引用机制

当前 MVP 不接入 AI。

【如果后续接入 AI，必须遵守】
1. AI 只能引用用户自己的结构化数据：豆种、批次、冲煮、杯测、日历备注。
2. AI 不能把建议写回数据库，除非用户确认。
3. AI 输出必须标明引用来源，例如冲煮记录 id、日期、豆种名、批次。
4. AI 不做医疗、健康、消费投资建议。
5. AI 不替用户生成虚假的杯测结论。
6. AI 不能访问其他用户数据。
7. AI 引用结果需要保留“可追溯来源”，不能只输出一段总结。

【建议的数据结构，后续再定】
- `ai_references`: 保存 AI 输出引用的实体类型、实体 id、字段、生成时间。
- `ai_outputs`: 保存用户确认后的 AI 总结。MVP 不建表。

## 十、开发约束

1. 不要破坏 `AuthGuard`。
2. 不要绕过 `utils.ts` 直接在页面组件里新增 Supabase 查询。少量一次性读取可讨论，但默认不允许。
3. 不要把业务枚举散写在页面里。统一从 `types.ts` 导出。
4. 不要把新增文案写死在 JSX。
5. 不要新增未受 RLS 保护的用户数据表。
6. 不要把 `service_role` key 放到前端。
7. 不要把 `.env` 内容写入文档或提交到公开仓库。
8. 不要删除现有 migration。新增变更必须新建 migration。
9. 不要在页面里直接做复杂统计 SQL。MVP 可前端聚合，后续数据量大再做视图或 RPC。
10. 不要让图片上传绕过用户目录隔离。
11. 豆种/配方图片必须在浏览器压缩到 800KB 内，Bucket 以 1MB 再兜底。
12. 数据库只保存 Storage path，不保存会过期的 signed URL。
13. 不要破坏深色模式 class。
14. 不要用新的 UI 库替换现有 Tailwind 组件体系，除非重做设计系统。

## 十一、禁止破坏的逻辑

1. 登录保护：业务路由必须登录后访问。
2. RLS：用户只能访问自己的数据。
3. 批次状态顺序：`pending -> resting -> ready -> in_use -> finished -> archived`。
4. 养豆计算：`readyDate = roast_date + recommended_resting_days`。
5. 冲煮创建扣库存：按 `dose_grams` 扣减，最低为 0。
6. 豆种删除保护：存在未完成 / 未归档批次时不能删除。
7. 日历当天唯一：同一用户同一日期只能有一条 `daily_entries`。
8. 中文默认：无本地语言设置时必须使用中文。
9. 内置做法读取：用户必须能看到 `is_default = true` 的公共做法。
10. 杯测更新：已有杯测时更新原记录，不新增重复记录。
11. 豆种最多 3 张图，配方最多 5 张图，首张图为封面。
12. 饮品配方不进入冲煮记录流程，不触发库存扣减。
13. 内置配方对登录用户只读，用户配方仅创建者可见。

## 十二、验收标准

【代码验收】
1. `npm run typecheck` 通过。
2. `npm run build` 通过。
3. 新增页面无 TypeScript any 泛滥。确实需要 any 时要能解释原因。
4. 新增 Supabase 字段有类型定义。
5. 新增 Supabase 表有 migration 和 RLS。

【业务验收】
1. 新用户可完成“豆种 -> 批次 -> 冲煮 -> 杯测 -> 日历回看”的主链路。
2. 语言切换后，新增功能文案同步切换。
3. 空数据、加载中、错误提示都有兜底。
4. 移动端和桌面端均可完成核心操作。
5. 深色模式下无不可读文本。

【安全验收】
1. 未登录用户不能访问业务数据。
2. 用户 A 不能读取用户 B 的豆种、批次、冲煮、杯测、日历。
3. 图片路径必须包含用户 id 文件夹。

## 十三、待确认 / 风险

1. Supabase 免费额度是否足够支撑图片上传，需要上线后观察。
2. React Router 7 要求较新的 Node，开发环境建议升级 Node 20。
3. 当前 build 主包较大，后续需要按路由 lazy load。
4. 当前 `daily-photos` bucket 是 public。若照片有隐私风险，后续改私有 bucket + signed URL。
5. 内置配方当前通过 migration 维护，内容增长后需单独建设受控发布工具。
