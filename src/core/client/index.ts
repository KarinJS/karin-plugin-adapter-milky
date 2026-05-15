import axios, { AxiosInstance } from 'node-karin/axios'
import type { MilkyAdapter } from '@/core/milkyAdapter'
import * as system from './system'
import * as friend from './friend'
import * as group from './group'
import * as messageApi from './message'
import * as fileApi from './file'
import * as msgId from './msgId'

type ApiResponse<T = unknown> =
  | { status: 'ok'; retcode: 0; data: T }
  | { status: 'failed'; retcode: number; message: string }

/** 子模块函数依赖的最小上下文：只暴露 request，避免它们持有完整的 Client 引用形成循环 */
export interface ClientCtx {
  request<T> (path: string, data?: any): Promise<T>
}

/** milky 协议端 HTTP 客户端。各 API 的真实实现散在 ./{system,friend,group,message,file}.ts，本类只做 wiring + axios 持有。 */
export class Client {
  #axios: AxiosInstance
  #ctx: ClientCtx

  constructor (url: string, bot: MilkyAdapter) {
    this.#axios = axios.create({
      baseURL: new URL('api', `${url.endsWith('/') ? url : `${url}/`}`).toString(),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
    this.#axios.interceptors.request.use(config => {
      const token = bot.adapter.secret
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })
    this.#ctx = { request: this.request.bind(this) }
  }

  async request<T> (path: string, data?: any): Promise<T> {
    const res = await this.#axios.post<ApiResponse<T>>(path, data ?? {})
    if (res.data.status === 'failed') {
      throw new Error(res.data.message)
    }
    return res.data.data
  }

  /* === system === */
  getLoginInfo = () => system.getLoginInfo(this.#ctx)
  getImplInfo = () => system.getImplInfo(this.#ctx)
  getUserProfile = (userId: number) => system.getUserProfile(this.#ctx, userId)
  getFriendList = (noCache?: boolean) => system.getFriendList(this.#ctx, noCache)
  getFriendInfo = (userId: number, noCache?: boolean) => system.getFriendInfo(this.#ctx, userId, noCache)
  getGroupList = (noCache?: boolean) => system.getGroupList(this.#ctx, noCache)
  getGroupInfo = (groupId: number, noCache?: boolean) => system.getGroupInfo(this.#ctx, groupId, noCache)
  getGroupMemberList = (groupId: number, noCache?: boolean) => system.getGroupMemberList(this.#ctx, groupId, noCache)
  getGroupMemberInfo = (groupId: number, userId: number, noCache?: boolean) => system.getGroupMemberInfo(this.#ctx, groupId, userId, noCache)
  getPeerPins = () => system.getPeerPins(this.#ctx)
  setPeerPin = (scene: 'group' | 'friend' | 'temp', peerId: number, isPinned?: boolean) => system.setPeerPin(this.#ctx, scene, peerId, isPinned)
  setAvatar = (uri: string) => system.setAvatar(this.#ctx, uri)
  setNickName = (name: string) => system.setNickName(this.#ctx, name)
  setBio = (bio: string) => system.setBio(this.#ctx, bio)
  getCustomFaceUrlList = () => system.getCustomFaceUrlList(this.#ctx)
  getCookies = (domain: string) => system.getCookies(this.#ctx, domain)
  getCSRFToken = () => system.getCSRFToken(this.#ctx)

  /* === friend === */
  sendFriendNudge = (userId: number, isSelf?: boolean) => friend.sendFriendNudge(this.#ctx, userId, isSelf)
  sendProfileLike = (userId: number, count?: number) => friend.sendProfileLike(this.#ctx, userId, count)
  deleteFriend = (userId: number) => friend.deleteFriend(this.#ctx, userId)
  getFriendRequests = (limit?: number, isFiltered?: boolean) => friend.getFriendRequests(this.#ctx, limit, isFiltered)
  acceptFriendRequest = (initiatorUid: string, isFiltered?: boolean) => friend.acceptFriendRequest(this.#ctx, initiatorUid, isFiltered)
  rejectFriendRequest = (initiatorUid: string, isFiltered?: boolean, reason?: string) => friend.rejectFriendRequest(this.#ctx, initiatorUid, isFiltered, reason)

  /* === group === */
  setGroupName = (groupId: number, name: string) => group.setGroupName(this.#ctx, groupId, name)
  setGroupAvatar = (groupId: number, uri: string) => group.setGroupAvatar(this.#ctx, groupId, uri)
  setGroupMemberCard = (groupId: number, userId: number, card: string) => group.setGroupMemberCard(this.#ctx, groupId, userId, card)
  setGroupMemberSpecialTitle = (groupId: number, userId: number, title: string) => group.setGroupMemberSpecialTitle(this.#ctx, groupId, userId, title)
  setGroupMemberAdmin = (groupId: number, userId: number, isSet?: boolean) => group.setGroupMemberAdmin(this.#ctx, groupId, userId, isSet)
  setGroupMemberMute = (groupId: number, userId: number, duration?: number) => group.setGroupMemberMute(this.#ctx, groupId, userId, duration)
  setGroupWholeMute = (groupId: number, isMute?: boolean) => group.setGroupWholeMute(this.#ctx, groupId, isMute)
  kickGroupMember = (groupId: number, userId: number, rejectRequest?: boolean) => group.kickGroupMember(this.#ctx, groupId, userId, rejectRequest)
  getGroupAnnouncements = (groupId: number) => group.getGroupAnnouncements(this.#ctx, groupId)
  sendGroupAnnouncement = (groupId: number, content: string, uri?: string) => group.sendGroupAnnouncement(this.#ctx, groupId, content, uri)
  deleteGroupAnnouncement = (groupId: number, id: string) => group.deleteGroupAnnouncement(this.#ctx, groupId, id)
  getGroupEssenceMessages = (groupId: number, pageIndex: number, pageSize: number) => group.getGroupEssenceMessages(this.#ctx, groupId, pageIndex, pageSize)
  setGroupEssenceMessage = (groupId: number, messageSeq: number, isSet?: boolean) => group.setGroupEssenceMessage(this.#ctx, groupId, messageSeq, isSet)
  quitGroup = (groupId: number) => group.quitGroup(this.#ctx, groupId)
  setGroupMessageReaction = (groupId: number, messageSeq: number, reaction: string, reactionType: 'face' | 'emoji', isAdd?: boolean) => group.sendGroupMessageReaction(this.#ctx, groupId, messageSeq, reaction, reactionType, isAdd)
  sendGroupNudge = (groupId: number, userId: number) => group.sendGroupNudge(this.#ctx, groupId, userId)
  getGroupNotifications = (start?: number, isFiltered?: boolean, limit?: number) => group.getGroupNotifications(this.#ctx, start, isFiltered, limit)
  acceptGroupRequest = (noticeId: number, noticeType: 'join_request' | 'invited_join_request', groupId: number, isFiltered?: boolean) => group.acceptGroupRequest(this.#ctx, noticeId, noticeType, groupId, isFiltered)
  rejectGroupRequest = (noticeId: number, noticeType: 'join_request' | 'invited_join_request', groupId: number, isFiltered?: boolean, reason?: string) => group.rejectGroupRequest(this.#ctx, noticeId, noticeType, groupId, isFiltered, reason)
  acceptGroupInvitation = (groupId: number, invitationSeq: number) => group.acceptGroupInvitation(this.#ctx, groupId, invitationSeq)
  rejectGroupInvitation = (groupId: number, invitationSeq: number) => group.rejectGroupInvitation(this.#ctx, groupId, invitationSeq)

  /* === message === */
  sendPrivateMessage = (userId: number, message: Parameters<typeof messageApi.sendPrivateMessage>[2]) => messageApi.sendPrivateMessage(this.#ctx, userId, message)
  sendGroupMessage = (groupId: number, message: Parameters<typeof messageApi.sendGroupMessage>[2]) => messageApi.sendGroupMessage(this.#ctx, groupId, message)
  recallPrivateMessage = (userId: number, messageSeq: number) => messageApi.recallPrivateMessage(this.#ctx, userId, messageSeq)
  recallGroupMessage = (groupId: number, messageSeq: number) => messageApi.recallGroupMessage(this.#ctx, groupId, messageSeq)
  getMessage = (scene: msgId.MessageScene, peerId: number, messageSeq: number) => messageApi.getMessage(this.#ctx, scene, peerId, messageSeq)
  getHistoryMessage = (scene: msgId.MessageScene, peerId: number, start?: number, limit?: number) => messageApi.getHistoryMessage(this.#ctx, scene, peerId, start, limit)
  getResourceTempUrl = (resourceId: string) => messageApi.getResourceTempUrl(this.#ctx, resourceId)
  getForwardedMessage = (forwardId: string) => messageApi.getForwardedMessage(this.#ctx, forwardId)
  markMessageAsRead = (scene: msgId.MessageScene, peerId: number, messageSeq: number) => messageApi.markMessageAsRead(this.#ctx, scene, peerId, messageSeq)

  /* === file === */
  uploadPrivateFile = (userId: number, fileUri: string, fileName: string) => fileApi.uploadPrivateFile(this.#ctx, userId, fileUri, fileName)
  uploadGroupFile = (groupId: number, folderId: string, fileUri: string, fileName: string) => fileApi.uploadGroupFile(this.#ctx, groupId, folderId, fileUri, fileName)
  getPrivateFileDownloadUrl = (userId: number, fileId: string, fileHash: string) => fileApi.getPrivateFileDownloadUrl(this.#ctx, userId, fileId, fileHash)
  getGroupFileDownloadUrl = (groupId: number, fileId: string) => fileApi.getGroupFileDownloadUrl(this.#ctx, groupId, fileId)
  getGroupFiles = (groupId: number, folderId?: string) => fileApi.getGroupFiles(this.#ctx, groupId, folderId)
  moveGroupFile = (groupId: number, fileId: string, folderId: string, targetId: string) => fileApi.moveGroupFile(this.#ctx, groupId, fileId, folderId, targetId)
  renameGroupFile = (groupId: number, fileId: string, folderId: string, newName: string) => fileApi.renameGroupFile(this.#ctx, groupId, fileId, folderId, newName)
  deleteGroupFile = (groupId: number, fileId: string) => fileApi.deleteGroupFile(this.#ctx, groupId, fileId)
  createGroupFolder = (groupId: number, folderName: string) => fileApi.createGroupFolder(this.#ctx, groupId, folderName)
  renameGroupFolder = (groupId: number, folderId: string, newName: string) => fileApi.renameGroupFolder(this.#ctx, groupId, folderId, newName)
  deleteGroupFolder = (groupId: number, folderId: string) => fileApi.deleteGroupFolder(this.#ctx, groupId, folderId)

  /* === msgId 工具（纯函数转发，保持调用方 bot.super.encodeMsgId 兼容） === */
  encodeMsgId = msgId.encodeMsgId
  decodeMsgId = msgId.decodeMsgId
  encodeVarint = msgId.encodeVarint
  decodeVarint = msgId.decodeVarint
}
