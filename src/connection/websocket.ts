import { Cfg } from '@/config'
import { MilkyAdapter } from '@/core/bot'
import { EventDispatch } from '@/event'
import karin from 'node-karin'
import WebSocket from 'ws'

export class WebSocketHandle {
  #startTime = 0
  #wss: null | WebSocket = null
  /** 适配器实例 */
  bot: MilkyAdapter
  /** 重连次数 */
  #reconnectCount = 0
  /** 连接时间计算器 */
  #IntervalTime: NodeJS.Timeout | null = null
  /** 重连计时器 */
  #reconnectTimer: NodeJS.Timeout | null = null
  constructor (bot: MilkyAdapter) {
    this.bot = bot
  }

  connect () {
    if (this.#wss && this.#wss.readyState === WebSocket.OPEN) {
      return
    }
    this.#wss = new WebSocket(this.bot.adapter.address, {
      headers: { authorization: `Bearer ${this.bot.adapter.secret}` }
    })
    this.#wss.on('open', () => {
      this.#reconnectCount = 0
      if (this.#IntervalTime) clearInterval(this.#IntervalTime)
      this.#startTime = Date.now()
      this.#IntervalTime = setInterval(() => {
        const time = Date.now()
        this.bot.adapter.connectTime = time - this.#startTime
      }, 1000)
      this.bot.__registerBot()
    })

    this.#wss.on('message', (event: string) => {
      try {
        const data = JSON.parse(event)
        EventDispatch(data, this.bot)
      } catch (err) {
        this.bot.logger('error', `WebSocket 消息处理错误: ${err}`)
      }
    })
    this.#wss.on('error', (err) => {
      this.bot.logger('error', `WebSocket 连接错误: ${err.message}`)
    })
    this.#wss.on('close', (code, reason) => {
      const index = this.bot.adapter.index
      if (index) {
        const bot = karin.getBot(index)
        if (bot) {
          this.bot.logger('error', `[WebSocket] 断开连接 状态码:${code} ${reason}`)
          this.bot.__unregisterBot()
        }
      }
      this.reconnect()
    })
  }

  reconnect () {
    if (this.#reconnectTimer) return
    /** 先清理资源再进行重连 */
    this.clear()
    let RMC = +Cfg.get.reconnectMaxCount || 0
    if (RMC === -1) RMC = Infinity
    if (this.#reconnectCount >= RMC) {
      this.bot.logger('error', '[WebSocket]重连已达最大次数,停止重连')
      this.bot.transport = null
      return false
    }

    let timeout = +Cfg.get.reconnectInterval || 1
    if (timeout <= 0) timeout = 1
    this.#reconnectCount++
    this.bot.logger('error', `[WebSocket] ${timeout} 秒后尝试第${this.#reconnectCount}次重连`)
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = null
      this.connect()
    }, timeout * 1000)
  }

  clear () {
    if (this.#IntervalTime) {
      clearInterval(this.#IntervalTime)
      this.#IntervalTime = null
    }
    const ws = this.#wss
    if (ws) {
      this.#wss = null
      ws.removeAllListeners()
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    }
  }
}
