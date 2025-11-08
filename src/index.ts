import { logger } from 'node-karin'
import { Root } from './utils/Root'

// 导出适配器
export * from './adapter'

// 导出原始连接类（可选）
export * from './core'
export * from './api'
export * from './event'
export * from './connection'

/** 适配器加载日志 */
logger.info(`[${Root.pluginName}] 适配器 v${Root.pluginVersion} 加载完成~`)
