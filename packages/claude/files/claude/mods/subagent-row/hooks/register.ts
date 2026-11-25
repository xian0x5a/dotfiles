import type { AgentInfo, Register } from 'claude-code'

// Mirrors the colors and thresholds of ~/.claude/statusline.js: a mod runs without Node, so it cannot require that file.
const COLORS = Object.freeze({
  cyan: '\x1b[96m',
  green: '\x1b[92m',
  yellow: '\x1b[93m',
  blue: '\x1b[94m',
  red: '\x1b[91m',
  reset: '\x1b[0m',
})
const CONTEXT_WARNING_PERCENTAGE = 70
const CONTEXT_CRITICAL_PERCENTAGE = 85

// Shown before the subagent's first request when no effort is set for it: the session's level applies then.
const AUTO_EFFORT_LABEL = 'auto'
const SEGMENT_SEPARATOR = ' · '

const TERMINAL_ESCAPE_PATTERN = /\x1b\][^\x07]*(?:\x07|\x1b\\)|\x1b\[[0-?]*[ -/]*[@-~]|\x1b./g
const CONTROL_CHARACTER_PATTERN = /\p{Cc}+/gu

// Collapses model-written text into one plain line: the row body keeps SGR styles and draws line breaks as extra rows.
function plainText(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  const text = value
    .replace(TERMINAL_ESCAPE_PATTERN, '')
    .replace(CONTROL_CHARACTER_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text === '' ? undefined : text
}

function colored(text: string, color: string): string {
  return `${color}${text}${COLORS.reset}`
}

function contextColor(percentage: number): string {
  if (percentage >= CONTEXT_CRITICAL_PERCENTAGE) return COLORS.red
  if (percentage >= CONTEXT_WARNING_PERCENTAGE) return COLORS.yellow
  return COLORS.green
}

function formatContextWindowSize(size: number): string {
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)}m`
  if (size >= 1_000) return `${Math.round(size / 1_000)}k`
  return String(size)
}

// Once requests start, the effort shown is the one the API was sent, after any model cap; a model that takes
// none shows no effort. Before that it is the level set for the subagent, if any.
function effortLabel(agent: AgentInfo): string | undefined {
  if (agent.lastRequest !== undefined) {
    return agent.lastRequest.effort === undefined ? undefined : String(agent.lastRequest.effort)
  }
  return String(agent.effort ?? AUTO_EFFORT_LABEL)
}

function modelSegment(agent: AgentInfo): string | undefined {
  const model = plainText(agent.model)
  if (model === undefined) return undefined
  const effort = effortLabel(agent)
  return colored(effort === undefined ? model : `${model}•${effort}`, COLORS.blue)
}

function contextSegment(agent: AgentInfo): string | undefined {
  const windowSize = agent.contextWindowSize
  if (windowSize === undefined || !(windowSize > 0)) return undefined
  const percentage = Math.min(100, Math.max(0, Math.round((agent.tokenCount / windowSize) * 100)))
  return colored(`${percentage}%/${formatContextWindowSize(windowSize)}`, contextColor(percentage))
}

function subagentRowBody(agent: AgentInfo): string | undefined {
  const identity = plainText(agent.name) ?? plainText(agent.type)
  // Without an identity, leave the row to Claude Code's own columns.
  if (identity === undefined) return undefined
  return [colored(identity, COLORS.cyan), plainText(agent.description), modelSegment(agent), contextSegment(agent)]
    .filter((segment) => segment !== undefined)
    .join(SEGMENT_SEPARATOR)
}

export const register: Register = (on) => {
  on('ui.render', { component: 'AgentRow' }, ($, e, next) => {
    // The deprecated subagentStatusLine drew terminal rows only; the desktop app and VS Code keep their own rows.
    if (e.surface !== 'terminal') return next(e)
    const body = subagentRowBody(e.props)
    return next(body === undefined ? e : { ...e, props: { ...e.props, body } })
  })
}
