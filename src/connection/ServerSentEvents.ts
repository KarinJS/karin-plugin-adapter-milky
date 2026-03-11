import { MilkyAdapter } from '@/core/bot'
import { EventDispatch } from '@/event'
import { Event } from '@saltify/milky-types'
import { EventSource } from 'eventsource'
import karin from 'node-karin'

export class SSEClient {
  /** 首次连接时间 */
  #startTime = 0
  /** sse实例 */
  #client: null | EventSource = null
  /** 适配器实例 */
  bot: MilkyAdapter
  /** 重试最大次数 */
  #reconnectMaxCount = 3
  /** 重连次数 */
  #reconnectCount = 0
  /** 连接时间计算器 */
  #IntervalTime: NodeJS.Timeout | null = null
  constructor (bot: MilkyAdapter) {
    this.bot = bot
  }

  connect () {
    let url = this.bot.adapter.address
    if (this.bot.adapter.secret) url += `?access_token=${this.bot.adapter.secret}`
    this.#client = new EventSource(url)
    this.#client.addEventListener('milky_event', (event) => {
      const data = JSON.parse(event.data) as Event
      EventDispatch(data, this.bot)
    })
    this.#client.onopen = () => {
      this.#reconnectCount = 0
      if (this.#IntervalTime) clearInterval(this.#IntervalTime)
      this.#startTime = Date.now()
      this.#IntervalTime = setInterval(() => {
        const time = Date.now()
        this.bot.adapter.connectTime = time - this.#startTime
      }, 10000)
      this.bot.__registerBot()
    }
    this.#client.onerror = (error) => {
      this.bot.logger('error', `SSE连接错误:${JSON.stringify(error)}`)
      const index = this.bot.adapter.index
      if (index) {
        const bot = karin.getBot(index)
        if (bot) {
          this.bot.__unregisterBot()
        }
      }
      this.clear()
      this.reconnect()
    }
  }

  reconnect () {
    if (this.#reconnectCount >= this.#reconnectMaxCount) {
      this.bot.logger('error', '[SSE]重连已达最大次数,停止重连')
      return false
    }
    this.#reconnectCount++
    this.bot.logger('error', `[SSE]尝试第${this.#reconnectCount}次重连`)
    setTimeout(() => {
      this.connect()
    }, 5000)
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
