---
title: OpenClaw Skills 技术文档
date: 2026-03-14
description: OpenClaw Skills 系统完整指南 - 技能的定义、加载机制、创建与配置
---

# OpenClaw Skills 技术文档

## 概述

OpenClaw 采用基于 [AgentSkills](https://agentskills.io) 兼容的技能文件夹机制来扩展代理能力。每个技能（Skill）都是一个独立的目录，包含一个 `SKILL.md` 文件，该文件通过 YAML 前置元数据和 Markdown 指令来指导 AI 代理如何使用各种工具。Skills 系统是 OpenClaw 实现功能扩展的核心机制，它允许用户根据自身需求定制和增强代理的功能。

Skills 的设计理念是将特定领域的知识和工具使用规范封装成独立的模块，使得代理能够在不同场景下调用相应的技能。这种模块化设计不仅便于维护和更新，还支持灵活的权限管理和条件加载。

## Skills 架构与位置

OpenClaw 从三个位置加载 Skills，遵循明确的优先级规则：

**1. 捆绑技能（Bundled Skills）**
捆绑技能随 OpenClaw 安装包一起分发，位于 npm 包或 OpenClaw 应用内部。这是系统自带的基础技能集合。

**2. 托管技能（Managed/Local Skills）**
托管技能位于 `~/.openclaw/skills` 目录，用于用户本地的技能覆盖和自定义。这些技能对同一机器上的所有代理可见。

**3. 工作区技能（Workspace Skills）**
工作区技能位于 `<workspace>/skills` 目录，是代理专属的技能目录。在多代理部署中，每个代理可以拥有独立的技能集合。

**优先级规则**：当存在同名技能时，优先级从高到低依次为：工作区技能 > 托管技能 > 捆绑技能。这意味着用户可以在自己的 workspace 中覆盖默认技能的行为，而无需修改系统文件。

此外，还可以通过 `skills.load.extraDirs` 配置额外的技能文件夹，这些文件夹拥有最低优先级，适用于多个代理共享技能包的场景。

## SKILL.md 文件格式

每个技能目录必须包含一个 `SKILL.md` 文件，该文件采用特定的格式规范。

**基础格式**包括 YAML 前置元数据区和 Markdown 指令区：

```markdown
---
name: skill-name
description: 技能简短描述
---

# 技能标题

这里是技能的详细使用说明...
```

**完整的元数据字段**：

```markdown
---
name: example-skill
description: 示例技能
metadata:
  {
    "openclaw": {
      "requires": { "bins": ["命令名"], "env": ["环境变量名"] },
      "primaryEnv": "环境变量名",
      "always": false,
      "os": ["darwin", "linux"],
      "homepage": "https://example.com",
      "emoji": "🎯",
    },
  }
---
```

**可选的前置元数据字段说明**：

- `homepage`：技能官网 URL，在 macOS Skills UI 中显示
- `user-invocable`：是否允许用户通过斜杠命令调用，默认为 true
- `disable-model-invocation`：是否在模型提示词中排除该技能
- `command-dispatch`：设置为 "tool" 时，斜杠命令直接分发给工具而非模型
- `command-tool`：指定 command-dispatch 为 tool 时调用的工具名称

## 门控规则（Gating）

OpenClaw 在加载时通过元数据过滤技能，实现条件化加载：

**基于操作系统的过滤**：

```markdown
metadata:
  {
    "openclaw": { "os": ["darwin", "linux"] },
  }
```

**基于二进制命令的过滤**：

```markdown
metadata:
  {
    "openclaw": {
      "requires": { "bins": ["git", "docker"] },
    },
  }
```

**基于环境变量的过滤**：

```markdown
metadata:
  {
    "openclaw": {
      "requires": { "env": ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"] },
    },
  }
```

**基于配置的过滤**：

```markdown
metadata:
  {
    "openclaw": {
      "requires": { "config": ["browser.enabled"] },
    },
  }
```

**always 字段**：设置 `"always": true` 可以让技能跳过其他门控规则，始终可用。

门控检查在技能加载时执行。对于沙箱环境中的代理，如果技能需要特定二进制命令，这些命令也必须存在于沙箱容器内部。可以通过 `agents.defaults.sandbox.docker.setupCommand` 配置容器初始化命令来安装依赖。

## 技能安装器

Skills 可以内置安装器规范，支持自动化安装依赖：

```markdown
metadata:
  {
    "openclaw": {
      "requires": { "bins": ["gemini"] },
      "install": [
        {
          "id": "brew",
          "kind": "brew",
          "formula": "gemini-cli",
          "bins": ["gemini"],
          "label": "Install Gemini CLI (brew)",
        },
      ],
    },
  }
```

支持的安装类型包括：brew（Homebrew）、node（npm/pnpm/yarn/bun）、go、download（直接下载）。当存在多个安装选项时，系统会优先选择 Homebrew（若可用），否则回退到 Node 方式。

## ClawHub 技能市场

ClawHub（https://clawhub.com）是 OpenClaw 官方维护的公共技能市场，用户可以在此浏览、发现、安装和更新技能。

**常用命令**：

```bash
# 安装技能到工作区
clawhub install <skill-slug>

# 更新所有已安装技能
clawhub update --all

# 同步技能更新
clawhub sync --all
```

默认情况下，clawhub 安装到当前工作目录下的 `./skills` 目录，下次会话时 OpenClaw 会自动识别。

## 配置管理

在 `~/.openclaw/openclaw.json` 中可以配置技能的启用状态、环境变量和自定义参数：

```json5
{
  skills: {
    entries: {
      "example-skill": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "API_KEY" },
        env: {
          CUSTOM_VAR: "value",
        },
        config: {
          endpoint: "https://api.example.com",
        },
      },
    },
  },
}
```

**配置规则**：
- `enabled: false` 可以禁用已安装或捆绑的技能
- `env` 仅在变量未在进程环境变量中设置时注入
- `apiKey` 是便捷字段，支持密文或 SecretRef 对象
- `config` 用于自定义字段，必须挂载在此配置下

## 安全注意事项

使用第三方技能时需要注意安全风险：

1. **将第三方技能视为不受信任的代码**，在启用前务必阅读其源码
2. 对于不可信输入和风险工具，优先使用沙箱模式运行
3. `skills.entries.*.env` 和 `skills.entries.*.apiKey` 会将密钥注入到主机进程环境变量中，注意保护敏感信息，避免在提示词和日志中泄露
4. 建议定期审查已安装的技能，及时更新或移除不再使用的技能

## 创建自定义技能

**步骤一：创建技能目录**

```bash
mkdir -p ~/.openclaw/workspace/skills/my-custom-skill
```

**步骤二：编写 SKILL.md**

```markdown
---
name: my_custom_skill
description: 我的自定义技能
---

# 自定义技能说明

当用户请求特定功能时，按照以下步骤执行...
```

**步骤三：定义工具和指令**

在 Markdown 区域详细描述技能的功能、适用场景、工具调用方式等。OpenClaw 会将这些信息注入到系统提示词中，使代理能够理解和调用该技能。

**步骤四：测试技能**

可以通过向代理发送消息来测试新技能，例如："使用我的新技能"。

## 技能加载与刷新

OpenClaw 在会话启动时对可用技能进行快照，后续对话轮次复用该列表。技能或配置的修改会在下次新会话时生效。

启用技能监视器可以实现热重载：

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

当 `SKILL.md` 文件发生变化时，OpenClaw 会自动更新技能列表，下一个代理轮次即可使用新配置。

## 总结

OpenClaw 的 Skills 系统提供了强大而灵活的扩展能力。通过理解技能的位置优先级、格式规范、门控规则和配置方式，用户可以根据实际需求定制代理的功能。ClawHub 技能市场为快速获取社区贡献的技能提供了便利，而完善的安全最佳实践则确保了系统的安全可靠运行。
