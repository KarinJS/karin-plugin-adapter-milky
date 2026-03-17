import { BotCfg, Cfg } from '@/config'
import { MilkyAdapter } from './bot'

class BotManager {
  bots: Map<string, MilkyAdapter> = new Map()

  getKey (cfg: BotCfg) {
    return `${cfg.protocol}::${cfg.url}`
  }

  loaderBots () {
    const bots = Cfg.get.bots
    if (bots.length <= 0) return true
    for (const v of bots) {
      if (!v.protocol || !v.url) continue
      this.addBot(v)
    }
  }

  addBot (cfg: BotCfg) {
    const key = this.getKey(cfg)
    const bot = new MilkyAdapter(cfg)
    this.bots.set(key, bot)
    bot.start()
  }

  async delBot (key: string) {
    const bot = this.bots.get(key)
    if (!bot) return true
    await bot.stop()
    this.bots.delete(key)
  }

  async reload (cfgs: BotCfg[]) {
    const newMap = new Map<string, BotCfg>()
    for (const cfg of cfgs) {
      const key = this.getKey(cfg)
      newMap.set(key, cfg)
      const old = this.bots.get(key)
      if (!old) {
        this.addBot(cfg)
        continue
      }
      if (old.adapter.secret !== cfg.token) {
        old.logger('info', 'token变更,重载Bot')
        await old.stop()
        const bot = new MilkyAdapter(cfg)
        bot.start()
        this.bots.set(key, bot)
      }
    }

    for (const key of this.bots.keys()) {
      if (!newMap.has(key)) {
        await this.delBot(key)
      }
    }
  }
}
export const Bot = new BotManager()
