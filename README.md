<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  You type one prompt. AgentCrow picks the right agents and dispatches them.<br>
  144 agents. 15 commands. Zero config.
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/agentcrow"><img src="https://img.shields.io/npm/v/agentcrow?style=flat-square&color=violet" alt="npm" /></a>
  <img src="https://img.shields.io/badge/agents-150-brightgreen?style=flat-square" alt="Agents" />
  <img src="https://img.shields.io/badge/tests-187_passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/MCP-server-blue?style=flat-square" alt="MCP" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jee599/agentcrow?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="#quickstart">Quickstart</a> •
  <a href="#two-modes">Two Modes</a> •
  <a href="#commands">Commands</a> •
  <a href="#mcp-server">MCP Server</a> •
  <a href="#custom-agents">Custom Agents</a> •
  <a href="docs/README.ko.md">한국어</a> •
  <a href="docs/README.ja.md">日本語</a> •
  <a href="docs/README.zh.md">中文</a>
</p>

---

<a id="quickstart"></a>
## ⚡ Quickstart

```bash
npm i -g agentcrow
agentcrow init --global
```

Done. Now just use `claude` as usual:

```
You: "Build a SaaS dashboard with Stripe billing, auth, and docs"

🐦 AgentCrow auto-dispatches:
  🖥️ frontend_developer  → Dashboard UI
  🏗️ backend_architect   → Auth + Stripe API
  🧪 qa_engineer         → E2E tests
  📝 technical_writer    → API docs

You didn't pick them. AgentCrow did.
```

Simple prompts run normally. AgentCrow only activates for complex, multi-task requests.

---

<a id="two-modes"></a>
## 🔀 Two Modes

### Mode 1: CLAUDE.md (default)

```bash
agentcrow init --global
```

Injects dispatch rules into CLAUDE.md. Claude reads the rules and dispatches agents automatically. No server, no background process.

### Mode 2: MCP Server (recommended)

```bash
agentcrow init --global --mcp
```

Registers AgentCrow as an MCP server. Claude gets 3 native tools:

| Tool | What it does |
|------|-------------|
| `agentcrow_match` | Find the best agent for a role + task |
| `agentcrow_search` | Search agents by keyword |
| `agentcrow_list` | List all agents by division |

MCP mode is more precise (code-based matching vs. LLM judgment) and uses fewer tokens (no agent catalog in context).

---

<a id="commands"></a>
## 🔧 All Commands

```bash
# Setup
agentcrow init [--global] [--mcp] [--lang ko] [--max 5]

# Lifecycle
agentcrow on [--global]         # Re-enable
agentcrow off [--global]        # Disable temporarily
agentcrow status                # Check status
agentcrow doctor                # Diagnose installation (11 checks)
agentcrow uninstall             # Clean removal

# Agents
agentcrow agents                # List all 144 agents
agentcrow agents search <query> # Search by keyword
agentcrow update                # Fetch latest external agents
agentcrow add <path|url>        # Add custom agent (.md/.yaml)
agentcrow remove <role>         # Remove custom agent

# Inspect
agentcrow compose <prompt>      # Preview decomposition (dry run)
agentcrow stats                 # Dispatch history & analytics

# MCP
agentcrow serve                 # Start MCP server (stdio)
```

---

## 🤖 144 Agents, 13 Divisions

| Division | Examples |
|:---------|:---------|
| **Engineering** | frontend_developer, backend_architect, ai_engineer, sre, devops |
| **Game Dev** | game_designer, level_designer, unreal, unity, godot |
| **Design** | ui_designer, ux_researcher, brand_guardian |
| **Marketing** | content_strategist, seo_specialist, social_media |
| **Testing** | qa_engineer, test_automation, performance_tester |
| **Builtin** | security_auditor, korean_tech_writer, refactoring_specialist |
| + 7 more | sales, support, product, strategy, spatial-computing, academic, paid-media |

9 builtin agents are hand-crafted with personality, MUST/MUST NOT rules, and deliverables.
135 external agents from [agency-agents](https://github.com/msitarzewski/agency-agents).

---

<a id="custom-agents"></a>
## ➕ Custom Agents

```bash
# Add from local file
agentcrow add ./my-agent.md

# Add from URL
agentcrow add https://raw.githubusercontent.com/user/repo/main/agent.yaml

# Remove (only custom agents can be removed)
agentcrow remove my_agent
```

Custom agents are stored in `~/.agentcrow/agents/custom/` and appear in INDEX.md alongside builtin and external agents.

---

<a id="mcp-server"></a>
## 🔌 MCP Server Setup

```bash
agentcrow init --global --mcp
```

This adds AgentCrow to your Claude Code settings:

```json
{
  "mcpServers": {
    "agentcrow": {
      "command": "agentcrow",
      "args": ["serve"]
    }
  }
}
```

Or add it manually. The server provides `agentcrow_match`, `agentcrow_search`, and `agentcrow_list` tools.

---

## 📊 Dispatch Stats

```bash
agentcrow stats
```

```
  🐦 AgentCrow Stats v4.0.0

  Overview
    Total dispatches: 47
    Unique roles:     12

  Match Quality
    exact  38 (81%)
    fuzzy   7 (15%)
    none    2 (4%)

  Top Agents
    frontend_developer     12 ████████████
    qa_engineer             8 ████████
    backend_architect       6 ██████
```

Every `compose` and MCP `match` call is recorded. History is kept in `~/.agentcrow/history.json` (last 1000 records).

---

## 🛡️ Zero Overhead

| | |
|:---|:---|
| 🟢 Complex prompts | Auto-dispatched to specialist agents |
| 🔵 Simple prompts | Runs normally, no agents |
| 🔴 `agentcrow off` | Completely disabled, backup preserved |

AgentCrow only touches `.claude/CLAUDE.md`, `.claude/agents/`, and settings.json (for MCP). No project dependencies, no background processes.

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
```

</td>
<td width="50%">

**✅ With AgentCrow**
```
You: same prompt

AgentCrow auto-dispatches:
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

## ⚙️ How It Works

```
  ┌───────────────────────────────────────┐
  │  Your prompt                          │
  │           ↓                           │
  │  ┌──────────────────────────────┐     │
  │  │ Mode A: CLAUDE.md rules      │     │
  │  │   Claude reads INDEX.md      │     │
  │  │   Picks agents, dispatches   │     │
  │  │                              │     │
  │  │ Mode B: MCP server           │     │
  │  │   Claude calls agentcrow_    │     │
  │  │   match/search/list tools    │     │
  │  └──────────────────────────────┘     │
  │           ↓                           │
  │  Specialist agents work in parallel   │
  └───────────────────────────────────────┘
```

---

## 🤝 Contributing

```bash
git clone https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 187 tests
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
