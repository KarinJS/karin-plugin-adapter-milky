import { AdapterBase, registerBot, unregisterBot, logger } from 'node-karin'
import { MilkyWebSocket } from '../connection/websocket'
import { createMessage } from './message'
import {
  handleFriendRequest,
  handleGroupJoinRequest,
  handleGroupInvitation,
  handleGroupMemberIncrease,
  handleGroupMemberDecrease,
  handleGroupAdminChange,
  handleMessageRecall,
  handleBotOffline,
} from './events'
import type { Contact, SendElement, SendMsgResults } from 'node-karin'
import type { MilkyType } from '../core/types'

/**
 * Milky适配器
 * 将Milky协议适配到Karin
 */
export class AdapterMilky extends AdapterBase {
  #isInit = false
  _milky: MilkyType

  constructor (milky: MilkyType) {
    super()
    this.adapter.platform = 'qq'
    this.adapter.standard = 'other'  // Milky不在标准列表中，使用'other'
    this._milky = milky
  }

  async init () {
    if (this.#isInit) return
    this.#isInit = true

    await this._milky.init()
    this.setAdapterInfo()

    // 监听消息接收事件
    this._milky.on('message_receive', (data) => {
      createMessage(data, this)
    })

    // 监听好友请求事件
    this._milky.on('friend_request', (data) => {
      handleFriendRequest(data, this)
    })

    // 监听加群请求事件
    this._milky.on('group_join_request', (data) => {
      handleGroupJoinRequest(data, this)
    })

    // 监听群邀请事件
    this._milky.on('group_invitation', (data) => {
      handleGroupInvitation(data, this)
    })

    // 监听群成员增加事件
    this._milky.on('group_member_increase', (data) => {
      handleGroupMemberIncrease(data, this)
    })

    // 监听群成员减少事件
    this._milky.on('group_member_decrease', (data) => {
      handleGroupMemberDecrease(data, this)
    })

    // 监听群管理员变更事件
    this._milky.on('group_admin_change', (data) => {
      handleGroupAdminChange(data, this)
    })

    // 监听消息撤回事件
    this._milky.on('message_recall', (data) => {
      handleMessageRecall(data, this)
    })

    // 监听Bot离线事件
    this._milky.on('bot_offline', (data) => {
      handleBotOffline(data, this)
    })
  }

  /**
   * 注册机器人
   */
  registerBot () {
    const commType = this._milky instanceof MilkyWebSocket ? 'webSocketClient' : 'http'
    logger.bot('info', this.selfId, `[Milky][${commType}] 连接成功`)
    this.adapter.index = registerBot(commType, this)
  }

  /**
   * 卸载注册的机器人
   */
  unregisterBot () {
    unregisterBot('index', this.adapter.index)
    logger.bot('info', this.selfId, '连接关闭')
  }

  /** 设置适配器信息 */
  setAdapterInfo () {
    this.adapter.platform = 'qq'
    this.adapter.name = this._milky.protocol.name
    this.adapter.version = this._milky.protocol.version
    this.adapter.protocol = 'other'  // Milky不在协议列表中，使用'other'
  }

  /** 设置机器人信息 */
  setBotInfo () {
    this.account.selfId = this._milky.self.id
    this.account.name = this._milky.self.nickname
    this.account.avatar = this._milky.self.avatar
    this.account.uin = this._milky.self.id
    this.account.uid = this._milky.self.id
  }

  /**
   * 发送消息
   */
  async sendMsg (contact: Contact, elements: Array<SendElement>, retryCount = 0): Promise<SendMsgResults> {
    // TODO: 转换Karin消息格式到Milky格式
    const milkyMessage = this.convertToMilkyMessage(elements)

    if (contact.scene === 'friend') {
      const result = await this._milky.callApi('send_private_message', {
        user_id: contact.peer,
        message: milkyMessage
      }) as any
      return {
        messageId: String(result.message_seq),
        time: Number(result.time),
        rawData: result,
        message_id: String(result.message_seq),
        messageTime: Number(result.time)
      }
    } else if (contact.scene === 'group') {
      const result = await this._milky.callApi('send_group_message', {
        group_id: contact.peer,
        message: milkyMessage
      }) as any
      return {
        messageId: String(result.message_seq),
        time: Number(result.time),
        rawData: result,
        message_id: String(result.message_seq),
        messageTime: Number(result.time)
      }
    }

    throw new Error(`不支持的场景类型: ${contact.scene}`)
  }

  /**
   * 撤回消息
   */
  async recallMsg (contact: Contact, messageId: string): Promise<void> {
    if (contact.scene === 'friend') {
      await this._milky.callApi('recall_private_message', {
        user_id: contact.peer,
        message_seq: BigInt(messageId)
      })
    } else if (contact.scene === 'group') {
      await this._milky.callApi('recall_group_message', {
        group_id: contact.peer,
        message_seq: BigInt(messageId)
      })
    }
  }

  /**
   * 获取头像URL
   */
  async getAvatarUrl (userId: string, size: 0 | 40 | 100 | 140 = 0): Promise<string> {
    // Milky协议中可能需要通过其他方式获取
    return `https://q1.qlogo.cn/g?b=qq&nk=${userId}&s=${size || 100}`
  }

  /**
   * 获取群头像URL
   */
  async getGroupAvatarUrl (groupId: string, size: 0 | 40 | 100 | 140 = 0): Promise<string> {
    return `https://p.qlogo.cn/gh/${groupId}/${groupId}/${size || 100}`
  }

  /**
   * 获取好友列表
   */
  async getFriendList (): Promise<any[]> {
    try {
      const result = await this._milky.callApi('get_friend_list', {})
      return result as any[]
    } catch (error) {
      logger.error('[Milky] 获取好友列表失败:', error)
      return []
    }
  }

  /**
   * 获取群列表
   */
  async getGroupList (): Promise<any[]> {
    try {
      const result = await this._milky.callApi('get_group_list', {})
      return result as any[]
    } catch (error) {
      logger.error('[Milky] 获取群列表失败:', error)
      return []
    }
  }

  /**
   * 获取群成员列表
   */
  async getGroupMemberList (groupId: string): Promise<any[]> {
    try {
      const result = await this._milky.callApi('get_group_member_list', { group_id: groupId })
      return result as any[]
    } catch (error) {
      logger.error('[Milky] 获取群成员列表失败:', error)
      return []
    }
  }

  /**
   * 获取群成员信息
   */
  async getGroupMemberInfo (groupId: string, userId: string): Promise<any> {
    try {
      const result = await this._milky.callApi('get_group_member_info', {
        group_id: groupId,
        user_id: userId,
      })
      return result
    } catch (error) {
      logger.error('[Milky] 获取群成员信息失败:', error)
      return null
    }
  }

  /**
   * 设置群名称
   */
  async setGroupName (groupId: string, groupName: string): Promise<void> {
    await this._milky.callApi('set_group_name', {
      group_id: groupId,
      group_name: groupName,
    })
  }

  /**
   * 设置群成员名片
   */
  async setGroupCard (groupId: string, userId: string, card: string): Promise<void> {
    await this._milky.callApi('set_group_member_card', {
      group_id: groupId,
      user_id: userId,
      card,
    })
  }

  /**
   * 设置群管理员
   */
  async setGroupAdmin (groupId: string, userId: string, enable: boolean): Promise<void> {
    await this._milky.callApi('set_group_member_admin', {
      group_id: groupId,
      user_id: userId,
      enable,
    })
  }

  /**
   * 群成员禁言
   */
  async setGroupMute (groupId: string, userId: string, duration: number): Promise<void> {
    await this._milky.callApi('set_group_member_mute', {
      group_id: groupId,
      user_id: userId,
      duration,
    })
  }

  /**
   * 全员禁言
   */
  async setGroupWholeMute (groupId: string, enable: boolean): Promise<void> {
    await this._milky.callApi('set_group_whole_mute', {
      group_id: groupId,
      enable,
    })
  }

  /**
   * 踢出群成员
   */
  async kickGroupMember (groupId: string, userId: string, rejectAddRequest = false): Promise<void> {
    await this._milky.callApi('kick_group_member', {
      group_id: groupId,
      user_id: userId,
      reject_add_request: rejectAddRequest,
    })
  }

  /**
   * 退出群聊
   */
  async quitGroup (groupId: string): Promise<void> {
    await this._milky.callApi('quit_group', {
      group_id: groupId,
    })
  }

  /**
   * 获取消息 (overload 1)
   */
  async getMsg (messageId: string): Promise<any>
  /**
   * 获取消息 (overload 2)
   */
  async getMsg (contact: Contact, messageId: string): Promise<any>
  /**
   * 获取消息 (implementation)
   */
  async getMsg (contactOrId: Contact | string, messageId?: string): Promise<any> {
    try {
      // 如果第一个参数是字符串，就是messageId
      if (typeof contactOrId === 'string') {
        const result = await this._milky.callApi('get_message', {
          message_id: contactOrId,
        })
        return result
      }

      // 否则是contact + messageId
      const result = await this._milky.callApi('get_message', {
        message_id: messageId!,
      })
      return result
    } catch (error) {
      logger.error('[Milky] 获取消息失败:', error)
      return null
    }
  }

  /**
   * 获取历史消息 (overload 1 - by seq)
   */
  async getHistoryMsg (contact: Contact, startMsgSeq: number, count: number): Promise<any[]>
  /**
   * 获取历史消息 (overload 2 - by id)
   */
  async getHistoryMsg (contact: Contact, startMsgId: string, count: number): Promise<any[]>
  /**
   * 获取历史消息 (implementation)
   */
  async getHistoryMsg (contact: Contact, startMsgSeqOrId: number | string, count: number = 20): Promise<any[]> {
    try {
      const params: any = { count }

      if (contact.scene === 'friend') {
        params.user_id = contact.peer
      } else if (contact.scene === 'group') {
        params.group_id = contact.peer
      }

      // 添加起始消息参数
      if (typeof startMsgSeqOrId === 'number') {
        params.start_seq = startMsgSeqOrId
      } else {
        params.start_id = startMsgSeqOrId
      }

      const result = await this._milky.callApi('get_history_messages', params)
      return result as any[]
    } catch (error) {
      logger.error('[Milky] 获取历史消息失败:', error)
      return []
    }
  }

  /**
   * 发送好友戳一戳
   */
  async sendFriendNudge (userId: string): Promise<void> {
    await this._milky.callApi('send_friend_nudge', {
      user_id: userId,
    })
  }

  /**
   * 发送群戳一戳
   */
  async sendGroupNudge (groupId: string, userId: string): Promise<void> {
    await this._milky.callApi('send_group_nudge', {
      group_id: groupId,
      user_id: userId,
    })
  }

  /**
   * 点赞
   */
  async sendProfileLike (userId: string, times: number = 1): Promise<void> {
    await this._milky.callApi('send_profile_like', {
      user_id: userId,
      times,
    })
  }

  /**
   * 处理好友请求
   */
  async handleFriendRequest (requestId: string, approve: boolean, remark?: string): Promise<void> {
    if (approve) {
      await this._milky.callApi('accept_friend_request', {
        request_id: requestId,
        remark,
      })
    } else {
      await this._milky.callApi('reject_friend_request', {
        request_id: requestId,
      })
    }
  }

  /**
   * 处理加群请求
   */
  async handleGroupRequest (requestId: string, approve: boolean, reason?: string): Promise<void> {
    if (approve) {
      await this._milky.callApi('accept_group_join_request', {
        request_id: requestId,
      })
    } else {
      await this._milky.callApi('reject_group_join_request', {
        request_id: requestId,
        reason,
      })
    }
  }

  /**
   * 转换Karin消息元素到Milky消息格式
   */
  private convertToMilkyMessage (elements: Array<SendElement>): Array<any> {
    const milkyMessage: any[] = []

    for (const element of elements) {
      // 如果是字符串，转换为文本消息
      if (typeof element === 'string') {
        milkyMessage.push({ type: 'text', data: { text: element } })
        continue
      }

      // 如果已经是正确的格式，直接使用
      if (typeof element === 'object' && element !== null && 'type' in element) {
        const el: any = element
        // 根据类型进行格式转换
        switch (el.type) {
          case 'text':
            milkyMessage.push({ type: 'text', data: { text: el.data?.text || '' } })
            break
          case 'image':
            milkyMessage.push({
              type: 'image',
              data: {
                file: el.data?.file || el.data?.url,
                url: el.data?.url,
              },
            })
            break
          case 'face':
            milkyMessage.push({ type: 'face', data: { id: String(el.data?.id || 0) } })
            break
          case 'at':
            milkyMessage.push({
              type: 'at',
              data: { qq: el.data?.qq === 'all' ? 'all' : el.data?.qq },
            })
            break
          case 'reply':
            milkyMessage.push({ type: 'reply', data: { id: el.data?.id } })
            break
          case 'record':
            milkyMessage.push({
              type: 'record',
              data: { file: el.data?.file || el.data?.url },
            })
            break
          case 'video':
            milkyMessage.push({
              type: 'video',
              data: { file: el.data?.file || el.data?.url },
            })
            break
          case 'file':
            milkyMessage.push({
              type: 'file',
              data: { file: el.data?.file || el.data?.url },
            })
            break
          case 'json':
            milkyMessage.push({ type: 'json', data: el.data })
            break
          case 'xml':
            milkyMessage.push({ type: 'xml', data: { data: el.data?.data } })
            break
          case 'markdown':
            milkyMessage.push({ type: 'markdown', data: { content: el.data?.content } })
            break
          default:
            // 未知类型，尝试直接传递
            milkyMessage.push(element)
        }
      } else {
        // 其他情况，转换为文本
        milkyMessage.push({ type: 'text', data: { text: String(element) } })
      }
    }

    return milkyMessage
  }
}
