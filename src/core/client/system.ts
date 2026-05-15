import type {
  GetCookiesOutput,
  GetCSRFTokenOutput,
  GetCustomFaceUrlListOutput,
  GetFriendInfoOutput,
  GetFriendListOutput,
  GetGroupInfoOutput,
  GetGroupListOutput,
  GetGroupMemberInfoOutput,
  GetGroupMemberListOutput,
  GetImplInfoOutput,
  GetLoginInfoOutput,
  GetPeerPinsOutput,
  GetUserProfileOutput
} from '@saltify/milky-types'
import type { ClientCtx } from './index'

export const getLoginInfo = (ctx: ClientCtx) =>
  ctx.request<GetLoginInfoOutput>('/get_login_info', {})

export const getImplInfo = (ctx: ClientCtx) =>
  ctx.request<GetImplInfoOutput>('/get_impl_info', {})

export const getUserProfile = (ctx: ClientCtx, userId: number) =>
  ctx.request<GetUserProfileOutput>('/get_user_profile', { user_id: +userId })

export const getFriendList = (ctx: ClientCtx, noCache = false) =>
  ctx.request<GetFriendListOutput>('/get_friend_list', { no_cache: noCache })

export const getFriendInfo = (ctx: ClientCtx, userId: number, noCache = false) =>
  ctx.request<GetFriendInfoOutput>('/get_friend_info', { user_id: +userId, no_cache: noCache })

export const getGroupList = (ctx: ClientCtx, noCache = false) =>
  ctx.request<GetGroupListOutput>('/get_group_list', { no_cache: noCache })

export const getGroupInfo = (ctx: ClientCtx, groupId: number, noCache = false) =>
  ctx.request<GetGroupInfoOutput>('/get_group_info', { group_id: +groupId, no_cache: noCache })

export const getGroupMemberList = (ctx: ClientCtx, groupId: number, noCache = false) =>
  ctx.request<GetGroupMemberListOutput>('/get_group_member_list', { group_id: +groupId, no_cache: noCache })

export const getGroupMemberInfo = (ctx: ClientCtx, groupId: number, userId: number, noCache = false) =>
  ctx.request<GetGroupMemberInfoOutput>('/get_group_member_info', { group_id: +groupId, user_id: +userId, no_cache: noCache })

export const getPeerPins = (ctx: ClientCtx) =>
  ctx.request<GetPeerPinsOutput>('/get_peer_pins', {})

export const setPeerPin = (
  ctx: ClientCtx,
  scene: 'group' | 'friend' | 'temp',
  peerId: number,
  isPinned = true
) =>
  ctx.request('/set_peer_pin', { message_scene: scene, peer_id: peerId, is_pinned: isPinned })

export const setAvatar = (ctx: ClientCtx, uri: string) =>
  ctx.request('/set_avatar', { uri })

export const setNickName = (ctx: ClientCtx, name: string) =>
  ctx.request('/set_nickname', { new_nickname: name })

export const setBio = (ctx: ClientCtx, bio: string) =>
  ctx.request('/set_bio', { new_bio: bio })

export const getCustomFaceUrlList = (ctx: ClientCtx) =>
  ctx.request<GetCustomFaceUrlListOutput>('/get_custom_face_url_list', {})

export const getCookies = (ctx: ClientCtx, domain: string) =>
  ctx.request<GetCookiesOutput>('/get_cookies', { domain })

export const getCSRFToken = (ctx: ClientCtx) =>
  ctx.request<GetCSRFTokenOutput>('/get_csrf_token', {})
