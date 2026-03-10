export interface ConfigType {
  webhookToken: string
  bots: BotCfg[]
}
export interface BotCfg {
  protocol: 'webhook' | 'sse' | 'websocket' | 'ws'
  url: string
  token: string
}
