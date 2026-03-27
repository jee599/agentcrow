#!/bin/bash
# AgentCrow PreToolUse hook — auto-inject agent persona into subagent prompt
# Installed by: agentcrow init
# Matcher: "Agent" (only fires on Agent tool calls)

INPUT=$(cat)

# Quick check: only process Agent tool calls
if command -v jq &>/dev/null; then
  TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
else
  # Fallback without jq
  if ! echo "$INPUT" | grep -q '"tool_name"[[:space:]]*:[[:space:]]*"Agent"'; then
    exit 0
  fi
  TOOL="Agent"
fi

[ "$TOOL" != "Agent" ] && exit 0

# Delegate to agentcrow inject (Node.js, reads catalog-index.json)
echo "$INPUT" | agentcrow inject 2>/dev/null
