import axios, { AxiosInstance } from 'node-karin/axios'
import {
  CreateGroupFolderOutput,
  GetCookiesOutput,
  GetCSRFTokenOutput,
  GetCustomFaceUrlListOutput,
  GetForwardedMessagesOutput,
  GetFriendInfoOutput,
  GetFriendListOutput,
  GetFriendRequestsOutput,
  GetGroupAnnouncementsOutput,
  GetGroupEssenceMessagesOutput,
  GetGroupFileDownloadUrlOutput,
  GetGroupFilesOutput,
  GetGroupInfoOutput,
  GetGroupListOutput,
  GetGroupMemberInfoOutput,
  GetGroupMemberListOutput,
  GetGroupNotificationsOutput,
  GetHistoryMessagesOutput,
  GetImplInfoOutput,
  GetLoginInfoOutput,
  GetMessageOutput,
  GetPrivateFileDownloadUrlOutput,
  GetResourceTempUrlOutput,
  GetUserProfileOutput,
  OutgoingSegment,
  SendGroupMessageOutput,
  SendPrivateMessageOutput,
  UploadGroupFileOutput,
  UploadPrivateFileOutput
} from '@saltify/milky-types'
import { MilkyAdapter } from './bot'

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

/** 接口API */
export class Client {
  #axios: AxiosInstance

  constructor (url: string, bot: MilkyAdapter) {
    const headers: any = {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
    if (bot.adapter.secret) headers.Authorization = `Bearer ${bot.adapter.secret}`
    this.#axios = axios.create({
      baseURL: url + '/api',
      headers
    })
  }

  async request<T> (path: string, data?: any) {
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
  async getUserProfile (userId: number) {
    return await this.request<GetUserProfileOutput>('/get_user_profile', { user_id: +userId })
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
    return await this.request<GetFriendInfoOutput>('/get_friend_info', { user_id: +userId, no_cache: noCache })
  }

  /**
   * 获取群列表
   * @param [noCache=false] 是否强制不使用缓存
   */
  async getGroupList (noCache: boolean = false) {
    return await this.request<GetGroupListOutput>('/get_group_list', { no_cache: noCache })
  }

  /**
   * 获取群信息
   * @param groupId 群号
   * @param [noCache=false] 是否强制不使用缓存
   */
  async getGroupInfo (groupId: number, noCache: boolean = false) {
    return await this.request<GetGroupInfoOutput>('/get_group_info', { group_id: +groupId, no_cache: noCache })
  }

  /**
   * 获取群成员列表
   * @param groupId 群号
   * @param [noCache=false] 是否强制不使用缓存
   */
  async getGroupMemberList (groupId: number, noCache: boolean = false) {
    return await this.request<GetGroupMemberListOutput>('/get_group_member_list', { group_id: +groupId, no_cache: noCache })
  }

  /**
   * 获取群成员信息
   * @param groupId 群号
   * @param userId 群成员 QQ 号
   * @param [noCache=false] 是否强制不使用缓存
   */
  async getGroupMemberInfo (groupId: number, userId: number, noCache: boolean = false) {
    return await this.request<GetGroupMemberInfoOutput>('/get_group_member_info', { group_id: +groupId, user_id: +userId, no_cache: noCache })
  }

  /**
   * 设置 QQ 账号头像
   * @param uri 头像文件 URI，支持 file:// http(s):// base64:// 三种格式
   */
  async setAvatar (uri: string) {
    return await this.request('/set_avatar', { uri })
  }

  /**
   * 设置 QQ 账号昵称
   * @param name 新昵称
   */
  async setNickName (name: string) {
    return await this.request('/set_nickname', { new_nickname: name })
  }

  /**
   * 设置 QQ 账号个性签名
   * @param bio 新个性签名
   */
  async setBio (bio: string) {
    return await this.request('/set_bio', { new_bio: bio })
  }

  /**
   * 获取自定义表情 URL 列表
   */
  async getCustomFaceUrlList () {
    return await this.request<GetCustomFaceUrlListOutput>('/get_custom_face_url_list', {})
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
    return await this.request<SendPrivateMessageOutput>('/send_private_message', { user_id: +userId, message })
  }

  /**
   * 发送群聊消息
   * @param groupId 群号
   * @param message 消息内容
   */
  async sendGroupMessage (groupId: number, message: OutgoingSegment[]) {
    return await this.request<SendGroupMessageOutput>('/send_group_message', { group_id: +groupId, message })
  }

  /**
   * 撤回私聊消息
   * @param userId 好友 QQ 号
   * @param messageSeq 消息序列号
   */
  async recallPrivateMessage (userId: number, messageSeq: number) {
    return await this.request('/recall_private_message', { user_id: +userId, message_seq: +messageSeq })
  }

  /**
   * 撤回群聊消息
   * @param groupId 群号
   * @param messageSeq 消息序列号
   */
  async recallGroupMessage (groupId: number, messageSeq: number) {
    return await this.request('/recall_group_message', { group_id: +groupId, message_seq: +messageSeq })
  }

  /**
   * 获取消息
   * @param messageScene 消息场景
   * @param peerId 好友 QQ 号或群号
   * @param messageSeq 消息序列号
   */
  async getMessage (messageScene: 'friend' | 'group' | 'temp', peerId: number, messageSeq: number) {
    return await this.request<GetMessageOutput>('/get_message', { message_scene: messageScene, peer_id: +peerId, message_seq: +messageSeq })
  }

  /**
   * 获取历史消息列表
   * @param messageScene 消息场景
   * @param peerId 好友 QQ 号或群号
   * @param start 起始消息序列号，由此开始从新到旧查询，不提供则从最新消息开始
   * @param [limit=20] 期望获取到的消息数量，最多 30 条
   */
  async getHistoryMessage (messageScene: 'friend' | 'group' | 'temp', peerId: number, start?: number, limit: number = 20) {
    return await this.request<GetHistoryMessagesOutput>('/get_history_messages', { message_scene: messageScene, peer_id: +peerId, start_message_seq: start, limit })
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
    return await this.request('/mark_message_as_read', { message_scene: messageScene, peer_id: +peerId, message_seq: +messageSeq })
  }

  /**
   * 发送好友戳一戳
   * @param userId 好友 QQ 号
   * @param [isSelf=false] 是否戳自己
   */
  async sendFriendNudge (userId: number, isSelf: boolean = false) {
    return await this.request('/send_friend_nudge', { user_id: +userId, is_self: isSelf })
  }

  /**
   * 发送名片点赞
   * @param userId 好友 QQ 号
   * @param [count=1] 点赞数量
   */
  async sendProfileLike (userId: number, count: number = 1) {
    return await this.request('/send_profile_like', { user_id: +userId, count })
  }

  async deleteFriend (userId: number) {
    return await this.request('/delete_friend', { user_id: +userId })
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
    return await this.request('/set_group_name', { group_id: +groupId, new_group_name: name })
  }

  /**
   * 设置群头像
   * @param groupId 群号
   * @param uri 头像文件 URI，支持 `file://` `http(s)://` `base64://` 三种格式
   * @returns
   */
  async setGroupAvatar (groupId: number, uri: string) {
    return await this.request('/set_group_avatar', { group_id: +groupId, image_uri: uri })
  }

  /**
   * 设置群名片
   * @param groupId 群号
   * @param userId 被设置的群成员 QQ 号
   * @param card 新群名片
   * @returns
   */
  async setGroupMemberCard (groupId: number, userId: number, card: string) {
    return await this.request('/set_group_member_card', { group_id: +groupId, user_id: +userId, card })
  }

  /**
   * 设置群成员专属头衔
   * @param groupId 群号
   * @param userId 被设置的群成员 QQ 号
   * @param title 新专属头衔
   * @returns
   */
  async setGroupMemberSpecialTitle (groupId: number, userId: number, title: string) {
    return await this.request('/set_group_member_special_title', { group_id: +groupId, user_id: +userId, special_title: title })
  }

  /**
   * 设置群管理员
   * @param groupId 群号
   * @param userId 被设置的 QQ 号
   * @param isSet 是否设置为管理员，`false` 表示取消管理员
   * @returns
   */
  async setGroupMemberAdmin (groupId: number, userId: number, isSet: boolean = true) {
    return await this.request('/set_group_member_admin', { group_id: +groupId, user_id: +userId, isSet })
  }

  /**
   * 设置群成员禁言
   * @param groupId 群号
   * @param userId 被设置的 QQ 号
   * @param duration 禁言持续时间（秒），设为 `0` 为取消禁言
   * @returns
   */
  async setGroupMemberMute (groupId: number, userId: number, duration: number = 0) {
    return await this.request('/set_group_member_mute', { group_id: +groupId, user_id: +userId, duration })
  }

  /**
   * 设置群全员禁言
   * @param groupId 群号
   * @param isMute 是否开启全员禁言，`false` 表示取消全员禁言
   * @returns
   */
  async setGroupWholeMute (groupId: number, isMute: boolean = true) {
    return await this.request('/set_group_whole_mute', { group_id: +groupId, is_mute: isMute })
  }

  /**
   * 踢出群成员
   * @param groupId 群号
   * @param userId 被踢的 QQ 号
   * @param rejectRequest 是否拒绝加群申请，`false` 表示不拒绝
   * @returns
   */
  async kickGroupMember (groupId: number, userId: number, rejectRequest: boolean = false) {
    return await this.request('/kick_group_member', { group_id: +groupId, user_id: +userId, reject_add_request: rejectRequest })
  }

  /**
   * 获取群公告列表
   * @param groupId 群号
   * @returns
   */
  async getGroupAnnouncements (groupId: number) {
    return await this.request<GetGroupAnnouncementsOutput>('/get_group_announcements', { group_id: +groupId })
  }

  /**
   * 发送群公告
   * @param groupId 群号
   * @param content 公告内容
   * @param uri 公告附带图像文件 URI，支持 `file://` `http(s)://` `base64://` 三种格式
   * @returns
   */
  async sendGroupAnnouncement (groupId: number, content: string, uri?: string) {
    return await this.request('/send_group_announcement', { group_id: +groupId, content, image_uri: uri })
  }

  /**
   * 删除群公告
   * @param groupId 群号
   * @param id 公告 ID
   * @returns
   */
  async deleteGroupAnnouncement (groupId: number, id: string) {
    return await this.request('/delete_group_announcement', { group_id: +groupId, announcement_id: String(id) })
  }

  /**
   * 获取群精华消息列表
   * @param groupId 群号
   * @param pageIndex 页码索引，从 0 开始
   * @param pageSize 每页包含的精华消息数量
   * @returns
   */
  async getGroupEssenceMessages (groupId: number, pageIndex: number, pageSize: number) {
    return await this.request<GetGroupEssenceMessagesOutput>('/get_group_essence_messages', { group_id: +groupId, page_index: +pageIndex, page_size: +pageSize })
  }

  /**
   * 设置群精华消息
   * @param groupId 群号
   * @param messageSeq 消息序列号
   * @param isSet 是否设置为精华消息，`false` 表示取消精华
   * @returns
   */
  async setGroupEssenceMessage (groupId: number, messageSeq: number, isSet: boolean = true) {
    return await this.request('/set_group_essence_message', { group_id: +groupId, message_seq: messageSeq, is_set: isSet })
  }

  /**
   * 退出群
   * @param groupId 群号
   * @returns
   */
  async quitGroup (groupId: number) {
    return await this.request('/quit_group', { group_id: +groupId })
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
    return await this.request('/send_group_message_reaction', { group_id: +groupId, message_seq: messageSeq, reaction, is_add: isAdd })
  }

  /**
   * 发送群戳一戳
   * @param groupId 群号
   * @param userId 被戳的群成员 QQ 号
   * @returns
   */
  async sendGroupNudge (groupId: number, userId: number) {
    return await this.request('/send_group_nudge', { group_id: +groupId, user_id: +userId })
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
    return await this.request('/accept_group_request', { notification_seq: noticeId, notification_type: noticeType, group_id: +groupId, is_filtered: isFiltered })
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
    return await this.request('/reject_group_request', { notification_seq: noticeId, notification_type: noticeType, group_id: +groupId, is_filtered: isFiltered, reason })
  }

  /**
   * 同意他人邀请自身入群
   * @param groupId 群号
   * @param invitationSeq 邀请序列号
   * @returns
   */
  async acceptGroupInvitation (groupId: number, invitationSeq: number) {
    return await this.request('/accept_group_invitation', { group_id: +groupId, invitation_seq: invitationSeq })
  }

  /**
   * 拒绝他人邀请自身入群
   * @param groupId 群号
   * @param invitationSeq 邀请序列号
   * @returns
   */
  async rejectGroupInvitation (groupId: number, invitationSeq: number) {
    return await this.request('/reject_group_invitation', { group_id: +groupId, invitation_seq: invitationSeq })
  }

  /**
   * 上传私聊文件
   * @param userId 好友 QQ 号
   * @param fileUri 文件 URI，支持 `file://` `http(s)://` `base64://` 三种格式
   * @param fileName 文件名称
   * @returns
   */
  async uploadPrivateFile (userId: number, fileUri: string, fileName: string) {
    return await this.request<UploadPrivateFileOutput>('/upload_private_file', { user_id: +userId, file_uri: fileUri, file_name: fileName })
  }

  /**
   * 上传群文件
   * @param groupId 群号
   * @param folderId 目标文件夹 ID
   * @param fileUri 文件 URI，支持 `file://` `http(s)://` `base64://` 三种格式
   * @param fileName 文件名称
   * @returns
   */
  async uploadGroupFile (groupId: number, folderId: string = '/', fileUri: string, fileName: string) {
    return await this.request<UploadGroupFileOutput>('/upload_group_file', { group_id: +groupId, parent_folder_id: folderId, file_uri: fileUri, file_name: fileName })
  }

  /**
   * 获取私聊文件下载链接
   * @param userId 好友 QQ 号
   * @param fileId 文件 ID
   * @param fileHash 文件的 TriSHA1 哈希值
   * @returns
   */
  async getPrivateFileDownloadUrl (userId: string, fileId: string, fileHash: string) {
    return await this.request<GetPrivateFileDownloadUrlOutput>('/get_private_file_download_url', { user_id: +userId, file_id: fileId, file_hash: fileHash })
  }

  /**
   * 获取群文件下载链接
   * @param groupId 群号
   * @param fileId 文件 ID
   * @returns
   */
  async getGroupFileDownloadUrl (groupId: number, fileId: string) {
    return await this.request<GetGroupFileDownloadUrlOutput>('/get_group_file_download_url', { group_id: +groupId, file_id: fileId })
  }

  /**
   * 获取群文件列表
   * @param groupId 群号
   * @param folderId 父文件夹 ID
   * @returns
   */
  async getGroupFiles (groupId: number, folderId: string = '/') {
    return await this.request<GetGroupFilesOutput>('/get_group_files', { group_id: +groupId, parent_folder_id: folderId })
  }

  /**
   * 移动群文件
   * @param groupId 群号
   * @param fileId 文件 ID
   * @param folderId 文件所在的文件夹 ID
   * @param targetId 目标文件夹 ID
   * @returns
   */
  async moveGroupFile (groupId: number, fileId: string, folderId: string = '/', targetId: string = '/') {
    return await this.request('/move_group_file', { group_id: +groupId, file_id: fileId, parent_folder_id: folderId, target_folder_id: targetId })
  }

  /**
   * 重命名群文件
   * @param groupId 群号
   * @param fileId 文件 ID
   * @param folderId 文件所在的文件夹 ID
   * @param newName 新文件名称
   * @returns
   */
  async renameGroupFile (groupId: number, fileId: string, folderId: string = '/', newName: string) {
    return await this.request('/rename_group_file', { group_id: +groupId, file_id: fileId, parent_folder_id: folderId, new_file_name: newName })
  }

  /**
   * 删除群文件
   * @param groupId 群号
   * @param fileId 文件 ID
   * @returns
   */
  async deleteGroupFile (groupId: number, fileId: string) {
    return await this.request('/delete_group_file', { group_id: +groupId, file_id: fileId })
  }

  /**
   * 创建群文件夹
   * @param groupId 群号
   * @param folderName 文件夹名称
   * @returns
   */
  async createGroupFolder (groupId: number, folderName: string) {
    return await this.request<CreateGroupFolderOutput>('/create_group_folder', { group_id: +groupId, folder_name: folderName })
  }

  /**
   * 重命名群文件夹
   * @param groupId 群号
   * @param folderId 文件夹 ID
   * @param newName 新文件夹名
   * @returns
   */
  async renameGroupFolder (groupId: number, folderId: string, newName: string) {
    return await this.request('/rename_group_folder', { group_id: +groupId, folder_id: folderId, new_folder_name: newName })
  }

  /**
   * 删除群文件夹
   * @param groupId 群号
   * @param folderId 文件夹 ID
   * @returns
   */
  async deleteGroupFolder (groupId: number, folderId: string) {
    return await this.request('/delete_group_folder', { group_id: +groupId, folder_id: folderId })
  }

  encodeVarint (value: number) {
    if (value < 0) throw new Error('value不可为负')
    const bytes: number[] = []
    while (value > 127) {
      bytes.push((value & 127) | 128)
      value >>>= 7
    }
    bytes.push(value)
    return bytes
  }

  decodeVarint (buffer: Buffer | Uint8Array, offset: { index: number }) {
    let result = 0
    let shift = 0
    while (true) {
      if (offset.index >= buffer.length) throw new Error('数据不正确')
      const byte = buffer[offset.index++]
      result |= (byte & 127) << shift
      if ((byte & 128) === 0) break
      shift += 7
      if (shift > 35) throw new Error('数据过大')
    }
    return result
  }

  /**
   * 生成MsgId
   * @param scene 场景
   * @param peerId 群号或者好友ID
   * @param seq 消息Seq
   */
  encodeMsgId (scene: 'group' | 'friend' | 'temp', peerId: number, seq: number) {
    const sceneId = scene === 'group' ? 0 : scene === 'friend' ? 1 : 2

    const bytes = [
      ...this.encodeVarint(sceneId),
      ...this.encodeVarint(peerId),
      ...this.encodeVarint(seq)
    ]
    return Buffer
      .from(bytes)
      .toString('base64')
      .replace(/=+$/, '')
  }

  decodeMsgId (msgid: string) {
    msgid += '==='.slice((msgid.length + 3) % 4)
    const buffer = Buffer.from(msgid, 'base64')
    const offset = { index: 0 }
    const sceneId = this.decodeVarint(buffer, offset)
    const scene = (sceneId === 0 ? 'group' : sceneId === 1 ? 'friend' : 'temp') as 'group' | 'friend' | 'temp'
    const peerId = this.decodeVarint(buffer, offset)
    const seq = this.decodeVarint(buffer, offset)
    return {
      scene,
      peerId,
      seq
    }
  }
}
