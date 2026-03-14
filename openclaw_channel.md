# OpenClaw 多平台接入指南：钉钉、飞书、QQ、微信全攻略

OpenClaw 的强大不仅在于它能“动手做事”，更在于它能接入你日常使用的即时通讯工具，让 AI 助手真正融入工作流。无论是钉钉的企业审批、飞书的文档协同，还是 QQ/微信的日常沟通，OpenClaw 都能通过统一的网关和适配器，将消息转化为指令，并返回结果。

本文将详细介绍如何将 OpenClaw 接入国内四大主流 IM 平台：钉钉、飞书、QQ、微信（含企业微信）。我们会从整体架构讲起，然后分平台给出详细的配置步骤，包括机器人创建、适配器安装、回调地址设置等。最后通过对比表格，帮助你快速选择最适合的接入方案。

---

## 1. OpenClaw 消息接入架构概览

在深入每个平台之前，理解 OpenClaw 如何处理外部消息至关重要。下图展示了消息从 IM 平台到 AI 智能体的完整路径：

```mermaid
graph TD
    subgraph “外部IM”
        A1[钉钉]
        A2[飞书]
        A3[QQ]
        A4[微信/企业微信]
    end

    subgraph “OpenClaw 网关层”
        B[Gateway<br/>端口:18789]
        C[消息路由器]
    end

    subgraph “适配器层 Adapters”
        D1[dingtalk-adapter]
        D2[feishu-adapter]
        D3[qq-adapter]
        D4[wechat-adapter]
    end

    subgraph “智能体层”
        E[Agent 管理器]
        F[指定的 Agent]
    end

    A1 -- “HTTP回调/WebSocket” --> D1
    A2 --> D2
    A3 --> D3
    A4 --> D4

    D1 --> B
    D2 --> B
    D3 --> B
    D4 --> B

    B --> C
    C --> E
    E --> F
    F -- “返回消息” --> C
    C --> B
    B --> D1
    B --> D2
    B --> D3
    B --> D4
    D1 --> A1
    D2 --> A2
    D3 --> A3
    D4 --> A4
```

- **适配器（Adapter）**：每个 IM 平台对应一个适配器插件，负责接收平台推送的消息（HTTP 回调或 WebSocket），将其转换为 OpenClaw 内部统一格式，并转发给网关。
- **网关（Gateway）**：OpenClaw 的核心入口，管理所有适配器连接，进行消息路由、认证和负载均衡。
- **消息路由器**：根据配置（如关键字、群聊映射）将消息分发给指定的 Agent。
- **Agent**：最终处理消息并生成回复的 AI 智能体。

所有适配器都作为独立的进程或线程运行，通过本地网络与网关通信。这种设计保证了可扩展性和隔离性。

---

## 2. 通用前置步骤

在开始各平台配置前，需要确保 OpenClaw 核心已正确安装并运行。参考《OpenClaw 安装完全指南》，至少完成以下：

1. 安装 OpenClaw Core，启动网关（`openclaw.gateway`）。
2. 创建一个至少一个 Agent（如 `my-assistant`）。
3. 确保网关配置正确，特别是 `bind: "127.0.0.1"` 和 `auth` 启用（虽然适配器是本地通信，但建议保留认证）。

**网关配置示例**（`~/.openclaw/openclaw.json`）：
```json5
{
  "gateway": {
    "port": 18789,
    "bind": "127.0.0.1",
    "auth": {
      "enabled": true,
      "token": "your-gateway-token"
    }
  }
}
```

所有适配器将使用该 token 连接到网关。

---

## 3. 各平台接入详细教程

### 3.1 钉钉接入

钉钉提供企业机器人（企业内部应用）和群机器人（仅群聊）两种方式。我们推荐使用**企业内部应用**，以获得更完整的消息能力和权限。

#### 3.1.1 创建钉钉机器人

1. 登录[钉钉开放平台](https://open.dingtalk.com/)，进入“应用开发” → “企业内部开发”。
2. 点击“创建应用”，填写应用名称等信息，创建后获取 **AppKey** 和 **AppSecret**。
3. 在应用详情页，启用“机器人”功能，配置消息接收模式：
   - **消息接收方式**：选择 “HTTP”，填入你的公网回调地址（例如 `https://your-domain.com/dingtalk/webhook`）。注意钉钉要求公网可访问且支持 HTTPS。
   - **消息加解密**：可开启，记录 **AES Key** 和 **Token**。
4. 发布应用（至少发布到部分员工）。

#### 3.1.2 安装钉钉适配器

OpenClaw 官方提供了钉钉适配器插件，通过 ClawHub 安装：

```bash
# 激活 OpenClaw 虚拟环境
source ~/openclaw-core/venv/bin/activate

# 安装适配器
openclaw extension install openclaw-community/dingtalk-adapter
```

适配器将安装在 `~/.openclaw/extensions/dingtalk-adapter/`。

#### 3.1.3 配置适配器

创建适配器配置文件 `~/.openclaw/extensions/dingtalk-adapter/config.json`：

```json5
{
  "gateway": {
    "host": "127.0.0.1",
    "port": 18789,
    "token": "your-gateway-token"
  },
  "dingtalk": {
    "appKey": "your-app-key",
    "appSecret": "your-app-secret",
    "aesKey": "your-aes-key",      // 若开启加密则填写
    "token": "your-platform-token", // 钉钉机器人中的 Token
    "webhook": "/dingtalk/webhook", // 相对路径，适配器会启动 HTTP 服务
    "port": 9001,                    // 适配器监听端口，用于接收钉钉回调
    "agentMapping": {
      "default": "my-assistant"      // 默认消息转发给哪个 Agent
    }
  }
}
```

#### 3.1.4 启动适配器

```bash
cd ~/.openclaw/extensions/dingtalk-adapter
python run.py --config config.json
```

推荐使用 systemd 或 supervisor 管理适配器进程。

#### 3.1.5 设置公网访问

由于钉钉需要公网回调地址，你需要将适配器的端口（如 9001）暴露到公网。可以使用 Nginx 反向代理并配置 SSL：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /dingtalk/webhook {
        proxy_pass http://127.0.0.1:9001/dingtalk/webhook;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

确保防火墙允许 443 端口。

#### 3.1.6 测试

在钉钉中向机器人发送消息，观察网关日志和 Agent 响应。

### 3.2 飞书接入

飞书（Lark）同样支持企业自建应用机器人，配置流程与钉钉类似。

#### 3.2.1 创建飞书应用

1. 登录[飞书开放平台](https://open.feishu.cn/)，创建企业自建应用。
2. 获取 **App ID** 和 **App Secret**。
3. 启用机器人能力，配置事件订阅：
   - **请求网址**：填入 `https://your-domain.com/feishu/webhook`。
   - **事件**：勾选 `message` 相关事件。
4. 获取 **Encrypt Key** 和 **Verification Token**（可选）。

#### 3.2.2 安装飞书适配器

```bash
openclaw extension install openclaw-community/feishu-adapter
```

#### 3.2.3 配置适配器

`~/.openclaw/extensions/feishu-adapter/config.json`：

```json5
{
  "gateway": {
    "host": "127.0.0.1",
    "port": 18789,
    "token": "your-gateway-token"
  },
  "feishu": {
    "appId": "your-app-id",
    "appSecret": "your-app-secret",
    "encryptKey": "your-encrypt-key",
    "verificationToken": "your-verification-token",
    "webhook": "/feishu/webhook",
    "port": 9002,
    "agentMapping": {
      "default": "my-assistant"
    }
  }
}
```

#### 3.2.4 启动适配器

```bash
cd ~/.openclaw/extensions/feishu-adapter
python run.py --config config.json
```

#### 3.2.5 Nginx 配置

与钉钉类似，将 `/feishu/webhook` 代理到本地 9002 端口。

#### 3.2.6 测试

在飞书客户端向机器人发送消息验证。

### 3.3 QQ 接入

QQ 接入相对复杂，因为官方对机器人限制较多。目前有两种主流方案：

- **QQ 官方机器人**：需要企业认证，申请门槛高，但稳定。
- **基于 Mirai / go-cqhttp 的第三方协议**：使用个人 QQ 账号，但存在封号风险，仅建议测试环境使用。

此处我们介绍使用**官方机器人**的方式（推荐企业用户）。

#### 3.3.1 注册 QQ 开放平台

1. 访问 [QQ 开放平台](https://q.qq.com/)，注册成为开发者，创建机器人。
2. 获取机器人的 **AppID** 和 **AppSecret**。
3. 设置回调地址：`https://your-domain.com/qq/webhook`。

#### 3.3.2 安装 QQ 适配器

```bash
openclaw extension install openclaw-community/qq-adapter
```

#### 3.3.3 配置适配器

`~/.openclaw/extensions/qq-adapter/config.json`：

```json5
{
  "gateway": {
    "host": "127.0.0.1",
    "port": 18789,
    "token": "your-gateway-token"
  },
  "qq": {
    "appId": "your-app-id",
    "appSecret": "your-app-secret",
    "webhook": "/qq/webhook",
    "port": 9003,
    "agentMapping": {
      "default": "my-assistant"
    }
  }
}
```

#### 3.3.4 启动适配器

```bash
cd ~/.openclaw/extensions/qq-adapter
python run.py --config config.json
```

#### 3.3.5 测试

在 QQ 中向机器人发消息。

---

### 3.4 微信接入

微信分为**企业微信**和**个人微信**。企业微信有完善的 API，推荐生产使用；个人微信无官方 API，需借助第三方框架（如 Wechaty），但稳定性无法保证。

#### 3.4.1 企业微信接入

##### 3.4.1.1 创建企业微信应用

1. 登录[企业微信管理后台](https://work.weixin.qq.com/)，在“应用管理”中创建自建应用。
2. 获取 **AgentId** 和 **Secret**。
3. 在企业微信后台“我的企业”中查看 **企业ID**。
4. 配置接收消息服务器：
   - **URL**：`https://your-domain.com/workweixin/webhook`
   - **Token** 和 **EncodingAESKey** 自行生成，并记录。

##### 3.4.1.2 安装企业微信适配器

```bash
openclaw extension install openclaw-community/workweixin-adapter
```

##### 3.4.1.3 配置适配器

`~/.openclaw/extensions/workweixin-adapter/config.json`：

```json5
{
  "gateway": {
    "host": "127.0.0.1",
    "port": 18789,
    "token": "your-gateway-token"
  },
  "workweixin": {
    "corpId": "your-corp-id",
    "agentId": "your-agent-id",
    "secret": "your-secret",
    "token": "your-platform-token",   // 接收消息服务器的 Token
    "encodingAESKey": "your-aes-key",
    "webhook": "/workweixin/webhook",
    "port": 9004,
    "agentMapping": {
      "default": "my-assistant"
    }
  }
}
```

##### 3.4.1.4 启动适配器

```bash
cd ~/.openclaw/extensions/workweixin-adapter
python run.py --config config.json
```

##### 3.4.1.5 测试

在企业微信中向应用发送消息。

#### 3.4.2 个人微信接入（实验性）

个人微信接入推荐使用 **Wechaty** 的 Puppet 方案，但需要付费 Token 或自建。这里简要介绍基于 Wechaty 的适配器。

##### 3.4.2.1 安装 Wechaty 适配器

```bash
openclaw extension install openclaw-community/wechat-personal-adapter
```

该适配器需要安装 Wechaty 依赖，并配置 Puppet。

##### 3.4.2.2 配置适配器

`~/.openclaw/extensions/wechat-personal-adapter/config.json`：

```json5
{
  "gateway": {
    "host": "127.0.0.1",
    "port": 18789,
    "token": "your-gateway-token"
  },
  "wechat": {
    "puppet": "wechaty-puppet-wechat",   // 或其他 puppet
    "token": "your-wechaty-token",       // 若使用 puppet-service
    "port": 9005,
    "agentMapping": {
      "default": "my-assistant"
    }
  }
}
```

##### 3.4.2.3 启动适配器

```bash
cd ~/.openclaw/extensions/wechat-personal-adapter
npm install   # Wechaty 是 Node.js 生态
node run.js --config config.json
```

**风险提示**：个人微信机器人可能被腾讯封禁，请勿用于重要业务。

---

## 4. 多平台接入对比

| 特性 | 钉钉 | 飞书 | QQ（官方） | 企业微信 | 个人微信（Wechaty） |
|------|------|------|------------|----------|---------------------|
| **官方支持** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **消息类型** | 文本、图片、链接等 | 文本、卡片、群聊 | 文本、图片 | 文本、图片、Markdown | 文本、图片 |
| **回调方式** | HTTP | HTTP | HTTP | HTTP | WebSocket |
| **认证复杂度** | 中 | 中 | 中 | 低 | 高（需处理登录） |
| **稳定性** | 高 | 高 | 高 | 高 | 低（封号风险） |
| **适用场景** | 企业内部 | 企业内部 | 社区/客服 | 企业内部 | 个人测试 |
| **适配器端口** | 9001 | 9002 | 9003 | 9004 | 9005 |

---

## 5. 高级配置：多 Agent 与消息路由

默认情况下，所有消息都转发给 `default` Agent。你可以根据群聊、关键词等条件路由到不同 Agent。

### 5.1 基于群聊的路由

在适配器配置中增加 `groupMapping`：

```json5
"agentMapping": {
  "default": "my-assistant",
  "groupMapping": {
    "钉钉群ID1": "project-manager",
    "飞书群ID2": "customer-service"
  }
}
```

### 5.2 基于关键词的前缀路由

可在网关层配置消息预处理，将特定前缀的消息转发给指定 Agent（需编写自定义插件，此处不展开）。

---

## 6. 总结

通过本文的详细教程，你应该能够将 OpenClaw 成功接入钉钉、飞书、QQ 和企业微信，让 AI 智能体在你的工作流中发挥作用。回顾整个接入过程，关键节点包括：

1. **理解架构**：适配器独立运行，通过本地网络与网关通信，确保可扩展性和隔离性。
2. **创建平台机器人**：每个平台都需要注册应用、获取凭证、配置回调地址。
3. **安装对应适配器**：通过 `openclaw extension install` 从 ClawHub 获取官方或社区适配器。
4. **配置适配器**：填写平台凭证、网关 token、监听端口和 Agent 映射。
5. **启动适配器并暴露公网**：使用 Nginx 反向代理处理 HTTPS 回调。
6. **测试与路由配置**：验证消息收发，并根据需要设置多 Agent 路由。

**安全提醒**：
- 所有适配器应运行在内部网络，仅通过 Nginx 暴露必要的回调路径。
- 网关 token 和平台密钥务必妥善保管，避免硬编码在代码中。
- 个人微信方案仅限测试，生产环境请使用企业微信或官方机器人。

现在，你的“龙虾”已经能够穿梭于各大 IM 平台，随时听候调遣。下一步，你可以为不同的 Agent 编写专属的 `SOUL.md`，让它们在不同场景下展现不同的人格和能力。

---

*如果在接入过程中遇到问题，欢迎查阅各适配器的官方文档或在社区中提问。让我们一起，让 AI 无处不在！*