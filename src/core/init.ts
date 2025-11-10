import { Cfg } from '@/config'
import { AdapterMilky } from './bot'

export function main () {
  Cfg.getConfig.bots.forEach(v => {
    if (!v.protocol || !v.url) return false
    new AdapterMilky(v).init()
  })
}
main()
