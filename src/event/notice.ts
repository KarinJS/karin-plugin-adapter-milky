import { MilkyAdapter } from '@/core/bot'
import { Event } from '@saltify/milky-types'
import { contactFriend, contactGroup, createGroupRecallNotice, createPrivateFileUploadedNotice, createPrivateRecallNotice, senderFriend, senderGroup } from 'node-karin'

export function RecallNotice (event: Extract<Event, { event_type: 'message_recall' }>, bot: MilkyAdapter) {
  const data = event.data
  const messageId = bot.super.serializeMsgId(data.message_scene, data.peer_id, data.message_seq)
  if (data.message_scene === 'friend') {
    const contact = contactFriend(data.peer_id + '')
    const sender = senderFriend(data.operator_id + '')
    createPrivateRecallNotice({
      time: event.time,
      eventId: 'notice:' + event.time,
      rawEvent: event,
      contact,
      sender,
      srcReply: elements => bot.sendMsg(contact, elements),
      bot,
      content: {
        operatorId: data.operator_id + '',
        messageId,
        tips: data.display_suffix
      }
    })
  } else
    if (data.message_scene === 'group') {
      const contact = contactGroup(data.peer_id + '')
      const sender = senderGroup(data.operator_id + '')
      createGroupRecallNotice({
        time: event.time,
        eventId: 'notice:' + event.time,
        rawEvent: event,
        contact,
        sender,
        srcReply: elements => bot.sendMsg(contact, elements),
        bot,
        content: {
          operatorId: data.operator_id + '',
          messageId,
          targetId: data.sender_id + '',
          tip: data.display_suffix
        }
      })
    }
}

export function FriendFileUpload (event: Extract<Event, { event_type: 'friend_file_upload' }>, bot: MilkyAdapter) {
  const contact = contactFriend(event.data.user_id + '')
  createPrivateFileUploadedNotice({
    time: event.time,
    eventId: 'notice' + event.time,
    contact,
    rawEvent: event,
    sender: senderFriend(event.data.user_id + ''),
    srcReply: (elements) => bot.sendMsg(contact, elements),
    bot,
    content: {
      operatorId: (event.data.is_self ? event.self_id : event.data.user_id) + '',
      fid: event.data.file_id,
      subId: 0,
      name: event.data.file_name,
      size: event.data.file_size,
      expireTime: 0,
      url: async () => { return await bot.getFileUrl(contact, event.data.file_id) },
    }
  })
}
