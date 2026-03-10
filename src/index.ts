import { logger } from 'node-karin'
import '@/connection/webhook/webhook'
import '@/core/init'
import { dir } from './utils'

logger.info(`[${dir.AdapterName}] 适配器初始化完成~`)
