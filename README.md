# Karin Milky 适配器

基于 [Milky 协议](https://milky.ntqqrev.org/) 的 Karin 适配器插件实现。

## 安装

在 Karin 项目根目录下执行：

```bash
pnpm add @karinjs/plugin-adapter-milky -w
```

## 使用说明

### 第一次使用

1. **安装插件**（见上方安装命令）

2. **启动 Karin**
   首次启动时，插件会自动创建配置文件：
   - 配置目录：`@karinjs/@karinjs/plugin-adapter-milky/config/`
   - 配置文件：`config.json`

3. **修改配置**
   找到并编辑配置文件：

```json
{
  "webhookToken": "Fvuo0TRH",
  "bots": [
    {
      "protocol": "websocket",
      "url": "https://example.com",
      "token": "abcd"
    }
  ]
}
```

## 配置项说明 (注: 修改配置文件后需要重启才能生效)

`webhookToken`
WebHook的鉴权密钥，设置后会验证请求头的Authorization字段

`protocol`
连接协议，支持 `websocket`,`sse`和`webhook`

`url`
接口请求地址,必须以 `http://` 或 `https://` 开头的链接，例如 `http://127.0.0.1:8080`

`token`
接口的鉴权密钥，将用于连接Bot并请求接口

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/KarinJS/karin-plugin-adapter-milky.git
cd karin-plugin-adapter-milky

# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

```

---

## 参考资料

- [Milky 协议文档](https://milky.ntqqrev.org/)
- [Milky GitHub](https://github.com/SaltifyDev/milky)
- [Karin 文档](https://karinjs.com)
- [Karin](https://github.com/KarinJS/Karin)

---

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

GPL-3.0 License
