export interface ConfigType {
  /** 最大重连次数 -1表示无限重连 */
  reconnectMaxCount: number
  /** 重连间隔 */
  reconnectInterval: number
  /** webhook鉴权token */
  webhookToken: string
  bots: BotCfg[]
}
export interface BotCfg {
  /** 连接方式 */
  protocol: 'webhook' | 'sse' | 'websocket'
  url: string
  token: string
}
