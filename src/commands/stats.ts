import { calculateStats } from '../utils/history.js';
import { c, VERSION } from '../utils/constants.js';

export function cmdStats(): void {
  const stats = calculateStats();

  console.log();
  console.log(`  ${c.purple('🐦 AgentCrow Stats')} ${c.dim(`v${VERSION}`)}`);
  console.log();

  if (stats.totalDispatches === 0) {
    console.log(`  ${c.dim('No dispatch history yet.')}`);
    console.log(`  ${c.dim('History is recorded when agents are matched via MCP or compose.')}`);
    console.log();
    return;
  }

  // Overview
  console.log(`  ${c.bold('Overview')}`);
  console.log(`    Total dispatches: ${c.bold(String(stats.totalDispatches))}`);
  console.log(`    Unique roles:     ${c.bold(String(stats.uniqueRoles))}`);
  console.log(`    First dispatch:   ${c.dim(stats.firstDispatch ?? '-')}`);
  console.log(`    Last dispatch:    ${c.dim(stats.lastDispatch ?? '-')}`);
  console.log();

  // Match type breakdown
  const { exact, fuzzy, none } = stats.matchTypeBreakdown;
  const total = stats.totalDispatches;
  console.log(`  ${c.bold('Match Quality')}`);
  console.log(`    ${c.green('exact')}  ${exact} ${c.dim(`(${Math.round(exact / total * 100)}%)`)}`);
  console.log(`    ${c.yellow('fuzzy')}  ${fuzzy} ${c.dim(`(${Math.round(fuzzy / total * 100)}%)`)}`);
  console.log(`    ${c.red('none')}   ${none} ${c.dim(`(${Math.round(none / total * 100)}%)`)}`);
  console.log();

  // Top agents
  if (stats.topAgents.length > 0) {
    console.log(`  ${c.bold('Top Agents')}`);
    for (let i = 0; i < stats.topAgents.length; i++) {
      const { role, count } = stats.topAgents[i];
      const bar = '█'.repeat(Math.min(count, 30));
      console.log(`    ${c.cyan(role.padEnd(25))} ${c.dim(String(count).padStart(3))} ${c.purple(bar)}`);
    }
    console.log();
  }

  // Recent dispatches
  if (stats.recentDispatches.length > 0) {
    console.log(`  ${c.bold('Recent')}`);
    for (const record of stats.recentDispatches) {
      const matchIcon = record.matchType === 'exact' ? c.green('✓') : record.matchType === 'fuzzy' ? c.yellow('~') : c.red('✗');
      const time = record.timestamp.split('T')[0] ?? record.timestamp;
      console.log(`    ${matchIcon} ${c.dim(time)} ${c.bold(record.role)} → ${record.action.slice(0, 50)}`);
    }
    console.log();
  }
}
