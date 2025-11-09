import { app, logger } from 'node-karin'
import express from 'node-karin/express'
import { WebHookHander } from './handler'
import { AdapterName } from '@/utils/other'
import { Root } from '@/utils'

const RouterPath = '/milky/api/v1'
const router = express.Router()
// const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
//   const token = Cfg.getConfig.webhookToken || ''
//   if (!token) return next()
//   const accessToken = req.query.access_token
//   if (!accessToken || accessToken !== token) return res.status(403).json({ error: '无权限', message: '鉴权密钥错误' })
//   next()
// }
router.use(express.json())
router.post('/webhook', (req, _res) => {
  WebHookHander.handle(req.body)
})
router.get('/webhook', (_req, res) => res.json({
  name: 'Milky-adapter',
  version: `${Root.pluginVersion}`,
  time: Date.now(),
  msg: 'Ciallo~(∠・ω< )⌒☆',
  success: '当你看到这个消息，那么就说明 milky 适配器启动成功!',
}))

app.use(RouterPath, router)
logger.info(`[${AdapterName}] WebHook启动成功`)
logger.info(`[${AdapterName}] ${logger.yellow('WebHook 访问地址')}: ${logger.green(`http://127.0.0.1:${process.env.HTTP_PORT}${RouterPath}/webhook`)}`)
