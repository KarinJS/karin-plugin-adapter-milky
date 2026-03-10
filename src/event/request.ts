import { MilkyAdapter } from '@/core/bot'
import { Event } from '@saltify/milky-types'
import { contactFriend, contactGroup, createGroupApplyRequest, createPrivateApplyRequest, senderFriend, senderGroup } from 'node-karin'

export function FriendRequest (event: Extract<Event, { event_type: 'friend_request' }>, bot: MilkyAdapter) {
  const userId = event.data.initiator_id + ''
  const contact = contactFriend(userId)
  createPrivateApplyRequest({
    bot,
    time: event.time,
    contact,
    rawEvent: event,
    subEvent: 'friendApply',
    eventId: `request:${event.time}`,
    sender: senderFriend(userId),
    srcReply: (elements) => bot.sendMsg(contact, elements),
    content: {
      applierId: userId,
      message: event.data.comment,
      flag: userId
    }
  })
}

export function GroupJoinRequest (event: Extract<Event, { event_type: 'group_join_request' | 'group_invited_join_request' }>, bot: MilkyAdapter) {
  const userId = String(event.data.initiator_id)
  const groupId = String(event.data.group_id)
  const contact = contactGroup(groupId)

  createGroupApplyRequest({
    bot,
    time: event.time,
    contact,
    rawEvent: event,
    subEvent: 'groupApply',
    eventId: `request:${event.time}`,
    sender: senderGroup(userId),
    srcReply: (elements) => bot.sendMsg(contact, elements),
    content: {
      applierId: userId,
      inviterId: 'target_user_id' in event.data ? String(event.data.target_user_id) : '',
      reason: 'comment' in event.data ? event.data.comment : '',
      flag: event.event_type + ':' + event.data.notification_seq,
      groupId
    }
  })
}
