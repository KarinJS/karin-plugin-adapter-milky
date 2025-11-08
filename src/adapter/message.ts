import { logger } from 'node-karin'
import type { AdapterMilky } from './adapter'

/**
 * 将Milky消息事件转换为Karin事件
 */
export function createMessage (data: any, adapter: AdapterMilky) {
  // TODO: 实现消息事件转换
  // 参考 /tmp/Karin/packages/core/src/adapter/onebot/create/message.ts
  logger.bot('debug', adapter.selfId, '收到消息事件:', data)
}
