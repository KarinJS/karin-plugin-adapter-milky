import { BotCfg } from '@/config/types'
import { AdapterBase, AdapterType } from 'node-karin'
import { Client } from './Client'

export class AdapterMilky extends AdapterBase implements AdapterType {
  super: Client
  constructor (cfg: BotCfg) {
    super()
    this.super = new Client(cfg)
  }

  async init () {
  }
}
