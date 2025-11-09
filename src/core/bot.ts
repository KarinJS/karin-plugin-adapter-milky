import { BotCfg } from '@/config/types'
import { AdapterBase, AdapterType, logger, registerBot, unregisterBot } from 'node-karin'
import { Client } from './Client'

export class AdapterMilky extends AdapterBase implements AdapterType {
  super: Client
  constructor (cfg: BotCfg) {
    super()
    this.super = new Client(cfg)
    this.adapter = {
      index: 0,
      name: this.super.adapter.name,
      version: this.super.adapter.version,
      platform: 'qq',
      standard: 'other',
      protocol: 'other',
      communication: this.super.self.protocol === 'sse' ? 'http' : this.super.self.protocol === 'websocket' ? 'webSocketClient' : 'other',
      address: this.super.self.EventUrl,
      connectTime: this.super.self.connectTime,
      secret: this.super.self.token
    }
  }

  async init () {
    this.super.on('error', (event) => {
      this.logger('error', '适配器 连接错误', event)
    })
    this.super.on('bot_offline', (event) => {
      this.logger('error', 'Bot下线', event)
      unregisterBot('index', this.adapter.index)
    })
    this.super.on('success', () => {
      const selfId = String(this.super.self.uin)
      this.account = {
        uin: selfId,
        uid: selfId,
        selfId,
        name: this.super.self.nickname,
        avatar: `https://q1.qlogo.cn/g?b=qq&s=0&nk=${selfId}`,
        subId: {
          guild: '',
          channel: '',
          user: ''
        }
      }
      const index = registerBot(this.adapter.communication, this)
      if (index) this.adapter.index = index
    })
    await this.super.init()
  }

  logger (level: 'info' | 'error' | 'trace' | 'debug' | 'mark' | 'warn' | 'fatal', ...args: any[]) {
    logger.bot(level, this.account.uid || this.account.uin, ...args)
  }
}
