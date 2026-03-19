<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  输入一个 prompt，AgentCrow 自动拆分到 144 个专业 Agent 并行执行。<br>
  <code>npx agentcrow init</code> → <code>claude</code> → 自动调度。
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/agentcrow"><img src="https://img.shields.io/npm/v/agentcrow?style=flat-square&color=violet" alt="npm" /></a>
  <img src="https://img.shields.io/badge/agents-144_ready-brightgreen?style=flat-square" alt="Agents" />
  <img src="https://img.shields.io/badge/tests-70_passing-brightgreen?style=flat-square" alt="Tests" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jee599/agentcrow?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="../README.md">English</a> •
  <a href="README.ko.md">한국어</a> •
  <a href="README.ja.md">日本語</a> •
  中文
</p>

---

```
  你:    "做一个AI股票分析工具，能爬取数据、分析趋势、生成报告"

  AgentCrow 自动分解 → 5 个 Agent:

    🤖  ai_engineer         → 趋势预测模型、情感分析
    📊  data_pipeline_eng   → 股票API爬取、数据清洗、存储
    🖥️  frontend_developer  → 图表仪表盘、实时行情UI
    🏗️  backend_architect   → 数据API、用户认证、报告生成
    🧪  qa_engineer         → 数据准确性测试、API压力测试

  Claude 自动调度每个 Agent。
```

<h3 align="center">⬇️ 一行命令，搞定。</h3>

```bash
npx agentcrow init
```

<p align="center">
  然后像平时一样运行 <code>claude</code> 就行。剩下的交给 AgentCrow。<br>
  <b>macOS · Linux · Windows</b>
</p>

---

## 👀 Before / After

<table>
<tr>
<td width="50%">

**❌ 没有 AgentCrow**
```
你: 做一个 Dashboard，
    包含 API、测试和文档。

Claude:（一个 Agent 干所有事）
        - 读所有文件
        - 写所有代码
        - 跑所有测试
        - 写所有文档
        = 一个上下文窗口
        = 忘掉前面的工作
        = 10 分钟以上
```

</td>
<td width="50%">

**✅ 使用 AgentCrow**
```
你: 同样的 prompt

AgentCrow 自动调度:
  @ui_designer     → 布局
  @frontend_dev    → React 代码
  @backend_arch    → API
  @qa_engineer     → 测试
  @tech_writer     → 文档

  = 并行 Agent
  = 各自专注擅长领域
  = 更好的结果
```

</td>
</tr>
</table>

---

<a id="install"></a>
## ⚡ 安装

```bash
npx agentcrow init
```

就这么简单。运行后会生成以下文件：
- `.agr/agents/` — 144 个 Agent 定义（内置 9 个 + 外部 135 个）
- `.claude/CLAUDE.md` — Claude 自动调度规则
- `.claude/settings.local.json` — SessionStart 钩子

> [!TIP]
> AgentCrow 在首次 init 时会从 [agency-agents](https://github.com/msitarzewski/agency-agents) 下载 135 个外部 Agent，需要 `git`。

<a id="how-it-works"></a>
## ⚙️ 工作原理

```
  ┌─────────────────────────────────────┐
  │  Your prompt                        │
  │           ↓                         │
  │  ┌────────────────────────────┐     │
  │  │ CLAUDE.md reads agent list │     │
  │  │ Claude decomposes prompt   │     │
  │  │ Dispatches Agent tool      │     │
  │  │ Each agent works in scope  │     │
  │  └────────────────────────────┘     │
  │           ↓                         │
  │  Files created, tests written,      │
  │  docs generated — by specialists    │
  └─────────────────────────────────────┘
```

1. **在已初始化 AgentCrow 的项目中运行 `claude`**
2. **输入一个复杂的 prompt**
3. **Claude 读取 CLAUDE.md** — 获取 Agent 列表和调度规则
4. **Claude 分解任务** — 将 prompt 拆分为多个专注的子任务
5. **Claude 调度 Agent** — 通过 Agent 工具生成子 Agent
6. **每个 Agent 各司其职** — 在自己的专业领域内工作

不需要 API Key。不需要服务器。只需 Claude Code + CLAUDE.md。

<a id="agents"></a>
## 🤖 144 个 Agent，15 个部门

| 部门 | 数量 | 示例 |
|:---------|------:|:---------|
| **Engineering** | 23 | frontend_developer, backend_architect, ai_engineer, sre |
| **Game Dev** | 20 | game_designer, level_designer, unreal, unity, godot |
| **Marketing** | 18 | content_strategist, seo_specialist, social_media |
| **Testing** | 8 | test_automation, performance_tester |
| **Design** | 8 | ui_designer, ux_researcher, brand_guardian |
| **Builtin** | 9 | qa_engineer, korean_tech_writer, security_auditor |
| + 其他 9 个 | 58 | sales, support, product, strategy, spatial-computing... |

<a id="commands"></a>
## 🔧 命令

```bash
npx agentcrow init              # Set up agents + CLAUDE.md
npx agentcrow status            # Check if active
npx agentcrow off               # Disable temporarily
npx agentcrow on                # Re-enable
npx agentcrow agents            # List all 144 agents
npx agentcrow agents search ai  # Search by keyword
npx agentcrow compose "prompt"  # Preview decomposition (dry run)
```

## 💡 Prompt 示例

```
React로 로그인 만들고 API 연동하고 테스트하고 문서 작성해줘
→ frontend_developer + backend_architect + qa_engineer + korean_tech_writer

Build a real-time chat app with WebSocket and deploy to Docker
→ frontend_developer + backend_architect + devops_automator + qa_engineer

ゲームのマッチメイキングシステムを設計して実装して
→ game_designer + backend_architect + qa_engineer
```

简单的 prompt 会正常运行，AgentCrow 只在多任务请求时才会介入。

## 🛡️ 零开销

| | |
|:---|:---|
| 🟢 复杂 prompt | 自动拆分为多个 Agent |
| 🔵 简单 prompt | 正常运行，不启动 Agent |
| 🔴 `agentcrow off` | 完全禁用 |

> [!IMPORTANT]
> AgentCrow 只添加一个 CLAUDE.md 文件。没有依赖，没有后台进程。`agentcrow off` 即可完全移除。

## 🤝 贡献

```bash
git clone --recursive https://github.com/jee599/agentcrow.git
cd agentochester && npm install && npm test  # 70 tests
```

## 📜 许可证

MIT — 外部 Agent 来源：[agency-agents](https://github.com/msitarzewski/agency-agents)。

---

<p align="center">
  <b>🐦 一个 Prompt。多个 Agent。零配置。</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
