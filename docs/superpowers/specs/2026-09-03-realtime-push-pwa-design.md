# 购物审批：实时同步与通知升级设计

日期：2026-09-03

## 目标

把当前 GitHub Pages + Supabase 的两人购物审批网页升级为更接近正式应用的使用体验：用户直接打开主网址即可使用；网页打开时，双方的提交与审批近实时同步；浏览器具备能力时，可在后台收到系统通知；在 vivo 浏览器不支持或推送不稳定时，应用要明确显示能力状态，而不是假装通知已开启。

## 已确认约束

- 两位用户均使用 Android。
- 主要浏览器为 vivo 浏览器。
- 不要求现在重做原生 Android App 或 vivo 快应用。
- 仍使用 GitHub Pages 托管前端，Supabase 负责认证、数据库、Storage、Realtime 与服务端逻辑。
- 继续使用匿名登录，不增加邮箱、手机号等注册步骤。
- 通知只覆盖：新申请、通过、驳回、重新提交。

## 方案

### 1. 单一正式入口

主页面 `index.html` 内置 Supabase Project URL 与 publishable key，首次打开自动创建匿名会话。用户不再需要先访问 `start.html`，也不再需要手工填写云端连接参数。

`start.html` 保留一段时间作为兼容跳转入口，访问后直接跳回主页面，不承担配置职责。

### 2. Realtime 前台同步

进入房间后订阅当前房间的 `purchase_requests` 数据变化。监听 INSERT 和 UPDATE；收到变化后重新拉取当前房间数据并刷新界面。

仍保留低频轮询作为兜底，但从当前约 10 秒降低为长周期兜底，Realtime 为主路径。

数据库访问继续受现有 RLS 约束，客户端不使用 service_role。

### 3. PWA

补齐 `manifest.webmanifest`、应用图标与 Service Worker 注册，使 Android 浏览器在支持时可以添加到桌面，并提供独立窗口式体验。

Service Worker 负责：
- 基础静态资源缓存；
- 接收 Push 事件；
- 显示系统通知；
- 点击通知后打开或聚焦购物审批页面。

### 4. Web Push 能力检测

应用设置页增加“通知”区域，并逐项检测：

- `serviceWorker` 是否存在；
- `PushManager` 是否存在；
- `Notification` API 是否存在；
- 当前通知权限状态。

只有全部具备时才显示“开启通知”按钮。若 vivo 浏览器不支持 Push API，则明确显示“当前浏览器不支持后台推送；网页打开时仍会实时同步”。

不强制用户更换浏览器。

### 5. 推送订阅数据

Supabase 新增 `push_subscriptions` 表，保存：

- user_id
- room_id
- endpoint
- p256dh
- auth
- user_agent
- created_at / updated_at

RLS 只允许用户管理自己的订阅记录。

### 6. 后台通知发送

使用 Supabase Edge Function 发送标准 Web Push。发送端私钥仅保存在 Supabase 服务端 secret 中，不进入 GitHub 仓库或浏览器。

当以下业务事件发生时，由服务端向房间内另一位成员的订阅发送通知：

- 新申请：`XX 提交了新的购物申请：商品名 ¥价格`
- 通过：`你的“商品名”已通过`
- 驳回：`你的“商品名”被驳回`
- 重新提交：`XX 重新提交了“商品名”`

通知 payload 只带必要的 request_id、类型和显示文本，不携带敏感数据库凭据。

### 7. vivo 浏览器降级策略

如果实测 vivo 浏览器支持 Web Push，则使用标准 Web Push。

如果不支持，正式版仍提供：
- 网页打开时的 Supabase Realtime 即时更新；
- 页面可见时的站内 toast / 状态变化提示；
- 设置页明确标识“后台系统通知不可用”。

不在当前版本引入 vivo 原生 Push SDK，因为那需要原生 Android / 快应用工程，属于另一套产品形态。

## 数据与安全

- publishable key 可以在前端公开；service_role 不进入前端。
- Web Push 私钥仅在 Supabase 服务端保存。
- `push_subscriptions` 开启 RLS。
- 现有 `rooms`、`room_members`、`purchase_requests`、Storage 继续使用 RLS。
- Edge Function 根据当前登录用户和房间成员关系确定接收者，不允许客户端任意指定其他用户接收通知。

## 测试标准

升级完成后至少验证：

1. 两台不同 Android 设备使用主网址可分别创建/加入同一房间。
2. A 提交申请后，B 页面打开时无需手动刷新即可看到。
3. B 通过或驳回后，A 页面打开时无需手动刷新即可看到。
4. 驳回后重新提交可再次触发对方实时更新。
5. 图片上传和私有图片读取正常。
6. vivo 浏览器的通知能力检测结果与实际 API 支持一致。
7. 若浏览器支持 Web Push，关闭页面或切后台后可收到系统通知并能点击返回应用。
8. 若浏览器不支持 Web Push，界面清楚显示降级状态，其他实时审批功能不受影响。
9. GitHub Pages 部署成功，主入口无需 `start.html`。

## 不在本次范围

- 原生 Android APK。
- vivo Push SDK / vivo 快应用推送。
- 应用商店上架。
- 邮箱、手机号或第三方账号登录。
- 多人房间、管理员角色、复杂通知偏好。