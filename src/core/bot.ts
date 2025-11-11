import { BotCfg } from '@/config/types'
import karin, { AdapterBase, AdapterType, Contact, contactFriend, contactGroup, contactGroupTemp, Elements, GroupInfo, logger, MessageResponse, registerBot, SendMsgResults, unregisterBot } from 'node-karin'
import { Client } from './Client'
import { createMessage } from '@/event/message'
import { AdapterConvertKarin, KarinConvertAdapter } from '@/event/convert'

export class AdapterMilky extends AdapterBase implements AdapterType {
  #init = false
  super: Client
  constructor (cfg: BotCfg) {
    super()
    this.super = new Client(cfg)
    this.adapter = {
      index: 0,
      name: this.super.adapter.name,
      version: this.super.adapter.version,
      platform: 'qq',
      standard: 'other',
      protocol: 'other',
      communication: this.super.self.protocol === 'sse' ? 'http' : this.super.self.protocol === 'websocket' ? 'webSocketClient' : 'other',
      address: this.super.self.EventUrl,
      connectTime: this.super.self.connectTime,
      secret: this.super.self.token
    }
  }

  async init () {
    if (this.#init) return
    this.#init = true
    this.super.on('system_error', (event) => {
      this.logger('error', '适配器 连接错误: ', event)
    })
    this.super.on('system_offline', (event) => {
      this.logger('error', 'Bot下线: ', event)
      if (karin.getBotByIndex(this.adapter.index)) unregisterBot('index', this.adapter.index)
    })
    this.super.once('system_success', () => {
      const selfId = String(this.super.self.uin)
      this.account = {
        uin: selfId,
        uid: selfId,
        selfId,
        name: this.super.self.nickname,
        avatar: `https://q1.qlogo.cn/g?b=qq&s=0&nk=${selfId}`,
        subId: {
          guild: '',
          channel: '',
          user: ''
        }
      }
      const index = registerBot(this.adapter.communication, this)
      if (index) this.adapter.index = index
    })
    this.super.on('message_receive', async (event) => {
      createMessage(event.data, this)
    })
    await this.super.init()
  }

  get selfId (): string {
    return this.account.uid || this.account.uin || this.account.selfId
  }

  get selfName (): string {
    return this.account.name || ''
  }

  logger (level: 'info' | 'error' | 'trace' | 'debug' | 'mark' | 'warn' | 'fatal', ...args: any[]) {
    logger.bot(level, this.account.uid || this.account.uin, ...args)
  }

  async sendMsg (contact: Contact, elements: Array<Elements>, _retryCount?: number): Promise<SendMsgResults> {
    const result: SendMsgResults = {
      messageId: '',
      time: 0,
      rawData: {},
      message_id: '',
      messageTime: 0
    }
    const msg = await KarinConvertAdapter(elements)
    let res
    if (contact.scene === 'group') {
      res = await this.super.sendGroupMessage(Number(contact.peer), msg)
    } else {
      if (contact.scene === 'friend') {
        res = await this.super.sendPrivateMessage(Number(contact.peer), msg)
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
    const Id = Number(contact.peer)
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
    await this.super.setGroupMessageReaction(+contact.peer, seq, faceId + '', isSet)
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
      admins: []
    }
  }
}
