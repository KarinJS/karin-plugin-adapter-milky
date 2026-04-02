import '@/connection/webhook/webhook'
import { LoggerAdapter } from './utils'
import { Bot } from './core/BotManager'
import { Cfg } from './config'

LoggerAdapter('info', '开始加载Bot~')
const bots = Cfg.get.bots
if (bots.length >= 0) {
  for (const v of bots) {
    if (!v.protocol || !v.url) continue
    Bot.addBot(v)
  }
}
LoggerAdapter('info', `Bot 加载完成,共 ${bots.length} 个 Bot`)
