# 测试账号登记

最后维护：2026-09-24
用途：本地开发、Vercel Preview 验收、截图和回归测试。

## 安全规则

- 账号密码不写入 Git、Markdown、截图、Issue 或 commit message。
- 真实测试密码只保存在本机未跟踪的凭据文件或密码管理器中。
- 测试账号不得绑定真实个人邮箱，不得用于生产数据。
- 账号创建后必须完成邮箱确认，并在 Supabase Auth 用户列表记录用途。
- 测试结束后可以禁用或删除账号，但不要删除用于回归的稳定样例账号。

## 账号规划

| 别名 | 计划邮箱 | 数据状态 | 用途 | 当前状态 |
| --- | --- | --- | --- | --- |
| empty | `coffee-empty-20260922@test.com` | 无业务数据 | 空状态、首次使用、前置拦截 | 已创建并验证 |
| sample | `coffee-sample-20260922@test.com` | 2 个豆种（其中 1 个有测试图片）、3 个批次、2 条冲煮、1 条杯测、1 个自定义做法、1 条有测试照片的日历记录 | 完整流程、用户手册截图、回归 | 已创建并初始化 |
| mobile | `coffee-mobile-20260922@test.com` | 1 个豆种、1 个可冲煮批次、1 条冲煮 | 390px 移动端回归、导航和表单 | 已创建并初始化 |

账号均创建于 Supabase 项目 `dglbnphrqfdeuartvjnq`，并在初始化时通过各自的登录会话验证了 RLS。

### Supabase User ID

| 别名 | User ID | 邮箱确认 |
| --- | --- | --- |
| empty | `1cae86ae-a1e7-4ad4-8c49-c1d9e2826be7` | 是 |
| sample | `e0b8cd3a-f7de-4775-9577-2e2738ada271` | 是 |
| mobile | `a7e4aa88-0f8d-4904-babe-bd8108568837` | 是 |

> 这些是专用测试账号，不得用于生产数据。创建阶段临时关闭了 Supabase Email Confirm；完成账号创建后，建议在 Authentication -> Providers -> Email 中重新打开 Confirm email，避免新注册用户绕过邮箱确认。

## 本机凭据存放约定

本次已在项目目录创建本机文件：

    /Users/naka/Mine/study/ai/coffeelab-web/project/.test-accounts.local

文件格式：

    COFFEE_EMPTY_EMAIL=coffee-empty-20260922@test.com
    COFFEE_EMPTY_PASSWORD=<仅本机保存>
    COFFEE_SAMPLE_EMAIL=coffee-sample-20260922@test.com
    COFFEE_SAMPLE_PASSWORD=<仅本机保存>
    COFFEE_MOBILE_EMAIL=coffee-mobile-20260922@test.com
    COFFEE_MOBILE_PASSWORD=<仅本机保存>

该文件由项目 `.gitignore` 的 `*.local` 规则忽略，不上传 GitHub 和 Vercel。密码只保存在该文件中，没有写入本文档。

## 创建和初始化 SOP

1. 在 Supabase Dashboard 打开正确项目的 Authentication -> Users。
2. 创建上表 3 个邮箱账号，使用随机强密码，并勾选邮箱已确认（或完成确认邮件）。
3. 用 empty 登录，确认豆种、库存、冲煮、日历和统计均为空。
4. 用 sample 登录，按以下顺序写入脱敏样例：
   - 2 个豆种档案，其中 1 个有两个购买批次。
   - 1 个养豆中批次、1 个可冲煮批次。
   - 2 条冲煮记录、1 条杯测、1 个自定义做法。
   - 1 条日历图片 URL 和备注。
5. 用 mobile 登录，保留 1 个豆种和 1 个可冲煮批次，验证移动端。
6. 在每次数据库结构变更后，优先用 empty 账号验证 RLS，再用 sample 验证主流程。
7. 截图只使用 sample 或静态脱敏数据，不显示真实邮箱、密码、token 和数据库地址。

## 创建记录

- 2026-09-23：Supabase Email Confirm 已关闭，使用项目 publishable key 通过 Auth signup 创建 3 个账号。
- 3 个账号均返回有效 session，且 `email_confirmed_at` 已存在。
- 使用各账号自己的 authenticated session 写入和读取业务数据，未使用 service role key，未直接写入 `auth.users`。
- `empty` 验证：bean_profiles、batches、brew_records、cupping_records、daily_entries 和自定义 recipes 均为 0。
- `sample` 验证：bean_profiles=2、batches=3、brew_records=2、cupping_records=1、自定义 recipes=1、daily_entries=1；本次图片回归增加 1 张豆种测试图片和 1 张日历测试照片。
- `mobile` 验证：bean_profiles=1、batches=1、brew_records=1、cupping_records=0、自定义 recipes=0、daily_entries=0。
- 本机密码文件 `.test-accounts.local` 权限为 `0600`，且由 `*.local` 规则忽略，不进入 Git 或 Vercel。

## 验收清单

- [x] 三个账号在当前 Supabase 项目 Auth 用户列表中存在。
- [x] 三个账号邮箱已确认。
- [x] empty 无业务数据。
- [x] sample 有脱敏完整样例。
- [x] mobile 可复现移动端场景。
- [x] 测试密码只在本机凭据文件/密码管理器中。
- [x] 文档、截图和 GitHub 不包含秘密。
