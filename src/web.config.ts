import { components, defineConfig } from 'node-karin'
import { dir } from './utils'
import { Cfg, ConfigType } from './config'
import _ from 'node-karin/lodash'

export default defineConfig({
  info: {
    id: dir.name,
    name: 'Milky适配器',
    author: {
      name: dir.pkg.author,
      home: dir.pkg.homepage,
      avatar: 'https://github.com/yusheng929.png'
    },
    icon: {
      name: 'Computer',
      size: 24,
      color: '#B2A8D3'
    },
    version: dir.version,
    description: dir.pkg.description,
  },
  components: () => [
    components.input.string('webhookToken', {
      label: 'WebHook鉴权Token',
      isRequired: false,
      defaultValue: Cfg.get.webhookToken
    }),
    components.accordionPro.create('bots',
      Cfg.get.bots.map((item, index) => ({
        title: `Bot ${index + 1}`,
        ...item
      })),
      {
        label: 'MilkyBot 列表',
        children: components.accordion.createItem('bots-a', {
          children: [
            components.radio.group('protocol', {
              label: '连接方法',
              color: 'warning',
              size: 'sm',
              isRequired: true,
              radio: [
                components.radio.create('websocket', {
                  label: 'WebSocket 连接',
                  value: 'websocket'
                }),
                components.radio.create('sse', {
                  label: 'SSE 连接',
                  value: 'sse'
                }),
                components.radio.create('webhook', {
                  label: 'WebHook 推送',
                  value: 'webhook'
                })
              ]
            }),
            components.input.string('url', {
              label: '通讯地址',
              description: '请填写以http://或者https://开头的链接',
              placeholder: '请输入url链接'
            }),
            components.input.string('token', {
              label: '鉴权token',
              description: '用来请求通讯地址所使用的Token',
              isRequired: false
            })
          ]
        })
      })
  ],
  save: async (config: ConfigType) => {
    if (_.isEqual(config, Cfg.get)) {
      return {
        success: false,
        message: '配置文件无变化'
      }
    }
    const s = await Cfg.save(config)
    return {
      success: s,
      message: s ? '配置保存成功' : '配置保存失败',
    }
  }
})
