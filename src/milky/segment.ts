import { OutgoingSegment } from '@saltify/milky-types'

type Segment<T> = Extract<OutgoingSegment, { type: T }>
interface ImageOptions {
  /** 图片外显 */
  summary?: string
  /** 图片子类型 */
  subType?: 'normal' | 'sticker'
}
export const segment = {
  /** 构建文本元素
   * @param text 文本内容
   */
  text (text: string): Segment<'text'> {
    return { type: 'text', data: { text: String(text) } }
  },

  /** 构建at元素
   * @param target 'all' 或 用户ID
   */
  at (target: 'all' | number | string): Segment<'mention_all'> | Segment<'mention'> {
    if (target === 'all') {
      return { type: 'mention_all', data: {} }
    }
    return { type: 'mention', data: { user_id: +target } }
  },

  /** 构建表情元素
   * @param id 表情ID
   * @param isLarge 是否大表情
   */
  face (id: number | string, isLarge?: boolean): Segment<'face'> {
    return { type: 'face', data: { face_id: String(id), is_large: isLarge ?? false } }
  },

  /** 构建回复消息元素
   * @param messageSeq 消息序号
   */
  reply (messageSeq: number | string): Segment<'reply'> {
    return { type: 'reply', data: { message_seq: +messageSeq } }
  },

  /** 构建图片元素
   * @param uri uri 支持 file:// http(s):// base64:// 等格式
   * @param options 其他选项
   */
  image (uri: string, options?: ImageOptions): Segment<'image'> {
    return {
      type: 'image',
      data: {
        uri,
        sub_type: options?.subType ?? 'normal',
        summary: options?.summary
      },
    }
  },

  /** 构建语音元素
   * @param uri uri 支持 file:// http(s):// base64:// 等格式
   */
  record (uri: string): Segment<'record'> {
    return { type: 'record', data: { uri } }
  },

  /** 构建视频元素
   * @param uri uri 支持 file:// http(s):// base64:// 等格式
   */
  video (uri: string): Segment<'video'> {
    return { type: 'video', data: { uri } }
  },
}
