import type {
  GetGroupAnnouncementsOutput,
  GetGroupEssenceMessagesOutput,
  GetGroupNotificationsOutput
} from '@saltify/milky-types'
import type { ClientCtx } from './index'

export const setGroupName = (ctx: ClientCtx, groupId: number, name: string) =>
  ctx.request('/set_group_name', { group_id: +groupId, new_group_name: name })

export const setGroupAvatar = (ctx: ClientCtx, groupId: number, uri: string) =>
  ctx.request('/set_group_avatar', { group_id: +groupId, image_uri: uri })

export const setGroupMemberCard = (ctx: ClientCtx, groupId: number, userId: number, card: string) =>
  ctx.request('/set_group_member_card', { group_id: +groupId, user_id: +userId, card })

export const setGroupMemberSpecialTitle = (
  ctx: ClientCtx,
  groupId: number,
  userId: number,
  title: string
) =>
  ctx.request('/set_group_member_special_title', { group_id: +groupId, user_id: +userId, special_title: title })

export const setGroupMemberAdmin = (
  ctx: ClientCtx,
  groupId: number,
  userId: number,
  isSet = true
) =>
  ctx.request('/set_group_member_admin', { group_id: +groupId, user_id: +userId, is_set: isSet })

export const setGroupMemberMute = (
  ctx: ClientCtx,
  groupId: number,
  userId: number,
  duration = 0
) =>
  ctx.request('/set_group_member_mute', { group_id: +groupId, user_id: +userId, duration })

export const setGroupWholeMute = (ctx: ClientCtx, groupId: number, isMute = true) =>
  ctx.request('/set_group_whole_mute', { group_id: +groupId, is_mute: isMute })

export const kickGroupMember = (
  ctx: ClientCtx,
  groupId: number,
  userId: number,
  rejectRequest = false
) =>
  ctx.request('/kick_group_member', { group_id: +groupId, user_id: +userId, reject_add_request: rejectRequest })

export const getGroupAnnouncements = (ctx: ClientCtx, groupId: number) =>
  ctx.request<GetGroupAnnouncementsOutput>('/get_group_announcements', { group_id: +groupId })

export const sendGroupAnnouncement = (
  ctx: ClientCtx,
  groupId: number,
  content: string,
  uri?: string
) =>
  ctx.request('/send_group_announcement', { group_id: +groupId, content, image_uri: uri })

export const deleteGroupAnnouncement = (ctx: ClientCtx, groupId: number, id: string) =>
  ctx.request('/delete_group_announcement', { group_id: +groupId, announcement_id: String(id) })

export const getGroupEssenceMessages = (
  ctx: ClientCtx,
  groupId: number,
  pageIndex: number,
  pageSize: number
) =>
  ctx.request<GetGroupEssenceMessagesOutput>('/get_group_essence_messages', { group_id: +groupId, page_index: +pageIndex, page_size: +pageSize })

export const setGroupEssenceMessage = (
  ctx: ClientCtx,
  groupId: number,
  messageSeq: number,
  isSet = true
) =>
  ctx.request('/set_group_essence_message', { group_id: +groupId, message_seq: messageSeq, is_set: isSet })

export const quitGroup = (ctx: ClientCtx, groupId: number) =>
  ctx.request('/quit_group', { group_id: +groupId })

export const sendGroupMessageReaction = (
  ctx: ClientCtx,
  groupId: number,
  messageSeq: number,
  reaction: string,
  reactionType: 'face' | 'emoji',
  isAdd = true
) =>
  ctx.request('/send_group_message_reaction', { group_id: +groupId, message_seq: messageSeq, reaction, reaction_type: reactionType, is_add: isAdd })

export const sendGroupNudge = (ctx: ClientCtx, groupId: number, userId: number) =>
  ctx.request('/send_group_nudge', { group_id: +groupId, user_id: +userId })

export const getGroupNotifications = (
  ctx: ClientCtx,
  start?: number,
  isFiltered = false,
  limit = 20
) =>
  ctx.request<GetGroupNotificationsOutput>('/get_group_notifications', { start_notification_seq: start, is_filtered: isFiltered, limit })

export const acceptGroupRequest = (
  ctx: ClientCtx,
  noticeId: number,
  noticeType: 'join_request' | 'invited_join_request',
  groupId: number,
  isFiltered = false
) =>
  ctx.request('/accept_group_request', { notification_seq: noticeId, notification_type: noticeType, group_id: +groupId, is_filtered: isFiltered })

export const rejectGroupRequest = (
  ctx: ClientCtx,
  noticeId: number,
  noticeType: 'join_request' | 'invited_join_request',
  groupId: number,
  isFiltered = false,
  reason?: string
) =>
  ctx.request('/reject_group_request', { notification_seq: noticeId, notification_type: noticeType, group_id: +groupId, is_filtered: isFiltered, reason })

export const acceptGroupInvitation = (ctx: ClientCtx, groupId: number, invitationSeq: number) =>
  ctx.request('/accept_group_invitation', { group_id: +groupId, invitation_seq: invitationSeq })

export const rejectGroupInvitation = (ctx: ClientCtx, groupId: number, invitationSeq: number) =>
  ctx.request('/reject_group_invitation', { group_id: +groupId, invitation_seq: invitationSeq })
