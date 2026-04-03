import { Bot } from '@/core/BotManager'
import karin from 'node-karin'

export const Connect = karin.command(/^#milky上线(.*)?$/i, async (ctx) => {
  const line = ctx.msg.substring(8).trim()
  const [protocol, address] = line.split(',').map(i => i.trim().toLowerCase())
  if (!protocol || !address) return ctx.reply('格式错误,请使用#milky上线通讯协议,通讯地址\n例如:\n#milky上线websocket,http://127.0.0.1:7860')
  const key = Bot.getKey(protocol, address)
  const bot = Bot.getBot(key)
  if (!bot) return ctx.reply('未找到对应的Bot')
  bot.start()
  return ctx.reply('已发送上线指令')
}, { perm: 'master' })
