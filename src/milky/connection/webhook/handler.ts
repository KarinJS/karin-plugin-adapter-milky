import { Client } from '@/milky/Client'
import { Event } from '@saltify/milky-types'
import { logger } from 'node-karin'

class Handler {
  private ClientMap: Map<number, Client>
  Timeout: Map<number, NodeJS.Timeout>
  constructor () {
    this.ClientMap = new Map()
    this.Timeout = new Map()
  }

  /** 注册事件 */
  register (client: Client) {
    if (!client.self.uin) throw new Error('uin获取失败')
    if (this.ClientMap.has(client.self.uin)) throw new Error(`Client ${client.self.uin} 已注册`)

    this.ClientMap.set(client.self.uin, client)
    this.setHeartbeat(client)
    client.emit('system_success')
  }

  /** 触发事件 */
  handle (data: Event) {
    const client = this.ClientMap.get(data.self_id)
    if (!client) {
      logger.debug('[milky Adapter]收到未知客户端请求', data)
      return false
    }
    client.emit(data.event_type, data as any)
  }

  /** 清理内容 */
  clear (Id: number) {
    const client = this.ClientMap.get(Id)
    const timeout = this.Timeout.get(Id)
    if (client) this.ClientMap.delete(Id)
    if (timeout) {
      clearInterval(timeout)
      this.Timeout.delete(Id)
    }
  }

  /** 设置心跳超时器 */
  private setHeartbeat (client: Client) {
    let timeout = this.Timeout.get(client.self.uin)
    if (timeout) clearInterval(timeout)
    timeout = setInterval(async () => {
      try {
        const info = await client.getLoginInfo()
        if (!info?.uin) {
          this.clear(client.self.uin)
          client.emit('system_offline', '客户端获取信息失败')
        }
      } catch (err) {
        this.clear(client.self.uin)
        client.emit('system_offline', '获取客户端信息错误', err)
      }
    }, 30000)

    this.Timeout.set(client.self.uin, timeout)
  }
}
export const WebHookHander = new Handler()
