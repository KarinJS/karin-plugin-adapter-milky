import {
  logger,
} from 'node-karin'
import type { AdapterMilky } from './adapter'

/**
 * 处理好友请求事件
 */
export function handleFriendRequest (data: any, adapter: AdapterMilky) {
  try {
    logger.bot('info', adapter.selfId, '[Milky] 好友请求事件:', {
      user_id: data.user_id,
      message: data.message,
      flag: data.flag,
    })
    // TODO: 创建 Karin 好友请求事件对象并触发
    // 当前版本：记录日志，管理员可通过 adapter.handleFriendRequest() 手动处理
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

/**
 * 处理好友戳一戳事件
 */
export function handleFriendNudge (data: any, adapter: AdapterMilky) {
  try {
    logger.bot('info', adapter.selfId, '[Milky] 好友戳一戳事件:', {
      user_id: data.user_id,
      sender_id: data.sender_id,
    })
    // TODO: 创建 Karin 好友戳一戳通知事件
  } catch (error) {
    logger.error('[Milky] 处理好友戳一戳事件失败:', error, data)
  }
}

/**
 * 处理好友文件上传事件
 */
export function handleFriendFileUpload (data: any, adapter: AdapterMilky) {
  try {
    logger.bot('info', adapter.selfId, '[Milky] 好友文件上传事件:', {
      user_id: data.user_id,
      file: data.file,
    })
    // TODO: 创建 Karin 好友文件上传通知事件
  } catch (error) {
    logger.error('[Milky] 处理好友文件上传事件失败:', error, data)
  }
}

/**
 * 处理群名称变更事件
 */
export function handleGroupNameChange (data: any, adapter: AdapterMilky) {
  try {
    logger.bot('info', adapter.selfId, '[Milky] 群名称变更事件:', {
      group_id: data.group_id,
      old_name: data.old_name,
      new_name: data.new_name,
      operator_id: data.operator_id,
    })
    // TODO: 创建 Karin 群名称变更通知事件
  } catch (error) {
    logger.error('[Milky] 处理群名称变更事件失败:', error, data)
  }
}

/**
 * 处理群精华消息变更事件
 */
export function handleGroupEssenceMessageChange (data: any, adapter: AdapterMilky) {
  try {
    logger.bot('info', adapter.selfId, '[Milky] 群精华消息变更事件:', {
      group_id: data.group_id,
      message_id: data.message_id,
      sub_type: data.sub_type, // add or delete
      operator_id: data.operator_id,
    })
    // TODO: 创建 Karin 群精华消息变更通知事件
  } catch (error) {
    logger.error('[Milky] 处理群精华消息变更事件失败:', error, data)
  }
}

/**
 * 处理群消息表情回应事件
 */
export function handleGroupMessageReaction (data: any, adapter: AdapterMilky) {
  try {
    logger.bot('info', adapter.selfId, '[Milky] 群消息表情回应事件:', {
      group_id: data.group_id,
      message_id: data.message_id,
      user_id: data.user_id,
      emoji_id: data.emoji_id,
      is_add: data.is_add,
    })
    // TODO: 创建 Karin 群消息表情回应通知事件
  } catch (error) {
    logger.error('[Milky] 处理群消息表情回应事件失败:', error, data)
  }
}

/**
 * 处理群戳一戳事件
 */
export function handleGroupNudge (data: any, adapter: AdapterMilky) {
  try {
    logger.bot('info', adapter.selfId, '[Milky] 群戳一戳事件:', {
      group_id: data.group_id,
      user_id: data.user_id,
      sender_id: data.sender_id,
    })
    // TODO: 创建 Karin 群戳一戳通知事件
  } catch (error) {
    logger.error('[Milky] 处理群戳一戳事件失败:', error, data)
  }
}
