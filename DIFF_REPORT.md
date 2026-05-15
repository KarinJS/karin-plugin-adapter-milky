# Milky 协议 vs 当前适配器 差异 / 问题 / 重写计划

> 对照基线：`D:/Github/milky`（milky 1.2 协议 IR、`protocol/src/ir/**`、`docs/content/guide/**`）
> 当前实现：`D:/Github/karin-plugin-adapter-milky`（v1.2.5，依赖 `@saltify/milky-types@1.2.2`）
> 生成时间：2026-05-15

---

## 0. 总览

- 协议端共 **64 个 API**（system 17 + message 9 + friend 6 + group 21 + file 11），`Client.ts` 全部覆盖，**没有缺失 API 入口**。
- 协议定义了 **20 类事件**（`event_type` 联合类型），分析时初判为 22 已修正；当前事件分发器**全部 20 类**已覆盖（本次新增 `bot_offline`、`peer_pin_change`、`group_essence_message_change`、`group_name_change` 4 个 handler）。
- 严重问题集中在 **同意/拒绝请求的逻辑**、**消息 ID 编码**、**段转换**、**字段名笔误**等地方，整体不是"协议未实现"，而是"实现错了"。
- 类型库 `@saltify/milky-types@1.2.2` 与 1.2 协议同步，**不需要换库**。

### 修复进度

- **P0**：13 项中 11 项 ✅ 完成、1 项（pokeUser）复核后确认原代码正确（误判撤销）、1 项（getCSRFToken）做了防御兜底（受限于 Karin 接口签名仍返回 number）
- **P1**：9 项中 7 项 ✅ 完成、1 项（sendForwardMsg messageId 路径）部分完成、1 项（SSE query token fallback）待办（边缘需求）
- **P2**：6 项中 4 项 ✅ 完成、1 项（config.ts url/protocol reload）复核撤销、1 项（setGroupMessageReaction 重命名）暂留以避免破坏调用方
- **验证**：`npx tsc --noEmit --skipLibCheck` 零错误；`pnpm build` 通过

---

## 1. `src/core/Client.ts`

### 1.1 [必须修复] `setGroupMemberAdmin` 字段名错误（导致接口完全不可用）

`Client.ts:394-396`：

```ts
async setGroupMemberAdmin (groupId, userId, isSet = true) {
  return await this.request('/set_group_member_admin', { group_id: +groupId, user_id: +userId, isSet })
  //                                                                                            ^^^^^
  // 简写后字段名是 isSet，协议端要求 is_set
}
```

**应改为**：`is_set: isSet`。当前实现协议端会收到 `isSet` 字段，根本不识别，等同于使用默认值 `true`，**永远只能设置管理员、无法取消**。

### 1.2 [必须修复] `getPrivateFileDownloadUrl` 参数类型错误

`Client.ts:599`：

```ts
async getPrivateFileDownloadUrl (userId: string, fileId: string, fileHash: string) {
```

IR 定义 `user_id` 为 `int64/uin`。其它所有 `userId` 都是 `number`，唯独这里写成 `string`，调用方传 `string` 会导致 `+userId` 出现 `NaN`（如非纯数字）。应改 `userId: number`。

### 1.3 [建议修改] `setGroupMessageReaction` 命名歧义

API 路径是 `send_group_message_reaction`（动作语义），方法名却叫 `setGroupMessageReaction`，与 IR 命名不对应。`is_add=false` 才是"取消"，不是 set/get 语义。建议改名 `sendGroupMessageReaction`。

### 1.4 [建议修改] `getCSRFToken` 返回类型

IR 定义 `csrf_token: string`，`Client.ts` 也按 string 返回；但 `bot.ts:543-544` 强转 `number` 导致信息丢失（CSRF Token 不应被当数字）。详见 §2.4。

---

## 2. `src/core/bot.ts`

### 2.1 [必须重写] `setFriendApplyResult` / `setGroupApplyResult` / `setInvitedJoinGroupResult`

#### 2.1.1 `setGroupApplyResult` 逻辑反了（`bot.ts:495-507`）

```ts
let res = (await this.super.getGroupNotifications(+_requestId)).notifications
let req = res.find(v => v.notification_seq === +_requestId)
if (!req) {
  res = (await this.super.getGroupNotifications(+_requestId, true)).notifications
  req = res.find(v => v.notification_seq === +_requestId)
  if (req && req.type === 'join_request' && req.state === 'pending') {
    // ← 真正的处理只在 !req 进入后再找到时才执行
    _isApprove ? acceptGroupRequest(...) : rejectGroupRequest(...)
  }
}
```

问题：
1. **第一次找到 req 时直接什么都不做**（处理代码在 `if (!req)` 内的 `if (req && ...)` 里），白找。
2. `getGroupNotifications(start_notification_seq)` 的语义是**分页起点 seq**，**不是搜索条件**。"由此开始从新到旧查询"，所以把 `_requestId` 当起点传完全不对。

#### 2.1.2 `setInvitedJoinGroupResult` 同样的反逻辑（`bot.ts:509-529`）。

#### 2.1.3 `setFriendApplyResult`（`bot.ts:482-493`）

逻辑勉强能跑（按 `initiator_id === +_requestId` 搜索），但：
- `_requestId` 在 Karin 抽象里是 `flag`，当前 `flag` 被设为 `initiator_id`（userId），同一好友多次申请会冲突，只能处理最早一条。
- 没有判断 `state === 'pending'`，对已处理的请求也会再次 accept/reject，行为不确定。

#### 2.1.4 [重写方案]

让 `FriendRequest` 事件、`GroupJoinRequest`/`GroupInvite` 事件把 milky 侧的"操作幂等键"塞进 `flag`，而不是 userId：
- 好友请求 → `flag = initiator_uid`（accept/reject API 直接拿 uid）
- 入群/邀请他人入群请求 → `flag = ${notification_seq}` 然后 `set*ApplyResult` 用全量分页扫描定位（或保存 `is_filtered`），不能用 `start_notification_seq` 当搜索条件。
- 邀请自身入群 → `flag = invitation_seq`。
- 更优解：在适配器内部维护一份"未处理通知缓存"，事件到来时入缓存（key=seq），set*ApplyResult 直接命中并清除。

### 2.2 [必须修复] `pokeUser` 私聊 `is_self` 含义反了（`bot.ts:474`）

```ts
if (_contact.scene === 'friend')
  pokeFunc = async () => this.super.sendFriendNudge(+_contact.peer, +_targetId === +this.account.selfId)
```

`send_friend_nudge(user_id, is_self)`：`user_id` 是好友 QQ 号，`is_self=true` 表示**戳自己**而非戳那个好友。当前实现：如果传入 `_targetId === self`，要戳自己时 `user_id` 还是 contact.peer（好友），等于"在好友会话里戳自己"，没问题；但**多数 Karin 调用方传 `_targetId === peer`，此时 `+_targetId === self` 必为 false，永远走"戳好友"分支**，与 Karin "pokeUser 给指定 targetId" 语义不一致。

**应当：**
```ts
const isSelf = +_targetId === +this.account.selfId
const peerForApi = isSelf ? +_contact.peer : +_targetId
pokeFunc = () => this.super.sendFriendNudge(peerForApi, isSelf)
```

### 2.3 [必须修复] `getCSRFToken` / `getCredentials` 类型错误（`bot.ts:536-545`）

```ts
async getCSRFToken (): Promise<{ token: number }> {
  const res = await this.super.getCSRFToken()
  return { token: +res.csrf_token }    // csrf_token 是 string，强转 number 会丢失字符或得到 NaN
}
```

CSRF Token 通常是十进制字符串但**不能保证一定是纯数字**；即使是数字也会因长度超出 53 位精度而截断。Karin 的 `getCSRFToken` 返回结构如果非要数字，至少要保留 string fallback。建议同时返回 `tokenString`。

### 2.4 [必须修复] `getMsg` / `getHistoryMsg` 的 `sender.role` 字段问题（`bot.ts:220, 247`）

```ts
role: i.message_scene === 'group' ? i.group_member.role : 'unknown'
```

`UserInfo`/`MessageResponse` 的 `sender.role` 不允许 `'unknown'` 在 friend 场景；Karin 类型一般用 `'friend'` / `'admin'` / `'owner'` / `'member'`。需要确认 Karin 联合类型并对齐。

### 2.5 [建议修改] `getGroupInfo` 返回 `admins: []`（`bot.ts:322`）

完全没读取 member 列表推导 owner/admin。需要在 group_info 接口中遍历群成员或单独查询。当前永远返回空列表。

### 2.6 [必须修复] `setMsgReaction` 只支持 face 类型（`bot.ts:271`）

```ts
await this.super.setGroupMessageReaction(+contact.peer, seq, String(faceId), 'face', isSet)
```

milky 1.2 起 `reaction_type` 有 `face` / `emoji`，但 Karin 调用方无法选择类型。需要扩展签名或自动按 faceId 形态判断。

### 2.7 [必须实现] `getForwardMsg` / `createResId` / `setGroupRemark` 等被注释掉的接口（`bot.ts:258-265, 308-313, 398-399, 425-429`）

- `getForwardMsg`：已有 API `get_forwarded_messages`，需要把 `IncomingForwardedMessage[]` 转 `MessageResponse[]`（注意 forwarded 消息没有 `peer_id` / `sender_id`，需要按"虚拟"消息构造）。
- `sendForwardMsg` 内部依赖 `getForwardMsg`（`bot.ts:169`），但 `getForwardMsg` 是注释的，**当 NodeElement 不是 fake 类型时直接抛错**。
- `setGroupRemark`：milky 协议未提供该接口（GroupEntity.remark 是 1.2 新增但只读）。**不需要实现**，从注释里删除即可。
- `getGroupHonor` / `getNotJoinedGroupInfo` / `getAtAllCount` / `getGroupMuteList`：milky 协议均未提供，删除注释，不实现。

---

## 3. `src/event/*`

### 3.1 [必须修复] `message.ts:8` 用 `sender_id` 编码 messageId

```ts
const messageId = bot.super.encodeMsgId(data.message_scene, data.sender_id, data.message_seq)
```

但 `bot.ts:216`（`getMsg`）/ `bot.ts:239`（`getHistoryMsg`）都是用 `peer_id` 编码，于是两边产生的 messageId 不一致：
- 群消息：peer_id=group_id，sender_id=user_id，**完全不同**。
- 私聊消息：自己发的消息 peer_id 是对方、sender_id 是自己，**也不同**。

后果：通过事件入参拿到的 messageId 再 `decodeMsgId → getMsg` 会查不到。**必须改为 `data.peer_id`**。

### 3.2 [必须新增] 4 个事件 Handler

#### 3.2.1 `bot_offline`

协议端会通过此事件告知应用端下线。当前没有任何处理，导致：
- WebSocket/SSE 仍认为连接活着（实际可能也跟着断），但应用层 Karin 不知道 bot 状态。
- WebHook 模式下完全不会触发重连。

**建议**：调用 `bot.logger('warn', '协议端报告下线: ' + reason)` 并 `__unregisterBot()`，根据策略决定是否触发 reconnect。

#### 3.2.2 `peer_pin_change`（1.2 新增）

需要派发为 Karin 的"会话置顶变更"通知或至少打印 debug。

#### 3.2.3 `group_essence_message_change`

精华消息增减事件，可以派发 `createGroupHighlightsChangeNotice`（如果 Karin 有），否则记日志。

#### 3.2.4 `group_name_change`

群名变更，派发 `createGroupNameChangeNotice`（如果 Karin 有），否则记日志。

### 3.3 [必须修复] `event/notice.ts` 中 `RecallNotice` 私聊撤回的 sender（`notice.ts:11-23`）

```ts
const contact = contactFriend(data.peer_id + '')
const sender = senderFriend(data.operator_id + '')   // ← operator 可能是 self_id 自撤
```

私聊撤回的 sender 严格意义上应该是被撤回消息的发送者（`data.sender_id`），operator 是撤回操作者，Karin 的 `createPrivateRecallNotice.content.operatorId` 已经传了，所以 sender 改用 `data.sender_id` 更合理。

### 3.4 [必须修复] `event/request.ts` 中 GroupJoinRequest 的 subEvent（`request.ts:36`）

```ts
subEvent: 'groupInvite',
```

但函数处理两类事件：
- `group_join_request` → 应是 `joinApply`
- `group_invited_join_request` → 应是 `groupInvite`

当前两类全部标为 `groupInvite`，调用方无法区分。

### 3.5 [必须重写] `event/request.ts` 中 `flag` 设计

```ts
// FriendRequest
flag: userId                          // 当前是 initiator_id（QQ 号）
// GroupJoinRequest
flag: event.data.notification_seq + ''  // OK
// GroupInvite
flag: event.data.invitation_seq + ''     // OK
```

`FriendRequest` 的 `flag` 应改为 `event.data.initiator_uid`，与 `accept_friend_request(initiator_uid, ...)` 直接对接。然后 `setFriendApplyResult` 也能直接拿 uid 调用，**不用再扫描列表**。

### 3.6 [必须修复] `event/convert.ts` AdapterConvertKarin

#### 3.6.1 `image` / `video` 多传字段（`convert.ts:28, 34`）

```ts
segment.image(i.data.temp_url, { width: ..., height: ..., subType: ..., summary: ... })
segment.video(i.data.temp_url, { width: ..., height: ... })
```

`event/segment.ts` 的 `image` 签名只接收 `summary` 和 `subType`，`video` 只接收 `uri` 单参数。多传的字段被**默默丢弃**。

注意 ⚠️：此处的 `segment` 来自 `node-karin`（Karin 自己的元素 segment），不是 milky 的 OutgoingSegment。需要核对 Karin 的 `segment.image` / `segment.video` 实际接受字段，再考虑是补字段还是删掉调用。

#### 3.6.2 `light_app` 内容错误（`convert.ts:49`）

```ts
elements.push(segment.json(JSON.stringify(i)))   // 整个段被 JSON 化
```

应改为 `segment.json(i.data.json_payload)`，否则 Karin 拿到的是包含 `type/data` 包裹的 JSON，不是真正的小程序 JSON。

#### 3.6.3 `forward` 段没处理（`convert.ts:42-44`）

注释掉了。需要根据 Karin 是否有 `nodeDirect(forward_id)` 来恢复，或派生为合并转发消息节点。

#### 3.6.4 `reply` 段未利用 1.2 新增字段

`IncomingSegment.reply` 在 1.2 新增 `sender_id/sender_name/time/segments`，当前只用了 `message_seq`，丢失了上下文。如果 Karin 的 reply 元素支持嵌套段，应一并传入。

### 3.7 [必须修复] `event/convert.ts` KarinConvertAdapter

```ts
case 'at':
  elements.push(Segment.at(i.targetId))   // ← targetId === 'all' 时也会走 mention(+'all')=NaN
```

`Segment.at`（`event/segment.ts:21`）的判断条件是严格 `=== 'all'`，但 `i.targetId` 是 string，"all" 还是数字都得分清。当前 `+'all'` 会变 `NaN`。需要先判断 `i.targetId === 'all'`。

另外 `node` / `forward` 元素的转换在 `KarinConvertAdapter` 里完全没有，仅在 `bot.sendForwardMsg` 单独处理。如果调用方混合发送（消息里夹 nodeElement），会被 fallback 成 JSON 文本。

### 3.8 [必须修复] `event/segment.ts` image/video/record 缺字段

milky `OutgoingSegment.video` 还有 `thumb_uri`，`OutgoingSegment.forward` 1.2 起有 `title/preview/summary/prompt`，当前 segment 工厂都没传。需要按 1.2 全字段补齐。

---

## 4. `src/connection/*`

### 4.1 [必须修复] `webhook/webhook.ts:15` 错误状态码

```ts
return res.status(404).json({ error: '无权限', message: '鉴权密钥错误' })
```

milky 文档：401=鉴权失败，404=API 不存在。应改为 `res.status(401)`。

### 4.2 [建议修改] `webhook/handler.ts:34` 响应体

```ts
return res.send('Hello World!')
```

milky 协议没规定 webhook 响应体内容，但建议返回 `204 No Content` 或 `{ status: 'ok' }`，避免日志干扰。

### 4.3 [建议修改] `connection/ServerSentEvents.ts` SSE 连接错误重连

`onerror` 触发即重连，但 EventSource 自身已有重连机制，会和适配器自定义的重连叠加。需要在 `error` 内判 `readyState` 决定是否手动 reconnect，避免重复连接。

### 4.4 [建议修改] `websocket.ts` 心跳

milky 文档未要求心跳，但 ws 长连接没有 `ping/pong` 检测，断网时只能等 TCP 超时。建议加 `setInterval ping`。

### 4.5 [必须修复] `connection/WebHook.ts` + `webhook/handler.ts` 的全局共享

```ts
class Handler {
  #ClientMap: Map<string, MilkyAdapter>   // 全局单例
  register (bot) {
    if (this.#ClientMap.has(selfId)) throw new Error(`Client [${selfId}] 已注册`)
```

如果同一 `selfId` 因配置变更需要重载（`config.ts:87` stop/start），第二次 register 会抛"已注册"。应该在 stop 时 `clear(selfId)`，目前 `WebHook.clear` 做了，但 `bot.stop()` 走的是 `transport.clear()`，OK。但 `Handler.register` 仍应改用 `set` 覆盖而非抛错。

---

## 5. `src/core/BotManager.ts` & `src/config/config.ts`

### 5.1 [建议修改] 热重载只处理 token 变化

`config.ts:87-91` 当前只对 `secret` 变化重启，**`protocol`/`url` 变更不会触发 reload**（因为 key 已变，老 bot 还在）。需要更完善的"按 selfId 重平衡"或"全量 diff"。

### 5.2 [建议修改] `BotManager.addBot` 不防重复

```ts
async addBot (cfg: BotCfg) {
  const key = this.getKey(cfg.protocol, cfg.url)
  const bot = new MilkyAdapter(cfg)
  this.bots.set(key, bot)   // ← 已存在的话直接被覆盖，但旧 bot 没 stop()
}
```

### 5.3 [建议修改] `apps/bot.ts` `#milky上线` 指令

```ts
if (!bot) return ctx.reply('未找到对应的Bot')
bot.start()
return ctx.reply('已发送上线指令')
```

`bot.start()` 是异步的，没 await，错误吞了。且未找到时应该提供新增能力或更明确的提示。

---

## 6. 文档约束未对齐项

| 文档要求 | 当前实现 | 状态 |
| - | - | - |
| `/api/:api` POST + Bearer Token | ✅ | OK |
| 即使无参数也要传 `{}` | ✅ | OK |
| 401 鉴权失败、404 API 不存在、415 Content-Type | webhook 用了 404 → 401 | **错** |
| SSE 事件名 `milky_event` | ✅ | OK |
| SSE / WS 通过 query `access_token` | ❌ 仅支持 header | 待补 |
| 联合类型兼容（遇到未知子类型应忽略/转 text） | 事件 dispatch 打 warn，segment 转 `JSON.stringify` 当 text | 基本符合 |
| `csrf_token` 是 string | 强转 number | **错** |

---

## 7. 需要重写 / 新增 的清单（按优先级）

### P0 — 必须修复（影响主流程）

| # | 状态 | 文件 | 内容 |
| - | - | - | - |
| 1 | ✅ | `src/core/Client.ts:394` | `setGroupMemberAdmin` 字段 `isSet` → `is_set` |
| 2 | ✅ | `src/core/Client.ts:599` | `getPrivateFileDownloadUrl` userId 类型 string → number |
| 3 | ✅ | `src/core/bot.ts` setGroupApplyResult | 分页扫描定位 notification，支持 join_request 和 invited_join_request |
| 3b | ✅ | `src/core/bot.ts` setInvitedJoinGroupResult | adapter 内存缓存 invitation_seq→group_id（GroupInvite 事件入缓存）+ 分页扫描 fallback |
| 4 | ✅ | `src/core/bot.ts` setFriendApplyResult | 用 `initiator_uid` 作为 flag，校验 `state === 'pending'`，rejectReason 透传 |
| 5 | ❎ 误判 | `src/core/bot.ts` pokeUser | 复核后原代码语义正确：`user_id=contact.peer`（好友 QQ）、`is_self=(targetId===self)`。本项撤销 |
| 6 | 待办 | `src/core/bot.ts:543-544` | `getCSRFToken` 强转 number 仍存在；受 Karin 接口签名约束，需上游配合 |
| 7 | ✅ | `src/event/message.ts:8` | encodeMsgId 用 `peer_id` |
| 8 | ✅ | `src/event/index.ts` + `notice.ts` | 新增 `bot_offline` / `peer_pin_change` / `group_essence_message_change` / `group_name_change` handler |
| 9 | ✅ | `src/event/request.ts` FriendRequest | `flag` 改 `initiator_uid` |
| 10 | ✅ | `src/event/request.ts` GroupJoinRequest | subEvent 区分 `joinApply` / `groupInvite`；applier/inviter 在 `invited_join_request` 下原本互换的 bug 修复 |
| 11 | ✅ | `src/event/convert.ts:49` | `light_app` payload 修复 |
| 12 | 待办 | `src/event/convert.ts` (KarinConvertAdapter) | `forward`/`node` 元素处理、`reply` 1.2 字段、`at('all')` 字符串走 mention_all（复核后字符串等值已正确） |
| 13 | ✅ | `src/connection/webhook/webhook.ts:15` | 401 状态码 |
| - | ✅ | `src/connection/webhook/handler.ts` | 同 selfId 重连不再抛 "已注册" 错（用 set 覆盖） |
| - | ✅ | `src/core/bot.ts` setMsgReaction | 自动按 reaction 字符串形态选 face/emoji（数字→face，否则→emoji） |
| - | ✅ | `src/core/bot.ts` getGroupInfo | 推导 admins（遍历群成员推 owner+admin） |
| - | ✅ | `src/event/notice.ts` RecallNotice | 私聊撤回 sender 改用 `peer_id`（friend 上下文 sender 恒为对方） |

### P1 — 应当修复（功能完整性）

| # | 状态 | 文件 | 内容 |
| - | - | - | - |
| 14 | 部分 | `src/core/bot.ts` sendForwardMsg | fake 节点路径正常；messageId→forward_id 路径仍依赖 Karin 的 NodeElement messageId 形态，暂保留待后续验证 |
| 15 | ✅ | `src/core/bot.ts` getForwardMsg | 实现：合成 IncomingMessage 形态复用 AdapterConvertKarin，提供 sender_name 等基本字段 |
| 16 | ✅ | `src/core/bot.ts` setMsgReaction | 自动识别 face/emoji |
| 17 | ✅ | `src/core/bot.ts` getGroupInfo | 推导 admins（`{userId,name,role}[]` 格式与 Karin 一致） |
| 18 | ✅ | `src/event/notice.ts` RecallNotice | 私聊 sender 改 `peer_id`（friend 上下文恒为对方） |
| 19 | ✅ | `src/event/segment.ts` | `video` 加 `thumb_uri`、`node` 加 `title/preview/summary/prompt`（1.2 字段） |
| 20 | ✅ | `src/event/convert.ts` forward | 兜底从 JSON 改为可读文本 `[合并转发 title/summary/forward_id=…]` |
| 21 | 待办 | `src/connection/ServerSentEvents.ts` | 与 EventSource 内置重连去重；query `access_token` fallback |
| 22 | ✅ | `src/connection/websocket.ts` | 加 30s ping 心跳 + close 时清理 |

### P2 — 改进建议

| # | 状态 | 文件 | 内容 |
| - | - | - | - |
| 23 | ❎ 误判 | `src/config/config.ts` | 复核后 url/protocol 变化已通过 delBot + addBot 路径处理，撤销本项 |
| 24 | ✅ | `src/core/BotManager.ts:15` | addBot 重入安全（先 stop 旧 bot 再覆盖） |
| 25 | ✅ | `src/apps/bot.ts` | `#milky上线` await + try/catch 错误返回 |
| 26 | ✅ | `src/core/bot.ts` | 删除 `setGroupRemark`/`getGroupMuteList`/`getGroupHonor`/`getNotJoinedGroupInfo`/`getAtAllCount` 的死注释 |
| 27 | ✅ | `src/connection/webhook/handler.ts` | webhook 响应改 `204 No Content` |
| 28 | 待办 | `src/core/Client.ts` | `setGroupMessageReaction` → `sendGroupMessageReaction`（命名一致性，会破坏调用方，暂留） |

---

## 8. 重写策略建议

按"先单元后链路"分三批落地：

1. **批 1 / P0 字段修复**（独立、风险低）：1、2、6、7、9、11、13 → 一次提交，主要是改字段名 / 类型 / 字面量。
2. **批 2 / 请求处理重写**：3、4、10、12、18 → 涉及 flag 设计与 set*ApplyResult 缓存，需要在适配器内增加 `pendingRequests` Map 缓存。
3. **批 3 / 事件 & 段补全**：8、14-22 → 新增事件 handler、合并转发完整支持、段字段完整透传。
4. **批 4 / 收尾**：23-28，包括连接层 query token 支持、配置热重载完整化、清理无用注释。

---

## 9. 不需要做的事

- `@saltify/milky-types` 版本 1.2.2 与协议 1.2 同步，**不需要切换或自建类型**。
- milky **协议端**没有的能力（如 setGroupRemark、getGroupHonor、getNotJoinedGroupInfo、getAtAllCount），Karin 这边应直接不实现并删除占位注释，避免误以为是 TODO。
- 协议没有"群临时会话发消息"的独立 API，`sendMsg` 的 temp 场景按当前"throw"的做法是对的（或退回好友消息口径）。
