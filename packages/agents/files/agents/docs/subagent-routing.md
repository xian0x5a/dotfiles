# Subagent routing

Heuristic reference for routing each subagent by role to a model tier and effort. The parent may pick a higher tier for a listed role when the task needs it.

| Role                                                          | Tier       | Effort        |
| ------------------------------------------------------------- | ---------- | ------------- |
| Mechanical search, extraction, reformatting                   | small      | `low`         |
| Implementation or tests from detailed instructions/ExecPlan   | standard   | `medium`      |
| Implementation or tests where the delegate fills gaps         | standard   | `high`        |
| Code review                                                   | frontier   | `high`        |
| Final review of high-stakes changes; debugging without a lead | frontier   | `xhigh`       |
| Advisor: second opinion on a decision                         | frontier   | `high` and up |

- Review sits above the implementation it checks: implementer mistakes get caught downstream, a reviewer's miss ships silently. When one round runs several reviewers on the same change (e.g. a majority vote), draw each from a different model family: same-family reviewers share blind spots, so their agreement counts for less.
- Running a smaller tier than listed: only a `⁺` model, with effort raised one level.
- Retry after a failure: one step up, tier first, then effort. `max` is the last resort for a challenging task that already failed.
- Families without a level (e.g. no `max`): use the nearest.
- Stay at or below the parent's effort; exceed it only as advisor or last-resort retry, and name which in the handoff.

## Tiers

Resolve a tier to an available model at delegation time (`orchestrator_capabilities` or the harness's model list).

| Tier       | Examples                         |
| ---------- | -------------------------------- |
| escalation | Fable                            |
| frontier   | Opus                             |
| standard   | Sonnet                           |
| small      | Haiku, GPT Luna, DeepSeek Flash⁺ |

`⁺` marks a model that can stand in for the tier above when effort is raised one level.

Escalation models cost more than frontier without being reliably stronger; reach them by retry or as advisor, not as a first pick.

## Staleness

This doc is stale when you judge a pick in it a poor fit for a case, such as one that took repeated retries, or the tier list misses an available model or names a retired one. Then suggest an update to the user, naming the role, the pick that failed, and the pick that worked.
