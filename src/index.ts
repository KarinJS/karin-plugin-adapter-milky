import { logger } from 'node-karin'
import '@/milky/connection/webhook/webhook'
import '@/core/init'
import { AdapterName } from './utils'

logger.info(`[${AdapterName}] 适配器初始化完成~`)
