# Karin Milky 适配器

基于 [Milky 协议](https://milky.ntqqrev.org/) 的 Karin 适配器插件实现。

## 📖 目录

- [简介](#简介)
- [安装](#安装)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [API 支持](#api-支持)
- [事件支持](#事件支持)
- [开发](#开发)

---

## 简介

本插件是 Karin 的 Milky 协议适配器，使 Karin 能够连接到支持 Milky 协议的 QQ 机器人后端。

**特性：**
- ✅ 完整的 Karin 适配器实现
- ✅ 支持 HTTP 和 WebSocket 连接模式
- ✅ 自动注册到 Karin Bot 列表
- ✅ 支持消息发送、撤回等核心功能
- ✅ TypeScript 类型安全
- ✅ 自动重连（WebSocket 模式）

---

## 安装

在 Karin 项目根目录下执行：

```bash
pnpm add karin-plugin-adapter-milky -w
```

## 使用说明

### 第一次使用

1. **安装插件**（见上方安装命令）

2. **启动 Karin**
   
   首次启动时，插件会自动创建配置文件：
   - 配置目录：`@karinjs/karin-plugin-adapter-milky/config/`
   - 配置文件：`config.json`

3. **修改配置**
   
   找到并编辑配置文件：
   ```json
   {
     "websocket": {
       "enable": true,  // 改为 true 启用
       "url": "ws://your-milky-server:3000/event",  // 修改为你的服务器地址
       "accessToken": "your-token"  // 如果需要认证，填写token
     }
   }
   ```

4. **重启 Karin**
   
   配置修改后重启，适配器会自动连接并注册 Bot

### 配置文件监听

插件会自动监听配置文件变化并提示，但需要重启才能应用更改。

### 多适配器模式

可以同时启用 WebSocket 和 HTTP：

```json
{
  "websocket": {
    "enable": true,
    "url": "ws://server1:3000/event"
  },
  "http": {
    "enable": true,
    "baseUrl": "http://server2:3000"
  }
}
```

---

## 快速开始

### 自动配置（推荐）

插件会在首次加载时自动创建配置文件。编辑配置文件即可启用适配器：

**配置文件位置：** `@karinjs/karin-plugin-adapter-milky/config/config.json`

```json
{
  "websocket": {
    "enable": true,
    "url": "ws://localhost:3000/event",
    "accessToken": "",
    "autoReconnect": true,
    "reconnectInterval": 5000,
    "maxReconnectAttempts": 10,
    "timeout": 120000
  },
  "http": {
    "enable": false,
    "baseUrl": "http://localhost:3000",
    "accessToken": "",
    "timeout": 120000
  }
}
```

**使用步骤：**

1. 安装插件：`pnpm add karin-plugin-adapter-milky -w`
2. 重启 Karin，插件会自动创建配置文件
3. 修改配置文件中的 `url` 和 `accessToken`
4. 将 `enable` 设置为 `true`
5. 再次重启 Karin

适配器会自动连接并注册到 Karin Bot 列表。

### Web UI 配置

如果你的 Karin 安装了 Web UI，也可以通过 Web 界面配置适配器：

1. 访问 Karin Web UI
2. 进入"插件管理" > "Milky适配器"
3. 在界面中修改配置
4. 保存并重启 Karin

### 代码方式（高级）

如果需要更灵活的控制，可以手动创建适配器：

```typescript
import { createMilkyWebSocket, createMilkyHttp } from 'karin-plugin-adapter-milky'

// WebSocket 模式（推荐用于实时消息）
const adapter = await createMilkyWebSocket({
  url: 'ws://localhost:3000/event',
  accessToken: 'your-token',  // 可选
  autoReconnect: true,
})

// HTTP 模式（适用于简单的API调用）
const adapter = await createMilkyHttp({
  baseUrl: 'http://localhost:3000',
  accessToken: 'your-token',  // 可选
})
```

适配器会自动注册到 Karin，之后可以通过 Karin 的标准 API 使用。

---

## 配置说明

### 配置文件

配置文件位于：`@karinjs/karin-plugin-adapter-milky/config/config.json`

插件会在首次加载时自动复制默认配置文件。修改配置后需要重启 Karin 才能生效。

### WebSocket 配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| url | string | - | WebSocket 服务器地址（必填） |
| accessToken | string | - | 访问令牌（可选） |
| autoReconnect | boolean | true | 是否自动重连 |
| reconnectInterval | number | 5000 | 重连间隔（毫秒） |
| maxReconnectAttempts | number | 10 | 最大重连次数 |
| timeout | number | 120000 | API 调用超时（毫秒） |

### HTTP 配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| baseUrl | string | - | API 基础URL（必填） |
| accessToken | string | - | 访问令牌（可选） |
| timeout | number | 120000 | 请求超时（毫秒） |

---

## API 支持

适配器实现了 Karin 的标准 API 接口，主要包括：

### 消息相关
- `sendMsg` - 发送消息（支持私聊和群聊）
- `recallMsg` - 撤回消息
- `getAvatarUrl` - 获取头像链接

### Milky 原生 API

适配器底层支持所有 Milky 协议 API（28个方法）：

**消息 API (9个)**
- send_private_message, send_group_message
- recall_private_message, recall_group_message
- get_message, get_history_messages
- get_resource_temp_url, get_forwarded_messages
- mark_message_as_read

**好友 API (5个)**
- send_friend_nudge, send_profile_like
- get_friend_requests, accept_friend_request
- reject_friend_request

**群组 API (14个)**
- set_group_name, set_group_avatar
- set_group_member_card, set_group_member_special_title
- set_group_member_admin, set_group_member_mute
- set_group_whole_mute, kick_group_member
- get_group_announcements, send_group_announcement
- delete_group_announcement, get_group_essence_messages
- set_group_essence_message, quit_group
- send_group_message_reaction, send_group_nudge

---

## 事件支持

适配器会接收并转换以下 Milky 事件到 Karin 事件系统：

**消息事件**
- ✅ `message_receive` - 消息接收（私聊/群聊）
- ✅ `message_recall` - 消息撤回

**好友事件**
- ✅ `friend_request` - 好友请求
- ✅ `friend_nudge` - 好友戳一戳
- ✅ `friend_file_upload` - 好友文件上传

**群组事件**
- ✅ `group_join_request` - 加群请求
- ✅ `group_invitation` - 群邀请
- ✅ `group_member_increase` - 群成员增加
- ✅ `group_member_decrease` - 群成员减少
- ✅ `group_admin_change` - 群管理员变更
- ✅ `group_name_change` - 群名称变更
- ✅ `group_essence_message_change` - 群精华消息变更
- ✅ `group_message_reaction` - 群消息表情回应

**机器人事件**
- ✅ `bot_offline` - Bot离线（自动触发重连）

**连接事件**
- ✅ `connected` - 连接成功
- ✅ `disconnected` - 连接断开
- ✅ `reconnecting` - 重连中
- ✅ `error` - 错误事件

---

## 自定义路由 API

插件提供 HTTP API 用于监控和管理适配器。

### 路由设置

```typescript
import { milkyRouter } from 'karin-plugin-adapter-milky'

// 在 Karin 应用中设置路由
milkyRouter.setup(app)
```

### API 端点

**获取所有适配器状态**
```
GET /api/milky/status
```

响应：
```json
{
  "success": true,
  "data": {
    "123456": {
      "selfId": "123456",
      "nickname": "Bot",
      "platform": "qq",
      "standard": "other",
      "communication": "webSocketClient",
      "isConnected": true
    }
  }
}
```

**获取单个适配器状态**
```
GET /api/milky/status/:selfId
```

**重连适配器**
```
POST /api/milky/reconnect/:selfId
```

### 编程方式使用路由

```typescript
import { milkyRouter } from 'karin-plugin-adapter-milky'

// 获取所有适配器状态
const allStatus = milkyRouter.getStatus()

// 获取单个适配器状态
const status = milkyRouter.getAdapterStatus('123456')

// 重连适配器
await milkyRouter.reconnect('123456')
```

---

## 开发

### 项目结构

```
src/
├── adapter/           # Karin 适配器实现
│   ├── adapter.ts    # AdapterMilky 主类
│   ├── create.ts     # 适配器创建函数
│   ├── message.ts    # 消息事件转换
│   ├── events.ts     # 事件处理器
│   └── index.ts
├── core/              # 核心基类
├── api/               # API 类型定义
├── event/             # 事件类型
├── connection/        # 连接层（HTTP/WebSocket）
├── router/            # 自定义路由
│   └── index.ts      # HTTP API 路由
├── utils/             # 工具函数
│   ├── Root.ts       # 插件根信息
│   ├── dir.ts        # 目录路径管理
│   ├── config.ts     # 配置文件加载
│   └── index.ts
├── web.config.ts      # Web UI 配置
└── index.ts           # 入口文件（自动加载配置）

config/                # 默认配置文件
└── config.json        # Milky 适配器配置
```

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/KarinJS/karin-plugin-adapter-milky.git
cd karin-plugin-adapter-milky

# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 类型检查
npx tsc --noEmit
```

### 扩展适配器

如果需要实现更多 Karin API 方法，可以在 `src/adapter/adapter.ts` 中的 `AdapterMilky` 类中添加：

```typescript
export class AdapterMilky extends AdapterBase {
  // 实现更多 Karin API...
  async getGroupMemberInfo(groupId: string, userId: string) {
    // 调用 Milky API
    return await this._milky.callApi('get_group_member_info', {
      group_id: groupId,
      user_id: userId
    })
  }
}
```

---

## 与原始实现的区别

本版本已重构为 **Karin 适配器插件**：

1. **集成方式**：现在是 Karin 的原生适配器，而不是独立客户端
2. **使用方式**：通过 Karin 的标准 API 使用，而不是直接调用 Milky API
3. **生命周期**：由 Karin 管理，自动注册和注销
4. **事件处理**：事件会转换为 Karin 事件并通过 Karin 的事件系统分发

如果你需要直接使用 Milky 客户端，仍然可以导入底层的连接类：

```typescript
import { MilkyWebSocket, MilkyHttp } from 'karin-plugin-adapter-milky'
```

---

## 参考资料

- [Milky 协议文档](https://milky.ntqqrev.org/)
- [Milky GitHub](https://github.com/SaltifyDev/milky)
- [Karin 文档](https://github.com/KarinJS/Karin)
- [Karin OneBot 适配器](https://github.com/KarinJS/Karin/tree/main/packages/onebot)

---

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

GPL-3.0 License
