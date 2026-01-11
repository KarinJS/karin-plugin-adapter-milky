import { Client } from '@/milky/Client'
import { AdapterName } from '@/utils'
import { Event } from '@saltify/milky-types'
import { EventSource } from 'eventsource'
import { logger } from 'node-karin'

export class SSEHandle {
  client: Client
  #sse: null | EventSource = null
  Time = 0
  #reconnectMaxCount = 3
  #reconnectCount = 0
  Interval: NodeJS.Timeout | null = null

  constructor (client: Client) {
    this.client = client
  }

  connect () {
    this.#sse = new EventSource(this.client.self.EventUrl + `?access_token=${this.client.self.token}`)
    this.#sse.onopen = () => {
      this.#reconnectCount = 0
      if (this.Interval) clearInterval(this.Interval)
      this.Time = Date.now()
      this.Interval = setInterval(() => {
        const time = Date.now()
        this.client.self.connectTime = time - this.Time
      }, 10000)
      this.client.emit('system_success')
    }
    this.#sse.onmessage = ({ event, data }: any) => {
      if (event !== 'milky_event') return false
      const i = JSON.parse(data) as Event
      this.client.emit(i.event_type, i as any)
    }
    this.#sse.onerror = (event) => {
      if (this.#reconnectCount > this.#reconnectMaxCount) {
        logger.error(`[${AdapterName}][Server-Sent-Events]重连次数上限,停止重连`)
        this.clear()
        return false
      }
      this.#reconnectCount++
      this.client.emit('system_error', event)
      logger.info(`[${AdapterName}][Server-Sent-Events]尝试第${this.#reconnectCount}次重连`)
      if (this.client.self.online) this.client.emit('system_offline', 'sse连接错误', event)
    }
  }

  clear () {
    if (this.Interval) {
      clearInterval(this.Interval)
      this.Interval = null
    }
    if (this.#sse) {
      this.#sse.onopen = null
      this.#sse.onmessage = null
      this.#sse.onerror = null
      this.#sse.close()
      this.#sse = null
    }
  }
}
