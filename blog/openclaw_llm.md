# OpenClaw 自定义模型接入指南：对接非官方 API 与私有模型

OpenClaw 的强大很大程度上依赖于其背后的大语言模型（LLM）。虽然官方预置了 Anthropic、OpenAI、Moonshot 等主流提供商，但在实际应用中，我们往往需要接入：

- 国内厂商模型（阿里通义千问、百度文心、腾讯混元）
- 本地部署的开源模型（Llama、Qwen、ChatGLM）
- 通过 OneAPI 等聚合层统一管理的多模型服务
- 企业内部自研模型

本文将深入 OpenClaw 的模型接入机制，详细讲解如何配置自定义 LLM 提供商，让你能够将任何模型接入 OpenClaw，并享受其强大的 Agent 能力。

---

## 1. OpenClaw 的 LLM Provider 架构

在 OpenClaw 中，所有与大语言模型的交互都通过 **Provider** 模块完成。核心配置文件 `openclaw.json` 中的 `providers` 节定义了可用的模型提供商及其参数。

```mermaid
graph TD
    subgraph “OpenClaw Core”
        A[Agent 执行循环]
        B[Provider 管理器]
        C[内置 Provider]
        D[自定义 Provider]
    end

    subgraph “外部 API”
        E[OpenAI API]
        F[Anthropic API]
        G[阿里云 DashScope]
        H[本地 Llama<br/>OpenAI 兼容接口]
    end

    A --> B
    B --> C
    B --> D
    C --> E
    C --> F
    D --> G
    D --> H
```

- **内置 Provider**：官方预置了 `openai`、`anthropic`、`moonshot` 等，通过简单的 API Key 和模型名即可使用。
- **自定义 Provider**：当需要接入非官方 API 时，我们可以通过两种方式扩展：
  - **利用 OpenAI 兼容接口**：如果目标模型提供了与 OpenAI 兼容的 API 格式（如本地部署的 Llama 通过 vLLM 或 FastChat 启动），只需修改 `openai` provider 的配置。
  - **编写自定义 Provider 模块**：对于完全私有的 API（如阿里云 DashScope、百度 ERNIE Bot），需要实现一个符合 OpenClaw Provider 接口的 Python 类，并注册到系统中。

---

## 2. 方式一：通过 OpenAI 兼容接口接入（最简单）

许多本地部署框架（vLLM、FastChat、LocalAI）以及聚合服务（OneAPI、NewAPI）都提供了与 OpenAI 一致的 API 格式。这种情况下，我们无需编写新代码，只需在 `openclaw.json` 中修改 `openai` provider 的配置，指向自定义端点。

### 2.1 适用场景
- 本地部署的 Llama 3、Qwen 等，通过 `vllm` 启动并提供 OpenAI 兼容 API。
- 使用 OneAPI 聚合多家厂商，对外暴露统一的 OpenAI 格式接口。
- 某些国内厂商也提供了 OpenAI 兼容模式（如智谱 AI 的部分接口）。

### 2.2 配置步骤

假设你在本地 `http://localhost:8000` 启动了一个兼容 OpenAI 的模型服务（例如使用 vLLM 启动的 Llama 3），模型名为 `"llama3-8b"`。

#### 2.2.1 修改 `openclaw.json`

```json5
{
  "providers": {
    // 仍然使用 openai provider，但覆盖默认配置
    "openai": {
      "apiKey": "EMPTY",                     // 本地服务可能不需要 key，或使用固定值
      "baseURL": "http://localhost:8000/v1", // 关键：修改为基础 URL
      "defaultModel": "llama3-8b",           // 模型名称需与服务端一致
      "maxTokens": 4096,
      "temperature": 0.7
    }
  }
}
```

#### 2.2.2 验证连接

你可以使用 curl 测试本地 API 是否正常工作：

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3-8b",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

如果返回正常，OpenClaw 即可直接使用。

#### 2.2.3 高级：配置多个 OpenAI 兼容后端

如果需要同时使用多个不同的 OpenAI 兼容服务，可以为每个服务创建一个独立的 provider 名称（例如 `openai-local`、`openai-oneapi`），并分别指定 `baseURL` 和 `apiKey`。OpenClaw 允许在 `providers` 下定义任意名称的 provider，只要它们符合接口规范。

```json5
{
  "providers": {
    "openai-official": {
      "apiKey": "$OPENAI_API_KEY",
      "defaultModel": "gpt-4"
    },
    "openai-local-llama": {
      "apiKey": "EMPTY",
      "baseURL": "http://localhost:8000/v1",
      "defaultModel": "llama3-8b"
    },
    "openai-oneapi": {
      "apiKey": "$ONEAPI_KEY",
      "baseURL": "https://oneapi.example.com/v1",
      "defaultModel": "claude-3-haiku"
    }
  }
}
```

然后在 Agent 配置或会话中指定使用哪个 provider。

---

## 3. 方式二：自定义 Provider（针对私有 API）

当目标 API 格式与 OpenAI 不兼容时（例如阿里云 DashScope、百度 ERNIE Bot、腾讯混元的原生 API），我们需要编写自定义 Provider 类，并将其注册到 OpenClaw 中。

### 3.1 自定义 Provider 接口

OpenClaw 的 Provider 是一个 Python 类，必须实现以下核心方法：

- `__init__(self, config)`: 接收来自 `openclaw.json` 的配置参数。
- `chat_completion(self, messages, **kwargs)`: 接收消息列表，返回模型回复（字符串或结构化对象）。

此外，建议实现 `async_chat_completion` 以支持异步调用。

### 3.2 实战：接入阿里云通义千问（DashScope）

我们以阿里云 DashScope 为例，演示如何编写一个自定义 Provider。DashScope 的 API 与 OpenAI 不同，需要使用专门的 SDK。

#### 3.2.1 创建自定义 Provider 文件

在 OpenClaw 的扩展目录中，创建一个新的 Python 包，例如 `~/.openclaw/extensions/dashscope_provider/`，并在其中放置 `__init__.py` 和 `provider.py`。

```bash
mkdir -p ~/.openclaw/extensions/dashscope_provider
cd ~/.openclaw/extensions/dashscope_provider
touch __init__.py provider.py
```

#### 3.2.2 编写 Provider 类

`provider.py` 内容如下：

```python
import os
from typing import List, Dict, Any, Optional
import dashscope
from dashscope import Generation

class DashScopeProvider:
    """阿里云 DashScope 通义千问 Provider"""

    def __init__(self, config: Dict[str, Any]):
        """
        config 从 openclaw.json 中传递，例如：
        {
            "apiKey": "your-api-key",
            "defaultModel": "qwen-max",
            "baseURL": "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
        }
        """
        self.api_key = config.get('apiKey') or os.environ.get('DASHSCOPE_API_KEY')
        if not self.api_key:
            raise ValueError("DashScope API key must be provided")
        
        dashscope.api_key = self.api_key
        
        self.default_model = config.get('defaultModel', 'qwen-max')
        self.base_url = config.get('baseURL', 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation')
        # 其他参数
        self.max_tokens = config.get('maxTokens', 2048)
        self.temperature = config.get('temperature', 0.8)
        self.top_p = config.get('topP', 0.8)

    def chat_completion(self, messages: List[Dict[str, str]], **kwargs) -> str:
        """
        同步调用 DashScope 的生成接口
        """
        # 将 OpenClaw 的消息格式转换为 DashScope 的格式
        # DashScope 的 prompt 是简单的文本拼接，这里简化处理
        prompt = self._build_prompt(messages)
        
        response = Generation.call(
            model=kwargs.get('model', self.default_model),
            prompt=prompt,
            max_tokens=kwargs.get('max_tokens', self.max_tokens),
            temperature=kwargs.get('temperature', self.temperature),
            top_p=kwargs.get('top_p', self.top_p),
            # 其他参数
        )
        
        if response.status_code == 200:
            return response.output.text
        else:
            raise Exception(f"DashScope API error: {response.message}")

    async def async_chat_completion(self, messages: List[Dict[str, str]], **kwargs) -> str:
        """
        异步调用（可选，建议实现以提高性能）
        这里可以使用 aiohttp 或 dashscope 的异步客户端
        """
        import aiohttp
        import json

        prompt = self._build_prompt(messages)
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        payload = {
            'model': kwargs.get('model', self.default_model),
            'input': {'prompt': prompt},
            'parameters': {
                'max_tokens': kwargs.get('max_tokens', self.max_tokens),
                'temperature': kwargs.get('temperature', self.temperature),
                'top_p': kwargs.get('top_p', self.top_p)
            }
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(self.base_url, headers=headers, json=payload) as resp:
                result = await resp.json()
                if resp.status == 200:
                    return result['output']['text']
                else:
                    raise Exception(f"DashScope API error: {result}")

    def _build_prompt(self, messages: List[Dict[str, str]]) -> str:
        """
        将消息列表转换为单一 prompt 字符串。
        通义千问原生支持 messages 格式，但为了简化，这里使用拼接。
        更高级的实现可以调用 dashscope 的 chat 接口。
        """
        # 简单拼接，实际生产环境应使用更合适的方式
        prompt = ""
        for msg in messages:
            role = msg['role']
            content = msg['content']
            if role == 'system':
                prompt += f"System: {content}\n"
            elif role == 'user':
                prompt += f"User: {content}\n"
            elif role == 'assistant':
                prompt += f"Assistant: {content}\n"
        prompt += "Assistant: "
        return prompt
```

#### 3.2.3 注册自定义 Provider

我们需要告诉 OpenClaw 在何处找到这个 Provider 类。通常有两种方式：

- **通过配置文件指定模块路径**（推荐）：在 `openclaw.json` 的 `providers` 中，使用 `type` 字段指向自定义类的导入路径。
- **将自定义 Provider 安装为插件**：通过扩展机制注册。

此处采用第一种方式：

```json5
{
  "providers": {
    "dashscope": {
      "type": "custom",                     // 标记为自定义
      "module": "extensions.dashscope_provider.provider", // Python 模块路径
      "class": "DashScopeProvider",          // 类名
      "apiKey": "$DASHSCOPE_API_KEY",
      "defaultModel": "qwen-max",
      "maxTokens": 4096,
      "temperature": 0.7
    }
  }
}
```

#### 3.2.4 安装依赖

自定义 Provider 可能依赖第三方库（如 `dashscope`、`aiohttp`）。需要在 OpenClaw 的虚拟环境中安装：

```bash
source ~/openclaw-core/venv/bin/activate
pip install dashscope aiohttp
```

#### 3.2.5 测试

在 Agent 配置中，将 provider 指定为 `dashscope`，并发送消息验证。

```bash
openclaw chat --agent my-assistant --provider dashscope --message "你是谁？"
```

### 3.3 其他国内厂商的接入要点

| 厂商   | API 特点                               | 接入建议                                                     |
| ------ | -------------------------------------- | ------------------------------------------------------------ |
| 百度文心 | 使用 ERNIE Bot SDK，接口与 OpenAI 差异较大 | 编写自定义 Provider，利用 `erniebot` 库                       |
| 腾讯混元 | 提供 HTTP API，需要签名                 | 自定义 Provider，实现签名逻辑，或使用官方 SDK                  |
| 智谱 AI | 部分接口兼容 OpenAI，部分需要使用 SDK    | 优先尝试 OpenAI 兼容模式；若不支持，自定义 Provider 接入       |
| 讯飞星火 | WebSocket 流式接口，与 REST 不同         | 需编写复杂的自定义 Provider，处理 WebSocket 连接和流式输出     |

---

## 4. 方式三：使用 OneAPI 聚合层

OneAPI 是一个开源的 LLM API 聚合与管理平台，可以将多家厂商的 API 统一转换为 OpenAI 格式，并提供负载均衡、密钥管理等能力。对于需要同时使用多个不同厂商模型的生产环境，这是最优雅的方案。

### 4.1 OneAPI 部署简介

OneAPI 的部署不在本文范围，但大致流程：

```bash
docker run --name oneapi -d -p 3000:3000 \
  -v oneapi-data:/data \
  -e SQLITE_PATH=/data/oneapi.db \
  -e LOG_SQL_DSN= \
  justsong/one-api
```

部署完成后，在 OneAPI 后台添加渠道（如阿里云、百度、OpenAI 等），然后创建一个令牌（Token）。

### 4.2 OpenClaw 端配置

由于 OneAPI 对外提供 OpenAI 兼容接口，我们只需像 2.1 节那样配置 `openai` provider，指向 OneAPI 的地址：

```json5
{
  "providers": {
    "oneapi": {
      "apiKey": "sk-your-oneapi-token",
      "baseURL": "http://your-oneapi-server:3000/v1",
      "defaultModel": "qwen-max",   // 此处模型名需与 OneAPI 中配置的一致
      "maxTokens": 4096
    }
  }
}
```

然后就可以在 Agent 中随意切换模型，只需修改 `defaultModel` 或在请求中指定模型名称，OneAPI 会自动路由到对应的后端。

### 4.3 多模型负载均衡与故障转移

OneAPI 支持将多个同模型渠道分组，实现负载均衡；也支持备用渠道，在主渠道失败时自动切换。这些功能都可以在 OneAPI 后台配置，OpenClaw 无需修改。

---

## 5. 配置对比与选型建议

| 方案           | 复杂度 | 灵活性 | 维护成本 | 适用场景                                   |
| -------------- | ------ | ------ | -------- | ------------------------------------------ |
| OpenAI 兼容接口 | 低     | 中     | 低       | 本地部署模型、已提供 OpenAI 兼容服务的厂商 |
| 自定义 Provider | 高     | 高     | 中       | 私有 API、特殊协议（如 WebSocket）         |
| OneAPI 聚合层   | 中     | 极高   | 中       | 多厂商混合使用、需要统一管理、生产环境     |

**建议**：
- 对于实验或单一模型，优先尝试 OpenAI 兼容模式。
- 如果需要接入多个国内厂商，或者有复杂的渠道管理需求，部署 OneAPI 是最佳实践。
- 只有遇到完全不兼容且 OneAPI 也无法适配的私有 API 时，才考虑编写自定义 Provider。

---

## 6. 高级技巧：在 Agent 中动态切换模型

OpenClaw 允许在会话中动态指定使用的 provider 和模型。例如在聊天时：

```bash
openclaw chat --agent my-assistant --provider dashscope --model qwen-max
```

或者在调用 API 时通过参数指定。

你甚至可以在同一个 Agent 的 `SOUL.md` 中写入规则，让 AI 根据任务类型自动选择合适的模型。例如，数学推理用 GPT-4，创意写作用 Claude，代码生成用通义千问。这需要编写一个自定义的模型路由插件，但已经超出了本文范围。

---

## 7. 常见问题与排错

### Q1: 接入后返回错误 “Provider not found” 或 “Module not found”

- 检查 `openclaw.json` 中 `module` 路径是否正确，相对于 Python 的导入路径。通常需要确保自定义 Provider 所在的目录在 `sys.path` 中（例如放在 `extensions/` 下，且该目录包含 `__init__.py`）。
- 确认虚拟环境中已安装所有依赖。

### Q2: 调用 OpenAI 兼容接口返回 404

- 检查 `baseURL` 是否完整，通常需要包含 `/v1`。
- 使用 curl 验证接口是否可达。

### Q3: 自定义 Provider 的异步方法未被调用

- OpenClaw 优先使用异步方法（如果存在），若未实现则回退到同步方法。如果希望提升并发性能，请实现 `async_chat_completion`。

### Q4: 如何调试自定义 Provider？

在 Provider 代码中添加日志输出，或使用 `print` 语句（注意 OpenClaw 可能重定向输出）。查看网关日志 `~/.openclaw/logs/gateway.log` 获取错误信息。

---

## 8. 总结

本文详细介绍了 OpenClaw 接入非官方模型 API 的三种方式，并提供了具体的配置和代码示例。回顾核心要点：

1. **理解 Provider 架构**：OpenClaw 通过统一的 Provider 接口与 LLM 交互，支持内置和自定义实现。
2. **利用 OpenAI 兼容接口**：最简单快捷的方式，只需修改 `baseURL` 和 `apiKey`。
3. **编写自定义 Provider**：当 API 不兼容时，通过实现 Python 类来适配，以阿里云 DashScope 为例展示了完整流程。
4. **使用 OneAPI 聚合层**：生产环境的最佳实践，统一管理多模型，实现负载均衡和故障转移。
5. **对比选型**：根据复杂度、灵活性和场景选择合适方案。

通过掌握这些技能，你可以将 OpenClaw 连接到任何你想要的模型，无论是云端商业 API 还是本地私有模型，真正实现“模型自由”。

---

*如果在接入过程中遇到问题，欢迎查阅 OpenClaw 官方文档或在社区中寻求帮助。让我们一起，解锁 AI 智能体的无限可能！*