import { logger } from 'node-karin'
import { AdapterMilky } from './adapter'
import { MilkyWebSocket } from '../connection/websocket'
import { MilkyHttp } from '../connection/http'
import type { MilkyWebSocketOptions } from '../connection/websocket'
import type { MilkyHttpOptions } from '../connection/http'

/**
 * 创建Milky WebSocket适配器
 */
export async function createMilkyWebSocket (options: MilkyWebSocketOptions) {
  const milky = new MilkyWebSocket(options)
  const adapter = new AdapterMilky(milky)

  adapter.adapter.address = options.url
  adapter.adapter.communication = 'webSocketClient'

  // 监听连接事件
  milky.on('connected', async () => {
    logger.info(`[Milky] WebSocket连接成功: ${options.url}`)
    await adapter.init()
    await adapter.setBotInfo()
    adapter.registerBot()
  })

  milky.on('disconnected', () => {
    adapter.unregisterBot()
    logger.warn(`[Milky] WebSocket连接断开: ${options.url}`)
  })

  milky.on('reconnecting', (attempt: number) => {
    logger.info(`[Milky] 正在尝试重连... (第${attempt}次)`)
  })

  milky.on('error', (error: Error) => {
    logger.error('[Milky] 发生错误:', error)
  })

  return adapter
}

/**
 * 创建Milky HTTP适配器
 */
export async function createMilkyHttp (options: MilkyHttpOptions) {
  const milky = new MilkyHttp(options)
  const adapter = new AdapterMilky(milky)

  adapter.adapter.address = options.baseUrl
  adapter.adapter.communication = 'http'

  await adapter.init()
  await adapter.setBotInfo()
  adapter.registerBot()

  logger.info(`[Milky] HTTP客户端初始化成功: ${options.baseUrl}`)

  return adapter
}
