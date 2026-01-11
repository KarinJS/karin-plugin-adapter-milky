import { Client } from '@/milky/Client'
import { AdapterName } from '@/utils'
import { Event } from '@saltify/milky-types'
import { logger } from 'node-karin'
import { WebSocket } from 'ws'

export class WebSocketHandle {
  Time = 0
  client: Client
  #wss: null | WebSocket = null
  #reconnectMaxCount = 3
  #reconnectCount = 0
  Interval: NodeJS.Timeout | null = null
  constructor (client: Client) {
    this.client = client
  }

  connect () {
    try {
      this.#wss = new WebSocket(this.client.self.EventUrl, {
        headers: { Authorization: `Bearer ${this.client.self.token}` },
      })
      this.#wss.on('open', () => {
        this.#reconnectCount = 0
        if (this.Interval) clearInterval(this.Interval)
        this.Time = Date.now()
        this.Interval = setInterval(() => {
          const time = Date.now()
          this.client.self.connectTime = time - this.Time
        }, 10000)
        this.client.emit('system_success')
      })
      this.#wss.on('close', (code, reason) => {
        if (this.client.self.online) this.client.emit('system_offline', `WebSocket 断开连接 ${code} ${reason}`)
        this.clear()
        this.reconnect()
      })
      this.#wss.on('error', (err) => this.client.emit('system_error', err))
      this.#wss.on('message', (event: any) => {
        const data = JSON.parse(event.data) as Event
        this.client.emit(data.event_type, data as any)
      })
    } catch (err) {
      this.client.emit('system_error', err)
    }
  }

  reconnect () {
    if (this.#reconnectCount > this.#reconnectMaxCount) {
      logger.error(`[${AdapterName}][WebSocket]重连已达最大次数,停止重连`)
      return false
    }
    this.#reconnectCount++
    logger.info(`[${AdapterName}][WebSocket]尝试第${this.#reconnectCount}次重连`)
    setTimeout(() => {
      this.connect()
    }, 3000)
  }

  clear () {
    if (this.Interval) {
      clearInterval(this.Interval)
      this.Interval = null
    }
    if (this.#wss) {
      this.#wss.close()
      this.#wss.removeAllListeners()
      this.#wss = null
    }
  }
}
