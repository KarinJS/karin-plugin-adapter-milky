import { MilkyAdapter } from '@/core/bot'
import { Event } from '@saltify/milky-types'
import { contactFriend, contactGroup, createGroupAdminChangedNotice, createGroupFileUploadedNotice, createGroupMemberAddNotice, createGroupMemberBanNotice, createGroupMemberDelNotice, createGroupMessageReactionNotice, createGroupPokeNotice, createGroupRecallNotice, createGroupWholeBanNotice, createPrivateFileUploadedNotice, createPrivatePokeNotice, createPrivateRecallNotice, senderFriend, senderGroup } from 'node-karin'

export function RecallNotice (event: Extract<Event, { event_type: 'message_recall' }>, bot: MilkyAdapter) {
  const data = event.data
  const messageId = bot.super.encodeMsgId(data.message_scene, data.peer_id, data.message_seq)
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

export function FriendPoke (event: Extract<Event, { event_type: 'friend_nudge' }>, bot: MilkyAdapter) {
  const userId = event.data.user_id + ''
  const contact = contactFriend(userId)
  createPrivatePokeNotice({
    eventId: `notice:${event.time}`,
    rawEvent: event,
    bot,
    time: event.time,
    contact,
    sender: senderFriend(event.data.is_self_send ? event.self_id + '' : userId),
    srcReply: (elements) => bot.sendMsg(contact, elements),
    content: {
      operatorId: event.data.is_self_send ? event.self_id + '' : userId,
      targetId: event.data.is_self_receive ? event.self_id + '' : userId,
      action: event.data.display_action,
      actionImage: event.data.display_action_img_url,
      suffix: event.data.display_suffix
    }
  })
}

export function GroupAdminChange (event: Extract<Event, { event_type: 'group_admin_change' }>, bot: MilkyAdapter) {
  const contact = contactGroup(event.data.group_id + '')
  createGroupAdminChangedNotice({
    bot,
    eventId: `notice:${event.time}`,
    rawEvent: event,
    time: event.time,
    contact,
    sender: senderGroup(event.data.operator_id + ''),
    srcReply: (elements) => bot.sendMsg(contact, elements),
    content: {
      targetId: event.data.user_id + '',
      isAdmin: event.data.is_set,
    }
  })
}

export function GroupMemberIncrease (event: Extract<Event, { event_type: 'group_member_increase' }>, bot: MilkyAdapter) {
  const contact = contactGroup(event.data.group_id + '')
  const userId = event.data.user_id + ''
  createGroupMemberAddNotice({
    bot,
    eventId: `notice:${event.time}`,
    rawEvent: event,
    time: event.time,
    contact,
    sender: senderGroup(userId),
    srcReply: (elements) => bot.sendMsg(contact, elements),
    content: {
      operatorId: event.data.operator_id + '',
      targetId: userId,
      type: 'approve'
    }
  })
}

export function GroupMemberDecrease (event: Extract<Event, { event_type: 'group_member_decrease' }>, bot: MilkyAdapter) {
  const contact = contactGroup(event.data.group_id + '')
  const userId = event.data.user_id + ''
  createGroupMemberDelNotice({
    bot,
    eventId: `notice:${event.time}`,
    rawEvent: event,
    time: event.time,
    contact,
    sender: senderGroup(userId),
    srcReply: (elements) => bot.sendMsg(contact, elements),
    content: {
      operatorId: String(event.data.operator_id || ''),
      targetId: userId,
      type: event.data.operator_id ? 'kick' : 'leave'
    }
  })
}

export function GroupMessageReaction (event: Extract<Event, { event_type: 'group_message_reaction' }>, bot: MilkyAdapter) {
  const contact = contactGroup(event.data.group_id + '')
  createGroupMessageReactionNotice({
    bot,
    eventId: `notice:${event.time}`,
    rawEvent: event,
    time: event.time,
    contact,
    sender: senderGroup(event.data.user_id + ''),
    srcReply: (elements) => bot.sendMsg(contact, elements),
    content: {
      count: 1,
      faceId: +event.data.face_id,
      isSet: event.data.is_add,
      messageId: bot.super.encodeMsgId('group', +contact.peer, event.data.message_seq),
    }
  })
}

export function GroupMute (event: Extract<Event, { event_type: 'group_mute' }>, bot: MilkyAdapter) {
  const contact = contactGroup(event.data.group_id + '')
  const userId = event.data.user_id + ''
  createGroupMemberBanNotice({
    bot,
    eventId: `notice:${event.time}`,
    rawEvent: event,
    time: event.time,
    contact,
    sender: senderGroup(userId),
    srcReply: (elements) => bot.sendMsg(contact, elements),
    content: {
      operatorId: String(event.data.operator_id),
      targetId: userId,
      duration: event.data.duration,
      isBan: event.data.duration > 0,
    }
  })
}
export function GroupWholeMute (event: Extract<Event, { event_type: 'group_whole_mute' }>, bot: MilkyAdapter) {
  const contact = contactGroup(event.data.group_id + '')
  const userId = event.data.operator_id + ''
  createGroupWholeBanNotice({
    bot,
    eventId: `notice:${event.time}`,
    rawEvent: event,
    time: event.time,
    contact,
    sender: senderGroup(userId),
    srcReply: (elements) => bot.sendMsg(contact, elements),
    content: {
      operatorId: userId,
      isBan: event.data.is_mute
    }
  })
}

export function GroupPoke (event: Extract<Event, { event_type: 'group_nudge' }>, bot: MilkyAdapter) {
  const userId = event.data.sender_id + ''
  const contact = contactGroup(event.data.group_id + '')
  createGroupPokeNotice({
    eventId: `notice:${event.time}`,
    rawEvent: event,
    bot,
    time: Date.now(),
    contact,
    sender: senderGroup(userId),
    srcReply: (elements) => bot.sendMsg(contact, elements),
    content: {
      operatorId: userId,
      targetId: event.data.receiver_id + '',
      action: event.data.display_action,
      actionImage: event.data.display_action_img_url,
      suffix: event.data.display_suffix
    }
  })
}

export function GroupFileUpload (event: Extract<Event, { event_type: 'group_file_upload' }>, bot: MilkyAdapter) {
  const userId = event.data.user_id + ''
  const contact = contactGroup(event.data.group_id + '')

  createGroupFileUploadedNotice({
    eventId: `notice:${event.time}`,
    rawEvent: event,
    bot,
    time: Date.now(),
    contact,
    sender: senderGroup(userId),
    srcReply: (elements) => bot.sendMsg(contact, elements),
    content: {
      fid: event.data.file_id,
      subId: 0,
      name: event.data.file_name,
      size: event.data.file_size,
      expireTime: 0,
      url: async () => { return await bot.getFileUrl(contact, event.data.file_id) },
    }
  })
}
