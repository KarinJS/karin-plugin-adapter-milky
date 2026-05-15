import type { GetFriendRequestsOutput } from '@saltify/milky-types'
import type { ClientCtx } from './index'

export const sendFriendNudge = (ctx: ClientCtx, userId: number, isSelf = false) =>
  ctx.request('/send_friend_nudge', { user_id: +userId, is_self: isSelf })

export const sendProfileLike = (ctx: ClientCtx, userId: number, count = 1) =>
  ctx.request('/send_profile_like', { user_id: +userId, count })

export const deleteFriend = (ctx: ClientCtx, userId: number) =>
  ctx.request('/delete_friend', { user_id: +userId })

export const getFriendRequests = (ctx: ClientCtx, limit = 20, isFiltered = false) =>
  ctx.request<GetFriendRequestsOutput>('/get_friend_requests', { limit, is_filtered: isFiltered })

export const acceptFriendRequest = (ctx: ClientCtx, initiatorUid: string, isFiltered = false) =>
  ctx.request('/accept_friend_request', { initiator_uid: initiatorUid, is_filtered: isFiltered })

export const rejectFriendRequest = (
  ctx: ClientCtx,
  initiatorUid: string,
  isFiltered = false,
  reason = ''
) =>
  ctx.request('/reject_friend_request', { initiator_uid: initiatorUid, is_filtered: isFiltered, reason })
