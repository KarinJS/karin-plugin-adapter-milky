import EventEmitter from 'events'
import axios, { AxiosInstance } from 'node-karin/axios'
import {
  Event,
  GetCookiesOutput,
  GetCSRFTokenOutput,
  GetForwardedMessagesOutput,
  GetFriendInfoOutput,
  GetFriendListOutput,
  GetFriendRequestsOutput,
  GetGroupAnnouncementsOutput,
  GetGroupEssenceMessagesOutput,
  GetGroupInfoOutput,
  GetGroupListOutput,
  GetGroupMemberInfoOutput,
  GetGroupMemberListOutput,
  GetGroupNotificationsOutput,
  GetHistoryMessagesOutput,
  GetImplInfoOutput,
  GetLoginInfoOutput,
  GetMessageOutput,
  GetResourceTempUrlOutput,
  GetUserProfileOutput,
  OutgoingSegment,
  SendGroupMessageOutput,
  SendPrivateMessageOutput
} from '@saltify/milky-types'
import { BotCfg } from '@/config/types'
import { Root } from '@/utils'
import { WebHookHander } from '@/connection/webhook/handler'
import { UrlEnd } from '@/utils/utils'
import { WebSocketHandle } from '@/connection/websocket'
import { SSEHandle } from '@/connection/ServerSentEvents'

type EventMap = {
  [K in Event['event_type']]: (data: Extract<Event, { event_type: K }>) => void
} & {
  system_error: (msg: unknown) => void
  system_success: () => void
  system_offline: (...args: any) => void
}
type ApiResponse<T = unknown> =
  | {
    status: 'ok'
    retcode: 0
    data: T
  }
  | {
    status: 'failed'
    retcode: number
    message: string
  }

/** 群聊与消息相关接口扩展 */
export class Client extends EventEmitter {
  #axios: AxiosInstance
  /** 适配器信息 */
  adapter: {
    /** 适配器名称 */
    name: string
    /** 适配器版本 */
    version: string
  }

  /** 账号信息 */
  self: {
    /** 账号id */
    uin: number
    /** 账号昵称 */
    nickname: string
    /** 连接协议 */
    protocol: 'webhook' | 'sse' | 'websocket'
    /** 事件链接 */
    EventUrl: string
    /** Api链接 */
    ApiUrl: string
    /** 连接时间 */
    connectTime: number
    /** 事件链接的鉴权Token */
    token: string
    /** 在线状态 */
    online: boolean
  }

  #Clear: null | (() => void) = null

  constructor (cfg: BotCfg) {
    super()
    const url = UrlEnd(cfg.url)
    this.adapter = {
      name: 'Milky',
      version: Root.pluginVersion,
    }
    this.self = {
      uin: 0,
      nickname: 'Milky-Bot',
      protocol: cfg.protocol,
      EventUrl: cfg.protocol === 'sse'
        ? url + '/event'
        : cfg.protocol === 'websocket'
          ? (() => { const urlObj = new URL(url); urlObj.protocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:'; return urlObj.toString() })()
          : '',
      ApiUrl: url + '/api',
      connectTime: 0,
      token: cfg.token,
      online: false
    }
    const headers: any = {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
    if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`
    this.#axios = axios.create({
      baseURL: this.self.ApiUrl,
      headers
    })
  }

  on<K extends keyof EventMap> (event: K, listener: EventMap[K]): this {
    return super.on(event, listener)
  }

  emit<K extends keyof EventMap> (event: K, ...args: Parameters<EventMap[K]>) {
    return super.emit(event, ...args)
  }

  async init () {
    try {
      const BotInfo = Object.assign(await this.getLoginInfo(), await this.getImplInfo())
      if (!BotInfo.uin) throw new Error('获取登录信息失败')
      this.self.uin = BotInfo.uin
      this.self.nickname = BotInfo.nickname
      if (this.self.protocol === 'webhook') {
        WebHookHander.register(this)
        this.#Clear = () => {
          WebHookHander.clear(this.self.uin)
        }
      } else if (this.self.protocol === 'websocket') {
        const ws = new WebSocketHandle(this)
        ws.connect()
        this.#Clear = () => {
          ws.clear()
        }
      } else {
        const sse = new SSEHandle(this)
        sse.connect()
        this.#Clear = () => {
          sse.clear()
        }
      }
      this.on('bot_offline', (data) => {
        this.#Clear!()
        this.emit('system_offline', data.data.reason)
      })
      this.on('system_offline', () => { this.self.online = false })
      this.on('system_success', () => { this.self.online = true })
    } catch (err) {
      this.emit('system_error', err)
    }
  }

  private async request<T> (path: string, data?: any) {
    const res = await this.#axios.post<ApiResponse<T>>(path, data ?? {})
    if (res.data.status === 'failed') {
      throw new Error(res.data.message)
    } else {
      return res.data.data
    }
  }

  /** 获取登录信息 */
  async getLoginInfo () {
    return await this.request<GetLoginInfoOutput>('/get_login_info', {})
  }

  /** 获取协议端信息 */
  async getImplInfo () {
    return await this.request<GetImplInfoOutput>('/get_impl_info', {})
  }

  /**
   * 获取用户个人信息
   * @param userId 用户QQ号
   */
  async getUserProfile (userId: bigint) {
    return await this.request<GetUserProfileOutput>('/get_user_profile', { user_id: Number(userId) })
  }

  /**
   * 获取好友列表
   * @param [noCache=false] 是否强制不使用缓存
   */
  async getFriendList (noCache: boolean = false) {
    return await this.request<GetFriendListOutput>('/get_friend_list', { no_cache: noCache })
  }

  /**
   * 获取好友信息
   * @param userId 好友 QQ 号
   * @param [noCache=false] 是否强制不使用缓存
   */
  async getFriendInfo (userId: number, noCache: boolean = false) {
    return await this.request<GetFriendInfoOutput>('/get_friend_info', { user_id: Number(userId), no_cache: noCache })
  }

  /**
   * 获取群信息
   * @param groupId 群号
   * @param [noCache=false] 是否强制不使用缓存
   */
  async getGroupInfo (groupId: number, noCache: boolean = false) {
    return await this.request<GetGroupInfoOutput>('/get_group_info', { group_id: Number(groupId), no_cache: noCache })
  }

  /**
   * 获取群列表
   * @param [noCache=false] 是否强制不使用缓存
   */
  async getGroupList (noCache: boolean = false) {
    return await this.request<GetGroupListOutput>('/get_group_list', { no_cache: noCache })
  }

  /**
   * 获取群成员列表
   * @param groupId 群号
   * @param [noCache=false] 是否强制不使用缓存
   */
  async getGroupMemberList (groupId: number, noCache: boolean = false) {
    return await this.request<GetGroupMemberListOutput>('/get_group_member_list', { group_id: Number(groupId), no_cache: noCache })
  }

  /**
   * 获取群成员信息
   * @param groupId 群号
   * @param userId 群成员 QQ 号
   * @param [noCache=false] 是否强制不使用缓存
   */
  async getGroupMemberInfo (groupId: number, userId: number, noCache: boolean = false) {
    return await this.request<GetGroupMemberInfoOutput>('/get_group_member_info', { group_id: Number(groupId), user_id: Number(userId), no_cache: noCache })
  }

  /**
   * 获取 Cookies
   * @param domain 需要获取 Cookies 的域名
   */
  async getCookies (domain: string) {
    return await this.request<GetCookiesOutput>('/get_cookies', { domain })
  }

  /** 获取 CSRF Token */
  async getCSRFToken () {
    return await this.request<GetCSRFTokenOutput>('/get_csrf_token', {})
  }

  /**
   * 发送私聊消息
   * @param userId 好友 QQ 号
   * @param message 消息内容
   */
  async sendPrivateMessage (userId: number, message: OutgoingSegment[]) {
    return await this.request<SendPrivateMessageOutput>('/send_private_message', { user_id: Number(userId), message })
  }

  /**
   * 发送群聊消息
   * @param groupId 群号
   * @param message 消息内容
   */
  async sendGroupMessage (groupId: number, message: OutgoingSegment[]) {
    return await this.request<SendGroupMessageOutput>('/send_group_message', { group_id: Number(groupId), message })
  }

  /**
   * 撤回私聊消息
   * @param userId 好友 QQ 号
   * @param messageSeq 消息序列号
   */
  async recallPrivateMessage (userId: number, messageSeq: number) {
    return await this.request('/recall_private_message', { user_id: Number(userId), message_seq: Number(messageSeq) })
  }

  /**
   * 撤回群聊消息
   * @param groupId 群号
   * @param messageSeq 消息序列号
   */
  async recallGroupMessage (groupId: number, messageSeq: number) {
    return await this.request('/recall_group_message', { group_id: Number(groupId), message_seq: Number(messageSeq) })
  }

  /**
   * 获取消息
   * @param messageScene 消息场景
   * @param peerId 好友 QQ 号或群号
   * @param messageSeq 消息序列号
   */
  async getMessage (messageScene: 'friend' | 'group' | 'temp', peerId: number, messageSeq: number) {
    return await this.request<GetMessageOutput>('/get_message', { message_scene: messageScene, peer_id: Number(peerId), message_seq: Number(messageSeq) })
  }

  /**
   * 获取历史消息列表
   * @param messageScene 消息场景
   * @param peerId 好友 QQ 号或群号
   * @param start 起始消息序列号，由此开始从新到旧查询，不提供则从最新消息开始
   * @param [limit=20] 期望获取到的消息数量，最多 30 条
   */
  async getHistoryMessage (messageScene: 'friend' | 'group' | 'temp', peerId: number, start?: number, limit: number = 20) {
    return await this.request<GetHistoryMessagesOutput>('/get_history_messages', { message_scene: messageScene, peer_id: Number(peerId), start_message_seq: start, limit })
  }

  /**
   * 获取临时资源链接
   * @param resourceId 资源 ID
   */
  async getResourceTempUrl (resourceId: string) {
    return await this.request<GetResourceTempUrlOutput>('/get_resource_temp_url', { resource_id: resourceId })
  }

  /**
   * 获取合并转发消息内容
   * @param forwardId 转发消息 ID
   */
  async getForwardedMessage (forwardId: string) {
    return await this.request<GetForwardedMessagesOutput>('/get_forwarded_messages', { forward_id: forwardId })
  }

  /**
   * 标记消息为已读
   * @param messageScene 消息场景
   * @param peerId 好友 QQ 号或群号
   * @param messageSeq 标为已读的消息序列号，该消息及更早的消息将被标记为已读
   */
  async markMessageAsRead (messageScene: 'friend' | 'group' | 'temp', peerId: number, messageSeq: number) {
    return await this.request('/mark_message_as_read', { message_scene: messageScene, peer_id: Number(peerId), message_seq: Number(messageSeq) })
  }

  /**
   * 发送好友戳一戳
   * @param userId 好友 QQ 号
   * @param [isSelf=false] 是否戳自己
   */
  async sendFriendNudge (userId: number, isSelf: boolean = false) {
    return await this.request('/send_friend_nudge', { user_id: Number(userId), is_self: isSelf })
  }

  /**
   * 发送名片点赞
   * @param userId 好友 QQ 号
   * @param [count=1] 点赞数量
   */
  async sendProfileLike (userId: number, count: number = 1) {
    return await this.request('/send_profile_like', { user_id: Number(userId), count })
  }

  /**
   * 获取好友请求列表
   * @param limit 获取的最大请求数量
   * @param isFiltered `true` 表示只获取被过滤（由风险账号发起）的通知，`false` 表示只获取未被过滤的通知
   * @returns
   */
  async getFriendRequests (limit: number = 20, isFiltered: boolean = false) {
    return await this.request<GetFriendRequestsOutput>('/get_friend_requests', { limit, is_filtered: isFiltered })
  }

  /**
  * 同意好友请求
  * @param initiatorUid 请求发起者 UID
  * @param isFiltered 是否是被过滤的请求
  * @returns
  */
  async acceptFriendRequest (initiatorUid: string, isFiltered: boolean = false) {
    return await this.request('/accept_friend_request', { initiator_uid: initiatorUid, is_filtered: isFiltered })
  }

  /**
   * 拒绝好友请求
   * @param initiatorUid 请求发起者 UID
   * @param isFiltered 是否是被过滤的请求
   * @param reason 拒绝理由
   * @returns
   */
  async rejectFriendRequest (initiatorUid: string, isFiltered: boolean = false, reason: string = '') {
    return await this.request('/reject_friend_request', { initiator_uid: initiatorUid, is_filtered: isFiltered, reason })
  }

  /**
   * 设置群名称
   * @param groupId 群号
   * @param name 新群名称
   * @returns
   */
  async setGroupName (groupId: number, name: string) {
    return await this.request('/set_group_name', { group_id: Number(groupId), new_group_name: name })
  }

  /**
   * 设置群头像
   * @param groupId 群号
   * @param uri 头像文件 URI，支持 `file://` `http(s)://` `base64://` 三种格式
   * @returns
   */
  async setGroupAvatar (groupId: number, uri: string) {
    return await this.request('/set_group_avatar', { group_id: Number(groupId), image_uri: uri })
  }

  /**
   * 设置群名片
   * @param groupId 群号
   * @param userId 被设置的群成员 QQ 号
   * @param card 新群名片
   * @returns
   */
  async setGroupMemberCard (groupId: number, userId: number, card: string) {
    return await this.request('/set_group_member_card', { group_id: Number(groupId), user_id: Number(userId), card })
  }

  /**
   * 设置群成员专属头衔
   * @param groupId 群号
   * @param userId 被设置的群成员 QQ 号
   * @param title 新专属头衔
   * @returns
   */
  async setGroupMemberSpecialTitle (groupId: number, userId: number, title: string) {
    return await this.request('/set_group_member_special_title', { group_id: Number(groupId), user_id: Number(userId), special_title: title })
  }

  /**
   * 设置群管理员
   * @param groupId 群号
   * @param userId 被设置的 QQ 号
   * @param isSet 是否设置为管理员，`false` 表示取消管理员
   * @returns
   */
  async setGroupMemberAdmin (groupId: number, userId: number, isSet: boolean = true) {
    return await this.request('/set_group_member_admin', { group_id: Number(groupId), user_id: Number(userId), isSet })
  }

  /**
   * 设置群成员禁言
   * @param groupId 群号
   * @param userId 被设置的 QQ 号
   * @param duration 禁言持续时间（秒），设为 `0` 为取消禁言
   * @returns
   */
  async setGroupMemberMute (groupId: number, userId: number, duration: number = 0) {
    return await this.request('/set_group_member_mute', { group_id: Number(groupId), user_id: Number(userId), duration })
  }

  /**
   * 设置群全员禁言
   * @param groupId 群号
   * @param isMute 是否开启全员禁言，`false` 表示取消全员禁言
   * @returns
   */
  async setGroupWholeMute (groupId: number, isMute: boolean = true) {
    return await this.request('/set_group_whole_mute', { group_id: Number(groupId), is_mute: isMute })
  }

  /**
   * 踢出群成员
   * @param groupId 群号
   * @param userId 被踢的 QQ 号
   * @param rejectRequest 是否拒绝加群申请，`false` 表示不拒绝
   * @returns
   */
  async kickGroupMember (groupId: number, userId: number, rejectRequest: boolean = false) {
    return await this.request('/kick_group_member', { group_id: Number(groupId), user_id: Number(userId), reject_add_request: rejectRequest })
  }

  /**
   * 获取群公告列表
   * @param groupId 群号
   * @returns
   */
  async getGroupAnnouncements (groupId: number) {
    return await this.request<GetGroupAnnouncementsOutput>('/get_group_announcements', { group_id: Number(groupId) })
  }

  /**
   * 发送群公告
   * @param groupId 群号
   * @param content 公告内容
   * @param uri 公告附带图像文件 URI，支持 `file://` `http(s)://` `base64://` 三种格式
   * @returns
   */
  async sendGroupAnnouncement (groupId: number, content: string, uri?: string) {
    return await this.request('/send_group_announcement', { group_id: Number(groupId), content, image_uri: uri })
  }

  /**
   * 删除群公告
   * @param groupId 群号
   * @param id 公告 ID
   * @returns
   */
  async deleteGroupAnnouncement (groupId: number, id: string) {
    return await this.request('/delete_group_announcement', { group_id: Number(groupId), announcement_id: String(id) })
  }

  /**
   * 获取群精华消息列表
   * @param groupId 群号
   * @param pageIndex 页码索引，从 0 开始
   * @param pageSize 每页包含的精华消息数量
   * @returns
   */
  async getGroupEssenceMessages (groupId: number, pageIndex: number, pageSize: number) {
    return await this.request<GetGroupEssenceMessagesOutput>('/get_group_essence_messages', { group_id: Number(groupId), page_index: Number(pageIndex), page_size: Number(pageSize) })
  }

  /**
   * 设置群精华消息
   * @param groupId 群号
   * @param messageSeq 消息序列号
   * @param isSet 是否设置为精华消息，`false` 表示取消精华
   * @returns
   */
  async setGroupEssenceMessage (groupId: number, messageSeq: number, isSet: boolean = true) {
    return await this.request('/set_group_essence_message', { group_id: Number(groupId), message_seq: messageSeq, is_set: isSet })
  }

  /**
   * 退出群
   * @param groupId 群号
   * @returns
   */
  async quitGroup (groupId: number) {
    return await this.request('/quit_group', { group_id: Number(groupId) })
  }

  /**
   * 发送群消息表情回应
   * @param groupId 群号
   * @param messageSeq 要回应的消息序列号
   * @param reaction 表情 ID
   * @param isAdd 是否添加表情，`false` 表示取消
   * @returns
   */
  async setGroupMessageReaction (groupId: number, messageSeq: number, reaction: string, isAdd: boolean = true) {
    return await this.request('/send_group_message_reaction', { group_id: Number(groupId), message_seq: messageSeq, reaction, is_add: isAdd })
  }

  /**
   * 发送群戳一戳
   * @param groupId 群号
   * @param userId 被戳的群成员 QQ 号
   * @returns
   */
  async sendGroupNudge (groupId: number, userId: number) {
    return await this.request('/send_group_nudge', { group_id: Number(groupId), user_id: Number(userId) })
  }

  /**
   * 获取群通知列表
   * @param start 起始通知序列号
   * @param isFiltered `true` 表示只获取被过滤（由风险账号发起）的通知，`false` 表示只获取未被过滤的通知
   * @param limit 获取的最大通知数量
   * @returns
   */
  async getGroupNotifications (start?: number, isFiltered: boolean = false, limit: number = 20) {
    return await this.request<GetGroupNotificationsOutput>('/get_group_notifications', { start_notification_seq: start, is_filtered: isFiltered, limit })
  }

  /**
   * 同意入群/邀请他人入群请求
   * @param noticeId 请求对应的通知序列号
   * @param noticeType 请求对应的通知类型
   * @param groupId 请求所在的群号
   * @param isFiltered 是否是被过滤的请求
   * @returns
   */
  async acceptGroupRequest (noticeId: number, noticeType: 'join_request' | 'invited_join_request', groupId: number, isFiltered: boolean = false) {
    return await this.request('/accept_group_request', { notification_seq: noticeId, notification_type: noticeType, group_id: Number(groupId), is_filtered: isFiltered })
  }

  /**
   * 拒绝入群/邀请他人入群请求
   * @param noticeId 请求对应的通知序列号
   * @param noticeType 请求对应的通知类型
   * @param groupId 请求所在的群号
   * @param isFiltered 是否是被过滤的请求
   * @param reason 拒绝理由
   * @returns
   */
  async rejectGroupRequest (noticeId: number, noticeType: 'join_request' | 'invited_join_request', groupId: number, isFiltered: boolean = false, reason?: string) {
    return await this.request('/reject_group_request', { notification_seq: noticeId, notification_type: noticeType, group_id: Number(groupId), is_filtered: isFiltered, reason })
  }

  /**
   * 同意他人邀请自身入群
   * @param groupId 群号
   * @param invitationSeq 邀请序列号
   * @returns
   */
  async acceptGroupInvitation (groupId: number, invitationSeq: number) {
    return await this.request('/accept_group_invitation', { group_id: Number(groupId), invitation_seq: invitationSeq })
  }

  /**
   * 拒绝他人邀请自身入群
   * @param groupId 群号
   * @param invitationSeq 邀请序列号
   * @returns
   */
  async rejectGroupInvitation (groupId: number, invitationSeq: number) {
    return await this.request('/reject_group_invitation', { group_id: Number(groupId), invitation_seq: invitationSeq })
  }

  /**
   * 解析消息ID
   * @param msgId 消息ID
   * @returns
   */
  deserializeMsgId (msgId: string): {
    scene: 'friend' | 'group' | 'temp'
    peerId: number
    seq: number
  } {
    const [scene, peerId, seq] = msgId.split(':') as any
    return {
      scene,
      peerId: +peerId,
      seq: +seq
    }
  }

  /**
   * 组合消息Id
   * @param scene 消息场景
   * @param peerId 发送者id
   * @param seq 消息序列号
   * @returns
   */
  serializeMsgId (scene: string, peerId: number, seq: number) {
    return `${scene}:${peerId}:${seq}`
  }
}
