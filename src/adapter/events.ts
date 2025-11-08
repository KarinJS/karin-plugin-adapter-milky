import {
  logger,
} from 'node-karin'
import type { AdapterMilky } from './adapter'

/**
 * 处理好友请求事件
 */
export function handleFriendRequest (data: any, adapter: AdapterMilky) {
  try {
    logger.bot('info', adapter.selfId, '[Milky] 好友请求事件:', data)
    // TODO: 创建 Karin 好友请求事件
  } catch (error) {
    logger.error('[Milky] 处理好友请求事件失败:', error, data)
  }
}

/**
 * 处理加群请求事件
 */
export function handleGroupJoinRequest (data: any, adapter: AdapterMilky) {
  try {
    logger.bot('info', adapter.selfId, '[Milky] 加群请求事件:', data)
    // TODO: 创建 Karin 加群请求事件
  } catch (error) {
    logger.error('[Milky] 处理加群请求事件失败:', error, data)
  }
}

/**
 * 处理群邀请事件
 */
export function handleGroupInvitation (data: any, adapter: AdapterMilky) {
  try {
    logger.bot('info', adapter.selfId, '[Milky] 群邀请事件:', data)
    // TODO: 创建 Karin 群邀请事件
  } catch (error) {
    logger.error('[Milky] 处理群邀请事件失败:', error, data)
  }
}

/**
 * 处理群成员增加事件
 */
export function handleGroupMemberIncrease (data: any, adapter: AdapterMilky) {
  try {
    logger.bot('info', adapter.selfId, '[Milky] 群成员增加事件:', data)
    // TODO: 创建 Karin 群成员增加通知
  } catch (error) {
    logger.error('[Milky] 处理群成员增加事件失败:', error, data)
  }
}

/**
 * 处理群成员减少事件
 */
export function handleGroupMemberDecrease (data: any, adapter: AdapterMilky) {
  try {
    logger.bot('info', adapter.selfId, '[Milky] 群成员减少事件:', data)
    // TODO: 创建 Karin 群成员减少通知
  } catch (error) {
    logger.error('[Milky] 处理群成员减少事件失败:', error, data)
  }
}

/**
 * 处理群管理员变更事件
 */
export function handleGroupAdminChange (data: any, adapter: AdapterMilky) {
  try {
    logger.bot('info', adapter.selfId, '[Milky] 群管理员变更事件:', data)
    // TODO: 创建 Karin 群管理员变更通知
  } catch (error) {
    logger.error('[Milky] 处理群管理员变更事件失败:', error, data)
  }
}

/**
 * 处理消息撤回事件
 */
export function handleMessageRecall (data: any, adapter: AdapterMilky) {
  try {
    logger.bot('info', adapter.selfId, '[Milky] 消息撤回事件:', data)
    // TODO: 使用 Karin 的消息撤回通知事件（如果有）
  } catch (error) {
    logger.error('[Milky] 处理消息撤回事件失败:', error, data)
  }
}

/**
 * 处理Bot离线事件
 */
export function handleBotOffline (data: any, adapter: AdapterMilky) {
  try {
    logger.bot('warn', adapter.selfId, '[Milky] Bot离线:', data)
    // 触发断线重连
    if (adapter._milky && 'reconnect' in adapter._milky) {
      // @ts-ignore
      adapter._milky.reconnect?.()
    }
  } catch (error) {
    logger.error('[Milky] 处理Bot离线事件失败:', error, data)
  }
}
