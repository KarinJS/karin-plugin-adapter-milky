import { app, logger } from 'node-karin'
import express, { NextFunction, Request, Response } from 'node-karin/express'
import { WebHookHander } from './handler'
import { Cfg } from '@/config'
import { dir, LoggerAdapter } from '@/utils'

const RouterPath = '/milky/api/v1'
const router = express.Router()
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = Cfg.get.webhookToken || ''
  if (!token) return next()
  const accessToken = req.headers.authorization
  if (!accessToken || accessToken !== `Bearer ${token}`) {
    logger.debug('未授权的客户端请求:', req.body)
    return res.status(404).json({ error: '无权限', message: '鉴权密钥错误' })
  }
  return next()
}
router.use(express.json())
router.post('/webhook', authMiddleware, (req, res) => {
  WebHookHander.handle(req, res)
})
router.get('/webhook', (_req, res) => res.json({
  name: 'Milky-adapter',
  version: `${dir.version}`,
  time: Date.now(),
  msg: 'Ciallo~(∠・ω< )⌒☆',
  success: '当你看到这个消息，那么就说明 milky 适配器启动成功!',
}))

app.use(RouterPath, router)
LoggerAdapter('info', 'WebHook启动成功')
LoggerAdapter('info', `${logger.yellow('WebHook 访问地址')}: ${logger.green(`http://127.0.0.1:${process.env.HTTP_PORT}${RouterPath}/webhook`)}`)
