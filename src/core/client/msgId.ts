/**
 * 消息 ID 编解码：milky 用 (scene, peerId, message_seq) 三元组定位消息，
 * 这里用 varint 拼成 base64 字符串供 Karin 适配层使用。
 */

export type MessageScene = 'group' | 'friend' | 'temp'

export function encodeVarint (value: number): number[] {
  if (value < 0) throw new Error('value不可为负')
  const bytes: number[] = []
  while (value > 127) {
    bytes.push((value & 127) | 128)
    value >>>= 7
  }
  bytes.push(value)
  return bytes
}

export function decodeVarint (buffer: Buffer | Uint8Array, offset: { index: number }): number {
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

export function encodeMsgId (scene: MessageScene, peerId: number, seq: number): string {
  const sceneId = scene === 'group' ? 0 : scene === 'friend' ? 1 : 2
  const bytes = [
    ...encodeVarint(sceneId),
    ...encodeVarint(peerId),
    ...encodeVarint(seq)
  ]
  return Buffer.from(bytes).toString('base64').replace(/=+$/, '')
}

export function decodeMsgId (msgid: string): { scene: MessageScene, peerId: number, seq: number } {
  msgid += '==='.slice((msgid.length + 3) % 4)
  const buffer = Buffer.from(msgid, 'base64')
  const offset = { index: 0 }
  const sceneId = decodeVarint(buffer, offset)
  const scene: MessageScene = sceneId === 0 ? 'group' : sceneId === 1 ? 'friend' : 'temp'
  const peerId = decodeVarint(buffer, offset)
  const seq = decodeVarint(buffer, offset)
  return { scene, peerId, seq }
}
