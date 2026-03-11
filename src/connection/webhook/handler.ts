import { MilkyAdapter } from '@/core/bot'
import { EventDispatch } from '@/event'
import { Event } from '@saltify/milky-types'
import { Request, Response } from 'node-karin/express'
import { logger } from 'node-karin'

class Handler {
  #ClientMap: Map<string, MilkyAdapter>
  constructor () {
    this.#ClientMap = new Map()
  }

  /** 注册事件 */
  register (bot: MilkyAdapter) {
    const selfId = bot.account.selfId
    if (!selfId) throw new Error('uin获取失败')
    if (this.#ClientMap.has(selfId)) throw new Error(`Client [${selfId}] 已注册`)
    this.#ClientMap.set(selfId, bot)
    bot.__registerBot()
  }

  /** 触发事件 */
  handle (req: Request, res: Response) {
    const data = req.body as Event
    const bot = this.#ClientMap.get(data.self_id + '')
    if (!bot) {
      logger.debug('[milky Adapter]收到未知客户端请求', data)
      return res.status(400).json({
        error: '非法的客户端',
        message: '该客户端尚未注册'
      })
    }
    EventDispatch(data, bot)
    return res.send('Hello World!')
  }

  /** 清理内容 */
  clear (Id: string) {
    const client = this.#ClientMap.get(Id)
    if (client) this.#ClientMap.delete(Id)
  }
}
export const WebHookHander = new Handler()
