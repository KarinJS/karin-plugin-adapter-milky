# @karinjs/plugin-adapter-milky

[![npm version](https://img.shields.io/npm/v/@karinjs/plugin-adapter-milky.svg?style=flat-square)](https://www.npmjs.com/package/@karinjs/plugin-adapter-milky)
[![license](https://img.shields.io/npm/l/@karinjs/plugin-adapter-milky.svg?style=flat-square)](LICENSE)
[![milky](https://img.shields.io/badge/milky-1.2-blueviolet?style=flat-square)](https://milky.ntqqrev.org/)
[![karin](https://img.shields.io/badge/karin-%5E1.15-cyan?style=flat-square)](https://karinjs.com)

基于 [Milky 协议 1.2](https://milky.ntqqrev.org/) 的 [Karin](https://github.com/KarinJS/Karin) QQ 机器人适配器。覆盖 milky 协议端全部 64 个 API、20 类事件、4 种传输形态，按 milky IR API 域组织代码结构。

> 协议覆盖度、修复历史与架构记录详见 [`DIFF_REPORT.md`](DIFF_REPORT.md)。

---

## 特性

- ✅ **协议覆盖完整**：milky 1.2 协议 IR 定义的 64 个 API 全部接入（system / friend / group / message / file 五大域）
- ✅ **事件全分发**：20 类事件全覆盖，包括 1.2 新增的 `peer_pin_change`、`bot_offline`、`group_essence_message_change`、`group_name_change`
- ✅ **三种传输形态**：WebSocket / SSE / Webhook 任选其一，支持多 Bot 并存
- ✅ **配置热重载**：修改 `config.json` 后自动 reload 变化的 Bot，无需重启 Karin
- ✅ **稳健的连接管理**：WebSocket 30s ping 心跳、SSE 与 EventSource 自身重连去重、断线自动重试
- ✅ **类型安全**：使用 [`@saltify/milky-types`](https://www.npmjs.com/package/@saltify/milky-types) 官方类型库

---

## 安装

```bash
pnpm add @karinjs/plugin-adapter-milky -w
```

或在 Karin WebUI 的"插件管理"中搜索 `plugin-adapter-milky` 直接安装。

**运行环境要求**：Node.js ≥ 18、Karin ≥ 1.15

---

## 配置

首次启动 Karin 时会自动在以下路径生成配置：

```
<Karin 数据目录>/@karinjs/plugin-adapter-milky/config/config.json
```

默认内容：

```jsonc
{
  "reconnectMaxCount": 5,        // 最大重连次数；-1 表示无限重连
  "reconnectInterval": 5,        // 重连间隔（秒）
  "webhookToken": "<随机生成>",  // 仅 webhook 模式使用，见下方说明
  "bots": []                     // 每个元素配置一个连接到 milky 协议端的 Bot
}
```

修改配置后**无需重启**，文件监听会自动 reload 变化的 Bot。

### Bot 配置

每个 Bot 用 `bots` 数组里的一项描述：

```jsonc
{
  "protocol": "websocket",          // 通信方式：websocket / sse / webhook
  "url": "http://127.0.0.1:8080",   // milky 协议端地址（websocket/sse）或 webhook 模式下仅用于发送 API 请求
  "token": "your-protocol-token"    // milky 协议端配置的 access_token，用于鉴权
}
```

| 字段 | 必填 | 说明 |
| - | - | - |
| `protocol` | ✅ | 通信方式，三选一：`websocket` / `sse` / `webhook` |
| `url` | ✅ | milky 协议端 HTTP 地址，例 `http://127.0.0.1:8080`；本插件会自动拼接 `/api/` 和 `/event` 子路径 |
| `token` | ✅ | milky 协议端配置文件里设置的 `access_token`。本插件会在 HTTP 请求头加 `Authorization: Bearer <token>`；websocket/sse 连接同样会带这个 token |

### 全局配置

| 字段 | 默认值 | 说明 |
| - | - | - |
| `reconnectMaxCount` | `5` | 单个 Bot 断线后最多重连次数；设 `-1` 为无限重连 |
| `reconnectInterval` | `5` | 重连间隔（秒），最小为 1 |
| `webhookToken` | 随机串 | **仅 webhook 模式使用**——协议端 POST 事件到本插件时，本插件校验请求头 `Authorization: Bearer <webhookToken>`；与 `bots[].token`（本插件发请求时用的）**职责相反**，不要混淆 |

---

## 三种传输方式怎么选

| 模式 | 方向 | 何时选用 |
| - | - | - |
| `websocket` | 本插件主动连协议端（持久长连接） | **推荐默认**。低延迟，支持 ping 心跳，断线自动重连 |
| `sse` | 本插件主动连协议端（HTTP SSE） | 协议端不支持 WebSocket 时；调试方便（curl 可直接观察事件流） |
| `webhook` | 协议端反向 POST 到本插件 | 本插件部署在公网或协议端无法主动出网时；需要把本插件挂到 Karin 的 HTTP server 上 |

### Webhook 模式细节

启用 webhook 模式时，本插件会在 Karin 的 express server 上挂载以下端点：

```
POST http://<karin-host>:<HTTP_PORT>/milky/api/v1/webhook
GET  http://<karin-host>:<HTTP_PORT>/milky/api/v1/webhook   # 健康检查
```

请在 **milky 协议端**的配置里把 webhook 推送地址指向这里，并把 `webhookToken` 同步配置为协议端的 access_token。

---

## 命令

在 Karin 中向 Bot 发送（仅 master 权限）：

```
#milky上线<protocol>,<url>
```

例：

```
#milky上线websocket,http://127.0.0.1:8080
```

会触发 `BotManager` 对该 Bot 执行 `start()`（如果尚未上线）。**注意**：该指令只能上线已经存在于 `config.json` 的 Bot，不能新增。

---

## 项目结构

```
src/
├── index.ts                   入口（副作用：加载所有 Bot）
├── apps/bot.ts                karin 命令：#milky上线
├── config/                    配置层（监听 + 热重载）
├── core/
│   ├── milkyAdapter.ts        MilkyAdapter 主类（实现 Karin AdapterType）
│   ├── botManager.ts          Bot 实例管理
│   ├── invitationCache.ts     邀请自身入群事件的 invitation_seq → group_id 缓存
│   ├── notificationLookup.ts  群通知分页扫描定位
│   └── client/                按 milky IR API 域拆分的 HTTP 客户端
│       ├── index.ts           Client 主类 + axios + wiring
│       ├── system.ts          17 个系统 API
│       ├── friend.ts          6 个好友 API
│       ├── group.ts           21 个群 API
│       ├── message.ts         9 个消息 API
│       ├── file.ts            11 个文件 API
│       └── msgId.ts           varint + encodeMsgId/decodeMsgId 纯函数
├── transport/                 三种传输形态
│   ├── websocket.ts           WebSocketClient（带 30s ping 心跳）
│   ├── sse.ts                 SSEClient
│   └── webhook/
│       ├── index.ts           barrel
│       ├── server.ts          express router（挂到 Karin HTTP server）
│       └── registry.ts        多 Bot 注册中心
├── event/                     milky 事件 → Karin 事件转换
│   ├── index.ts               事件分发表
│   ├── message.ts             消息事件
│   ├── notice.ts              通知事件（含 4 个 1.2 新增 handler）
│   ├── request.ts             请求事件
│   ├── convert.ts             milky ↔ Karin 段双向转换
│   └── segment.ts             OutgoingSegment 工厂
└── utils/
```

---

## 本地开发

```bash
git clone https://github.com/KarinJS/karin-plugin-adapter-milky.git
cd karin-plugin-adapter-milky
pnpm install

# 类型检查（不输出文件）
npx tsc --noEmit --skipLibCheck

# 开发模式（tsx 直接跑 src，免编译）
pnpm dev

# 构建（tsup 输出到 lib/）
pnpm build
```

---

## 兼容性

- **milky 协议**：1.2（含 1.0 / 1.1 全部字段；1.2 新增字段 `peer_pin_change` / `group_invitation.source_group_id` / `OutgoingSegment.forward.title|preview|summary|prompt` / `mention.name` / `reply.sender_id|sender_name|time|segments` / `reaction_type` / `light_app` OutgoingSegment 均已支持）
- **Karin**：≥ 1.15
- **Node.js**：≥ 18（tsup 编译目标）

---

## 参考资料

- [Milky 协议文档](https://milky.ntqqrev.org/)
- [Milky GitHub](https://github.com/SaltifyDev/milky)
- [Karin 文档](https://karinjs.com)
- [Karin GitHub](https://github.com/KarinJS/Karin)
- [`@saltify/milky-types`](https://www.npmjs.com/package/@saltify/milky-types) — milky 1.2 TypeScript 类型库
- [本仓库整改记录](DIFF_REPORT.md)

---

## 贡献

欢迎提 Issue / PR。代码风格遵循 `neostandard`，commit 信息建议遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 中文形态（参考本仓库 git log）。

## 许可证

[MIT](LICENSE) © KarinJS
