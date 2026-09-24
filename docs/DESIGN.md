# 液体风味公式 DESIGN

【版本】
- 1.0 新建。基于当前 UI、Tailwind 配置和页面实现整理。

## 一、视觉定位

【设计关键词】
- 安静。
- 专注。
- 有一点实验室感。
- 适合每天打开记录，而不是营销落地页。

【基础原则】
1. 第一屏就是工具，不做大 Hero。
2. 信息密度适中。库存、冲煮、日历都要便于扫描。
3. 颜色以咖啡、奶油、意式深色、鼠尾草绿色、陶土红为主。
4. 不做单一棕色系堆叠。必须保留绿色、红色、沙色作为状态和风险区分。
5. 组件尽量复用 `src/index.css` 中已有 class，不在页面里临时造大量新样式。

## 二、视觉主色调

颜色来自 `tailwind.config.js`。

| 色板 | 用途 | 常用色值 |
| --- | --- | --- |
| `coffee` | 主按钮、强调、咖啡相关高亮 | `coffee-600 #c46a24`、`coffee-500 #d4822f`、`coffee-100 #f9edd9`、`coffee-950 #3a1b0d` |
| `espresso` | 正文、深色背景、边框暗色 | `espresso-950 #1f1816`、`espresso-900 #3b2f2a`、`espresso-700 #504038`、`espresso-500 #7d6652` |
| `cream` | 页面背景、浅色卡片底、次级按钮 | `cream-50 #fefdfb`、`cream-100 #fdf9f0`、`cream-200 #faf0dc`、`cream-400 #eed49d` |
| `terracotta` | 危险、删除、告警、低库存 | `terracotta-600 #d14425`、`terracotta-500 #e35d3a`、`terracotta-100 #fce8e0` |
| `sage` | 成功、可开封、正向状态、照片提示 | `sage-600 #425e40`、`sage-500 #557652`、`sage-100 #e0e8df` |
| `sand` | 在路上、轻量提示、弱状态 | `sand-600 #847258`、`sand-200 #e0d9cc`、`sand-100 #f0ede6` |

【深色模式】
1. 页面背景使用 `dark:bg-espresso-950`。
2. 卡片使用 `dark:bg-espresso-900`。
3. 边框使用 `dark:border-espresso-800`。
4. 正文主色使用 `dark:text-cream-100`。
5. 弱文本使用 `dark:text-espresso-400` 或 `dark:text-espresso-500`。

## 三、字体与排版

| 类型 | 规则 |
| --- | --- |
| 正文字体 | `Inter, system-ui, sans-serif` |
| 展示字体 | `Playfair Display, Georgia, serif` |
| 页面标题 | `.page-title`，`text-2xl font-display font-bold` |
| 区块标题 | `.section-title`，`text-lg font-display font-semibold` |
| 表单 label | `.label`，`text-sm font-medium` |
| 统计数字 | `.stat-value`，`text-3xl font-display font-bold` |

【注意】
1. 不用 viewport width 动态缩放字体。
2. 不设置负字距。
3. 移动端按钮文字要能换行或保持短文案，不允许挤出按钮。

## 四、组件复用规范

### 4.1 按钮

统一使用以下 class：

| 类型 | class | 场景 |
| --- | --- | --- |
| 主按钮 | `.btn-primary` | 新增、保存、记录冲煮、上传成功动作 |
| 次按钮 | `.btn-secondary` | 编辑、取消、再次购买、次要入口 |
| 幽灵按钮 | `.btn-ghost` | 返回、图标按钮、轻量操作 |
| 危险按钮 | `.btn-danger` | 删除 |
| 小按钮 | `.btn-sm` | 卡片内操作、筛选项 |
| 图标按钮 | `.btn-icon` | 返回、关闭、删除图标 |

【规则】
1. 有 lucide 图标可用时，按钮内使用 lucide 图标。
2. 图标按钮必须有可理解的语义，删除按钮需要 `title` 或 `aria-label`。
3. 主流程只能有一个视觉最重的主按钮。

### 4.2 卡片

统一使用：
- `.card`
- `.card-hover`
- `.card-header`
- `.card-body`

【规则】
1. 卡片用于独立信息块、详情块、列表项、弹窗内容。
2. 不在页面大区块外层乱套卡片。
3. 列表项可使用 `.card-hover`，表示可点击。
4. 卡片圆角当前是 `rounded-2xl`。若后续要更偏工具化，可统一调整，不要单页单独改。

### 4.3 表单

统一使用：
- `.input`
- `.input-error`
- `.label`
- `.error-text`

【规则】
1. 必填字段在 label 后用 `*`。
2. placeholder 只做例子，不承担说明全部规则。
3. 保存失败用 toast；字段级校验失败才使用 `.error-text`。
4. 数字字段需要合理类型：金额 `step=0.01`，粉量 / 水温 `step=0.1`。

### 4.4 状态标签

批次状态 class：
- `.badge-pending`
- `.badge-resting`
- `.badge-ready`
- `.badge-in-use`
- `.badge-finished`
- `.badge-archived`

【语义】
1. `pending`：沙色，表示在路上。
2. `resting`：咖啡浅色，表示养豆中。
3. `ready`：绿色，表示可开封。
4. `in_use`：奶油色，表示使用中。
5. `finished`：灰褐色，表示已喝完。
6. `archived`：更弱灰褐色，表示归档。

### 4.5 图片与相册

【显示规则】

1. 豆种和配方列表封面使用固定 `4:3` 容器，日历月格照片使用固定高度，避免图片比例改变卡片和网格尺寸。
2. 固定缩略图需要读取原图方向：竖图使用 `object-contain` 完整显示，横图和接近方形的图片使用 `object-cover` 居中裁切。
3. 豆种和配方详情主图在移动端使用方形容器，`sm` 以上使用 `4:3`；日历当天大图使用 `4:3`。
4. 详情主图、日历当天大图和编辑页图片预览必须使用 `object-contain`，禁止使用 `object-cover` 裁掉包装文字、标签或拉花主体。
5. `contain` 图片的空白区域使用 `cream-200`，深色模式使用 `espresso-800/950`，不使用模糊图片或渐变作为填充背景。
6. 图片管理槽位保持方形和固定尺寸；封面、排序、删除按钮不得改变槽位尺寸。
7. 详情主图和日历当天大图支持点击全屏查看；多图按 `sort_order` 顺序切换。
8. 全屏图片使用 `max-width`、`max-height` 和 `object-contain`，支持上一张、下一张、方向键、`Escape`、关闭按钮和遮罩关闭。
9. 图片加载失败时显示明确占位或错误文案，同时保留关闭全屏查看的入口。

## 五、页面布局规范

### 5.1 桌面端

1. 左侧固定 sidebar，宽度 `lg:w-64`。
2. 主内容区使用 `lg:ml-64`。
3. 内容最大宽度 `max-w-6xl`。
4. 页面左右 padding 使用 `px-4 sm:px-6`。

### 5.2 移动端

1. 顶部固定 header。
2. 底部固定 tab bar。
3. 移动端底部保留高频入口：首页、豆种、库存、冲煮、做法、日历。
4. 统计入口保留在侧边菜单，不放底部 tab。

### 5.3 日历页

1. 月视图使用 7 列 CSS Grid。
2. 日期 cell 必须有稳定高度，当前为 `min-h-[118px]`。
3. 有冲煮记录：使用咖啡色浅底。
4. 有照片：显示缩略图和相机 icon。
5. 点击日期打开详情弹窗；移动端贴底，桌面居中。

## 六、关键交互动效

| 交互 | 当前规范 |
| --- | --- |
| 主按钮 hover | `hover:bg-coffee-700` + `hover:shadow-card-hover` |
| 主按钮 active | `active:scale-[0.98]` |
| 卡片 hover | 提升阴影、边框转咖啡色 |
| 路由页面 loading | 使用 skeleton 或中心 loading spinner |
| range slider | 咖啡色圆形 thumb |
| 日历 cell hover | 浅色背景变化 |
| 弹窗出现 | 当前无显式动画，依靠 overlay 和圆角建立层级 |
| 图片全屏查看 | 深色遮罩、完整显示；打开时锁定页面滚动，关闭后恢复 |

【后续可加，但现在不强制】
1. 弹窗可增加 150-200ms opacity / translate 过渡。
2. toast 可增加进入 / 退出动效。
3. 列表项删除可增加淡出，但不要影响数据一致性。

## 七、错误 / 加载中 / 空数据状态

### 7.1 错误状态

1. 全局操作错误使用 toast。
2. 删除、保存、上传失败必须有明确错误提示。
3. 表单缺少关键选择项时，优先 toast 提示。例如未选择豆种、未选择批次。
4. 危险动作使用 `confirm()` 二次确认；后续若改 Modal，要保持同等确认强度。

### 7.2 加载中状态

1. 全局鉴权 loading 使用中心 spinner。
2. 页面列表 loading 使用骨架屏。
3. 按钮保存中显示 `保存中...` / `Saving...`，并禁用按钮。
4. 图片上传中显示加载文案，不允许重复提交。

### 7.3 空数据状态

统一使用：
- `.empty-state`
- `.empty-icon`
- `.empty-title`
- `.empty-text`

【规则】
1. 空豆种：引导新增第一支豆子。
2. 空库存：引导新增第一条批次。
3. 空冲煮：引导记录第一杯。
4. 空做法：说明可创建自定义做法或使用内置模板。
5. 空统计：说明需要先有批次和冲煮记录。
6. 日历当天无冲煮：显示“当天没有冲煮记录”，并提供新增冲煮入口。

## 八、国际化规范

1. 中文为默认语言。
2. 英文品牌名为 `Coffee Lab`，中文品牌名为 `液体风味公式`。
3. 所有用户可见文案必须放入 `src/lib/i18n.ts`。
4. 不允许在组件中新增硬编码英文文案。
5. 枚举 label 不直接写中文或英文。使用翻译 key，例如 `device.v60`、`status.ready`。

## 九、验收标准

1. 浅色 / 深色模式下主要页面均可读。
2. 桌面 / 移动端导航均可用。
3. 所有新增页面必须有 loading、empty、error 至少一种兜底状态。
4. 所有新增按钮必须使用统一 button class。
5. 所有新增表单字段必须使用 `.label` 和 `.input`。
6. 新增文案必须走 i18n。
7. `npm run typecheck` 和 `npm run build` 必须通过。
