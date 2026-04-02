import { BotCfg } from '@/config'
import { MilkyAdapter } from './bot'

class BotManager {
  bots: Map<string, MilkyAdapter> = new Map()

  getKey (protocol: string, url: string): string {
    return `${protocol}::${url}`
  }

  getBot (key: string) {
    return this.bots.get(key)
  }

  async addBot (cfg: BotCfg) {
    const key = this.getKey(cfg.protocol, cfg.url)
    const bot = new MilkyAdapter(cfg)
    this.bots.set(key, bot)
    await bot.start()
  }

  delBot (key: string) {
    const bot = this.bots.get(key)
    if (!bot) return true
    bot.stop()
    this.bots.delete(key)
  }
}
export const Bot = new BotManager()
