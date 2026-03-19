# Social Media Posts for AgentCrow Launch

## Reddit — r/ClaudeAI

**Title:** I built the missing piece for Claude Code Agent Teams — 144 agents, auto-dispatch, zero config

**Body:**
Claude Code's Agent Teams can spawn subagents. But it doesn't know which ones to use.

I built AgentCrow — it gives Agent Teams 144 pre-built specialized agents (frontend, backend, game dev, QA, DevOps, marketing...) and auto-dispatches them based on your prompt.

```bash
npx agentcrow init
claude
# type "Build a SaaS dashboard with auth and billing"
# → auto-dispatches 5 specialized agents
```

No API key. No config. Just `npx agentcrow init` and use `claude` as usual.

GitHub: https://github.com/jee599/agentcrow
npm: https://www.npmjs.com/package/agentcrow

---

## Reddit — r/ChatGPTCoding

**Title:** Made a tool that auto-decomposes prompts into 144 specialized AI agents [Claude Code]

**Body:**
Instead of one AI doing everything, AgentCrow splits your prompt across specialized agents — game designer, frontend dev, QA engineer, etc. 144 agents across 15 divisions.

One command: `npx agentcrow init`

Then just use Claude Code normally. It auto-dispatches the right agents.

https://github.com/jee599/agentcrow

---

## Hacker News — Show HN

**Title:** Show HN: AgentCrow – 144 specialized agents for Claude Code Agent Teams

**URL:** https://github.com/jee599/agentcrow

**Text:**
Claude Code's Agent Teams can spawn subagents, but doesn't know which ones to use. AgentCrow solves this with 144 pre-built agent definitions (engineering, game dev, design, QA, DevOps, marketing) and auto-dispatch rules.

`npx agentcrow init` → generates a CLAUDE.md that tells Claude to auto-decompose complex prompts and dispatch the right specialists. No API key, no config, no runtime dependencies.

The agents come from two sources: 9 hand-crafted builtin agents with strict MUST/MUST NOT rules, and 135 community agents from the agency-agents project.

Built in TypeScript. MIT licensed.

---

## Twitter/X Thread

🐦 Just shipped AgentCrow.

Claude Code Agent Teams can spawn subagents.
But it doesn't know WHICH ones to use.

AgentCrow fixes that.
144 specialized agents. Auto-dispatch. Zero config.

```
npx agentcrow init
```

One command. Then use `claude` as usual. 🧵

---

You type: "Build a SaaS dashboard with Stripe billing and docs"

AgentCrow auto-dispatches 5 agents:
🖥️ frontend_developer
🏗️ backend_architect
💳 Stripe specialist
🧪 qa_engineer
📝 technical_writer

No manual setup. No --agents JSON.

---

144 agents across 15 divisions:
• Engineering (23)
• Game Dev (20)
• Marketing (18)
• Design (8)
• Testing (8)
• + 10 more

Each agent has identity, rules, MUST/MUST NOT.
Not blank subagents.

---

Turn it on: `agentcrow on`
Turn it off: `agentcrow off`
Check status: `agentcrow status`

The entire system is a CLAUDE.md file and YAML.
No runtime. No API key. No background process.

GitHub: github.com/jee599/agentcrow
npm: npmjs.com/package/agentcrow

Agent Teams is the engine.
AgentCrow is the brain. 🧠
