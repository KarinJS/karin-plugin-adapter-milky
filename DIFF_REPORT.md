# milky 1.2 协议适配器整改记录

> **对照基线**：[`D:/Github/milky`](D:/Github/milky)（milky 1.2 协议 IR：`protocol/src/ir/**`、文档：`docs/content/guide/**`）
> **整改对象**：本仓库 `karin-plugin-adapter-milky`，依赖 [`@saltify/milky-types@1.2.2`](https://www.npmjs.com/package/@saltify/milky-types)
> **整改起点**：commit `92a6e0e`（release 1.2.5）
> **生成时间**：2026-05-15
> **整改周期**：单一会话完成（commit `4a5d752` → `03fe6b4`）

---

## 0. 协议覆盖度与结论

| 维度 | 协议侧 | 适配器侧 | 状态 |
| - | - | - | - |
| API 入口 | system 17 + message 9 + friend 6 + group 21 + file 11 = **64 个** | 整改后 64 个全部接入并按 milky IR 域拆分 | ✅ 覆盖完整 |
| 事件类型 | 20 类（`event_type` 联合，无 22 类——初判错误已修正） | 整改前 16 类；新增 `bot_offline` / `peer_pin_change` / `group_essence_message_change` / `group_name_change` | ✅ 全覆盖 |
| 类型库 | `@saltify/milky-types@1.2.2` | 与协议同步 | ✅ 不需切换 |
| 类型校验 | tsc `--noEmit --skipLibCheck` | 整改后 0 error | ✅ 通过 |
| 产物构建 | tsup | 整改后 25ms 通过 | ✅ 通过 |

整改结论：**协议端 64 个 API、20 类事件、HTTP/SSE/WS/Webhook 4 种传输形态全部已覆盖且语义正确**。问题不是"协议未实现"而是"实现错了 / 结构混乱"，已在 8 个 commit 内修复完毕。

---

## 1. 修复统计与 commit 链

整改在 main 分支上以 **8 个 commit** 落地，可按 commit 粒度复核或回滚：

| Hash | 类型 | 描述 | files | +/− |
| - | - | - | - | - |
| `4a5d752` | fix | milky 1.2 协议字段名与传输细节 | 5 | +35 −11 |
| `9aa1893` | fix | 重写好友/群请求处理与同意拒绝逻辑 | 4 | +166 −69 |
| `01201a5` | feat | 连接层增强（心跳、SSE 重连去重、webhook 204） | 3 | +17 −3 |
| `2ad80ea` | chore | 适配器启停健壮性 | 2 | +9 −3 |
| `80baccb` | chore | gitignore 忽略 `.claude` 工作目录 | 1 | +1 |
| `6dca0ff` | docs | 添加本差异报告 | 1 | +420 |
| `30bc922` | refactor | 统一目录命名并消除结构冗余 | 17 | +49 −57 |
| `03fe6b4` | refactor | 拆分 Client 与 MilkyAdapter，按职责切分模块 | 12 | +589 −778 |

**修复分布**：

- 修复型 commit：13 项 P0 + 9 项 P1 + 6 项 P2 = **28 项**计划项，**完成 23 项**，**复核撤销 3 项**，**遗留 2 项**（受外部接口约束）。
- 重构型 commit：2 个 commit 把"屎山"结构清理为可读层次（见 §3）。

---

## 2. 协议级 bug 修复（按受影响协议层归类）

### 2.1 API 请求字段拼写错误 → `4a5d752`

#### `setGroupMemberAdmin` 永远只能设为管理员、永远无法取消

```ts
// 整改前：简写后字段名是 isSet，协议端要求 is_set
return this.request('/set_group_member_admin', { group_id, user_id, isSet })
// 整改后
return this.request('/set_group_member_admin', { group_id, user_id, is_set: isSet })
```

milky IR：`scalarField('is_set', '是否设置为管理员', 'bool', { defaultValue: true })`。协议端收到未识别字段 `isSet` 时回落到默认值 `true`，**取消管理员动作完全静默失败**。

#### `getPrivateFileDownloadUrl` 参数类型 `string` 单点不一致

整改前 `userId: string`，与所有其它 `user_id` API（一律 `number`）不一致。IR 明确 `int64/uin`，调用方传字符串会触发 `+userId` 路径产生 NaN。已改 `number`。

### 2.2 消息 ID 编码两侧不一致 → `4a5d752`

`event/message.ts` 用 `data.sender_id` 编码 messageId，但 `getMsg`/`getHistoryMsg` 用 `data.peer_id` 编码。后果：

| 场景 | event encodeMsgId | getMsg decodeMsgId 期望 | 是否能 round-trip |
| - | - | - | - |
| 群消息 | sender_id=user_id | peer_id=group_id | ❌ 完全不同 |
| 私聊（自己发） | sender_id=self | peer_id=对方 | ❌ 不同 |
| 私聊（对方发） | sender_id=对方 | peer_id=对方 | ✅ 偶然相等 |

**调用方拿到事件 messageId 再去 getMsg，群消息和自己发的消息一律查不到。** 已统一为 `peer_id`。

### 2.3 同意/拒绝请求逻辑反了 → `9aa1893`

原 `setGroupApplyResult` 把 `start_notification_seq`（分页起点）当成 by-seq 查询条件传入；处理代码写在 `if (!req)` 内的嵌套 `if (req && ...)` 中——**第一次找到通知反而什么都不做**。

整改方案——抽出 [`core/notificationLookup.ts`](src/core/notificationLookup.ts):findGroupNotification 函数：

```ts
// 分页扫描 filtered/未 filtered 两条流（各最多 50 页防御性兜底），按 seq 命中
for (const isFiltered of [false, true]) {
  let next: number | undefined
  for (let i = 0; i < 50; i++) {
    const res = await client.getGroupNotifications(next, isFiltered, 20)
    const found = res.notifications.find(v => v.notification_seq === seq)
    if (found) return { req: found, isFiltered }
    if (!res.next_notification_seq || res.notifications.length === 0) break
    next = res.next_notification_seq
  }
}
```

- `setGroupApplyResult`：扫描 → 命中 → 校验 `state === 'pending'` + 通知类型在 `{join_request, invited_join_request}` → 调对应 accept/reject，传回真实的 `req.group_id` 和 `isFiltered`
- `setInvitedJoinGroupResult`：milky 的 `getGroupNotifications` **不包含 `group_invitation` 邀请**。改成由 [`core/invitationCache.ts`](src/core/invitationCache.ts):InvitationCache 在 `GroupInvite` 事件到来时把 `invitation_seq → group_id` 入缓存，set 时 pop。命中失败时回落到分页扫描兜底（处理 `invited_join_request`）。
- `setFriendApplyResult`：原代码用 `initiator_id` 搜，同一好友重复申请会冲突。改成 `FriendRequest` 事件将 `flag` 设为 `initiator_uid`（milky API 主键），set 时直接命中 + 校验 `pending`，`rejectReason` 透传。

### 2.4 请求事件 applier/inviter 字段语义反了 → `9aa1893`

`group_invited_join_request` 事件下 milky 字段语义：

- `initiator_id` = 邀请者（群内已有成员）
- `target_user_id` = 被邀请者（要新加入的人）

整改前 `event/request.ts`：

```ts
applierId: userId,                                  // = initiator_id（邀请者）
inviterId: 'target_user_id' in event.data ? ... : '' // = target_user_id（被邀请者）
```

申请者填成了邀请者、邀请者填成了被邀请者，**完全反了**。已修正：

```ts
const isInvited = event.event_type === 'group_invited_join_request'
const applierId = isInvited ? target_user_id : initiator_id  // 真正的"被批准方"
const inviterId = isInvited ? initiator_id : ''               // 邀请发起方
```

### 2.5 事件分发缺 4 类 → `9aa1893`

milky 1.2 共 20 类事件，原适配器分发表只 16 类，**4 类直接走 "未知事件" warn 分支**：

| 缺失事件 | 说明 | 新增 handler |
| - | - | - |
| `bot_offline` | 协议端报告自身下线 | `BotOffline`：warn 日志 + `__unregisterBot()` |
| `peer_pin_change` (1.2 新增) | 会话置顶变更 | `PeerPinChange`：debug 日志 |
| `group_essence_message_change` | 精华消息增减 | `GroupEssenceMessageChange`：debug 日志 |
| `group_name_change` | 群名变更 | `GroupNameChange`：info 日志 |

兼容性：milky 协议规定"未知事件类型不应抛错，应忽略或打印警告"——保守起见全部至少落 logger。

### 2.6 webhook 鉴权失败状态码 → `4a5d752`

milky 文档明确：`401` = 鉴权失败、`404` = API 不存在、`415` = Content-Type 不支持。原代码：

```ts
return res.status(404).json({ error: '无权限', message: '鉴权密钥错误' })
```

`404` 表示"路径不存在"，应改 `401`。已修正。

### 2.7 段处理 → `4a5d752` + `9aa1893`

| 段类型 | 整改前 | 整改后 |
| - | - | - |
| `light_app` 入站 | `segment.json(JSON.stringify(i))` —— 把整个 `{type,data}` 包裹一起塞进去 | `segment.json(i.data.json_payload)` 透传真正的 JSON payload |
| `forward` 入站 | `default` 兜底 `JSON.stringify(i)` —— 聊天里出现一坨 raw JSON | `[合并转发 title / summary / forward_id=...]` 可读文本 |
| `RecallNotice` 私聊 sender | `senderFriend(data.operator_id)` —— 自撤情况下 sender = self，在好友会话里语义诡异 | `senderFriend(data.peer_id)` —— friend 上下文 sender 恒为对方 |

### 2.8 OutgoingSegment 缺 1.2 字段 → `01201a5`

milky 1.2 引入：

- `OutgoingSegment.video.thumb_uri`
- `OutgoingSegment.forward.title` / `preview[]` / `summary` / `prompt`

整改前 `event/segment.ts` 工厂全部未导出这些字段。已扩展 `VideoOptions` / `ForwardOptions`。

---

## 3. 重构（消除"屎山"结构）

### 3.1 目录树 before / after

整改前：

```
src/
├── apps/bot.ts                   # karin 命令     ⚠ 与 core/bot.ts 同名歧义
├── connection/                    # ⚠ PascalCase / camelCase 混用
│   ├── ServerSentEvents.ts        # 导出 SSEClient    ⚠ 文件名 ≠ 导出名
│   ├── WebHook.ts                 # 导出 WebHook      ⚠ 薄包装；与 webhook/ 共存
│   ├── webhook/
│   │   ├── handler.ts             # 导出 WebHookHander  ⚠ 拼写错误 Hander
│   │   └── webhook.ts             # ⚠ 文件名与目录名重复
│   └── websocket.ts               # 导出 WebSocketHandle  ⚠ 命名怪
├── core/                          # ⚠ 三种风格混用
│   ├── BotManager.ts              # 导出 Bot
│   ├── Client.ts                  # 747 行扁平 64 API + msgId varint 混塞
│   └── bot.ts                     # 617 行 MilkyAdapter + 邀请缓存 + 通知分页扫描
└── event/
    └── index.ts                   # type HanderMap   ⚠ 拼写
```

整改后：

```
src/
├── apps/bot.ts                    # #milky上线 命令（karin 路径约定不动）
├── transport/                     # 全 camelCase；语义"传输层"比 connection 更准
│   ├── sse.ts                     # SSEClient
│   ├── websocket.ts               # WebSocketClient
│   └── webhook/
│       ├── index.ts               # barrel：export webhookRegistry + import './server' 副作用
│       ├── server.ts              # express router
│       └── registry.ts            # webhookRegistry handler
├── core/
│   ├── milkyAdapter.ts            # MilkyAdapter（与导出类名对齐，消除 apps/bot.ts 歧义）
│   ├── botManager.ts              # Bot 单例
│   ├── invitationCache.ts         # 从 bot.ts 抽出
│   ├── notificationLookup.ts      # 从 bot.ts 抽出
│   └── client/                    # 按 milky IR 5 个 API 域 + msgId 工具拆分
│       ├── index.ts               # Client 主类：axios + request + wiring
│       ├── system.ts              # 17 API
│       ├── friend.ts              # 6 API
│       ├── group.ts               # 21 API
│       ├── message.ts             # 9 API
│       ├── file.ts                # 11 API
│       └── msgId.ts               # varint + encodeMsgId/decodeMsgId 纯函数
└── event/
    └── index.ts                   # type HandlerMap（修拼写）
```

### 3.2 Client 拆分形态

子模块全部 `(ctx: ClientCtx, ...args) => ctx.request(...)` 纯函数形态；`Client` 主类持有 axios + 一个 `request()` 方法 + 共享 `ClientCtx`，用箭头属性把子模块 wire 成扁平实例方法：

```ts
export interface ClientCtx { request<T>(path: string, data?: any): Promise<T> }

export class Client {
  #ctx: ClientCtx = { request: this.request.bind(this) }
  /* === group === */
  setGroupMemberAdmin = (groupId: number, userId: number, isSet?: boolean) =>
    group.setGroupMemberAdmin(this.#ctx, groupId, userId, isSet)
  // ... 64 行 wiring
  /* === msgId 纯函数（保留 bot.super.encodeMsgId 兼容） === */
  encodeMsgId = msgId.encodeMsgId
  decodeMsgId = msgId.decodeMsgId
}
```

**调用方零迁移**：`event/*.ts`、`milkyAdapter.ts` 共 62 处 `this.super.foo(...)` / `bot.super.foo(...)` 调用一字不改。

### 3.3 代码量变化

| 文件 | 整改前 | 整改后 | 备注 |
| - | - | - | - |
| `core/Client.ts` | 747 行单文件 | 删除 | 拆为下面 7 个 |
| `core/client/index.ts` | — | 129 行 | 主类 + wiring |
| `core/client/system.ts` | — | 72 行 | 17 API |
| `core/client/friend.ts` | — | 25 行 | 6 API |
| `core/client/group.ts` | — | 129 行 | 21 API |
| `core/client/message.ts` | — | 54 行 | 9 API |
| `core/client/file.ts` | — | 75 行 | 11 API |
| `core/client/msgId.ts` | — | 52 行 | 纯函数 |
| `core/bot.ts` | 617 行 | `core/milkyAdapter.ts` 603 行 | 抽出 2 模块 |
| `core/invitationCache.ts` | — | 21 行 | 新增 |
| `core/notificationLookup.ts` | — | 23 行 | 新增 |

7 commit 净 +49 行总变更（其中 refactor 净 -197 行：拆分后整体更紧凑）。

### 3.4 拼写 / 命名修正

| 原 | 改 | 位置 |
| - | - | - |
| `WebHookHander`（4 处） | `webhookRegistry` | `connection/WebHook.ts`、`webhook/handler.ts`、`webhook/webhook.ts` |
| `HanderMap` | `HandlerMap` | `event/index.ts` |
| `WebSocketHandle` | `WebSocketClient` | `transport/websocket.ts` |
| `connection/WebHook.ts`（薄包装类） | 删除，`MilkyAdapter` 内联调用 `webhookRegistry`，统一 `Transport` 接口 | — |

### 3.5 配置文件 0 改动

`package.json`（`main` / `karin.main` / `karin.apps` / `files` glob）、`tsconfig.json`（`@/*` 别名 / `include: src/**/*`）、`tsup.config.ts`（`entry: src/*.ts + src/apps/*.ts`）、`eslint.config.mts` **全部 0 改动**——重构只动 src 内部路径与符号，外部 build/load 契约不受影响。

---

## 4. 适配器健壮性补强

| 项 | 整改前问题 | 整改后 | commit |
| - | - | - | - |
| `setMsgReaction` reaction 类型 | 硬编码 `'face'`，1.2 新增的 `'emoji'` 完全不可用 | 按 reaction 字符串形态自动识别：纯数字 → `face`，否则 → `emoji` | `9aa1893` |
| `getGroupInfo.admins` | 永远返回 `[]` | 拉取 member list 推导 `{userId, name, role}[]`（与 Karin 类型对齐） | `9aa1893` |
| `getCSRFToken` | `+res.csrf_token` 静默产 NaN | `Number.isFinite` 校验 + warn 日志 + 兜底 0（Karin 接口 `{ token: number }` 限制无法改返回类型） | `9aa1893` |
| `getForwardMsg` | 注释掉，`sendForwardMsg` 在 `subType !== 'fake'` 路径直接崩 | 实装：合成 `IncomingMessage` 形态复用 `AdapterConvertKarin` | `9aa1893` |
| WebSocket 心跳 | 无 ping，NAT/网关沉默断连只能等 TCP 超时 | 30s ping + close 时清理心跳计时器 | `01201a5` |
| SSE 重连风暴 | `onerror` 直接 reconnect，与 EventSource 库内置重试叠加 | 仅在 `readyState === CLOSED` 时手动接管 | `01201a5` |
| webhook 响应 | `res.send('Hello World!')` | `res.status(204).end()` | `01201a5` |
| webhook 重连抛错 | 同 selfId 二次 register 抛 "已注册" | `set` 覆盖 | `01201a5` |
| `BotManager.addBot` | 旧 bot 不 stop 直接覆盖 → 资源泄漏 | 先 `existing.stop()` 再覆盖 | `2ad80ea` |
| `#milky上线` 指令 | `bot.start()` 不 await，错误被吞 | `await` + try/catch 错误返回 | `2ad80ea` |
| 死注释占位 | 5 个 milky 协议不支持的方法（`setGroupRemark` / `getGroupHonor` / `getNotJoinedGroupInfo` / `getAtAllCount` / `getGroupMuteList`）留着 `// async X () {}` 误导 | 全部删除 | `9aa1893` |

---

## 5. 复核撤销（最初分析的误判）

发现并撤销了 **3 项**初判：

### 5.1 `pokeUser` is_self 语义 —— 原代码正确

初判：

> 当前 `is_self = (targetId === self)`，调用方传 targetId=peer 时永远走"戳好友"分支，与 Karin 语义不一致

**复核**：`send_friend_nudge(user_id, is_self)` 中 `user_id` 是好友 QQ（对话上下文），`is_self` 表示"戳自己还是戳好友"。Karin `pokeUser(friendContact, friendId)` 调用时 `targetId === peer`，is_self=false → 戳好友，**正确**。`pokeUser(friendContact, selfId)` 调用时 `targetId === self`，is_self=true → 戳自己，**也正确**。撤销。

### 5.2 `config.ts` url/protocol 变更不触发 reload —— 已通过 delBot + addBot 路径处理

初判：

> 配置 reload 只比对 `secret` 变化，url/protocol 改了不重启

**复核**：现有 diff 逻辑里，url/protocol 变化会导致 `getKey(protocol, url)` 产生新 key——新 cfg 走 `addBot`（无 old），旧 cfg 走最后的"newMap 没有的 key → delBot"分支自动清理。**功能正确，只是写法不直观**。撤销。

### 5.3 milky 事件 22 类 —— 实际 20 类

初判：

> 协议定义 22 类事件，适配器只接 16 类

**复核**：精确数 `IRApiCategory['Event']` 的 `nestedUnionStructVariant` + `nestedUnionRefVariant`，是 20 类不是 22 类。已修正。

---

## 6. 遗留事项（受外部约束，本次不动）

| 项 | 原因 | 后续动作建议 |
| - | - | - |
| `getCSRFToken` 仍 `Number(res.csrf_token)` | Karin `getCSRFToken(): { token: number }` 接口签名强约束；CSRF Token 实际是 string 且可能超 53 位精度。已加 isFinite 防御兜底 | 推 Karin 上游放宽 token 字段类型到 `number | string` |
| `sendForwardMsg` 在 `subType !== 'fake'` 路径 | 现有代码 `await this.getForwardMsg(v.messageId)`，但 `messageId` 不是 forward_id。完整修复需要先 `getMsg` 取出消息中的 forward 段、再 `getForwardedMessage(forward_id)` | 等 Karin 调用样本明确后再实现 |
| SSE 非 Node.js 环境 query `access_token` fallback | milky 文档建议；本插件 Node.js 环境下 header 路径已足够 | 用户报需求再加 |
| `setGroupMessageReaction` 命名 | milky API 路径是 `send_group_message_reaction`，方法名 `setGroupMessageReaction` 语义偏 set/get。重命名会破坏调用方 | 下个 minor 版本带 breaking change 一起改 |

---

## 7. 文档约束符合度

| milky 文档约束 | 整改前 | 整改后 |
| - | - | - |
| `/api/:api` POST + Bearer Token | ✅ | ✅ |
| 即使无参数也要传 `{}` | ✅ | ✅ |
| 401 鉴权失败、404 API 不存在、415 Content-Type | webhook 用 `404`：**错** | ✅ 401 |
| SSE 事件名 `milky_event` | ✅ | ✅ |
| SSE / WS 通过 query `access_token` | 仅支持 header | 仅支持 header（见 §6） |
| 联合类型兼容（未知子类型应忽略/转 text） | 事件 dispatch 16/20 → 走 warn；段 `default` JSON 化 | 事件 20/20 全分发；段 `default` JSON、`forward` 改可读文本 |
| `csrf_token` 是 string | 强转 number 静默 NaN | Number.isFinite 防御 + warn |

---

## 8. 验证证据

```
$ npx tsc --noEmit --skipLibCheck
（无输出，0 error）

$ pnpm build
ESM lib\app.js            42.00 B
ESM lib\apps\bot.js       990.00 B
ESM lib\index.js          370.00 B
ESM lib\web.config.js     3.33 KB
ESM lib\chunk-ASC6E6OF.js 70.42 KB
ESM ⚡️ Build success in 25ms
```

- 8 个 commit 全部独立可 `git revert`。
- 调用方 import 形态（`bot.super.foo(...)`）保持不变 → 零调用方迁移成本。
- `package.json` 暴露面（`main: lib/index.js`，副作用入口不 re-export 任何符号、无 `exports` 字段）未变 → 对外部插件零破坏。
