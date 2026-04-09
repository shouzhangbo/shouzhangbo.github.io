# 构建高效 AI Agent：模式、实践与避坑指南

> 基于 Anthropic《Building Effective Agents》| 面向中高级开发者 | 2026-04-09

---

## 前言

过去一年，Anthropic 与数十个团队合作构建 LLM Agent。**最具成功的实现无一例外地使用了简单、可组合的模式，而非复杂的框架或专业库。**

本文从 Anthropic 的工程实践出发，系统梳理 Agent 的核心构建块、五种工作流模式、Agent 的设计原则，以及工具工程的最佳实践。

---

## 一、核心概念：Workflows vs Agents

Anthropic 明确区分了两个概念：

| 类型 | 定义 | 特征 | 适用场景 |
|------|------|------|----------|
| **Workflows** | 通过**预定义代码路径**编排 LLM 和工具的系统 | 可预测、一致性强、延迟低 | 任务边界清晰、步骤固定 |
| **Agents** | LLM **动态引导**自身流程和工具使用，系统自行决定执行路径 | 灵活性高、自主决策、开放域 | 任务难以预测、需要模型驱动决策 |

```
┌─────────────────────────────────────────────────────────────────┐
│                     Agentic Systems 全景                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐        ┌──────────────────────────┐  │
│  │   Augmented LLM      │        │    (Building Block)       │  │
│  │  (增强型大模型)       │        └──────────────────────────┘  │
│  │  + 检索 + 工具 + 记忆  │                                      │
│  └──────────┬───────────┘                                      │
│             │                                                  │
│     ┌───────┴────────┐                                          │
│     ↓                ↓                                          │
│ ┌──────────┐    ┌──────────┐                                    │
│ │ Workflows│    │  Agents  │                                    │
│ │(预定义编排)│    │(动态自主) │                                    │
│ └────┬─────┘    └────┬─────┘                                    │
│      │              │                                           │
│      └──────┬───────┘                                           │
│             ↓                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Prompt Chaining │ Routing │ Parallel │ Orchestrator │ Eval│   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、构建块：Augmented LLM

Agentic System 的基础构建块是**增强型 LLM** —— 具备检索、工具调用、记忆能力的 LLM。

```
┌─────────────────────────────────────────────────────────────┐
│                    Augmented LLM                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Base LLM                         │    │
│  │              (大语言模型本身)                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                         ↑                                     │
│         ┌───────────────┼───────────────┐                    │
│         ↓               ↓               ↓                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  Retrieval  │  │   Tools     │  │   Memory    │           │
│  │   (检索)     │  │   (工具)     │  │   (记忆)     │           │
│  │              │  │              │  │             │           │
│  │ • RAG       │  │ • 搜索       │  │ • 短期上下文  │           │
│  │ • 知识库     │  │ • 计算       │  │ • 长期记忆   │           │
│  │ • 向量检索   │  │ • 代码执行   │  │ • 会话状态   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

Anthropic 推荐通过 **MCP (Model Context Protocol)** 实现增强能力，它允许开发者通过简单的客户端实现，接入第三方工具生态。

### MCP 快速上手

```python
# MCP 客户端示例
from mcp.client import MCPClient

client = MCPClient()

# 连接多个 MCP 服务器（工具提供者）
await client.connect("https://mcp.server/search")
await client.connect("https://mcp.server/calculator")
await client.connect("https://mcp.server/filesystem")

# 所有工具自动对 LLM 可用
response = await client.complete(
    prompt="搜索最新 AI Agent 论文并保存到文件",
    model="claude-sonnet-4"
)
```

---

## 三、五大工作流模式

### 模式 1：Prompt Chaining（提示链）

**核心思想**：将任务分解为**固定序列**，每步 LLM 调用处理上一步的输出。

```
┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐
│ Input  │ ──→ │ LLM 1  │ ──→ │ LLM 2  │ ──→ │ LLM N  │ ──→ Output
│        │     │ Step 1 │     │ Step 2 │     │ Step N │
└────────┘     └────────┘     └────────┘     └────────┘
                     ↓             ↓
               ┌──────────┐  ┌──────────┐
               │ Gate/Checks │  │ Gate/Checks │  ← 程序化检查
               └──────────┘  └──────────┘
```

**使用场景**：任务可清晰分解为固定子任务，通过拆分提升每步准确率。

**典型案例**：
- 生成营销文案 → 翻译成多语言
- 写大纲 → 检查大纲 → 基于大纲写正文

```python
# Prompt Chaining 示例：文档审核流程
def document_workflow(draft: str) -> str:
    # Step 1: 语法检查
    grammar_check = llm.invoke(f"检查以下文本语法错误:\n{draft}")

    # Gate: 质量门槛检查
    if grammar_check.score < 0.7:
        return "质量不达标，需重写"

    # Step 2: 内容优化
    polished = llm.invoke(f"优化以下文本:\n{grammar_check.text}")

    # Step 3: 最终润色
    final = llm.invoke(f"最终润色:\n{polished.text}")

    return final.text
```

---

### 模式 2：Routing（路由）

**核心思想**：对输入进行**分类**，将不同类别导向专门的处理分支。

```
         ┌──────────────┐
         │    Input     │
         └──────┬───────┘
                ↓
         ┌──────────────┐
         │   Router     │
         │ (LLM/规则)   │
         └──────┬───────┘
        ┌───────┼───────┐
        ↓       ↓       ↓
   ┌────────┐┌────────┐┌────────┐
   │Handler ││Handler ││Handler │
   │  A     ││  B     ││  C     │
   │(简单)  ││(中等)  ││(复杂)  │
   └────────┘└────────┘└────────┘
```

**使用场景**：任务有明确分类，分类可准确判断，不同分支需要不同处理策略。

**典型案例**：
- 客服分流（退款 / 技术支持 / 一般咨询）
- 按问题难度分配模型（Haiku 处理简单问题，Sonnet 处理复杂问题）

```python
# 路由示例：按难度分配模型
from llm import llm_router

def route_question(question: str):
    # 路由决策（可由 LLM 或传统分类器完成）
    complexity = classify_complexity(question)  # "low" | "medium" | "high"

    model_map = {
        "low": "claude-haiku-4-5",
        "medium": "claude-sonnet-4-5",
        "high": "claude-opus-4",
    }

    return llm_router.invoke(question, model=model_map[complexity])
```

---

### 模式 3：Parallelization（并行化）

**核心思想**：多个 LLM **同时**处理子任务，结果按程序化方式聚合。

```
┌─────────────────────────────────────────────────────┐
│              Parallelization 两种模式                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  模式 A: Sectioning (分块)                          │
│  ┌─────────────┐  ┌─────────────┐                  │
│  │  LLM A      │  │  LLM B      │ ──→ 聚合          │
│  │ (子任务1)    │  │ (子任务2)    │     Results       │
│  └─────────────┘  └─────────────┘                  │
│                                                     │
│  模式 B: Voting (投票)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  LLM A      │  │  LLM B      │  │  LLM C     │ │
│  │ (视角1)     │  │ (视角2)     │  │ (视角3)    │ │
│  └─────────────┘  └─────────────┘  └────────────┘ │
│                      ↓                              │
│               Vote / 多数裁决                        │
└─────────────────────────────────────────────────────┘
```

**使用场景**：子任务相互独立、可并行执行；或需要多视角/多轮尝试提升置信度。

**典型案例**：
- **Sectioning**: 审核系统 — 一个 LLM 处理用户输入，另一个同时审核内容安全性
- **Voting**: 代码漏洞检测 — 多个不同提示词检测，发现问题则标记

```python
import asyncio

# Parallelization 示例：并发代码审查
async def parallel_code_review(code: str):
    reviewers = [
        "安全专家视角：检查 SQL 注入、XSS 等漏洞",
        "性能专家视角：检查时间复杂度和资源泄漏",
        "可维护性专家视角：检查代码结构和命名规范",
    ]

    # 并发执行
    tasks = [llm.invoke(f"{prompt}\n\n代码:\n{code}") for prompt in reviewers]
    results = await asyncio.gather(*tasks)

    # 聚合：任意一个发现关键问题即标记
    issues = [r for r in results if r.has_issues]
    return {
        "passed": len(issues) == 0,
        "total_issues": sum(len(r.issues) for r in results),
        "detailed_reports": results
    }
```

---

### 模式 4：Orchestrator-Workers（编排器-工作者）

**核心思想**：中央 LLM **动态**分解任务，委托给多个 Worker LLM，最后综合结果。

```
┌──────────────────────────────────────────────────────────────┐
│                  Orchestrator-Workers                        │
│                                                              │
│                      ┌─────────────┐                        │
│                      │ Orchestrator │                        │
│                      │  (中央调度)   │                        │
│                      └──────┬──────┘                        │
│              ┌───────────────┼───────────────┐              │
│              ↓               ↓               ↓              │
│         ┌────────┐      ┌────────┐      ┌────────┐          │
│         │Worker 1│      │Worker 2│      │Worker 3│          │
│         │(子任务1)│      │(子任务2)│      │(子任务3)│          │
│         └────┬───┘      └────┬───┘      └────┬───┘          │
│              └───────────────┼───────────────┘              │
│                              ↓                                │
│                      ┌─────────────┐                        │
│                      │  Synthesize  │                        │
│                      │  (综合结果)   │                        │
│                      └─────────────┘                        │
└──────────────────────────────────────────────────────────────┘
```

**关键特点**：子任务**不是预定义**的，而是由 Orchestrator 根据输入动态决定。

**使用场景**：复杂任务无法提前预测子任务数量和类型（如代码修改）。

**典型案例**：
- 自动化编码任务：修改多个文件，每个文件的变更内容和数量不可预测
- 多源信息搜索分析：动态决定从哪些来源获取信息

```python
# Orchestrator-Workers 示例：智能代码修改 Agent
async def code_modification_agent(task_description: str, repo_path: str):
    orchestrator = OrchestratorLLM()

    # Orchestrator 动态规划子任务
    sub_tasks = await orchestrator.plan(
        f"分析任务:\n{task_description}\n\n仓库: {repo_path}",
        context={"repo_structure": await get_repo_structure(repo_path)}
    )

    # 并发执行各子任务
    worker_tasks = [
        WorkerLLM().execute(task, context={"repo_path": repo_path})
        for task in sub_tasks
    ]
    results = await asyncio.gather(*worker_tasks)

    # Synthesize：综合所有修改
    final_plan = await orchestrator.synthesize(results)
    return final_plan
```

---

### 模式 5：Evaluator-Optimizer（评估-优化器）

**核心思想**：一个 LLM 生成响应，另一个 LLM 在循环中提供评估和反馈。

```
┌─────────────┐         ┌─────────────┐
│  Generator  │ ──────→ │  Evaluator  │
│  (生成器)    │         │  (评估器)    │
└──────┬──────┘         └──────┬──────┘
       ↑                        │
       └──────── loop ←─────────┘
            直到满足评估标准
```

**使用场景**：有明确的评估标准，迭代优化能带来可衡量的提升。

**典型案例**：
- 文学生成：初次翻译可能遗漏细微差别，评估器反馈后改进
- 复杂搜索：多轮搜索-分析-判断是否需要继续搜索

```python
# Evaluator-Optimizer 示例：迭代式搜索
async def iterative_research(query: str, max_rounds: int = 5):
    generator = LLM(model="claude-sonnet-4")
    evaluator = LLM(model="claude-haiku-4")

    current_answer = ""
    for round in range(max_rounds):
        # Generator: 产生或更新回答
        current_answer = await generator.generate(
            f"问题: {query}\n\n已知信息:\n{current_answer}\n\n请补充更多信息或纠正错误。"
        )

        # Evaluator: 判断是否已足够
        eval_result = await evaluator.evaluate(
            f"问题: {query}\n回答:\n{current_answer}",
            criteria=["完整性", "准确性", "相关性"]
        )

        if eval_result.score >= 0.9:
            break  # 收敛，停止迭代

    return current_answer
```

---

## 四、Agent 模式

### 什么是 Agent

Agent 是当 LLM 在以下关键能力上成熟后涌现的产物：
- 理解复杂输入
- 推理与规划
- 可靠地使用工具
- 从错误中恢复

**Agent 的实现往往非常简单**：本质上就是 LLM 在循环中使用工具，基于环境反馈进行决策。

```
┌─────────────────────────────────────────────────────────────┐
│                      Autonomous Agent                        │
│                                                              │
│   ┌──────────────┐                                          │
│   │  Human Input  │ ← 初始指令或交互讨论                      │
│   └──────┬───────┘                                          │
│          ↓                                                  │
│   ┌──────────────┐                                          │
│   │    Plan      │ ← 理解任务，制定执行计划                   │
│   └──────┬───────┘                                          │
│          ↓                                                  │
│   ┌──────┴───────┐      ┌──────────────┐                   │
│   │   ┌────────┐ │      │              │                   │
│   │   │ Action │─┼─────→│  Environment │ ← 工具调用结果    │
│   │   └────────┘ │      │  (环境反馈)   │   或代码执行结果   │
│   │   ↑          │      │              │                   │
│   │   │Observe   │←─────│              │                   │
│   │   └────────┘ │      └──────────────┘                   │
│   │      ↑        │                                          │
│   │      └────────┘                                          │
│   │   Loop (直到完成或遇到停止条件)                           │
│   └──────┬───────┘                                          │
│          ↓                                                  │
│   ┌──────────────┐                                          │
│   │  Human Flag  │ ← 检查点暂停，等待人类反馈                 │
│   └──────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

### Agent 的典型使用场景

| 场景 | 案例 | 关键特性 |
|------|------|----------|
| **编码 Agent** | SWE-bench 任务：基于 PR 描述修改多个文件 | 任务边界清晰、可通过测试验证 |
| **Computer Use** | Agent 操作真实计算机完成任务 | 开放式任务、需要灵活的工具集 |

### Agent 适用条件

**适用**：
- 开放性问题，难以预测所需步数
- 无法硬编码固定路径
- 需要模型自主决策

**不适用**：
- 延迟敏感场景（Agent 成本高、延迟大）
- 任务可被简单 prompt 或单次 LLM 调用解决

---

## 五、工具工程：Agent-Computer Interface (ACI)

**Anthropic 的核心洞察**：工具定义需要像设计优秀的人机界面一样精细。他们在 SWE-bench Agent 上花费最多时间优化的是**工具本身**，而非整体提示词。

### 四大设计原则

```
┌─────────────────────────────────────────────────────────────┐
│                   工具设计四大原则                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 给予足够 Token "思考" 空间                               │
│     └─ 避免模型在还没想清楚时就写死了                         │
│                                                             │
│  2. 格式贴近模型在互联网上自然见过的形式                      │
│     └─ 例如：写 diff 比写精确行数更容易出错                  │
│                                                             │
│  3. 避免格式"开销"                                           │
│     └─ 不需要模型精确计数几千行、也不需要它转义自身输出       │
│                                                             │
│  4. Poka-yoke（防呆设计）                                    │
│     └─ 让工具参数更难被误用                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 实践案例：文件路径问题

> "在 SWE-bench Agent 中，我们发现模型在离开根目录后，使用相对路径时会出错。解决方案：将工具改为**强制使用绝对路径**——模型从此完美使用该工具。"

### 工具定义最佳实践

```python
# ❌ 糟糕的工具定义：容易出错
Tool(
    name="edit_file",
    description="编辑文件",
    parameters={
        "type": "object",
        "properties": {
            "path": {"type": "string"},
            "content": {"type": "string"},
        }
    }
)

# ✅ 优秀的工具定义：防呆设计
Tool(
    name="edit_file",
    description="""在指定文件中进行编辑。

使用方法：
1. 如果文件不存在，使用 create_file 工具创建
2. 使用绝对路径（如 /home/user/project/src/main.py）
3. content 为文件的完整新内容

示例：
  path: "/home/user/project/src/main.py"
  content: "# 新文件内容..."
""",
    parameters={
        "type": "object",
        "properties": {
            "absolute_path": {
                "type": "string",
                "description": "文件的绝对路径（必须以 / 开头）",
                "pattern": "^/"
            },
            "content": {
                "type": "string",
                "description": "文件的完整新内容"
            },
            "change_summary": {
                "type": "string",
                "description": "此次修改的简要说明（便于追踪）"
            }
        },
        "required": ["absolute_path", "content"]
    }
)
```

### 工具测试的迭代流程

```python
# 工具测试框架示例
async def test_tool_consistency(tool: Tool, test_cases: list[TestCase]):
    """验证工具对各种输入的一致性表现"""
    errors = []

    for case in test_cases:
        results = []
        for _ in range(3):  # 相同输入多次调用
            result = await tool.invoke(case.input)
            results.append(result)

        # 检查多次调用结果的一致性
        if not all(r == results[0] for r in results):
            errors.append(f"非确定性输出: {case.description}")

        # 检查是否产生"幻觉"行为
        if result.contains_hallucinated_data(case.ground_truth):
            errors.append(f"幻觉数据: {case.description}")

    return errors

# 常见测试场景
test_cases = [
    TestCase(input="/nonexistent/path.py", description="不存在的路径"),
    TestCase(input="", description="空输入"),
    TestCase(input="x" * 100000, description="超长输入"),
]
```

---

## 六、框架取舍：何时用、何时不用

| 选项 | 优点 | 缺点 |
|------|------|------|
| **直接用 LLM API** | 透明、易调试、少抽象 | 需要自己处理轮询/重试/状态 |
| **LangChain / LangGraph** | 快速起步、丰富的工具生态 | 隐藏底层细节、难以调试 |
| **Agent SDK (Anthropic/Strands)** | 原生支持、模板丰富 | 供应商锁定 |
| **GUI 工具 (Rivet/Vellum)** | 可视化调试、非程序员友好 | 不适合复杂生产系统 |

### 核心建议

> **先用 LLM API 直接实现，很多模式只需几行代码。**
> 如果用框架，必须理解底层代码——对底层实现的错误假设是常见错误来源。

```python
# 用 LangChain 实现 ReAct Agent（框架方式）
from langchain.agents import create_react_agent
agent = create_react_agent(llm, tools)

# 用原生 API 实现同样的 ReAct 循环（仅约 50 行）
# —— 调试时更容易看清每一步发生了什么
```

---

## 七、实战：构建一个编码 Agent

基于 Anthropic 的最佳实践，构建 SWE-bench 风格的编码 Agent：

```python
import asyncio
from dataclasses import dataclass
from typing import Literal

@dataclass
class TaskResult:
    success: bool
    message: str
    iterations: int

class CodingAgent:
    """基于 Anthropic 最佳实践的编码 Agent"""

    def __init__(self, llm, tools: list[Tool]):
        self.llm = llm
        self.tools = {t.name: t for t in tools}
        self.max_iterations = 10
        self.conversation_history = []

    async def solve(self, task: str, repo_path: str) -> TaskResult:
        """SWE-bench 风格：基于任务描述解决 GitHub Issue"""

        # 初始化：让 Agent 制定计划
        plan = await self.llm.complete(
            prompt=f"分析以下任务并制定执行计划:\n{task}\n\n"
                   f"仓库路径: {repo_path}\n\n"
                   f"列出需要修改的文件和修改思路。"
        )

        self.conversation_history.append({"role": "user", "content": task})
        self.conversation_history.append({"role": "assistant", "content": plan})

        for iteration in range(self.max_iterations):
            # 1. Agent 决定下一步行动
            decision = await self.llm.complete(
                messages=self.conversation_history,
                system="""你是编码 Agent。对于每个行动，你需要：
1. 思考 (Thought): 分析当前状态，决定需要什么
2. 行动 (Action): 选择工具并给出参数
3. 等待观察 (Observation): 基于工具返回结果思考

重要原则：
- 所有路径必须使用绝对路径
- 每次修改后验证是否正确
- 如果测试失败，分析原因并重试"""
            )

            self.conversation_history.append({"role": "assistant", "content": decision})

            # 2. 解析行动
            action = self.parse_action(decision)

            if action.type == "finish":
                # 检查点：运行测试验证
                test_result = await self.run_tests(repo_path)
                if test_result.passed:
                    return TaskResult(success=True, message=decision, iterations=iteration+1)
                else:
                    # 测试失败，继续迭代
                    self.conversation_history.append({
                        "role": "user",
                        "content": f"测试失败: {test_result.message}"
                    })

            elif action.type == "tool_call":
                # 3. 执行工具
                tool = self.tools.get(action.tool_name)
                if tool:
                    result = await tool.invoke(**action.parameters)
                    self.conversation_history.append({
                        "role": "user",
                        "content": f"[{action.tool_name}] 结果:\n{result}"
                    })

        return TaskResult(success=False, message="达到最大迭代次数", iterations=self.max_iterations)

    def parse_action(self, text: str) -> Action:
        """从 LLM 输出中解析行动"""
        # 简化实现，实际需要更 robust 的解析
        import re
        action_match = re.search(r'Action: (\w+)\s*Parameters: (.+)', text, re.DOTALL)
        return Action(type="tool_call", tool_name=action_match.group(1), parameters={})

    async def run_tests(self, repo_path: str) -> TestResult:
        """运行测试验证修改"""
        # 运行 pytest
        result = await asyncio.create_subprocess_exec(
            "pytest", "-v", "--tb=short",
            cwd=repo_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await result.communicate()
        return TestResult(passed=result.returncode == 0, message=stdout.decode())
```

---

## 八、两大落地案例

### 案例 A：客服 Agent

```
┌──────────────────────────────────────────────────────────────┐
│                     客服 Agent 架构                           │
│                                                              │
│  User ──→ Chat Interface ──→ Agent ──→ Tool Layer          │
│                                    ├── 知识库检索            │
│                                    ├── 客户数据查询          │
│                                    ├── 订单历史              │
│                                    └── 业务操作              │
│                                         ├── 退款             │
│                                         ├── 改票             │
│                                         └── 建工单             │
│                                                              │
│  成功标准: 明确的解决率指标 (Charge per resolution)           │
└──────────────────────────────────────────────────────────────┘
```

**适合 Agent 的特质**：
- 对话流程自然，但需要外部信息（客户数据、订单历史）
- 可执行退款、改票等真实业务操作
- 成功标准可量化（用户是否得到满意解决）

### 案例 B：编码 Agent

**适合 Agent 的特质**：
- 输出可通过自动测试验证
- 可用测试结果作为反馈进行迭代
- 问题空间定义良好、结构化
- 输出质量可客观衡量

---

## 总结

### 核心原则

```
┌─────────────────────────────────────────────────────────────┐
│                   构建 Agent 的三大原则                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 保持简洁 (Simplicity)                                   │
│     └─ 用最简单的模式解决实际问题，不要过度设计              │
│                                                             │
│  2. 优先透明 (Transparency)                                │
│     └─ 显式展示 Agent 的规划步骤，让用户理解它在做什么       │
│                                                             │
│  3. 精细化 ACI 设计                                         │
│     └─ 工具文档和测试要像人机界面设计一样精细                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 模式选择决策树

```
需要 Agentic System？
        │
        否 → 优化单次 LLM 调用（检索、few-shot examples）
        │
        是 ──→ 任务边界清晰？
                │
                ├─ 是 ──→ 步骤固定？→ Prompt Chaining
                │                 分类明确？→ Routing
                │
                └─ 否 ──→ 子任务独立？
                           │
                           ├─ 是 ──→ 并行化 (Sectioning / Voting)
                           │
                           └─ 否 ──→ 子任务可动态确定？
                                       │
                                       ├─ 是 ──→ Orchestrator-Workers
                                       │
                                       └─ 否 ──→ 需要迭代优化？
                                                  └─ 是 ──→ Evaluator-Optimizer
```

### 关键结论

| 观点 | 说明 |
|------|------|
| **简单胜于复杂** | 最成功的 Agent 实现往往是最简单的 |
| **从 API 开始** | 框架只是加速起步，生产环境需理解底层 |
| **工具 > 框架** | Anthropic 在 SWE-bench 上优化工具的时间多于优化提示词 |
| **渐进式复杂** | 先测量性能，只有简单方案不够时才增加复杂度 |
| **MCP 是趋势** | 统一协议解决工具生态碎片化问题 |

> **一句话总结**：成功的 Agent 构建不是要造最复杂的系统，而是要为你的需求造**最合适**的系统。从单次 LLM 调用开始，用评估驱动迭代，只在必要时才引入 Agent 模式。

---

*参考文献：Anthropic Engineering Blog - Building Effective Agents (Erik Schluntz & Barry Zhang, 2024)*
