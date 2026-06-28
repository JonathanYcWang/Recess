// Regenerates .codex/agents/*.toml from .github/agents/*.md.
// The .md files are the single source of truth for agent personas.
// Per-agent static config (model, sandbox, MCP tools) is declared inline below.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const AGENTS = [
  {
    name: 'audit',
    description:
      'Recess audit agent. Scans codebase for architecture violations. Creates one GitHub issue per violation type with file paths and line numbers.',
    model: 'gpt-5',
    effort: 'high',
    sandbox: 'read-only',
    tools: ['create_issue', 'list_issues', 'get_file_contents'],
  },
  {
    name: 'planner',
    description:
      'Recess planner. Reads a GitHub issue, aligns with developer via grill-me, writes implementation plan back to issue. Read-only codebase access.',
    model: 'gpt-5',
    effort: 'high',
    sandbox: 'read-only',
    tools: ['get_issue', 'update_issue', 'list_issues'],
  },
  {
    name: 'implementer',
    description:
      'Recess implementer. Executes approved implementation plan from GitHub issue chunk by chunk. Write access to codebase.',
    model: 'gpt-5',
    effort: 'low',
    sandbox: 'workspace-write',
    tools: ['get_issue'],
  },
  {
    name: 'reviewer',
    description:
      'Recess reviewer. Checks implementation against architecture rules, explains findings, opens PR if clean. Read-only codebase access.',
    model: 'gpt-5',
    effort: 'high',
    sandbox: 'read-only',
    tools: ['get_issue', 'create_pull_request', 'list_commits', 'get_file_contents'],
  },
  {
    name: 'orchestrator',
    description:
      'Recess workflow orchestrator. Handles /build and /audit triggers. Delegates to planner, implementer, reviewer, and audit subagents.',
    model: 'gpt-5',
    effort: 'medium',
    sandbox: 'read-only',
    tools: ['get_issue', 'list_issues'],
  },
];

export const syncCodexAgents = () => {
  for (const a of AGENTS) {
    const body = readFileSync(join(ROOT, '.github/agents', `${a.name}.md`), 'utf8').trimEnd();
    const tools = a.tools.map((t) => `    "${t}",`).join('\n');
    const out = `# Auto-generated from .github/agents/${a.name}.md — do not edit by hand.
name = "${a.name}"
description = '${a.description}'
model = "${a.model}"
model_reasoning_effort = "${a.effort}"
sandbox_mode = "${a.sandbox}"

developer_instructions = """
${body}
"""

[mcp_servers.github]
url = "https://api.githubcopilot.com/mcp/"
bearer_token_env_var = "GITHUB_PAT_TOKEN"
enabled_tools = [
${tools}
]
`;
    writeFileSync(join(ROOT, '.codex/agents', `${a.name}.toml`), out);
    console.log(`✓ .codex/agents/${a.name}.toml`);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  syncCodexAgents();
}
