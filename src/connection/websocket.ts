import { Client } from '@/core/Client'

export class WebSocketHandle {
  #client: Client
  constructor (client: Client) {
    this.#client = client
  }
}
