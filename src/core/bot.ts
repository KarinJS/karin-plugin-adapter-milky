import { BotCfg } from '@/config/types'
import karin, { AdapterBase, AdapterType, Contact, Elements, logger, registerBot, SendMsgResults, unregisterBot } from 'node-karin'
import { Client } from './Client'
import { createMessage } from '@/event/message'
import { KarinConvertAdapter } from '@/event/convert'

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
    this.super.on('system_error', (event) => {
      this.logger('error', '适配器 连接错误: ', event)
    })
    this.super.on('system_offline', (event) => {
      this.logger('error', 'Bot下线: ', event)
      if (karin.getBotByIndex(this.adapter.index)) unregisterBot('index', this.adapter.index)
    })
    this.super.once('system_success', () => {
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
    this.super.on('message_receive', async (event) => {
      createMessage(event.data, this)
    })
    await this.super.init()
  }

  logger (level: 'info' | 'error' | 'trace' | 'debug' | 'mark' | 'warn' | 'fatal', ...args: any[]) {
    logger.bot(level, this.account.uid || this.account.uin, ...args)
  }

  async sendMsg (contact: Contact, elements: Array<Elements>, _retryCount?: number): Promise<SendMsgResults> {
    const result: SendMsgResults = {
      messageId: '',
      time: 0,
      rawData: {},
      message_id: '',
      messageTime: 0
    }
    const msg = await KarinConvertAdapter(elements)
    let res
    if (contact.scene === 'group') {
      res = await this.super.sendGroupMessage(Number(contact.peer), msg)
    } else {
      if (contact.scene === 'friend') {
        res = await this.super.sendPrivateMessage(Number(contact.peer), msg)
      } else {
        throw new Error('不支持的操作')
      }
    }
    result.messageId = String(res.message_seq)
    result.time = res.time
    result.rawData = res
    return result
  }
}
