import { Cfg } from '@/config'
import { MilkyAdapter } from '@/core/bot'
import { EventDispatch } from '@/event'
import { EventSource } from 'eventsource'
import karin from 'node-karin'

export class SSEClient {
  /** 首次连接时间 */
  #startTime = 0
  /** sse实例 */
  #client: null | EventSource = null
  /** 适配器实例 */
  bot: MilkyAdapter
  /** 重连次数 */
  #reconnectCount = 0
  /** 连接时间计算器 */
  #IntervalTime: NodeJS.Timeout | null = null
  #reconnectTimer: NodeJS.Timeout | null = null
  constructor (bot: MilkyAdapter) {
    this.bot = bot
  }

  async connect () {
    this.#client = new EventSource(this.bot.adapter.address, {
      fetch: (input, init) => fetch(input, {
        ...init,
        headers: {
          ...init?.headers,
          authorization: `Bearer ${this.bot.adapter.secret}`
        }
      })
    })
    this.#client.addEventListener('milky_event', (event) => {
      try {
        const data = JSON.parse(event.data)
        EventDispatch(data, this.bot)
      } catch (err: any) {
        this.bot.logger('error', `[SSE]消息解析失败: ${err.message}`)
      }
    })
    this.#client.onopen = () => {
      if (this.#IntervalTime) {
        clearInterval(this.#IntervalTime)
        this.#IntervalTime = null
      }
      this.#reconnectCount = 0
      if (this.#IntervalTime) clearInterval(this.#IntervalTime)
      this.#startTime = Date.now()
      this.#IntervalTime = setInterval(() => {
        const time = Date.now()
        this.bot.adapter.connectTime = time - this.#startTime
      }, 1000)
      this.bot.__registerBot()
    }
    this.#client.onerror = (err) => {
      this.bot.logger('error', `[SSE]连接错误: ${JSON.stringify(err)}`)
      const index = this.bot.adapter.index
      if (index) {
        const bot = karin.getBot(index)
        if (bot) {
          this.bot.__unregisterBot()
        }
      }
      this.reconnect()
    }
  }

  reconnect () {
    if (this.#reconnectTimer) return
    this.clear()
    let RMC = +Cfg.get.reconnectMaxCount || 0
    if (RMC === -1) RMC = Infinity
    if (this.#reconnectCount >= RMC) {
      this.bot.logger('error', '[SSE]重连已达最大次数,停止重连')
      this.bot.transport = null
      return false
    }
    this.#reconnectCount++
    let timeout = +Cfg.get.reconnectInterval || 1
    if (timeout <= 0) timeout = 1
    this.bot.logger('error', `[SSE]${timeout}秒后尝试第${this.#reconnectCount}次重连`)
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
    if (this.#client) {
      this.#client.close()
      this.#client = null
    }
  }
}
