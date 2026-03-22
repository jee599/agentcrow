#!/bin/bash
# AgentCrow demo — fake typing .cast generator
# Usage: bash scripts/generate-demo.sh > assets/demo.cast

COLS=90
ROWS=24
NOW=$(date +%s)

# --- Header ---
cat <<EOF
{"version":3,"term":{"cols":${COLS},"rows":${ROWS},"type":"xterm-256color","theme":{"fg":"#d4d4d4","bg":"#1e1e1e","palette":"#000000:#cd3131:#0dbc79:#e5e510:#2472c8:#bc3fbc:#11a8cd:#e5e5e5:#666666:#f14c4c:#23d18b:#f5f543:#3b8eea:#d670d6:#29b8db:#e5e5e5"}},"timestamp":${NOW},"env":{"SHELL":"/bin/zsh"}}
EOF

T=0.0  # cumulative timestamp

emit() {
  # $1 = delay (seconds), $2 = text
  T=$(echo "$T + $1" | bc)
  # Escape for JSON
  local escaped
  escaped=$(printf '%s' "$2" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g')
  printf '[%.3f, "o", "%s"]\n' "$T" "$escaped"
}

# Simulate typing one char at a time
type_chars() {
  local text="$1"
  local base_delay="${2:-0.07}"
  for (( i=0; i<${#text}; i++ )); do
    local c="${text:$i:1}"
    # Vary speed slightly
    local d
    d=$(echo "$base_delay + 0.0$((RANDOM % 6))" | bc)
    emit "$d" "$c"
  done
}

# Print a line instantly
print_line() {
  emit "${2:-0.0}" "$1\r\n"
}

# Color helpers
GREEN='\033[32m'
GRAY='\033[90m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'
CYAN='\033[36m'
YELLOW='\033[33m'
WHITE='\033[37m'
ORANGE='\033[38;2;215;119;87m'

PROMPT='jidong@mac my-saas % '

# ============================================================
# Scene 1: Create project & init
# ============================================================

emit 0.5 "${PROMPT}"
type_chars "mkdir my-saas && cd my-saas"
emit 0.4 "\r\n"
emit 0.3 "${PROMPT}"

# npx agentcrow init
type_chars "npx agentcrow init"
emit 0.5 "\r\n"

# Spinner
for spin in "⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏" "⠋" "⠙"; do
  emit 0.08 "\r\033[0K${spin}"
done

# Output
emit 0.1 "\r\033[0K"
print_line "  Builtin agents ready (9)" 0.05
print_line "  External agents ready" 0.05
print_line "  144 agent definitions → .claude/agents/" 0.05
print_line "  Updated AgentCrow section in CLAUDE.md" 0.05
print_line "" 0.05
print_line "${GREEN}✓ AgentCrow initialized.${RESET} 144 agents in .claude/agents/, max 5 per dispatch." 0.1
print_line "${GRAY}  agentcrow off / on / status${RESET}" 0.05
emit 0.8 ""

# ============================================================
# Scene 2: Launch claude
# ============================================================

emit 0.3 "${PROMPT}"
type_chars "claude"
emit 0.5 "\r\n"

# Claude Code banner (simplified)
emit 0.4 ""
print_line "${ORANGE}╭─── Claude Code v2.2.1 ──────────────────────────────────────────────────╮${RESET}" 0.05
print_line "${ORANGE}│${RESET}                                                                        ${ORANGE}│${RESET}" 0.02
print_line "${ORANGE}│${RESET}   ${BOLD}Welcome back jidong!${RESET}          Opus 4.6 (1M context) · Claude Max   ${ORANGE}│${RESET}" 0.02
print_line "${ORANGE}│${RESET}   ${GRAY}~/my-saas${RESET}                                                          ${ORANGE}│${RESET}" 0.02
print_line "${ORANGE}│${RESET}                                                                        ${ORANGE}│${RESET}" 0.02
print_line "${ORANGE}╰──────────────────────────────────────────────────────────────────────────╯${RESET}" 0.02
print_line "" 0.1
emit 0.3 "❯ "

# ============================================================
# Scene 3: Type the prompt
# ============================================================

type_chars "Build a SaaS dashboard with Stripe billing, auth, and docs" 0.06
emit 1.0 "\r\n"

# Thinking indicator
emit 0.5 ""
for spin in "⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧"; do
  emit 0.1 "\r\033[0K${GRAY}${spin} Thinking...${RESET}"
done
emit 0.3 "\r\033[0K"

# ============================================================
# Scene 4: AgentCrow dispatch
# ============================================================

print_line "" 0.1
print_line "🐦 ${BOLD}AgentCrow${RESET} — dispatching ${BOLD}5 agents${RESET}:" 0.05
print_line "" 0.05

# Agent dispatch lines with staggered timing
emit 0.3 ""
print_line "  1. ${CYAN}@frontend_developer${RESET}  → ${DIM}\"React dashboard UI, charts, responsive layout\"${RESET}" 0.1
emit 0.2 ""
print_line "  2. ${CYAN}@backend_architect${RESET}   → ${DIM}\"Auth system, REST API, database schema\"${RESET}" 0.1
emit 0.2 ""
print_line "  3. ${CYAN}@backend_architect${RESET}   → ${DIM}\"Stripe integration, webhook handlers\"${RESET}" 0.1
emit 0.2 ""
print_line "  4. ${CYAN}@qa_engineer${RESET}         → ${DIM}\"E2E billing flow tests, auth edge cases\"${RESET}" 0.1
emit 0.2 ""
print_line "  5. ${CYAN}@technical_writer${RESET}    → ${DIM}\"API reference, onboarding guide\"${RESET}" 0.1

print_line "" 0.3

# ============================================================
# Scene 5: Agents working
# ============================================================

print_line "${GRAY}────────────────────────────────────────────────────────────────────────────${RESET}" 0.2

# Agent 1 starts
emit 0.5 ""
print_line "${GREEN}▶${RESET} ${BOLD}Agent 1${RESET} ${CYAN}@frontend_developer${RESET} started" 0.05
print_line "${GREEN}▶${RESET} ${BOLD}Agent 2${RESET} ${CYAN}@backend_architect${RESET} started" 0.1
print_line "${GREEN}▶${RESET} ${BOLD}Agent 3${RESET} ${CYAN}@backend_architect${RESET} started" 0.1
print_line "${GREEN}▶${RESET} ${BOLD}Agent 4${RESET} ${CYAN}@qa_engineer${RESET} started" 0.1
print_line "${GREEN}▶${RESET} ${BOLD}Agent 5${RESET} ${CYAN}@technical_writer${RESET} started" 0.1

print_line "" 0.3

# Progress dots
for i in 1 2 3; do
  emit 0.4 "${GRAY}.${RESET}"
done
emit 0.3 "\r\n"

# Agents completing
emit 0.5 ""
print_line "${GREEN}✓${RESET} Agent 5 ${CYAN}@technical_writer${RESET} done — ${DIM}created docs/api-reference.md, docs/onboarding.md${RESET}" 0.1
emit 0.4 ""
print_line "${GREEN}✓${RESET} Agent 4 ${CYAN}@qa_engineer${RESET} done — ${DIM}created tests/billing.test.ts, tests/auth.test.ts${RESET}" 0.1
emit 0.5 ""
print_line "${GREEN}✓${RESET} Agent 3 ${CYAN}@backend_architect${RESET} done — ${DIM}created src/stripe/, src/webhooks/billing.ts${RESET}" 0.1
emit 0.3 ""
print_line "${GREEN}✓${RESET} Agent 1 ${CYAN}@frontend_developer${RESET} done — ${DIM}created src/app/dashboard/, 8 components${RESET}" 0.1
emit 0.4 ""
print_line "${GREEN}✓${RESET} Agent 2 ${CYAN}@backend_architect${RESET} done — ${DIM}created src/auth/, src/api/, prisma/schema.prisma${RESET}" 0.1

print_line "" 0.3
print_line "${GREEN}${BOLD}All 5 agents completed.${RESET} 23 files created across 6 directories." 0.1
print_line "" 0.5

# Final prompt
emit 0.5 "❯ "
emit 2.0 ""
