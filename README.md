<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Claude Code Agent Teams is powerful. But it doesn't know <i>which</i> agents to use.<br>
  AgentCrow does. 9 builtin agents + external agents. Auto-dispatch. <code>npx agentcrow init</code>
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/agentcrow"><img src="https://img.shields.io/npm/v/agentcrow?style=flat-square&color=violet" alt="npm" /></a>
  <img src="https://img.shields.io/badge/agents-9_builtin-brightgreen?style=flat-square" alt="Agents" />
  <img src="https://img.shields.io/badge/tests-78_passing-brightgreen?style=flat-square" alt="Tests" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jee599/agentcrow?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="#the-problem">Problem</a> •
  <a href="#install">Install</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#agents">Agents</a> •
  <a href="#commands">Commands</a> •
  <a href="docs/README.ko.md">한국어</a> •
  <a href="docs/README.ja.md">日本語</a> •
  <a href="docs/README.zh.md">中文</a> •
  <a href="docs/README.es.md">Español</a> •
  <a href="docs/README.pt.md">Português</a> •
  <a href="docs/README.de.md">Deutsch</a> •
  <a href="docs/README.fr.md">Français</a> •
  <a href="docs/README.ru.md">Русский</a> •
  <a href="docs/README.hi.md">हिन्दी</a> •
  <a href="docs/README.tr.md">Türkçe</a> •
  <a href="docs/README.vi.md">Tiếng Việt</a>
</p>

---

<a id="the-problem"></a>
## 🆚 Agent Teams alone vs. Agent Teams + AgentCrow

| | Agent Teams alone | + AgentCrow |
|:---|:---:|:---:|
| Spawn subagents | ✅ | ✅ |
| Know which agents to use | ❌ you decide | ✅ auto-matched |
| 9 builtin + external agent roles | ❌ you write prompts | ✅ ready to go |
| Auto-decompose prompts | ❌ you split manually | ✅ one prompt in |
| Agent identity & rules | ❌ blank subagents | ✅ personality, MUST/MUST NOT |
| Works without config | ❌ needs `--agents` JSON | ✅ `npx agentcrow init` |
| Multiple divisions (eng, game, design...) | ❌ | ✅ |

> **Agent Teams gives you the engine. AgentCrow gives it a brain.**

---

```
  You:    "Build a SaaS dashboard with Stripe billing, auth, and docs"

  🐦 AgentCrow auto-dispatches 5 agents:

    🖥️  frontend_developer  → React dashboard UI, charts, responsive layout
    🏗️  backend_architect   → Auth system, REST API, database schema
    💳  backend_architect   → Stripe integration, webhook handlers
    🧪  qa_engineer         → E2E billing flow tests, auth edge cases
    📝  technical_writer    → API reference, onboarding guide

  You didn't pick them. AgentCrow did.
```

<h3 align="center">⬇️ One line. That's it.</h3>

```bash
npx agentcrow init
```

<p align="center">
  Then just run <code>claude</code> as usual. AgentCrow handles the rest.<br>
  <b>macOS · Linux · Windows</b>
</p>

---

## 👀 Before / After

<table>
<tr>
<td width="50%">

**❌ Without AgentCrow**
```
You: Build a dashboard with API,
     tests, and docs

Claude: (one agent does everything)
        - reads all files
        - writes all code
        - runs all tests
        - writes all docs
        = one context window
        = forgets early work
        = 10+ minutes
```

</td>
<td width="50%">

**✅ With AgentCrow**
```
You: same prompt

AgentCrow auto-dispatches:
  @ui_designer     → layout
  @frontend_dev    → React code
  @backend_arch    → API
  @qa_engineer     → tests
  @tech_writer     → docs

  = parallel agents
  = each focused
  = better results
```

</td>
</tr>
</table>

---

<a id="install"></a>
## ⚡ Install

```bash
npx agentcrow init
```

That's it. This does two things:

**First run only** — downloads agents to `~/.agentcrow/` (global, shared across all projects)

**Every run** — merges AgentCrow section into `.claude/CLAUDE.md` (your existing rules are preserved)

> [!NOTE]
> Agents are stored globally at `~/.agentcrow/`. Second project onward = instant, no download.

> [!TIP]
> Already have a CLAUDE.md? AgentCrow **appends** its section — your existing rules stay untouched.

<a id="how-it-works"></a>
## ⚙️ How It Works

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

1. **You run `claude`** in a project with AgentCrow initialized
2. **You type a prompt** — anything complex
3. **Claude reads CLAUDE.md** — sees the agent roster and dispatch rules
4. **Claude decomposes** — splits your prompt into focused tasks
5. **Claude dispatches** — uses the Agent tool to spawn subagents
6. **Each agent works** — with its own expertise

No API key. No server. Just Claude Code + CLAUDE.md.

<a id="agents"></a>
## 🤖 9 Builtin Agents + External Agents

| Division | Examples |
|:---------|:---------|
| **Engineering** | frontend_developer, backend_architect, ai_engineer, sre |
| **Game Dev** | game_designer, level_designer, unreal, unity, godot |
| **Marketing** | content_strategist, seo_specialist, social_media |
| **Testing** | test_automation, performance_tester |
| **Design** | ui_designer, ux_researcher, brand_guardian |
| **Builtin** | qa_engineer, korean_tech_writer, security_auditor |
| + more | sales, support, product, strategy, spatial-computing... |

<a id="commands"></a>
## 🔧 Commands

```bash
npx agentcrow init              # Set up agents + CLAUDE.md (English default)
npx agentcrow init --lang ko    # Korean template
npx agentcrow init --max 5      # Max simultaneous agents per dispatch
npx agentcrow status            # Check if active
npx agentcrow off               # Disable temporarily
npx agentcrow on                # Re-enable
npx agentcrow agents            # List all agents
npx agentcrow agents search ai  # Search by keyword
npx agentcrow compose "prompt"  # Preview decomposition (dry run)
```

## 💡 Example Prompts

```
Build an AI-powered news aggregator with crawling and email alerts
→ ai_engineer + data_pipeline_engineer + frontend_developer + devops_automator

E-commerce site with Stripe, inventory management, and admin panel
→ frontend_developer + backend_architect + ui_designer + qa_engineer

Open source CLI tool with tests, docs, and CI/CD pipeline
→ frontend_developer + qa_engineer + technical_writer + devops_automator
```

Simple prompts run normally. AgentCrow only activates for multi-task requests.

## 🛡️ Zero Overhead

| | |
|:---|:---|
| 🟢 Complex prompts | Auto-decomposed into agents |
| 🔵 Simple prompts | Runs normally, no agents |
| 🔴 `agentcrow off` | Completely disabled |

> [!IMPORTANT]
> AgentCrow only touches `.claude/CLAUDE.md` and `.claude/agents/`. No project dependencies, no background processes. `agentcrow off` backs up and removes both cleanly.

## 🤝 Contributing

```bash
git clone --recursive https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 78 tests
```

## 📜 License

MIT — External agents from [agency-agents](https://github.com/msitarzewski/agency-agents).

---

<p align="center">
  <b>🐦 One prompt. Many agents. Zero config.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
