import { IncomingSegment, OutgoingSegment } from '@saltify/milky-types'
import { Elements, segment } from 'node-karin'
import { segment as Segment } from '@/milky/segment'

/** milky 消息转 Karin */
export async function AdapterConvertKarin (data: Array<IncomingSegment>): Promise<Array<Elements>> {
  const elements = []
  for (const i of data) {
    switch (i.type) {
      case 'text':
        elements.push(segment.text(i.data.text))
        break
      case 'face':
        elements.push(segment.face(Number(i.data.face_id)))
        break
      case 'image':
        elements.push(segment.image(i.data.temp_url, { width: i.data.width, height: i.data.height, subType: i.data.sub_type, summary: i.data.summary }))
        break
      case 'mention':
        elements.push(segment.at(String(i.data.user_id)))
        break
      case 'mention_all':
        elements.push(segment.at('all'))
        break
      case 'record':
        elements.push(segment.record(i.data.temp_url))
        break
      case 'reply':
        elements.push(segment.reply(String(i.data.message_seq)))
        break
      case 'video':
        elements.push(segment.video(i.data.temp_url, { width: i.data.width, height: i.data.height }))
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
export async function KarinConvertAdapter (data: Array<Elements>): Promise<Array<OutgoingSegment>> {
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
