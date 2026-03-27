#!/usr/bin/env node

import { VERSION, c } from './utils/constants.js';
import { cmdInit } from './commands/init.js';
import { cmdOff, cmdOn, cmdStatus } from './commands/lifecycle.js';
import { cmdAgents, cmdAgentsSearch } from './commands/agents.js';
import { cmdCompose } from './commands/compose.js';
import { cmdUpdate } from './commands/update.js';
import { cmdDoctor } from './commands/doctor.js';
import { cmdUninstall } from './commands/uninstall.js';
import { cmdServe } from './commands/serve.js';
import { cmdAdd, cmdRemove } from './commands/add.js';
import { cmdStats } from './commands/stats.js';
import { cmdInject } from './commands/inject.js';

function printUsage(): void {
  console.log(`
  ${c.purple('🐦 AgentCrow')} ${c.dim(`v${VERSION}`)} — Auto Agent Router for Claude Code

  ${c.bold('Usage:')}
    ${c.cyan('agentcrow init')} ${c.dim('[--global] [--lang ko] [--max 5]')}  Set up agents
    ${c.cyan('agentcrow on')} ${c.dim('[--global]')}               Re-enable
    ${c.cyan('agentcrow off')} ${c.dim('[--global]')}              Disable temporarily
    ${c.cyan('agentcrow status')}                      Check status (shows both)
    ${c.cyan('agentcrow agents')}                      List all agents
    ${c.cyan('agentcrow agents search')} ${c.dim('<query>')}      Search by keyword
    ${c.cyan('agentcrow compose')} ${c.dim('<prompt>')}           Preview decomposition
    ${c.cyan('agentcrow update')}                      Update external agents
    ${c.cyan('agentcrow doctor')}                      Diagnose installation
    ${c.cyan('agentcrow uninstall')}                   Remove all AgentCrow data
    ${c.cyan('agentcrow add')} ${c.dim('<path|url>')}              Add custom agent (.md/.yaml)
    ${c.cyan('agentcrow remove')} ${c.dim('<role>')}              Remove custom agent
    ${c.cyan('agentcrow stats')}                       Show dispatch statistics
    ${c.cyan('agentcrow serve')}                       Start MCP server (stdio)

  ${c.bold('Examples:')}
    ${c.dim('$')} agentcrow init --global    ${c.dim('# once, works everywhere')}
    ${c.dim('$')} agentcrow init --lang ko   ${c.dim('# Korean dispatch rules')}
    ${c.dim('$')} agentcrow compose "Build a todo app with auth and tests"
    ${c.dim('$')} agentcrow update           ${c.dim('# fetch latest agents')}
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === '--version' || command === '-v') {
    console.log(`agentcrow ${VERSION}`);
    return;
  }

  const isGlobal = args.includes('--global') || args.includes('-g');
  const isVerbose = args.includes('--verbose') || args.includes('-V');

  switch (command) {
    case 'init': {
      const langIdx = args.indexOf('--lang');
      const lang = langIdx !== -1 && args[langIdx + 1] ? args[langIdx + 1] : 'en';
      const maxIdx = args.indexOf('--max');
      const maxRaw = maxIdx !== -1 && args[maxIdx + 1] ? parseInt(args[maxIdx + 1], 10) : 5;
      const maxAgents = Number.isNaN(maxRaw) || maxRaw < 1 ? 5 : maxRaw;
      const isMcp = args.includes('--mcp');
      await cmdInit(lang, maxAgents, isGlobal, isMcp);
      break;
    }

    case 'on':
      cmdOn(isGlobal);
      break;

    case 'off':
      cmdOff(isGlobal);
      break;

    case 'status':
      cmdStatus(isGlobal);
      break;

    case 'agents':
      if (args[1] === 'search') {
        if (!args[2]) {
          console.error('Usage: agentcrow agents search <query>');
          process.exit(1);
        }
        await cmdAgentsSearch(args.slice(2).join(' '));
      } else {
        await cmdAgents();
      }
      break;

    case 'compose':
      if (!args[1]) {
        console.error('Usage: agentcrow compose <prompt>');
        process.exit(1);
      }
      await cmdCompose(args.filter((a) => !a.startsWith('--')).slice(1).join(' '), isVerbose);
      break;

    case 'update':
      await cmdUpdate();
      break;

    case 'doctor':
      cmdDoctor();
      break;

    case 'uninstall':
      cmdUninstall();
      break;

    case 'add':
      if (!args[1]) {
        console.error('Usage: agentcrow add <path|url>');
        process.exit(1);
      }
      await cmdAdd(args[1]);
      break;

    case 'remove':
      if (!args[1]) {
        console.error('Usage: agentcrow remove <role>');
        process.exit(1);
      }
      await cmdRemove(args[1]);
      break;

    case 'stats':
      cmdStats();
      break;

    case 'inject':
      await cmdInject();
      break;

    case 'serve':
      await cmdServe();
      break;

    default:
      if (command) {
        console.error(`Unknown command: ${command}\n`);
        process.exitCode = 1;
      }
      printUsage();
      break;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
