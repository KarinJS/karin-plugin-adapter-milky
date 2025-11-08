# Milky 适配器实现路线图

## 阶段一：核心消息功能 ✅ (已完成)

### 1.1 基础架构 ✅
- [x] AdapterMilky 类继承 AdapterBase
- [x] HTTP 客户端实现
- [x] WebSocket 客户端实现
- [x] 配置文件系统
- [x] 自动加载和初始化

### 1.2 适配器注册 ✅
- [x] registerBot/unregisterBot 集成
- [x] 连接生命周期管理
- [x] 错误处理和重连

## 阶段二：事件接收和消息发送 ✅ (已完成)

### 2.1 消息事件转换 ✅
- [x] 实现 createMessage 函数
  - [x] 私聊消息事件转换
  - [x] 群聊消息事件转换
  - [ ] 临时会话消息事件转换
- [x] Milky 消息格式 → Karin Element 转换
  - [x] 文本消息
  - [x] 图片消息
  - [x] 语音消息
  - [x] 视频消息
  - [x] At 消息
  - [x] 回复消息
  - [x] 其他消息类型

### 2.2 消息发送实现 ✅
- [x] sendMsg 基础实现
- [x] Karin Element → Milky 格式转换
- [x] 完善消息元素转换
  - [x] 文本、图片、表情
  - [x] At、回复
  - [x] 语音、视频、文件
  - [x] JSON、XML、Markdown

### 2.3 消息撤回 ✅
- [x] recallMsg 基础实现
- [x] 错误处理优化

## 阶段三：扩展 API 实现 🔄 (进行中)

### 3.1 好友相关 API
- [x] getFriendList - 获取好友列表
- [x] sendFriendNudge - 发送好友戳一戳
- [x] sendProfileLike - 点赞
- [ ] handleFriendRequest - 处理好友请求

### 3.2 群组相关 API
- [x] getGroupList - 获取群列表
- [x] getGroupMemberList - 获取群成员列表
- [x] getGroupMemberInfo - 获取群成员信息
- [x] setGroupName - 设置群名称
- [x] setGroupCard - 设置群名片
- [x] setGroupAdmin - 设置管理员
- [x] setGroupMute - 禁言
- [x] setGroupWholeMute - 全员禁言
- [x] kickGroupMember - 踢出群成员
- [x] quitGroup - 退出群聊
- [x] sendGroupNudge - 发送群戳一戳

### 3.3 消息相关 API
- [x] getMsg - 获取消息
- [x] getHistoryMsg - 获取历史消息
- [ ] getForwardMsg - 获取合并转发消息
- [ ] sendForwardMsg - 发送合并转发消息

### 3.4 资源相关 API
- [x] getAvatarUrl - 获取头像 URL
- [x] getGroupAvatarUrl - 获取群头像 URL
- [ ] uploadFile - 上传文件
- [ ] downloadFile - 下载文件

## 阶段四：事件系统完善 🔄 (进行中)

### 4.1 通知事件
- [x] 好友事件
  - [x] 好友请求 (日志记录)
  - [ ] 好友添加
  - [ ] 好友删除
  - [ ] 好友戳一戳
  - [ ] 好友文件上传
- [x] 群组事件
  - [x] 群成员增加 (日志记录)
  - [x] 群成员减少 (日志记录)
  - [x] 群管理员变更 (日志记录)
  - [ ] 群禁言
  - [ ] 群名称变更
  - [ ] 群精华消息
  - [ ] 群消息表情回应

### 4.2 请求事件
- [x] 好友请求 (日志记录)
- [x] 加群请求 (日志记录)
- [x] 群邀请 (日志记录)

### 4.3 元事件
- [x] Bot离线事件 (日志记录 + 重连)
- [x] 消息撤回事件 (日志记录)
- [ ] 生命周期事件
- [ ] 心跳事件

## 阶段五：Karin 集成优化 ⏳ (待开始)

### 5.1 自定义路由 (推荐)
- [ ] 创建 Milky 专用路由
- [ ] WebSocket 连接管理路由
- [ ] 配置管理路由
- [ ] 状态查询路由

### 5.2 使用更多 Karin 内部 API
- [ ] segment 工具使用
- [ ] makeMessage 消息构造
- [ ] makeForward 转发消息构造
- [ ] hooks 钩子系统集成
- [ ] watch 文件监听
- [ ] redis 缓存使用
- [ ] render 渲染功能

### 5.3 Web UI 集成
- [ ] 完善 web.config 配置项
- [ ] 添加适配器状态面板
- [ ] 添加消息统计
- [ ] 添加连接管理界面

## 阶段六：测试和文档 ⏳ (待开始)

### 6.1 单元测试
- [ ] API 方法测试
- [ ] 事件转换测试
- [ ] 消息格式转换测试
- [ ] 配置加载测试

### 6.2 集成测试
- [ ] 与真实 Milky 服务器测试
- [ ] 消息收发测试
- [ ] 事件处理测试
- [ ] 错误恢复测试

### 6.3 文档完善
- [ ] API 使用文档
- [ ] 事件处理文档
- [ ] 配置说明文档
- [ ] 故障排查文档

## 阶段七：性能优化 ⏳ (待开始)

### 7.1 性能优化
- [ ] 消息队列优化
- [ ] 连接池管理
- [ ] 内存使用优化
- [ ] 错误重试策略

### 7.2 稳定性增强
- [ ] 异常恢复机制
- [ ] 消息去重
- [ ] 请求限流
- [ ] 日志完善

## 当前优先级

### 立即实现 (本次提交)
1. ✅ 创建实现路线图
2. 🔄 实现消息事件接收和转换
3. 🔄 完善消息元素转换
4. 🔄 使用 Karin 内部 API (segment, createMessage 等)

### 下一步
1. 实现更多事件类型
2. 扩展 API 方法
3. 添加自定义路由
4. 集成测试

## 参考资料

- Milky 协议文档: https://milky.ntqqrev.org/
- Karin OneBot 实现: /tmp/Karin/packages/core/src/adapter/onebot
- Karin 事件系统: /tmp/Karin/packages/core/src/event
- Karin 路由系统: /tmp/Karin/packages/core/src/server/router
