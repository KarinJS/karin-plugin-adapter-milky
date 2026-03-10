import { MilkyAdapter } from '@/core/bot'
import { EventDispatch } from '@/event'
import karin from 'node-karin'
import WebSocket from 'ws'

export class WebSocketHandle {
  #startTime = 0
  #wss: null | WebSocket = null
  /** 适配器实例 */
  bot: MilkyAdapter
  /** 重试最大次数 */
  #reconnectMaxCount = 3
  /** 重连次数 */
  #reconnectCount = 0
  /** 连接时间计算器 */
  #IntervalTime: NodeJS.Timeout | null = null
  logger: typeof this.bot.logger
  constructor (bot: MilkyAdapter) {
    this.bot = bot
    this.logger = bot.logger
  }

  connect () {
    this.#wss = new WebSocket(this.bot.adapter.address + '/event', {
      headers: { authorization: `Bearer ${this.bot.adapter.secret}` }
    })
    this.#wss.on('open', () => {
      this.#reconnectCount = 0
      if (this.#IntervalTime) clearInterval(this.#IntervalTime)
      this.#startTime = Date.now()
      this.#IntervalTime = setInterval(() => {
        const time = Date.now()
        this.bot.adapter.connectTime = time - this.#startTime
      }, 10000)
      this.bot.__registerBot()
    })

    this.#wss.on('message', (event: string) => {
      const data = JSON.parse(event)
      EventDispatch(data, this.bot)
    })
    this.#wss.on('error', (err) => {
      this.logger('error', `WebSocket 连接错误: ${err.message}`)
    })
    this.#wss.on('close', (code, reason) => {
      const index = this.bot.adapter.index
      if (index) {
        const bot = karin.getBot(index)
        if (bot) {
          this.logger('error', `WebSocket 断开连接 状态码:${code} ${reason}`)
          this.bot.__unregisterBot()
        }
      }
    })
  }

  reconnect () {
    if (this.#reconnectCount > this.#reconnectMaxCount) {
      this.logger('error', '[WebSocket]重连已达最大次数,停止重连')
      return false
    }
    this.#reconnectCount++
    this.logger('error', `[WebSocket]尝试第${this.#reconnectCount}次重连`)
    setTimeout(() => {
      this.connect()
    }, 5000)
  }

  clear () {
    if (this.#IntervalTime) {
      clearInterval(this.#IntervalTime)
      this.#IntervalTime = null
    }
    if (this.#wss) {
      this.#wss.close()
      this.#wss.removeAllListeners()
      this.#wss = null
    }
  }
}
