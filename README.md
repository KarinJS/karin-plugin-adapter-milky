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

---

## 快速开始

### 配置文件方式（推荐）

在 Karin 的配置目录中创建 `config/adapter.yaml`（如果还没有），添加 Milky 适配器配置：

```yaml
milky:
  # WebSocket 模式
  websocket:
    enable: true
    url: ws://localhost:3000/event
    accessToken: your-access-token  # 可选
    autoReconnect: true
    reconnectInterval: 5000
    maxReconnectAttempts: 10

  # HTTP 模式
  http:
    enable: false
    baseUrl: http://localhost:3000
    accessToken: your-access-token  # 可选
```

### 代码方式

在你的 Karin 插件或应用中：

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

- ✅ `message_receive` - 消息接收
- ⏳ `message_recall` - 消息撤回（待实现）
- ⏳ `friend_request` - 好友请求（待实现）
- ⏳ `group_*` - 群组事件（待实现）
- ⏳ 其他事件（待实现）

---

## 开发

### 项目结构

```
src/
├── adapter/           # Karin 适配器实现
│   ├── adapter.ts    # AdapterMilky 主类
│   ├── create.ts     # 适配器创建函数
│   ├── message.ts    # 消息事件转换
│   └── index.ts
├── core/              # 核心基类
├── api/               # API 类型定义
├── event/             # 事件类型
├── connection/        # 连接层（HTTP/WebSocket）
└── index.ts           # 入口文件
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
