import type {
  GetForwardedMessagesOutput,
  GetHistoryMessagesOutput,
  GetMessageOutput,
  GetResourceTempUrlOutput,
  OutgoingSegment,
  SendGroupMessageOutput,
  SendPrivateMessageOutput
} from '@saltify/milky-types'
import type { ClientCtx } from './index'
import type { MessageScene } from './msgId'

export const sendPrivateMessage = (ctx: ClientCtx, userId: number, message: OutgoingSegment[]) =>
  ctx.request<SendPrivateMessageOutput>('/send_private_message', { user_id: +userId, message })

export const sendGroupMessage = (ctx: ClientCtx, groupId: number, message: OutgoingSegment[]) =>
  ctx.request<SendGroupMessageOutput>('/send_group_message', { group_id: +groupId, message })

export const recallPrivateMessage = (ctx: ClientCtx, userId: number, messageSeq: number) =>
  ctx.request('/recall_private_message', { user_id: +userId, message_seq: +messageSeq })

export const recallGroupMessage = (ctx: ClientCtx, groupId: number, messageSeq: number) =>
  ctx.request('/recall_group_message', { group_id: +groupId, message_seq: +messageSeq })

export const getMessage = (
  ctx: ClientCtx,
  scene: MessageScene,
  peerId: number,
  messageSeq: number
) =>
  ctx.request<GetMessageOutput>('/get_message', { message_scene: scene, peer_id: +peerId, message_seq: +messageSeq })

export const getHistoryMessage = (
  ctx: ClientCtx,
  scene: MessageScene,
  peerId: number,
  start?: number,
  limit = 20
) =>
  ctx.request<GetHistoryMessagesOutput>('/get_history_messages', { message_scene: scene, peer_id: +peerId, start_message_seq: start, limit })

export const getResourceTempUrl = (ctx: ClientCtx, resourceId: string) =>
  ctx.request<GetResourceTempUrlOutput>('/get_resource_temp_url', { resource_id: resourceId })

export const getForwardedMessage = (ctx: ClientCtx, forwardId: string) =>
  ctx.request<GetForwardedMessagesOutput>('/get_forwarded_messages', { forward_id: forwardId })

export const markMessageAsRead = (
  ctx: ClientCtx,
  scene: MessageScene,
  peerId: number,
  messageSeq: number
) =>
  ctx.request('/mark_message_as_read', { message_scene: scene, peer_id: +peerId, message_seq: +messageSeq })
