import '@/connection/webhook/webhook'
import { LoggerAdapter } from './utils'
import { Bot } from './core/BotManager'

LoggerAdapter('info', '适配器初始化完成~')
Bot.loaderBots()
