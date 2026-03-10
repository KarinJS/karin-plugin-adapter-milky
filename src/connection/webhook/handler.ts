import { MilkyAdapter } from '@/core/bot'
import { EventDispatch } from '@/event'
import { Event } from '@saltify/milky-types'
import { logger } from 'node-karin'

class Handler {
  #ClientMap: Map<string, MilkyAdapter>
  #Timeout: Map<string, NodeJS.Timeout>
  constructor () {
    this.#ClientMap = new Map()
    this.#Timeout = new Map()
  }

  /** 注册事件 */
  register (bot: MilkyAdapter) {
    const selfId = bot.account.selfId
    if (!selfId) throw new Error('uin获取失败')
    if (this.#ClientMap.has(selfId)) throw new Error(`Client ${selfId} 已注册`)
    this.#ClientMap.set(selfId, bot)
    this.setHeartbeat(bot)
    bot.__registerBot()
  }

  /** 触发事件 */
  handle (data: Event) {
    const bot = this.#ClientMap.get(data.self_id + '')
    if (!bot) {
      logger.debug('[milky Adapter]收到未知客户端请求', data)
      return false
    }
    EventDispatch(data, bot)
  }

  /** 清理内容 */
  clear (Id: string) {
    const client = this.#ClientMap.get(Id)
    const timeout = this.#Timeout.get(Id)
    if (client) this.#ClientMap.delete(Id)
    if (timeout) {
      clearInterval(timeout)
      this.#Timeout.delete(Id)
    }
  }

  /** 设置心跳超时器 */
  private setHeartbeat (bot: MilkyAdapter) {
    const selfId = bot.account.selfId

    let timeout = this.#Timeout.get(selfId)
    if (timeout) clearInterval(timeout)
    timeout = setInterval(async () => {
      try {
        const info = await bot.super.getLoginInfo()
        if (!info?.uin) {
          this.clear(selfId)
          bot.logger('error', '获取Bot信息失败')
          bot.__unregisterBot()
        }
      } catch (err) {
        this.clear(selfId)
        bot.logger('error', '获取Bot信息失败')
        bot.__unregisterBot()
      }
    }, 30000)

    this.#Timeout.set(selfId, timeout)
  }
}
export const WebHookHander = new Handler()
