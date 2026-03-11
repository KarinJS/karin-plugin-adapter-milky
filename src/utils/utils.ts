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
