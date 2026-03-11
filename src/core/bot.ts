import { BotCfg } from '@/config/types'
import karin, { AdapterBase, AdapterType, Contact, contactFriend, contactGroup, contactGroupTemp, Elements, GetGroupHighlightsResponse, GroupInfo, GroupMemberInfo, logger, MessageResponse, registerBot, SendMsgResults, unregisterBot, UserInfo } from 'node-karin'
import { Client } from '@/core/Client'
import { AdapterConvertKarin, KarinConvertAdapter } from '@/event/convert'
import { dir, UrlEnd } from '@/utils'
import { WebHookHander } from '@/connection/webhook/handler'
import { WebSocketHandle } from '@/connection/websocket'
import { SSEClient } from '@/connection/ServerSentEvents'

export class MilkyAdapter extends AdapterBase implements AdapterType {
  #init = false
  super: Client
  cfg: BotCfg
  constructor (cfg: BotCfg) {
    super()
    this.cfg = cfg
    this.adapter = {
      index: 0,
      name: 'Milky-Adapter',
      version: dir.version,
      platform: 'qq',
      standard: 'other',
      protocol: 'other',
      communication: cfg.protocol === 'sse' || cfg.protocol === 'webhook' ? 'http' : cfg.protocol === 'websocket' || cfg.protocol === 'ws' ? 'webSocketClient' : 'other',
      address: UrlEnd(cfg.url),
      connectTime: 0,
      secret: cfg.token
    }
    this.super = new Client(this.adapter.address, this)
  }

  async init () {
    if (this.#init) return
    this.#init = true
    const info = await this.super.getLoginInfo()
    if (!info) throw new Error('获取登录信息失败')
    const selfId = String(info.uin)
    this.account = {
      uin: selfId,
      uid: selfId,
      selfId,
      name: info.nickname,
      avatar: `https://q1.qlogo.cn/g?b=qq&s=0&nk=${selfId}`,
      subId: {}
    }
    this.adapter.address += '/event'
    if (this.cfg.protocol === 'webhook') return WebHookHander.register(this)
    if (this.cfg.protocol === 'sse') return new SSEClient(this).connect()
    if (this.cfg.protocol === 'websocket' || this.cfg.protocol === 'ws') {
      const url = new URL(this.adapter.address)
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      this.adapter.address = url.toString()
      return new WebSocketHandle(this).connect()
    }
    return this.logger('error', '未知的通讯方式' + this.cfg.protocol)
  }

  get selfId (): string {
    return this.account.selfId
  }

  get selfName (): string {
    return this.account.name || ''
  }

  /** 注册Bot,仅限适配器内部调用 */
  __registerBot () {
    const index = registerBot(this.adapter.communication, this)
    if (index) this.adapter.index = index
  }

  /** 卸载Bot,仅限适配器内部调用 */
  __unregisterBot () {
    if (karin.getBotByIndex(this.adapter.index)) unregisterBot('index', this.adapter.index)
    this.adapter.index = 0
  }

  logger (level: 'info' | 'error' | 'trace' | 'debug' | 'mark' | 'warn' | 'fatal', ...args: any[]) {
    logger.bot(level, this.account.selfId, ...args)
  }

  async sendApi (action: string, params: any) {
    return this.super.request(action, params)
  }

  async sendMsg (contact: Contact, elements: Array<Elements>, _retryCount?: number): Promise<SendMsgResults> {
    const result: SendMsgResults = {
      messageId: '',
      time: 0,
      rawData: {},
      message_id: '',
      messageTime: 0,
    }
    const msg = await KarinConvertAdapter(elements)
    let res
    if (contact.scene === 'group') {
      res = await this.super.sendGroupMessage(+contact.peer, msg)
    } else {
      if (contact.scene === 'friend') {
        res = await this.super.sendPrivateMessage(+contact.peer, msg)
      } else {
        throw new Error('不支持的操作')
      }
    }
    result.messageId = this.super.serializeMsgId(contact.scene, +contact.peer, res.message_seq)
    result.time = res.time
    result.rawData = res
    return result
  }

  // async sendForwardMsg (_contact: Contact, _elements: Array<NodeElement>, _options?: ForwardOptions): Promise<{ messageId: string; forwardId: string }> {

  // }

  async recallMsg (contact: Contact, messageId: string): Promise<void> {
    const Id = +contact.peer
    const { seq } = this.super.deserializeMsgId(messageId)
    if (contact.scene === 'group') {
      await this.super.recallGroupMessage(Id, seq)
    } else {
      if (contact.scene === 'friend') {
        await this.super.recallPrivateMessage(Id, seq)
      }
    }
  }

  async getMsg (Contact: Contact | string, messageId?: string): Promise<MessageResponse> {
    let peerId: number | string, scene: 'friend' | 'group' | 'temp', seq
    if (typeof Contact === 'string') {
      ({ scene, peerId, seq } = this.super.deserializeMsgId(Contact))
      messageId = seq + ''
    } else {
      scene = Contact.scene === 'friend' ? 'friend' : Contact.scene === 'group' ? 'group' : 'temp'
      peerId = Contact.peer
      messageId = this.super.deserializeMsgId(messageId!).seq + ''
    }
    const { message } = await this.super.getMessage(scene, Number(peerId), Number(messageId))
    const userId = String(message.sender_id)
    const nickname = message.message_scene === 'friend' ? message.friend.nickname : message.message_scene === 'group' ? message.group_member.nickname : ''
    const contact = message.message_scene === 'friend'
      ? contactFriend(String(message.friend.user_id), message.friend.nickname)
      : message.message_scene === 'group'
        ? contactGroup(String(message.group.group_id), message.group.group_name)
        : contactGroupTemp(String(message.group?.group_id), String(message.sender_id))
    return {
      time: message.time,
      messageId: this.super.serializeMsgId(message.message_scene, message.peer_id, message.message_seq),
      messageSeq: message.message_seq,
      contact,
      sender: {
        role: message.message_scene === 'group' ? message.group_member.role : 'unknown',
        userId,
        nick: nickname,
        name: nickname
      },
      elements: await AdapterConvertKarin(message.segments)
    }
  }

  async getHistoryMsg (contact: Contact, startMsgSeq: string | number, count: number): Promise<MessageResponse[]> {
    const MsgId = typeof startMsgSeq === 'string' ? this.super.deserializeMsgId(startMsgSeq).seq : startMsgSeq
    const scene = contact.scene === 'friend' ? 'friend' : contact.scene === 'group' ? 'group' : 'temp'
    const result = (await this.super.getHistoryMessage(scene, +contact.peer, MsgId, count)).messages
    const elements: MessageResponse[] = []
    for (const i of result) {
      const userId = String(i.sender_id)
      const nickname = i.message_scene === 'friend' ? i.friend.nickname : i.message_scene === 'group' ? i.group_member.nickname : ''
      elements.push({
        time: i.time,
        messageId: this.super.serializeMsgId(i.message_scene, i.peer_id, i.message_seq),
        messageSeq: i.message_seq,
        contact: i.message_scene === 'friend'
          ? contactFriend(String(i.friend.user_id), i.friend.nickname)
          : i.message_scene === 'group'
            ? contactGroup(String(i.group.group_id), i.group.group_name)
            : contactGroupTemp(String(i.group?.group_id), String(i.sender_id)),
        sender: {
          role: i.message_scene === 'group' ? i.group_member.role : 'unknown',
          userId,
          nick: nickname,
          name: nickname
        },
        elements: await AdapterConvertKarin(i.segments)
      })
    }
    return elements
  }

  // async getForwardMsg (_resId: string): Promise<Array<MessageResponse>> {
  // }

  // async createResId (_contact: Contact, _elements: Array<NodeElement>): Promise<string> {
  // }

  async setMsgReaction (contact: Contact, messageId: string, faceId: number | string, isSet: boolean): Promise<void> {
    if (contact.scene !== 'group') throw new Error('仅支持群聊设置表情回应')
    const seq = this.super.deserializeMsgId(messageId).seq
    await this.super.setGroupMessageReaction(+contact.peer, seq, String(faceId), isSet)
  }

  async groupKickMember (_groupId: string, _targetId: string, _rejectAddRequest?: boolean, _kickReason?: string): Promise<void> {
    await this.super.kickGroupMember(+_groupId, +_targetId, _rejectAddRequest)
  }

  async setGroupMute (_groupId: string, _targetId: string, _duration: number): Promise<void> {
    await this.super.setGroupMemberMute(+_groupId, +_targetId, _duration)
  }

  async setGroupAllMute (_groupId: string, _isBan: boolean): Promise<void> {
    await this.super.setGroupWholeMute(+_groupId, _isBan)
  }

  async setGroupAdmin (_groupId: string, _targetId: string, _isAdmin: boolean): Promise<void> {
    await this.super.setGroupMemberAdmin(+_groupId, +_targetId, _isAdmin)
  }

  async setGroupMemberCard (_groupId: string, _targetId: string, _card: string): Promise<void> {
    await this.super.setGroupMemberCard(+_groupId, +_targetId, _card)
  }

  async setGroupName (_groupId: string, _groupName: string): Promise<void> {
    await this.super.setGroupName(+_groupId, _groupName)
  }

  async setGroupQuit (_groupId: string, _isDismiss: boolean): Promise<void> {
    const info = await this.getGroupMemberInfo(_groupId, this.account.selfId)
    if (['owner'].includes(info.role) && !_isDismiss) return
    await this.super.quitGroup(+_groupId)
  }

  async setGroupMemberTitle (_groupId: string, _targetId: string, _title: string): Promise<void> {
    await this.super.setGroupMemberSpecialTitle(+_groupId, +_targetId, _title)
  }

  // async setGroupRemark (_groupId: string, _remark: string): Promise<boolean> {
  // }

  // async getGroupMuteList (_groupId: string): Promise<Array<GetGroupMuteListResponse>> {

  // }

  async getGroupInfo (_groupId: string, _noCache?: boolean): Promise<GroupInfo> {
    const res = await this.super.getGroupInfo(+_groupId, _noCache)
    return {
      groupId: res.group.group_id + '',
      groupName: res.group.group_name,
      maxMemberCount: res.group.max_member_count,
      memberCount: res.group.member_count,
      admins: [],
      avatar: await this.getGroupAvatarUrl(_groupId, 640 as any)
    }
  }

  async getGroupList (_refresh?: boolean): Promise<Array<GroupInfo>> {
    const res = (await this.super.getGroupList(_refresh)).groups
    const groups: GroupInfo[] = []
    for (const i of res) {
      groups.push({
        groupId: i.group_id + '',
        groupName: i.group_name,
        maxMemberCount: i.max_member_count,
        memberCount: i.member_count,
        admins: []
      })
    }
    return groups
  }

  async getGroupMemberInfo (_groupId: string, _targetId: string, _refresh?: boolean): Promise<GroupMemberInfo> {
    const res = await this.super.getGroupMemberInfo(+_groupId, +_targetId, _refresh)
    return {
      userId: res.member.user_id + '',
      role: res.member.role,
      nick: res.member.nickname,
      age: 0,
      uniqueTitle: res.member.title,
      card: res.member.card,
      joinTime: res.member.join_time,
      lastActiveTime: res.member.last_sent_time,
      level: res.member.level,
      shutUpTime: res.member.shut_up_end_time || undefined,
      sex: res.member.sex,
      sender: {
        userId: res.member.user_id + '',
        nick: res.member.nickname,
        name: res.member.nickname,
        role: res.member.role,
        card: res.member.card,
        level: res.member.level,
        title: res.member.title
      }
    }
  }

  async getGroupMemberList (_groupId: string, _refresh?: boolean): Promise<Array<GroupMemberInfo>> {
    const res = (await this.super.getGroupMemberList(+_groupId, _refresh)).members
    const info: GroupMemberInfo[] = []
    for (const i of res) {
      info.push({
        userId: i.user_id + '',
        role: i.role,
        nick: i.nickname,
        age: 0,
        uniqueTitle: i.title,
        card: i.card,
        joinTime: i.join_time,
        lastActiveTime: i.last_sent_time,
        level: i.level,
        shutUpTime: i.shut_up_end_time || undefined,
        sex: i.sex,
        sender: {
          userId: i.user_id + '',
          nick: i.nickname,
          name: i.nickname,
          role: i.role,
          card: i.card,
          level: i.level,
          title: i.title
        }
      })
    }
    return info
  }

  // async getGroupHonor (_groupId: string): Promise<Array<QQGroupHonorInfo>> {
  // }

  async getGroupHighlights (_groupId: string, _page: number, _pageSize: number): Promise<Array<GetGroupHighlightsResponse>> {
    const res = (await this.super.getGroupEssenceMessages(+_groupId, _page, _pageSize)).messages
    const list: GetGroupHighlightsResponse[] = []
    for (const i of res) {
      list.push({
        groupId: i.group_id + '',
        senderId: i.sender_id + '',
        senderName: i.sender_name,
        operatorId: i.operator_id + '',
        operatorName: i.operator_name,
        operationTime: i.operation_time,
        messageTime: i.message_time,
        messageId: this.super.serializeMsgId('group', i.sender_id, i.message_seq),
        messageSeq: i.message_seq,
        jsonElements: JSON.stringify(i.segments)
      })
    }
    return list
  }

  async setGroupHighlights (_groupId: string, _messageId: string, _create: boolean): Promise<void> {
    await this.super.setGroupEssenceMessage(+_groupId, this.super.deserializeMsgId(_messageId).seq, _create)
  }

  //   async getNotJoinedGroupInfo (_groupId: string): Promise<GroupInfo> {
  //   }

  // async getAtAllCount (_groupId: string): Promise<GetAtAllCountResponse> {
  // }

  // async getStrangerInfo (_targetId: string): Promise<UserInfo> {
  // }

  async getFriendList (_refresh?: boolean): Promise<Array<UserInfo>> {
    const res = (await this.super.getFriendList(_refresh)).friends
    const info: UserInfo[] = []
    for (const i of res) {
      info.push({
        userId: i.user_id + '',
        nick: i.nickname,
        qid: i.qid,
        remark: i.remark,
        sex: i.sex
      })
    }
    return info
  }

  async sendLike (_targetId: string, _count: number): Promise<void> {
    await this.super.sendProfileLike(+_targetId, _count)
  }

  async getAvatarUrl (_userId: string, _size?: 0 | 40 | 100 | 140): Promise<string> {
    return `https://q1.qlogo.cn/g?b=qq&s=${_size || 0}&nk=${_userId}`
  }

  async getGroupAvatarUrl (_groupId: string, _size?: 0 | 40 | 100 | 140, _history?: number): Promise<string> {
    return `https://p.qlogo.cn/gh/${_groupId}/${_groupId}/${_size}`
  }

  // async pokeUser (_contact: Contact, _count?: number): Promise<boolean> {
  //   for (let i = 0; i < (_count || 1); i++) {
  //     const Id = +_contact.peer
  //     if (_contact.scene === 'friend') {
  //       await this.super.sendFriendNudge(Id, Id === +this.selfId)
  //       return true
  //     } else {
  //       if (_contact.scene === 'group') {
  //         await this.super.sendGroupNudge(Id, +_contact.subPeer)
  //         return true
  //       }
  //     }
  //   }
  // }

  async setFriendApplyResult (_requestId: string, _isApprove: boolean, _remark?: string): Promise<void> {
    _isApprove
      ? await this.super.acceptFriendRequest(_requestId)
      : await this.super.rejectFriendRequest(_requestId)
  }

  // async setGroupApplyResult (_requestId: string, _isApprove: boolean, _denyReason?: string): Promise<void> {
  //   _isApprove
  //     ? await this.super.acceptGroupRequest(_requestId, 'join_request')
  //     : await this.super.rejectGroupJoinRequest(_requestId, _denyReason)
  // }

  // async setInvitedJoinGroupResult (_requestId: string, _isApprove: boolean): Promise<void> {
  // }

  async getCookies (_domain: string): Promise<{ cookie: string }> {
    const res = await this.super.getCookies(_domain)
    return { cookie: res.cookies }
  }

  async getCredentials (_domain: string): Promise<{ cookies: string; csrf_token: number }> {
    const cookies = (await this.getCookies(_domain)).cookie
    const token = (await this.getCSRFToken()).token
    return { cookies, csrf_token: token }
  }

  async getCSRFToken (): Promise<{ token: number }> {
    const res = await this.super.getCSRFToken()
    return { token: +res.csrf_token }
  }
}
