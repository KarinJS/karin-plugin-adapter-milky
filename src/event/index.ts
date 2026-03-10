import { MilkyAdapter } from '@/core/bot'
import { Event } from '@saltify/milky-types'
import { createMessage } from './message'
import { FriendFileUpload, RecallNotice } from './notice'
import { FriendRequest } from './request'

type HanderMap = {
  [K in Event['event_type']]: (event: Extract<Event, { event_type: K }>, bot: MilkyAdapter) => Promise<void> | void
}
const Handlers: HanderMap = Object.create(null)
Handlers['message_receive'] = createMessage
Handlers['message_recall'] = RecallNotice
Handlers['friend_request'] = FriendRequest
Handlers['friend_file_upload'] = FriendFileUpload

export async function EventDispatch (i: Event, bot: MilkyAdapter) {
  const handler = Handlers[i.event_type]
  if (!handler) {
    bot.logger('warn', `收到未知事件: ${JSON.stringify(i)}`)
    return false
  }
  return await handler(i as any, bot)
}
