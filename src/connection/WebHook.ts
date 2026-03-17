import { MilkyAdapter } from '@/core/bot'
import { WebHookHander } from './webhook/handler'

export class WebHook {
  bot: MilkyAdapter
  constructor (bot: MilkyAdapter) {
    this.bot = bot
  }

  connect () {
    WebHookHander.register(this.bot)
  }

  clear () {
    const id = this.bot.selfId
    if (id) WebHookHander.clear(id)
  }
}
