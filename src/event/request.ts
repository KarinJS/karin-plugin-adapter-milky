import { MilkyAdapter } from '@/core/milkyAdapter'
import { Event } from '@saltify/milky-types'
import { contactFriend, contactGroup, createGroupApplyRequest, createGroupInviteRequest, createPrivateApplyRequest, senderFriend, senderGroup } from 'node-karin'

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
      flag: event.data.initiator_uid
    }
  })
}

export async function GroupJoinRequest (event: Extract<Event, { event_type: 'group_join_request' | 'group_invited_join_request' }>, bot: MilkyAdapter) {
  const groupId = String(event.data.group_id)
  const contact = contactGroup(groupId)
  const isInvited = event.event_type === 'group_invited_join_request'
  const applierId = isInvited && 'target_user_id' in event.data
    ? String(event.data.target_user_id)
    : String(event.data.initiator_id)
  const inviterId = isInvited ? String(event.data.initiator_id) : ''
  const Info = await bot.getStrangerInfo(applierId)

  createGroupApplyRequest({
    bot,
    time: event.time,
    contact,
    rawEvent: event,
    subEvent: 'groupApply',
    eventId: `request:${event.time}`,
    sender: senderGroup(applierId, 'unknown', Info.nick, Info.sex, Info.age, Info.remark, Info.level + '', 0, undefined),
    srcReply: (elements) => bot.sendMsg(contact, elements),
    content: {
      applierId,
      inviterId,
      reason: 'comment' in event.data ? event.data.comment : '',
      flag: event.data.notification_seq + '',
      groupId
    }
  })
}
export function GroupInvite (event: Extract<Event, { event_type: 'group_invitation' }>, bot: MilkyAdapter) {
  const userId = event.data.initiator_id + ''
  const contact = contactGroup(event.data.group_id + '')
  bot.stashInvitation(event.data.invitation_seq, event.data.group_id)
  createGroupInviteRequest({
    bot,
    time: event.time,
    contact,
    rawEvent: event,
    subEvent: 'groupInvite',
    eventId: `request:${event.time}`,
    sender: senderGroup(userId, 'member'),
    srcReply: (elements) => bot.sendMsg(contact, elements),
    content: {
      inviterId: userId,
      flag: event.data.invitation_seq + '',
    }
  })
}
