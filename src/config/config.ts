import fs from 'node:fs'
import { existsSync, logger, mkdirSync, requireFileSync } from 'node-karin'
import path from 'path'
import { ConfigType } from './types'
import { RandomToken } from '@/utils/utils'
import { dir } from '@/utils'

class Config {
  /** 默认配置 */
  defaultConfig: ConfigType
  /** 配置文件路径 */
  CfgPath: string
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
  }

  /** 读取配置文件 */
  get get (): ConfigType {
    try {
      const cfg = requireFileSync(this.CfgPath, { force: true }) as ConfigType
      return { ...this.defaultConfig, ...cfg }
    } catch (err) {
      logger.error(`[${dir.AdapterName}] 读取配置文件失败，已加载默认配置`, err)
      return this.defaultConfig
    }
  }
}

export const Cfg = new Config()
