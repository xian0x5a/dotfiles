import type { AgentInfo } from 'claude-code'
import { expect, test, type TestBody } from 'claude-code/testing'

const CYAN = '\x1b[96m'
const GREEN = '\x1b[92m'
const YELLOW = '\x1b[93m'
const BLUE = '\x1b[94m'
const RED = '\x1b[91m'
const RESET = '\x1b[0m'

const cyan = (text: string) => `${CYAN}${text}${RESET}`
const blue = (text: string) => `${BLUE}${text}${RESET}`
const context = (color: string, text: string) => `${color}${text}${RESET}`

const BASE_AGENT: AgentInfo = {
  id: 'agent-1',
  description: '',
  type: '',
  status: 'running',
  kind: 'local_agent',
  taskStatus: 'running',
  label: 'label',
  startTime: 0,
  cwd: '/tmp',
  tokenCount: 0,
  tokenSamples: [],
  hasRow: true,
}

// Mounts the row through the mod and reads the body from a hook beneath it, i.e. what Claude Code would draw.
async function renderedBody(
  agent: Partial<AgentInfo>,
  ...[$, on, surface = 'terminal']: [...Parameters<TestBody>, ('terminal' | 'desktop' | 'vscode' | 'mobile')?]
) {
  let body: string | undefined
  on('ui.render', { component: 'AgentRow' }, (_, e, next) => {
    body = e.props.body
    return next(e)
  })
  const ui = await $.ui.mount({
    plugin: 'subagent-row',
    surface,
    component: 'AgentRow',
    props: { ...BASE_AGENT, ...agent, rowIds: ['agent-1'], isHidden: false },
  })
  await ui.unmount()
  return body
}

const SEGMENT_CASES: Array<[string, Partial<AgentInfo>, string | undefined]> = [
  ['name wins over type', { name: 'scout', type: 'Explore' }, cyan('scout')],
  ['type when name is absent', { type: 'Explore' }, cyan('Explore')],
  ['type when name is blank', { name: ' \n\t', type: 'Explore' }, cyan('Explore')],
  ['no identity leaves the row to Claude Code', { description: 'find files', model: 'opus' }, undefined],
  ['description is uncolored', { name: 'a', description: 'find files' }, `${cyan('a')} · find files`],
  ['model before request uses effort level', { name: 'a', model: 'opus', effort: 'high' }, `${cyan('a')} · ${blue('opus•high')}`],
  ['model before request uses numeric effort', { name: 'a', model: 'opus', effort: 8000 }, `${cyan('a')} · ${blue('opus•8000')}`],
  ['model before request defaults to auto', { name: 'a', model: 'opus' }, `${cyan('a')} · ${blue('opus•auto')}`],
  [
    'lastRequest effort overrides agent effort',
    { name: 'a', model: 'opus', effort: 'high', lastRequest: { at: 1, model: 'opus', effort: 'low' } as AgentInfo['lastRequest'] },
    `${cyan('a')} · ${blue('opus•low')}`,
  ],
  [
    'lastRequest without effort drops the effort',
    { name: 'a', model: 'opus', effort: 'high', lastRequest: { at: 1, model: 'opus' } as AgentInfo['lastRequest'] },
    `${cyan('a')} · ${blue('opus')}`,
  ],
  ['no model, no model segment', { name: 'a', effort: 'high' }, cyan('a')],
  ['context 1.0m green', { name: 'a', tokenCount: 100_000, contextWindowSize: 1_000_000 }, `${cyan('a')} · ${context(GREEN, '10%/1.0m')}`],
  ['context 200k green at 69', { name: 'a', tokenCount: 138_000, contextWindowSize: 200_000 }, `${cyan('a')} · ${context(GREEN, '69%/200k')}`],
  ['context yellow at 70', { name: 'a', tokenCount: 140_000, contextWindowSize: 200_000 }, `${cyan('a')} · ${context(YELLOW, '70%/200k')}`],
  ['context yellow at 84', { name: 'a', tokenCount: 168_000, contextWindowSize: 200_000 }, `${cyan('a')} · ${context(YELLOW, '84%/200k')}`],
  ['context red at 85', { name: 'a', tokenCount: 170_000, contextWindowSize: 200_000 }, `${cyan('a')} · ${context(RED, '85%/200k')}`],
  ['context clamps above 100', { name: 'a', tokenCount: 500, contextWindowSize: 200 }, `${cyan('a')} · ${context(RED, '100%/200')}`],
  ['context rounds', { name: 'a', tokenCount: 1, contextWindowSize: 200 }, `${cyan('a')} · ${context(GREEN, '1%/200')}`],
  ['context absent when size missing', { name: 'a', tokenCount: 50 }, cyan('a')],
  ['context absent when size is 0', { name: 'a', tokenCount: 50, contextWindowSize: 0 }, cyan('a')],
  [
    'all segments in order',
    { name: 'a', description: 'd', model: 'm', effort: 'max', tokenCount: 10, contextWindowSize: 100 },
    `${cyan('a')} · d · ${blue('m•max')} · ${context(GREEN, '10%/100')}`,
  ],
]

for (const [name, agent, expected] of SEGMENT_CASES) {
  test(`row body: ${name}`, async ($, on) => {
    expect(await renderedBody(agent, $, on)).toBe(expected)
  })
}

const SANITIZE_CASES: Array<[string, Partial<AgentInfo>, string]> = [
  ['escape sequences removed from name', { name: '\x1b[31mred\x1b[0m' }, cyan('red')],
  ['OSC link removed from description', { name: 'a', description: '\x1b]8;;http://x\x07link\x1b]8;;\x07' }, `${cyan('a')} · link`],
  ['line breaks and control characters become one space', { name: 'a', description: 'one\n\ntwo\x07\x00  three' }, `${cyan('a')} · one two three`],
  ['model is sanitized too', { name: 'a', model: ' \x1b[1mop\nus\x1b[0m ', effort: 'low' }, `${cyan('a')} · ${blue('op us•low')}`],
  ['text empty after cleaning counts as absent', { name: '\x1b[1m\x1b[0m', type: 'Explore', description: '\n', model: '\t' }, cyan('Explore')],
]

for (const [name, agent, expected] of SANITIZE_CASES) {
  test(`model-written text: ${name}`, async ($, on) => {
    expect(await renderedBody(agent, $, on)).toBe(expected)
  })
}

test('rows on other surfaces keep their own columns', async ($, on) => {
  expect(await renderedBody({ name: 'scout', model: 'opus' }, $, on, 'desktop')).toBeUndefined()
})
