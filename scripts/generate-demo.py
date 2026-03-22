#!/usr/bin/env python3
"""AgentCrow demo — fake typing .cast generator
Usage: python3 scripts/generate-demo.py > assets/demo.cast
"""
import json, time, random

COLS, ROWS = 90, 24
events = []
t = 0.0

def emit(delay, text):
    global t
    t += delay
    events.append([round(t, 3), "o", text])

def type_chars(text, base=0.07):
    for c in text:
        d = base + random.uniform(0, 0.05)
        emit(d, c)

def nl():
    emit(0, "\r\n")

def print_line(text, delay=0.0):
    emit(delay, text + "\r\n")

# Colors
ESC = "\u001b"
GREEN  = f"{ESC}[32m"
GRAY   = f"{ESC}[90m"
BOLD   = f"{ESC}[1m"
DIM    = f"{ESC}[2m"
RESET  = f"{ESC}[0m"
CYAN   = f"{ESC}[36m"
ORANGE = f"{ESC}[38;2;215;119;87m"
CLR    = f"\r{ESC}[0K"

PROMPT = "jidong@mac my-saas % "

# ── Scene 1: Create project & init ──
emit(0.5, PROMPT)
type_chars("mkdir my-saas && cd my-saas")
emit(0.4, "\r\n")
emit(0.3, PROMPT)

type_chars("npx agentcrow init")
emit(0.5, "\r\n")

# Spinner
for s in "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏⠋⠙":
    emit(0.08, f"{CLR}{s}")

emit(0.1, CLR)
print_line("  Builtin agents ready (9)", 0.05)
print_line("  External agents ready", 0.05)
print_line("  144 agent definitions → .claude/agents/", 0.05)
print_line("  Updated AgentCrow section in CLAUDE.md", 0.05)
print_line("", 0.05)
print_line(f"{GREEN}✓ AgentCrow initialized.{RESET} 144 agents in .claude/agents/, max 5 per dispatch.", 0.1)
print_line(f"{GRAY}  agentcrow off / on / status{RESET}", 0.05)
emit(0.8, "")

# ── Scene 2: Launch claude ──
emit(0.3, PROMPT)
type_chars("claude")
emit(0.5, "\r\n")

emit(0.4, "")
print_line(f"{ORANGE}╭─── Claude Code v2.2.1 ──────────────────────────────────────────────────╮{RESET}", 0.05)
print_line(f"{ORANGE}│{RESET}                                                                        {ORANGE}│{RESET}", 0.02)
print_line(f"{ORANGE}│{RESET}   {BOLD}Welcome back jidong!{RESET}          Opus 4.6 (1M context) · Claude Max   {ORANGE}│{RESET}", 0.02)
print_line(f"{ORANGE}│{RESET}   {GRAY}~/my-saas{RESET}                                                          {ORANGE}│{RESET}", 0.02)
print_line(f"{ORANGE}│{RESET}                                                                        {ORANGE}│{RESET}", 0.02)
print_line(f"{ORANGE}╰──────────────────────────────────────────────────────────────────────────╯{RESET}", 0.02)
print_line("", 0.1)
emit(0.3, "❯ ")

# ── Scene 3: Type prompt ──
type_chars("Build a SaaS dashboard with Stripe billing, auth, and docs", 0.06)
emit(1.0, "\r\n")

# Thinking
emit(0.5, "")
for s in "⠋⠙⠹⠸⠼⠴⠦⠧":
    emit(0.1, f"{CLR}{GRAY}{s} Thinking...{RESET}")
emit(0.3, CLR)

# ── Scene 4: AgentCrow dispatch ──
print_line("", 0.1)
print_line(f"🐦 {BOLD}AgentCrow{RESET} — dispatching {BOLD}5 agents{RESET}:", 0.05)
print_line("", 0.05)

agents = [
    ("@frontend_developer", "React dashboard UI, charts, responsive layout"),
    ("@backend_architect  ", "Auth system, REST API, database schema"),
    ("@backend_architect  ", "Stripe integration, webhook handlers"),
    ("@qa_engineer        ", "E2E billing flow tests, auth edge cases"),
    ("@technical_writer   ", "API reference, onboarding guide"),
]
for i, (name, task) in enumerate(agents, 1):
    emit(0.2, "")
    print_line(f"  {i}. {CYAN}{name}{RESET}  → {DIM}\"{task}\"{RESET}", 0.1)

print_line("", 0.3)

# ── Scene 5: Agents working ──
sep = "─" * 76
print_line(f"{GRAY}{sep}{RESET}", 0.2)

emit(0.5, "")
starts = [
    ("Agent 1", "@frontend_developer"),
    ("Agent 2", "@backend_architect"),
    ("Agent 3", "@backend_architect"),
    ("Agent 4", "@qa_engineer"),
    ("Agent 5", "@technical_writer"),
]
for name, role in starts:
    print_line(f"{GREEN}▶{RESET} {BOLD}{name}{RESET} {CYAN}{role}{RESET} started", 0.1)

print_line("", 0.3)

# Progress dots
for _ in range(3):
    emit(0.4, f"{GRAY}.{RESET}")
emit(0.3, "\r\n")

# Agents completing (out of order for realism)
completions = [
    ("Agent 5", "@technical_writer",    "created docs/api-reference.md, docs/onboarding.md"),
    ("Agent 4", "@qa_engineer",         "created tests/billing.test.ts, tests/auth.test.ts"),
    ("Agent 3", "@backend_architect",   "created src/stripe/, src/webhooks/billing.ts"),
    ("Agent 1", "@frontend_developer",  "created src/app/dashboard/, 8 components"),
    ("Agent 2", "@backend_architect",   "created src/auth/, src/api/, prisma/schema.prisma"),
]
for name, role, result in completions:
    emit(random.uniform(0.3, 0.6), "")
    print_line(f"{GREEN}✓{RESET} {name} {CYAN}{role}{RESET} done — {DIM}{result}{RESET}", 0.1)

print_line("", 0.3)
print_line(f"{GREEN}{BOLD}All 5 agents completed.{RESET} 23 files created across 6 directories.", 0.1)
print_line("", 0.5)

emit(0.5, "❯ ")
emit(2.0, "")

# ── Output ──
header = {
    "version": 3,
    "term": {
        "cols": COLS,
        "rows": ROWS,
        "type": "xterm-256color",
        "theme": {
            "fg": "#d4d4d4",
            "bg": "#1e1e1e",
            "palette": "#000000:#cd3131:#0dbc79:#e5e510:#2472c8:#bc3fbc:#11a8cd:#e5e5e5:#666666:#f14c4c:#23d18b:#f5f543:#3b8eea:#d670d6:#29b8db:#e5e5e5"
        }
    },
    "timestamp": int(time.time()),
    "env": {"SHELL": "/bin/zsh"}
}

print(json.dumps(header))
for ev in events:
    if ev[2]:  # skip empty
        print(json.dumps(ev))
