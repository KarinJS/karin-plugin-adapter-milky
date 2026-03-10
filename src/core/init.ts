import { Cfg } from '@/config'
import { MilkyAdapter } from './bot'

export function main () {
  Cfg.get.bots.forEach(v => {
    if (!v.protocol || !v.url) return false
    new MilkyAdapter(v).init()
  })
}
main()
