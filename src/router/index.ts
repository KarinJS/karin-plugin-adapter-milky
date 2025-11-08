/**
 * Milky 适配器自定义路由
 * 提供 HTTP 接口用于管理和监控适配器
 */

import { logger } from 'node-karin'
import type { AdapterMilky } from '../adapter/adapter'

// 存储所有适配器实例
const adapters = new Map<string, AdapterMilky>()

/**
 * 注册适配器到路由管理器
 */
export function registerAdapterToRouter(selfId: string, adapter: AdapterMilky) {
  adapters.set(selfId, adapter)
  logger.info(`[Milky Router] 适配器已注册: ${selfId}`)
}

/**
 * 从路由管理器移除适配器
 */
export function unregisterAdapterFromRouter(selfId: string) {
  adapters.delete(selfId)
  logger.info(`[Milky Router] 适配器已移除: ${selfId}`)
}

/**
 * 获取所有适配器状态
 */
export function getAllAdaptersStatus() {
  const status: Record<string, any> = {}
  
  for (const [selfId, adapter] of adapters.entries()) {
    status[selfId] = {
      selfId: adapter.selfId,
      nickname: adapter.nickname,
      avatar: adapter.avatar,
      platform: adapter.adapter.platform,
      standard: adapter.adapter.standard,
      communication: adapter.adapter.communication,
      index: adapter.adapter.index,
      // 连接状态
      isConnected: adapter._milky ? true : false,
    }
  }
  
  return status
}

/**
 * 获取单个适配器状态
 */
export function getAdapterStatus(selfId: string) {
  const adapter = adapters.get(selfId)
  if (!adapter) {
    return null
  }
  
  return {
    selfId: adapter.selfId,
    nickname: adapter.nickname,
    avatar: adapter.avatar,
    platform: adapter.adapter.platform,
    standard: adapter.adapter.standard,
    communication: adapter.adapter.communication,
    index: adapter.adapter.index,
    isConnected: adapter._milky ? true : false,
  }
}

/**
 * 重连指定适配器
 */
export async function reconnectAdapter(selfId: string): Promise<boolean> {
  const adapter = adapters.get(selfId)
  if (!adapter || !adapter._milky) {
    return false
  }
  
  try {
    if ('reconnect' in adapter._milky && typeof adapter._milky.reconnect === 'function') {
      await adapter._milky.reconnect()
      return true
    }
    return false
  } catch (error) {
    logger.error(`[Milky Router] 重连适配器失败 ${selfId}:`, error)
    return false
  }
}

/**
 * 设置 Karin 路由
 * 注意：需要在 Karin 应用启动后调用
 */
export function setupMilkyRoutes(app?: any) {
  if (!app) {
    logger.warn('[Milky Router] 未提供 Karin app 实例，跳过路由设置')
    return
  }
  
  // GET /api/milky/status - 获取所有适配器状态
  app.get?.('/api/milky/status', (_req: any, res: any) => {
    try {
      const status = getAllAdaptersStatus()
      res.json({
        success: true,
        data: status,
      })
    } catch (error) {
      logger.error('[Milky Router] 获取状态失败:', error)
      res.status(500).json({
        success: false,
        error: String(error),
      })
    }
  })
  
  // GET /api/milky/status/:selfId - 获取单个适配器状态
  app.get?.('/api/milky/status/:selfId', (req: any, res: any) => {
    try {
      const { selfId } = req.params
      const status = getAdapterStatus(selfId)
      
      if (!status) {
        res.status(404).json({
          success: false,
          error: '适配器不存在',
        })
        return
      }
      
      res.json({
        success: true,
        data: status,
      })
    } catch (error) {
      logger.error('[Milky Router] 获取状态失败:', error)
      res.status(500).json({
        success: false,
        error: String(error),
      })
    }
  })
  
  // POST /api/milky/reconnect/:selfId - 重连适配器
  app.post?.('/api/milky/reconnect/:selfId', async (req: any, res: any) => {
    try {
      const { selfId } = req.params
      const success = await reconnectAdapter(selfId)
      
      res.json({
        success,
        message: success ? '重连请求已发送' : '重连失败',
      })
    } catch (error) {
      logger.error('[Milky Router] 重连失败:', error)
      res.status(500).json({
        success: false,
        error: String(error),
      })
    }
  })
  
  logger.info('[Milky Router] 路由已设置')
}

/**
 * 导出路由函数
 */
export const milkyRouter = {
  setup: setupMilkyRoutes,
  registerAdapter: registerAdapterToRouter,
  unregisterAdapter: unregisterAdapterFromRouter,
  getStatus: getAllAdaptersStatus,
  getAdapterStatus,
  reconnect: reconnectAdapter,
}
