<h1 align="center">
  <br>
  🐦 AgentCrow
  <br>
</h1>

<h3 align="center">
  Every subagent Claude spawns gets an expert persona — automatically.<br>
  154 agents. Hook-enforced. Zero config.
</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/agentcrow"><img src="https://img.shields.io/npm/v/agentcrow?style=flat-square&color=violet" alt="npm" /></a>
  <img src="https://img.shields.io/badge/agents-154-brightgreen?style=flat-square" alt="Agents" />
  <img src="https://img.shields.io/badge/tests-190_passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/hook-PreToolUse-blue?style=flat-square" alt="Hook" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jee599/agentcrow?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="#the-problem">Problem</a> •
  <a href="#quickstart">Quickstart</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#commands">Commands</a> •
  <a href="#agents">Agents</a> •
  <a href="docs/README.ko.md">한국어</a> •
  <a href="docs/README.ja.md">日本語</a> •
  <a href="docs/README.zh.md">中文</a>
</p>

---

<a id="the-problem"></a>
## The Problem

When Claude Code spawns a subagent, it's a **blank generalist**. No expertise, no rules, no personality. It does what you asked, but not *how a specialist would*.

```
You: "Build a SaaS with auth, tests, and docs"

Claude spawns 4 subagents:
  Agent 1: (blank) → writes auth code
  Agent 2: (blank) → writes tests
  Agent 3: (blank) → writes docs
  Agent 4: (blank) → writes UI

  = generic output
  = no coding standards enforced
  = no specialist knowledge applied
```

AgentCrow fixes this. A **PreToolUse hook** intercepts every Agent tool call and injects the right expert persona — before the subagent even starts:

```
You: same prompt

AgentCrow intercepts each Agent tool call:
  Agent 1: → 🏗️ Backend Architect persona injected
            "Paranoid about data integrity. Never ships without migrations."
  Agent 2: → 🧪 QA Engineer persona injected
            "Treats 'it probably works' as a personal insult."
  Agent 3: → 📝 Technical Writer persona injected
            "Every sentence earns its place."
  Agent 4: → 🖥️ Frontend Developer persona injected
            "Composition over inheritance, always."

  = specialist output
  = MUST/MUST NOT rules enforced
  = concrete deliverables defined
```

**No other tool does this.** Not ECC (100K⭐), not agency-agents (59K⭐), not wshobson (31K⭐). AgentCrow is the only tool that enforces persona injection at the hook level.

---

<a id="quickstart"></a>
## ⚡ Quickstart

```bash
npm i -g agentcrow
agentcrow init --global
```

That's it. Two commands. From now on:
- Every complex prompt → Claude decomposes into tasks → spawns subagents
- Every subagent → AgentCrow's hook intercepts → injects expert persona
- The subagent works as a specialist, not a generalist

> [!TIP]
> English users: `agentcrow init --global --lang en`
> 한국어: `agentcrow init --global --lang ko`

---

<a id="how-it-works"></a>
## ⚙️ How It Works

```
Your prompt: "Build a todo app with auth, tests, and docs"
                    │
                    ▼
  Claude decomposes into 4 tasks
                    │
                    ▼
  Claude calls Agent tool:
    { name: "qa_engineer", prompt: "Write E2E tests" }
                    │
                    ▼
  ┌─────────────────────────────────────────┐
  │  PreToolUse Hook (automatic)            │
  │                                         │
  │  agentcrow-inject.sh → agentcrow inject │
  │    1. Load catalog-index.json (~5ms)    │
  │    2. Match "qa_engineer" → exact match │
  │    3. Load QA Engineer persona          │
  │    4. Prepend to prompt via updatedInput│
  └─────────────────────────────────────────┘
                    │
                    ▼
  Subagent spawns with full persona:
    <AGENTCROW_PERSONA>
    You are QA Engineer — test specialist
    ## Identity
    Treats 'it probably works' as a personal insult.
    ## MUST
    - Test every public function
    - Cover happy path, edge case, error path
    ## MUST NOT
    - Never test implementation details
    - Never use sleep for async waits
    ## Deliverables
    - Unit tests, Integration tests, E2E tests
    </AGENTCROW_PERSONA>

    Write E2E tests    ← original prompt preserved
```

### Three matching strategies

| Priority | Strategy | Example |
|----------|----------|---------|
| 1 | Exact name match | `name: "qa_engineer"` → QA Engineer |
| 2 | Subagent type match | `subagent_type: "security_auditor"` → Security Auditor |
| 3 | Keyword + synonym fuzzy | `"kubernetes helm deploy"` → DevOps Automator |

Fuzzy matching uses a **synonym map** (50+ entries) and **history learning** — agents you use often get matching priority.

Built-in Claude types (`Explore`, `Plan`, `general-purpose`) are never intercepted.

---

## 👀 Before / After

<table>
<tr>
<td width="50%">

**❌ Without AgentCrow**
```
Claude spawns blank subagent:
  prompt: "Write tests for auth"

  Result:
  - Generic test file
  - No AAA structure
  - Skipped edge cases
  - No coverage targets
  - 15 minutes of mediocre output
```

</td>
<td width="50%">

**✅ With AgentCrow**
```
AgentCrow injects QA persona:
  prompt: <AGENTCROW_PERSONA>
    MUST: test every public function
    MUST NOT: test implementation details
    Deliverables: unit + integration + E2E
  </AGENTCROW_PERSONA>
  Write tests for auth

  Result:
  - AAA-structured tests
  - Happy path + edge + error covered
  - Coverage report included
  - CI config generated
```

</td>
</tr>
</table>

---

<a id="commands"></a>
## 🔧 Commands

```bash
# Install & Setup
agentcrow init [--global] [--lang en|ko] [--max 5] [--mcp]

# Lifecycle
agentcrow on / off [--global]   # Enable/disable
agentcrow status                # Check installation
agentcrow doctor                # 12-point diagnostic
agentcrow update                # Fetch latest agents
agentcrow uninstall             # Clean removal

# Agent Management
agentcrow agents                # List all 154 agents
agentcrow agents search <query> # Keyword search
agentcrow add <path|url>        # Add custom agent (.md/.yaml)
agentcrow remove <role>         # Remove custom agent

# Inspect & Debug
agentcrow compose <prompt>      # Preview decomposition (dry run)
agentcrow stats                 # Dispatch history & analytics
agentcrow inject                # Hook handler (internal)

# MCP Server
agentcrow serve                 # Start MCP server (stdio)
```

---

<a id="agents"></a>
## 🤖 154 Agents

### 14 Hand-Crafted Builtin Agents

Each builtin has personality, communication style, thinking model, MUST/MUST NOT rules, deliverables, and success metrics.

| Agent | What it does | Key rule |
|-------|-------------|----------|
| **Frontend Developer** | React/Next.js, Core Web Vitals, WCAG AA | "Composition over inheritance, always" |
| **Backend Architect** | API design, auth, database, caching | "Never ship without migrations" |
| **QA Engineer** | Unit/integration/E2E tests, coverage | "Untested code is broken code" |
| **Security Auditor** | OWASP, CVSS scoring, PoC for every finding | "Never says 'the code is secure'" |
| **UI Designer** | Design systems, tokens, spacing scales | "If it's not in the token system, it doesn't exist" |
| **DevOps Automator** | CI/CD, Docker, K8s, secrets management | "No :latest tags in production" |
| **AI Engineer** | LLM integration, RAG, prompt optimization | "LLMs are unreliable components that need guardrails" |
| **Refactoring Specialist** | Code smells, Fowler catalog, strangler fig | "Never refactor without tests" |
| **Complexity Critic** | Cyclomatic complexity, YAGNI enforcement | "Never call something complex without proof" |
| **Data Pipeline Engineer** | ETL, idempotency, schema migrations | "Idempotency is non-negotiable" |
| **Technical Writer** | API docs, guides, READMEs | "Every sentence earns its place" |
| **Translator** | i18n, locale files, technical translation | "Never translate code identifiers" |
| **Compose Meta-Reviewer** | Audit agent team compositions | "Block execution below score 70" |
| **Unreal GAS Specialist** | GameplayAbilitySystem, UE5 C++ | "No damage calc in GameplayAbilities" |

### 136 External Agents (13 Divisions)

From [agency-agents](https://github.com/msitarzewski/agency-agents): engineering, game-dev, design, marketing, testing, sales, support, product, strategy, spatial-computing, academic, paid-media, project-management.

---

## ➕ Custom Agents

```bash
agentcrow add ./my-agent.yaml           # Local file
agentcrow add https://example.com/a.md  # URL
agentcrow remove my_agent               # Remove (custom only)
```

---

## 🔌 MCP Server (Optional)

```bash
agentcrow init --global --mcp
```

Adds 3 tools to Claude Code: `agentcrow_match`, `agentcrow_search`, `agentcrow_list`. Claude can query the agent catalog programmatically.

---

## 📊 Stats

```bash
agentcrow stats
```

```
  🐦 AgentCrow Stats

  Match Quality
    exact  38 (81%)    ← name matched directly
    fuzzy   7 (15%)    ← keyword + synonym matched
    none    2 (4%)     ← no match, passthrough

  Top Agents
    frontend_developer     12 ████████████
    qa_engineer             8 ████████
    backend_architect       6 ██████
```

---

## 🛡️ Safety & Performance

| | |
|:---|:---|
| Hook latency | **< 50ms** per Agent tool call |
| Token overhead | **~350 tokens** per persona injection |
| Fail-open | Missing index or binary → passthrough (no breakage) |
| Claude built-ins | `Explore`, `Plan`, `general-purpose` → never intercepted |
| Simple prompts | No agents dispatched, zero overhead |
| `agentcrow off` | Completely disabled, everything backed up |

---

## 🏗️ Architecture

```
~/.agentcrow/
  ├── agents/
  │   ├── builtin/          14 YAML (hand-crafted)
  │   ├── external/         136 MD (agency-agents)
  │   └── md/               154 unified .md files
  ├── catalog-index.json    Pre-built for <5ms lookup
  └── history.json          Dispatch records (last 1000)

~/.claude/
  ├── settings.json         SessionStart + PreToolUse hooks
  └── hooks/
      └── agentcrow-inject.sh
```

---

## 🤝 Contributing

```bash
git clone https://github.com/jee599/agentcrow.git
cd agentcrow && npm install && npm test  # 187 tests
```

## 📜 License

MIT

---

<p align="center">
  <b>🐦 Every subagent deserves a persona.</b>
</p>

<p align="center">
  <a href="https://github.com/jee599/agentcrow">
    <img src="https://img.shields.io/badge/GitHub-⭐_Star_this_repo-yellow?style=for-the-badge&logo=github" alt="Star" />
  </a>
</p>
