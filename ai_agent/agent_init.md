# AI Agent 简介与历史演进

> 面向中高级开发者 | 2026-04-09

---

## 什么是 AI Agent？

**AI Agent（人工智能代理）** 是一种能够自主感知环境、做出决策并执行动作的智能系统。与传统的「输入-输出」式 AI 模型不同，Agent 具备：

- **自主规划**：分解复杂任务为可执行的步骤
- **工具调用**：调用外部工具（API、代码执行、文件操作等）
- **记忆能力**：保持会话上下文和长期知识
- **反思迭代**：根据执行结果调整后续行动

### 核心架构

```
┌─────────────────────────────────────────────────────┐
│                    User Input                       │
│                         ↓                            │
│  ┌─────────────────────────────────────────────┐    │
│  │              Agent Core                     │    │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐ │    │
│  │  │ Planning │  │ Tool Use │  │  Memory    │ │    │
│  │  │  Engine  │  │  Module  │  │  System    │ │    │
│  │  └────┬────┘  └────┬─────┘  └─────┬──────┘ │    │
│  │       └───────────┼──────────────┘         │    │
│  │                   ↓                        │    │
│  │           ┌──────────────┐                 │    │
│  │           │  Tool Layer  │                 │    │
│  │           │  Web/Search  │                 │    │
│  │           │  Code/Exec   │                 │    │
│  │           │  File I/O    │                 │    │
│  │           └──────────────┘                 │    │
│  └─────────────────────────────────────────────┘    │
│                         ↓                            │
│                   Action Output                      │
└─────────────────────────────────────────────────────┘
```

---

## 历史演进：从 ELIZA 到 LLM-Agent

### 1. 萌芽期（1960s-1980s）

| 时间 | 里程碑 | 意义 |
|------|--------|------|
| 1966 | **ELIZA** | 第一个聊天机器人，使用模式匹配 |
| 1972 | ** SHRDLU** | 积木世界中的对话代理，理解自然语言指令 |
| 1980s | **专家系统** | 基于规则的推理系统（MYCIN 等） |

这一阶段的 Agent 本质是**规则驱动**的，能力边界完全依赖人工编写的知识库。

### 2. 机器学习期（1990s-2010s）

```
传统机器学习 Agent:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   感知器      │ ──→ │   强化学习    │ ──→ │   执行器     │
│  (输入处理)   │     │  (决策模型)   │     │  (动作输出)  │
└──────────────┘     └──────────────┘     └──────────────┘
```

- **1992**: Q-Learning 算法提出
- **2013**: DQN（Deep Q-Network）诞生，深度强化学习开始应用
- **2016**: **AlphaGo** 击败李世石震惊世界

特点：**数据驱动**，但仍然局限在特定领域（游戏、机器人控制等）。

### 3. 大模型时代（2017-2022）

- **2017**: Transformer 架构论文《Attention Is All You Need》发布
- **2018**: BERT、GPT 系列开始崭露头角
- **2020**: GPT-3 发布，涌现出少样本学习能力

> 这一阶段的核心变化：**语言理解能力质变**，Agent 首次能够理解开放域指令。

### 4. Agent 爆发期（2022-至今）

| 年份 | 关键事件 |
|------|----------|
| 2022 | **InstructGPT** 提出 RLHF，Agent 遵循指令能力大幅提升 |
| 2023 | **AutoGPT** 横空出世，公众首次感知「自主 Agent」 |
| 2023 | **LangChain** 框架发布，降低 Agent 开发门槛 |
| 2024 | **MCP (Model Context Protocol)** 协议发布，生态统一 |
| 2025-2026 | 多 Agent 协作、MCP 工具生态成熟 |

---

## 主流 AI Agent 框架对比

### 核心框架一览

| 框架 | 开发方 | 定位 | 工具生态 | 学习曲线 |
|------|--------|------|----------|----------|
| **LangChain** | LangChain Inc. | 全能型框架 | 丰富 | 中等 |
| **LlamaIndex** | LlamaIndex | 数据检索优先 | 专注 RAG | 中等 |
| **AutoGPT** | Significant Gravitas | 自主任务分解 | 基础 | 陡峭 |
| **CrewAI** | CrewAI Inc. | 多 Agent 协作 | 适中 | 平缓 |
| **MCP (协议)** | Anthropic | 工具互操作标准 | 统一 | 平缓 |

### 技术架构差异图

```
┌──────────────────────────────────────────────────────────────────┐
│                         LangChain                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Chains     │  │   Agents    │  │   Tools     │              │
│  │  (链式调用) │  │  (自主决策)  │  │  (工具集)   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                         ↓                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              LLM (大语言模型)                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                         CrewAI                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Agent 1   │  │   Agent 2   │  │   Agent 3   │              │
│  │  (研究员)   │  │  (写手)     │  │  (审核)     │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         └────────────────┼────────────────┘                     │
│                          ↓                                        │
│              ┌───────────────────────┐                          │
│              │   Tasks (任务编排)      │                          │
│              └───────────────────────┘                          │
└──────────────────────────────────────────────────────────────────┘
```

### MCP 协议：Agent 互操作的「USB-C」

MCP (Model Context Protocol) 是由 Anthropic 提出的开放协议，旨在解决不同 Agent 框架与工具之间的「碎片化」问题：

```
传统模式（碎片化）:
┌────────┐    ┌────────┐    ┌────────┐
│Agent A │    │Agent B │    │Agent C │
└───┬────┘    └───┬────┘    └───┬────┘
    │             │             │
  专用接口      专用接口       专用接口
    │             │             │
┌───┴────┐    ┌───┴────┐    ┌───┴────┐
│Tool A  │    │Tool B  │    │Tool C  │
└────────┘    └────────┘    └────────┘

MCP 模式（统一接口）:
┌────────┐    ┌────────┐    ┌────────┐
│Agent A │    │Agent B │    │Agent C │
└───┬────┘    └───┬────┘    └───┬────┘
    │             │             │
    └─────────────┼─────────────┘
                  ↓
        ┌──────────────────┐
        │   MCP Protocol   │
        │  (统一通信协议)    │
        └────────┬─────────┘
                 │
    ┌────────────┼────────────┐
    ↓            ↓            ↓
┌────────┐  ┌────────┐  ┌────────┐
│Tool A  │  │Tool B  │  │Tool C  │
└────────┘  └────────┘  └────────┘
```

---

## 实战：用 LangChain 构建你的第一个 Agent

### 环境准备

```bash
pip install langchain langchain-openai langchain-community
# 或使用 LangGraph（新一代构建方式）
pip install langgraph
```

### 示例：ReAct 模式的 Tool Agent

```python
from langchain import hub
from langchain.agents import AgentExecutor, create_react_agent
from langchain_openai import ChatOpenAI
from langchain.tools import Tool
from langchain.utilities import SerpAPIWrapper

# 1. 定义工具
tools = [
    Tool(
        name="Search",
        func=SerpAPIWrapper().run,
        description="用于搜索最新信息，当你需要了解当前事件或不知道的事实时使用"
    ),
    Tool(
        name="Calculator",
        func=lambda x: eval(x),  # 简化示例，生产环境请用安全计算器
        description="用于数学计算"
    )
]

# 2. 创建 Agent（ReAct 模式）
llm = ChatOpenAI(model="gpt-4", temperature=0)

agent = create_react_agent(llm, tools)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,  # 展示思考过程
    max_iterations=5
)

# 3. 执行
result = agent_executor.invoke({
    "input": "查找特斯拉最新股价，然后计算如果我持有100股，当前市值是多少美元？"
})

print(result["output"])
```

### Agent 执行流程解析

```
User: "查找特斯拉最新股价，然后计算如果我持有100股，当前市值是多少美元？"

Agent 思考过程 (ReAct 模式):

Thought: 我需要先搜索特斯拉的最新股价，才能计算市值。
Action: Search
Action Input: "特斯拉最新股价 2026"
Observation: $248.56

Thought: 搜索到了价格，现在计算100股的市值。
Action: Calculator
Action Input: 248.56 * 100
Observation: 24856

Thought: 计算完成，我现在可以给用户完整的回答了。
Final Answer: 特斯拉最新股价为 $248.56，100 股的市值为 $24,856 美元。
```

### 多 Agent 协作示例（CrewAI）

```python
from crewai import Agent, Task, Crew

# 定义多个专业 Agent
researcher = Agent(
    role="高级研究员",
    goal="从可信来源收集并分析市场数据",
    backstory="10年金融分析经验，擅长数据挖掘",
    verbose=True
)

writer = Agent(
    role="技术作家",
    goal="将复杂数据转化为易懂的技术报告",
    backstory="资深技术博主，擅长用图表解释概念",
    verbose=True
)

reviewer = Agent(
    role="质量审核",
    goal="确保报告内容准确、专业",
    backstory="曾是知名科技媒体的编辑",
    verbose=True
)

# 定义任务
research_task = Task(
    description="分析 2026 年 AI Agent 市场趋势",
    agent=researcher,
    expected_output="市场数据摘要"
)

write_task = Task(
    description="撰写技术博客初稿",
    agent=writer,
    expected_output="完整博客文章"
)

review_task = Task(
    description="审核文章质量",
    agent=reviewer,
    expected_output="审核意见和改进建议"
)

# 组建团队并执行
crew = Crew(
    agents=[researcher, writer, reviewer],
    tasks=[research_task, write_task, review_task],
    process="sequential"  # 顺序执行，也可设为 "hierarchical"
)

result = crew.kickoff()
print(result)
```

---

## 关键技术概念

### ReAct 模式（Reasoning + Acting）

```
传统 LLM:                          ReAct Agent:
┌──────────────┐                  ┌────────────────────────────────┐
│   Input      │                  │   Input: "北京今天天气如何？"   │
│      ↓       │                  │          ↓                     │
│   LLM        │                  │   Thought: 需要查询天气数据    │
│      ↓       │                  │          ↓                     │
│   Output     │                  │   Action: call_weather_api     │
└──────────────┘                  │          ↓                     │
                                  │   Observation: 晴，25°C        │
                                  │          ↓                     │
                                  │   Thought: 已获取天气信息       │
                                  │          ↓                     │
                                  │   Final Answer: 北京今天晴...  │
                                  └────────────────────────────────┘
```

### Tool Use 的安全考量

```python
# ❌ 危险：直接 eval 执行用户输入
dangerous_func = lambda x: eval(x)

# ✅ 安全：使用 AST 解析 + 白名单
import ast
import operator

ALLOWED_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
}

def safe_eval(expr: str) -> float:
    """安全的数学表达式求值"""
    node = ast.parse(expr, mode='eval')
    return _eval_node(node.body)

def _eval_node(node):
    if isinstance(node, ast.Num):
        return node.n
    elif isinstance(node, ast.BinOp):
        left = _eval_node(node.left)
        right = _eval_node(node.right)
        return ALLOWED_OPERATORS[type(node.op)](left, right)
    else:
        raise ValueError(f"不支持的操作: {type(node).__name__}")
```

---

## 现状与挑战

### 当前主流应用场景

| 场景 | 代表案例 | 成熟度 |
|------|----------|--------|
| **代码助手** | GitHub Copilot, Cursor | ⭐⭐⭐⭐⭐ |
| **自动化办公** | Agent 构建、工作流编排 | ⭐⭐⭐⭐ |
| **研究与数据分析** | Multi-Agent 协作分析 | ⭐⭐⭐ |
| **个人助理** | AI Phone, Assistant | ⭐⭐⭐ |
| **控制系统** | 机器人、自动驾驶 | ⭐⭐ |

### 面临的挑战

```
┌─────────────────────────────────────────────────────────────┐
│                      Agent 挑战图谱                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔴 可靠性     │  幻觉问题、长程推理失效                    │
│  🟡 安全性     │  工具调用权限管理、Prompt 注入              │
│  🟠 成本       │  多步推理Token 消耗巨大                    │
│  🟡 延迟       │  实时性场景不适用                          │
│  🔴 评估       │  缺乏统一的 Agent 评测标准                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 总结

1. **AI Agent 的本质** 是「大模型 + 工具 + 规划」的三位一体，它让 AI 从被动响应走向主动执行。

2. **历史脉络**：从规则系统 → 机器学习 → 大模型 → Agent 化，核心演进逻辑是**自主性的不断提升**。

3. **技术生态**：LangChain/LangGraph 主导应用层，MCP 协议正在统一工具互操作标准，CrewAI 等框架推动多 Agent 协作。

4. **开发者建议**：
   - 入门：从 LangChain Agent 文档和 LangGraph 教程开始
   - 生产：重视 Tool 安全、Token 成本控制、错误恢复机制
   - 关注：MCP 协议生态、Agent 评测基准（如 GAIA）

> **未来展望**：随着 Agent 评估体系的成熟和 MCP 等协议的普及，AI Agent 将从「工具」进化为「协作伙伴」，多 Agent 协作完成复杂任务将成为常态。

---

*参考资料：LangChain 官方文档、Anthropic MCP 规范、CrewAI GitHub、AlphaGo 论文、Attention Is All You Need*
