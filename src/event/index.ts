import { MilkyAdapter } from '@/core/milkyAdapter'
import { Event } from '@saltify/milky-types'
import { createMessage } from './message'
import { BotOffline, FriendFileUpload, FriendPoke, GroupAdminChange, GroupEssenceMessageChange, GroupFileUpload, GroupMemberDecrease, GroupMemberIncrease, GroupMessageReaction, GroupMute, GroupNameChange, GroupPoke, GroupWholeMute, PeerPinChange, RecallNotice } from './notice'
import { FriendRequest, GroupInvite, GroupJoinRequest } from './request'

type HandlerMap = {
  [K in Event['event_type']]: (event: Extract<Event, { event_type: K }>, bot: MilkyAdapter) => Promise<void> | void
}
const Handlers: HandlerMap = Object.create(null)
Handlers['message_receive'] = createMessage
Handlers['message_recall'] = RecallNotice
Handlers['friend_request'] = FriendRequest
Handlers['group_join_request'] = GroupJoinRequest
Handlers['group_invited_join_request'] = GroupJoinRequest
Handlers['group_invitation'] = GroupInvite
Handlers['friend_nudge'] = FriendPoke
Handlers['friend_file_upload'] = FriendFileUpload
Handlers['group_admin_change'] = GroupAdminChange
Handlers['group_member_increase'] = GroupMemberIncrease
Handlers['group_member_decrease'] = GroupMemberDecrease
Handlers['group_message_reaction'] = GroupMessageReaction
Handlers['group_mute'] = GroupMute
Handlers['group_whole_mute'] = GroupWholeMute
Handlers['group_nudge'] = GroupPoke
Handlers['group_file_upload'] = GroupFileUpload
Handlers['bot_offline'] = BotOffline
Handlers['peer_pin_change'] = PeerPinChange
Handlers['group_essence_message_change'] = GroupEssenceMessageChange
Handlers['group_name_change'] = GroupNameChange

export async function EventDispatch (i: Event, bot: MilkyAdapter) {
  const handler = Handlers[i.event_type]
  if (!handler) {
    bot.logger('warn', `收到未知事件: ${JSON.stringify(i)}`)
    return false
  }
  return await handler(i as any, bot)
}
