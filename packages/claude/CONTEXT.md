# Claude Code Package

Managed Claude Code configuration, helpers, and status-line renderers.

## Language

**Subagent identity**:
The first segment of a Claude Code subagent status row. It is the agent's `name`; when unavailable, it is the agent's `type`. When both are unavailable, the mod leaves the row to Claude Code's own columns.
_Avoid_: task label

**Subagent status row**:
The complete row for a Claude Code subagent: identity, description, model label, and context percentage, in that order. Unavailable segments are omitted and the row is never renderer-truncated.

**Subagent description**:
The second segment of a Claude Code subagent status row. It is the agent's `description` when supplied; it is otherwise absent.
_Avoid_: task label, task type

**Primary context indicator**:
The API-reported proportion of a context window in use. A reported zero is displayed as `0%`; when usage is unavailable but capacity is known, it is displayed as `?/200k`; when usage is known but capacity is unavailable, it is displayed as `26%/?`; when both are unavailable, the segment is absent. Values are not recalculated from other usage fields.
_Avoid_: calculated context percentage, recovered percentage

**Subagent context percentage**:
The agent's `tokenCount` (its current context size) over its `contextWindowSize`, displayed as `4%/200k`. It is displayed only when the window size is known.
_Avoid_: token-sample recovery, cumulative token spend

**Subagent model label**:
The agent's `model`, displayed verbatim, followed by `•<effort>`. Once the agent has made a request, effort is the one that request carried (`lastRequest.effort`), so it reflects model caps and levels set in any settings layer; a model that takes no effort shows none. Before the first request it is the level set for that subagent (definition frontmatter or the Agent tool's `effort` parameter), or `auto`.
_Avoid_: prettified model name, inferred model family

**Status-row colors**:
Color is reserved for identity, model, and context pressure. Descriptions and token counts use the terminal default color.

**Subagent row width**:
The renderer emits the complete status row regardless of the reported `columns` width. Claude Code owns any resulting clipping or wrapping.
_Avoid_: renderer truncation, field dropping
