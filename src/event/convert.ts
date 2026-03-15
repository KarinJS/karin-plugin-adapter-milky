import { IncomingMessage, OutgoingSegment } from '@saltify/milky-types'
import { contactFriend, contactGroup, contactGroupTemp, Elements, segment, SendElement } from 'node-karin'
import { segment as Segment } from '@/event/segment'
import { MilkyAdapter } from '@/core/bot'

/** milky 消息转 Karin */
export async function AdapterConvertKarin (event: IncomingMessage, bot: MilkyAdapter): Promise<Array<Elements>> {
  const data = event.segments
  const elements = []
  for (const i of data) {
    switch (i.type) {
      case 'text':
        elements.push(segment.text(i.data.text))
        break
      case 'mention':
        elements.push(segment.at(String(i.data.user_id)))
        break
      case 'mention_all':
        elements.push(segment.at('all'))
        break
      case 'face':
        elements.push(segment.face(Number(i.data.face_id)))
        break
      case 'reply':
        elements.push(segment.reply(bot.super.encodeMsgId(event.message_scene, event.peer_id, i.data.message_seq)))
        break
      case 'image':
        elements.push(segment.image(i.data.temp_url, { width: i.data.width, height: i.data.height, subType: i.data.sub_type, summary: i.data.summary }))
        break
      case 'record':
        elements.push(segment.record(i.data.temp_url))
        break
      case 'video':
        elements.push(segment.video(i.data.temp_url, { width: i.data.width, height: i.data.height }))
        break
      case 'file': {
        const contact = event.message_scene === 'friend' ? contactFriend(event.peer_id + '') : event.message_scene === 'group' ? contactGroup(event.peer_id + '') : contactGroupTemp(event.group?.group_id + '', event.sender_id + '')
        const url = await bot.getFileUrl(contact, i.data.file_id)
        elements.push(segment.file(url, { fid: i.data.file_id, name: i.data.file_name, size: i.data.file_size, hash: i.data.file_hash || undefined }))
        break
      }
      // case 'forward':
      // elements.push(segment.nodeDirect(i.data.forward_id))
      // break
      case 'market_face':
        elements.push(segment.marketFace(i.data.emoji_package_id + ''))
        break
      case 'light_app':
        elements.push(segment.json(JSON.stringify(i)))
        break
      case 'xml':
        elements.push(segment.xml(i.data.xml_payload))
        break
      default:
        elements.push(segment.text(JSON.stringify(i)))
    }
  }
  return elements
}

/** Karin 消息转 milky */
export async function KarinConvertAdapter (data: Array<SendElement>): Promise<Array<OutgoingSegment>> {
  const elements: Array<OutgoingSegment> = []
  for (const i of data) {
    switch (i.type) {
      case 'text':
        elements.push(Segment.text(i.text))
        break
      case 'at':
        elements.push(Segment.at(i.targetId))
        break
      case 'face':
        elements.push(Segment.face(i.id, i.isBig))
        break
      case 'reply':
        elements.push(Segment.reply(i.messageId))
        break
      case 'image':
        elements.push(Segment.image(i.file, { summary: i.summary, subType: i.subType as any }))
        break
      case 'record':
        elements.push(Segment.record(i.file))
        break
      case 'video':
        elements.push(Segment.video(i.file))
        break
      default:
        elements.push(Segment.text(JSON.stringify(i)))
    }
  }
  return elements
}
