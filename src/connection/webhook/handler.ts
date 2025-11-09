import { Client } from '@/core/Client'
import { Event } from '@saltify/milky-types'
import { logger } from 'node-karin'

class Hander {
  private ClientMap: Map<number, Client>
  constructor () {
    this.ClientMap = new Map()
  }

  /** 注册事件 */
  register (client: Client) {
    if (client.self.uin && !this.ClientMap.get(client.self.uin)) {
      this.ClientMap.set(client.self.uin, client)
    } else throw new Error('uin获取失败或者Client已注册')
  }

  /** 触发事件 */
  handle (data: Event) {
    const client = this.ClientMap.get(data.self_id)
    if (!client) {
      logger.debug('[milky Adapter]收到未知客户端请求', data)
      return true
    }
    client.emit(data.event_type, data as any)
  }
}
export const WebHookHander = new Hander()
