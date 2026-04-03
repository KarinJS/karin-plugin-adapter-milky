import fs, { FSWatcher } from 'node:fs'
import { existsSync, mkdirSync, requireFileSync } from 'node-karin'
import path from 'path'
import { ConfigType } from './types'
import { LoggerAdapter, RandomToken } from '@/utils/utils'
import { dir } from '@/utils'
import { Bot } from '@/core/BotManager'
import _ from 'node-karin/lodash'

class Config {
  /** 默认配置 */
  #defCfg: ConfigType
  /** 配置文件路径 */
  CfgPath: string
  watch: FSWatcher | null = null
  watchTimers: NodeJS.Timeout | null = null
  #cache: ConfigType | null = null
  constructor () {
    this.#defCfg = {
      reconnectMaxCount: 5,
      reconnectInterval: 5,
      webhookToken: '',
      bots: []
    }
    this.CfgPath = path.join(dir.ConfigDir, 'config.json')
    this.init()
  }

  init (): void {
    if (!existsSync(this.CfgPath)) {
      mkdirSync(path.dirname(this.CfgPath))
      const def = { ...this.#defCfg }
      def.webhookToken = RandomToken()
      fs.writeFileSync(this.CfgPath, JSON.stringify(def, null, 2), 'utf8')
    }
    this.watcher()
  }

  /** 读取配置文件 */
  get get (): ConfigType {
    try {
      if (this.#cache) return this.#cache
      const cfg = requireFileSync(this.CfgPath, { force: true }) as ConfigType
      this.#cache = { ...this.#defCfg, ...cfg }
      return this.#cache
    } catch (err) {
      LoggerAdapter('error', '读取配置文件失败，已加载默认配置', err)
      return this.#defCfg
    }
  }

  /** 默认配置 */
  get defCfg () {
    return this.#defCfg
  }

  async save (data: ConfigType) {
    try {
      await fs.promises.writeFile(this.CfgPath, JSON.stringify(data, null, 2), 'utf-8')
      return true
    } catch (err) {
      LoggerAdapter('error', '保存配置文件错误', err)
      return false
    }
  }

  watcher () {
    if (this.watch) return true
    this.watch = fs.watch(this.CfgPath, () => {
      if (this.watchTimers) clearTimeout(this.watchTimers)
      this.watchTimers = setTimeout(() => {
        const temp = this.#cache
        LoggerAdapter('info', '配置变化,已清除缓存')
        this.#cache = null
        if (!_.isEqual(temp?.bots, this.get.bots)) {
          LoggerAdapter('info', 'Bot列表变化,开始重载变化Bot')
          const cfgs = this.get.bots
          const newMap = new Map<string, ConfigType['bots'][number]>()
          for (const cfg of cfgs) {
            const key = Bot.getKey(cfg.protocol, cfg.url)
            newMap.set(key, cfg)
            const old = Bot.getBot(key)
            if (!old) {
              Bot.addBot(cfg)
              continue
            }
            if (old.adapter.secret !== cfg.token) {
              old.stop()
              old.adapter.secret = cfg.token
              old.start()
            }
          }

          for (const key of Bot.bots.keys()) {
            if (!newMap.has(key)) {
              Bot.delBot(key)
            }
          }
        }
      }, 1000)
    })
  }
}

export const Cfg = new Config()
