import fs, { FSWatcher } from 'node:fs'
import { existsSync, mkdirSync, requireFileSync } from 'node-karin'
import path from 'path'
import { ConfigType } from './types'
import { LoggerAdapter, RandomToken } from '@/utils/utils'
import { dir } from '@/utils'
import { Bot } from '@/core/BotManager'

class Config {
  /** 默认配置 */
  defaultConfig: ConfigType
  /** 配置文件路径 */
  CfgPath: string
  watch: FSWatcher | null = null
  watchTimers: NodeJS.Timeout | null = null
  constructor () {
    this.defaultConfig = {
      webhookToken: '',
      bots: []
    }
    this.CfgPath = path.join(dir.ConfigDir, 'config.json')
    this.init()
  }

  init (): void {
    const def = this.defaultConfig
    def.webhookToken = RandomToken()
    if (!existsSync(this.CfgPath)) {
      mkdirSync(path.dirname(this.CfgPath))
      const def = { ...this.defaultConfig }
      def.webhookToken = RandomToken()
      fs.writeFileSync(this.CfgPath, JSON.stringify(def, null, 2), 'utf8')
    }
    this.watcher()
  }

  /** 读取配置文件 */
  get get (): ConfigType {
    try {
      const cfg = requireFileSync(this.CfgPath, { force: true }) as ConfigType
      return { ...this.defaultConfig, ...cfg }
    } catch (err) {
      LoggerAdapter('error', '读取配置文件失败，已加载默认配置', err)
      return this.defaultConfig
    }
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
        LoggerAdapter('info', '配置变化')
        Bot.reload(this.get.bots)
      }, 1000)
    })
  }
}

export const Cfg = new Config()
