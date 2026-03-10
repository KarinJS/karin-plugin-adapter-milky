import { MilkyAdapter } from '@/core/bot'
import { Event } from '@saltify/milky-types'
import { AdapterConvertKarin } from './convert'
import { contactFriend, contactGroup, contactGroupTemp, createFriendMessage, createGroupMessage, createGroupTempMessage, senderFriend, senderGroup, senderGroupTemp } from 'node-karin'

export async function createMessage (event: Extract<Event, { event_type: 'message_receive' }>, bot: MilkyAdapter) {
  const data = event.data
  const messageId = bot.super.serializeMsgId(data.message_scene, data.sender_id, data.message_seq)
  const elements = await AdapterConvertKarin(data.segments)
  if (data.message_scene === 'group') {
    const contact = contactGroup(data.peer_id + '', data.group.group_name)
    const MInfo = data.group_member
    const sender = senderGroup(MInfo.user_id + '',
      MInfo.role,
      MInfo.nickname,
      MInfo.sex,
      0,
      MInfo.card,
      undefined,
      MInfo.level,
      MInfo.title
    )
    createGroupMessage({
      time: event.time,
      eventId: messageId,
      rawEvent: event,
      srcReply: (element) => bot.sendMsg(contact, element),
      bot,
      messageId,
      messageSeq: data.message_seq,
      elements,
      contact,
      sender
    })
  } else
    if (data.message_scene === 'friend') {
      const FInfo = data.friend
      const contact = contactFriend(data.peer_id + '', FInfo.nickname)
      const sender = senderFriend(FInfo.user_id + '',
        FInfo.nickname,
        FInfo.sex
      )
      createFriendMessage({
        time: event.time,
        eventId: messageId,
        rawEvent: event,
        srcReply: (element) => bot.sendMsg(contact, element),
        bot,
        messageId,
        messageSeq: data.message_seq,
        elements,
        contact,
        sender
      })
    } else
      if (data.message_scene === 'temp') {
        const TInfo = data.group
        const contact = contactGroupTemp(TInfo?.group_id + '', data.peer_id + '', TInfo?.group_name)
        const sender = senderGroupTemp(data.peer_id + '')
        createGroupTempMessage({
          time: event.time,
          eventId: messageId,
          rawEvent: event,
          srcReply: (element) => bot.sendMsg(contact, element),
          bot,
          messageId,
          messageSeq: data.message_seq,
          elements,
          contact,
          sender
        })
      }
}
