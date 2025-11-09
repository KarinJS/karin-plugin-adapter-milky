import { Client } from '@/core/Client'
import { AdapterName } from '@/utils'
import { Event } from '@saltify/milky-types'
import { logger } from 'node-karin'
import { WebSocket } from 'ws'

export class WebSocketHandle {
  #init: boolean = false
  client: Client
  Time: number = 0
  Interval: null | NodeJS.Timeout = null
  #wss: WebSocket | null = null
  #readyPromise: Promise<void>
  constructor (client: Client) {
    this.client = client
    this.#readyPromise = this.init()
  }

  async init () {
    if (this.#init) return
    this.#init = true
    try {
      this.#wss = new WebSocket(this.client.self.EventUrl,
        {
          headers: {
            Authorization: `Bearer ${this.client.self.token}`
          }
        })
    } catch (err) { throw new Error(`WebSocket 创建失败: ${err instanceof Error ? err.message : String(err)}`) }
    this.EventListeners()
    await new Promise<void>((resolve, reject) => {
      this.#wss?.once('open', () => {
        this.Time = Date.now()
        if (this.Interval) {
          clearInterval(this.Interval)
          this.Interval = null
        }
        this.Interval = setInterval(() => {
          this.client.self.connectTime = Date.now() - this.Time
        }, 10000)
        resolve()
      })
      this.#wss?.once('error', (err) => reject(err))
    })
  }

  ready () {
    return this.#readyPromise
  }

  EventListeners () {
    this.#wss?.on('message', (event: Event) => {
      this.client.emit(event.event_type, event as any)
    })
    this.#wss?.on('close', () => {
      this.clear()
      this.client.emit('system_offline', 'WebSocket 断开连接')
    })
  }

  clear () {
    if (this.Interval) {
      clearInterval(this.Interval)
      this.Interval = null
    }
    if (this.#wss) {
      try {
        this.#wss.removeAllListeners()
        if (this.#wss.readyState === WebSocket.OPEN || this.#wss.readyState === WebSocket.CONNECTING) {
          this.#wss.close()
        }
      } catch (err) {
        logger.error(`[${AdapterName}] 清理WebSocket 错误`, err)
      } finally {
        this.#wss = null
      }
    }
    this.#init = false
  }
}
