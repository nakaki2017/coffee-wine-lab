# Web 与微信小程序并行运行计划

版本：1.0  
日期：2026-07-10  
范围：Web 项目、本地微信小程序项目、未来新小程序项目、共享后端与并行开发流程

## 1. 当前项目现状

当前存在两个项目目录：

```text
/Users/naka/Mine/study/ai/coffeelab-web
/Users/naka/Mine/study/ai/coffeelab
```

其中：

| 目录 | 说明 |
| --- | --- |
| `/Users/naka/Mine/study/ai/coffeelab-web/project` | 当前 Web 项目，技术栈为 Vite + React + TypeScript + Tailwind + Supabase |
| `/Users/naka/Mine/study/ai/coffeelab-web/docs` | 产品、设计、架构、成本和运行文档统一维护目录 |
| `/Users/naka/Mine/study/ai/coffeelab` | 当前已有微信小程序项目目录 |
| `/Users/naka/Mine/study/ai/coffeelab/miniprogram` | 后续如新建 Taro 小程序项目，建议放在这里 |

当前 Web `.env` 应指向 Supabase 项目：

```text
https://dglbnphrqfdeuartvjnq.supabase.co
```

注意：如果 Web 和小程序连接了不同 Supabase project ref，会出现两端数据不一致、某些表缺失、日历报 404 等问题。

## 2. Web 项目启动

Web 项目路径：

```text
/Users/naka/Mine/study/ai/coffeelab-web/project
```

启动命令：

```bash
cd /Users/naka/Mine/study/ai/coffeelab-web/project
npm run dev -- --host 127.0.0.1
```

默认访问地址：

```text
http://127.0.0.1:5173/
```

如果 `5173` 被占用，可以指定新端口：

```bash
npm run dev -- --host 127.0.0.1 --port 5174
```

启动后检查终端输出：

```text
VITE ready
Local: http://127.0.0.1:5173/
```

## 3. 微信小程序启动

### 3.1 当前已有小程序项目

如果运行当前已有小程序项目，在微信开发者工具中打开：

```text
/Users/naka/Mine/study/ai/coffeelab
```

### 3.2 未来新建小程序项目

如果后续按新技术栈创建小程序项目，建议目录：

```text
/Users/naka/Mine/study/ai/coffeelab/miniprogram
```

推荐技术路线：

```text
Taro + React + TypeScript
```

原因：

1. 更接近当前 Web 的 React 代码组织。
2. 便于共享类型、i18n、主题 token 和部分业务逻辑。
3. 后续如果需要多端扩展，比原生小程序更容易做统一抽象。

## 4. 小程序域名与 Supabase 配置

如果小程序继续使用 Supabase，需要在微信公众平台或微信开发者工具中配置合法域名。

需要关注：

| 类型 | 域名 |
| --- | --- |
| request 合法域名 | `https://dglbnphrqfdeuartvjnq.supabase.co` |
| uploadFile 合法域名 | `https://dglbnphrqfdeuartvjnq.supabase.co` |
| downloadFile 合法域名 | `https://dglbnphrqfdeuartvjnq.supabase.co` |

开发阶段可以在微信开发者工具里临时勾选“不校验合法域名、web-view 域名、TLS 版本以及 HTTPS 证书”。

正式版必须配置合法域名。

## 5. 推荐并行目录结构

近期先保持现状：

```text
coffeelab-web/
  docs/
  project/

coffeelab/
  app.js
  app.json
  pages/
  components/
```

后续如果 Web 和小程序都稳定发展，再考虑整理为 monorepo：

```text
coffeelab/
  apps/
    web/
    miniprogram/
  packages/
    types/
    api/
    i18n/
    theme/
```

迁移到 monorepo 不是 MVP 必须项。当前更重要的是先把两端跑通。

## 6. 并行开发原则

### 6.1 页面层分开

Web 和小程序页面层分开维护。

原因：

1. Web 使用 DOM、React Router、Tailwind。
2. 小程序使用小程序组件、页面栈、WXSS 或 Taro 编译结果。
3. 两端 UI 可以视觉一致，但不应该强行共用同一份页面代码。

### 6.2 共享业务层

优先共享这些内容：

1. 数据类型：`BeanProfile`、`Batch`、`BrewRecord`、`Recipe`、`DailyEntry`。
2. 枚举定义：烘焙度、批次状态、冲煮设备。
3. i18n 文案 key。
4. 主题 token：颜色、圆角、阴影、间距。
5. API 接口定义。

不建议共享：

1. Web 页面组件。
2. 小程序页面组件。
3. Web 专用样式 class。
4. 浏览器专用 API。

### 6.3 API 调用收口

页面不要直接散落 Supabase 调用。

推荐统一成：

```text
api.fetchBatches()
api.createBatch()
api.fetchBrewRecords()
api.upsertDailyEntry()
api.uploadDailyPhoto()
```

底层可以有不同实现：

```text
api/supabase-web
api/supabase-miniprogram
api/cloudbase
```

这样以后如果从 Supabase 切到微信云开发或自建后端，主要替换 API 层，不大面积改页面。

## 7. Supabase 与数据一致性

Web 和小程序默认连接同一个 Supabase 项目。

当前核心表：

```text
bean_profiles
batches
brew_records
cupping_records
recipes
flavor_tag_definitions
daily_entries
```

当前 Storage bucket：

```text
daily-photos
```

约束：

1. 前端只使用 publishable / anon key。
2. 不在前端、小程序端、仓库中放 service role key。
3. 权限依赖 Supabase RLS。
4. 数据库 schema 变更必须先写 migration。
5. Web 和小程序必须使用同一份 schema。

## 8. 日常运行流程

### 8.1 只开发 Web

```bash
cd /Users/naka/Mine/study/ai/coffeelab-web/project
npm run dev -- --host 127.0.0.1
```

浏览器打开：

```text
http://127.0.0.1:5173/
```

### 8.2 只开发小程序

1. 打开微信开发者工具。
2. 导入 `/Users/naka/Mine/study/ai/coffeelab`。
3. 确认合法域名或开发环境域名校验配置。
4. 编译预览。

### 8.3 同时开发 Web 和小程序

建议：

1. Web 使用 `5173`。
2. 如需要第二个 Web dev server，用 `5174`。
3. 小程序在微信开发者工具中运行，不占用 Vite 端口。
4. 修改数据库前先确认两端当前连接的是同一个 Supabase project ref。
5. 改 schema 后同步更新 Web 类型、小程序类型和 API 层。

## 9. 常见问题

### 9.1 Web 日历报 `daily_entries` 404

原因：

当前连接的 Supabase 项目缺少 `daily_entries` 表。

处理：

1. 确认 `.env` 里的 `VITE_SUPABASE_URL`。
2. 到 Supabase Table Editor 查看是否有 `daily_entries`。
3. 如果没有，执行 `20260614070000_002_daily_entries.sql`。

### 9.2 两端数据不一致

优先检查：

1. Web `.env` 的 Supabase project ref。
2. 小程序配置里的 Supabase project ref。
3. 当前登录账号是否一致。

### 9.3 小程序请求失败

优先检查：

1. request 合法域名。
2. uploadFile 合法域名。
3. Supabase key 是否正确。
4. 是否使用了浏览器专用 API。

### 9.4 端口冲突

Web 改用新端口：

```bash
npm run dev -- --host 127.0.0.1 --port 5174
```

### 9.5 是否要切微信云开发

第一版不建议边迁小程序边切后端。

建议顺序：

1. 小程序先继续使用 Supabase，验证页面和主流程。
2. API 层提前抽象，避免页面直接绑定 Supabase。
3. 如果后续确定小程序优先、微信登录优先、国内合规优先，再评估迁移到微信云开发。

## 10. 后续执行清单

1. 确认小程序新项目技术栈：Taro React 或原生小程序。
2. 确认小程序项目目录：`/Users/naka/Mine/study/ai/coffeelab/miniprogram`。
3. 抽取共享类型和 API 接口定义。
4. 建立小程序 Supabase 请求封装。
5. 迁移登录、首页、库存、豆种、冲煮、日历等页面。
6. 对照 Web 移动端截图做视觉回归。
7. 确认正式版合法域名和发布配置。
