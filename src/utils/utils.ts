import { AdapterCommunication } from 'node-karin'

/** 随机生成密钥 */
export const RandomToken = (length: number = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    result += chars[randomIndex]
  }
  return result
}

/** 自动去除URL最后尾的/ */
export const UrlEnd = (url: string) => url.endsWith('/') ? url.slice(0, -1) : url

export const ConvertAddress = (address: string, c: AdapterCommunication) => {
  const u = UrlEnd(address)
  const url = new URL(u)
  if (c !== 'http' && c !== 'webSocketClient') return address
  const map = {
    http: {
      'http:': 'http:',
      'https:': 'https:',
      'ws:': 'http:',
      'wss:': 'https:'
    },
    webSocketClient: {
      'http:': 'ws:',
      'https:': 'wss:',
      'ws:': 'ws:',
      'wss:': 'wss:'
    }
  } as const
  url.protocol = map[c][url.protocol as keyof typeof map['http']]
  return url.toString()
}
