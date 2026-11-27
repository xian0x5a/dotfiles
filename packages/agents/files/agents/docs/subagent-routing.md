# Subagent routing

Heuristic reference for routing each subagent by role to a model tier and effort. The parent may pick a higher tier for a listed role when the task needs it.

| Role                                                                     | Tier     | Effort        |
| ------------------------------------------------------------------------ | -------- | ------------- |
| Mechanical search, extraction, reformatting                              | small    | `low`         |
| Implementation or tests: instructions/plan cover it, or gaps are routine | standard | `medium`      |
| Implementation where gaps need expertise and errors may pass tests       | frontier | `high`        |
| Code review                                                              | frontier | `high`        |
| Final review of high-stakes changes; debugging without a lead            | apex     | `high`        |
| Advisor: second opinion on a decision                                    | apex     | `high` and up |

- Give review a tier at or above the implementation it checks: implementer mistakes get caught downstream, a reviewer's miss ships silently.
- Advisor and final review buy an independent read: prefer a model that differs from the parent's. Keep an advisor exchange short: a question in, an answer back.
- ML implementation and research (training, model design, experiments): prefer a non-Anthropic model that meets the tier; if an Anthropic model does it, prefer a non-Anthropic reviewer that meets the review tier.
- Running a smaller tier than listed: only a `⁺` model, with effort raised one level.
- Retry after a failure: first give the subagent a way to check its own work (a test, a build, a script) if it had none. Then one step up: raise effort while below `high`, otherwise move up a tier and drop effort one level. Effort buys more thought, a tier buys knowledge and skill: when the failure shows the model lacked those, move up a tier directly. Effort above `high` is the last resort, once apex at `high` has failed.
- Families without a level (e.g. no `max`): use the nearest; on a tie, round up.

## Tiers

Resolve a tier to an available model at delegation time (`orchestrator_capabilities` or the harness's model list).

| Tier       | Examples                         |
| ---------- | -------------------------------- |
| apex       | Fable                            |
| frontier   | Opus, Gemini Neon⁺               |
| standard   | Sonnet, Gemini Hydrogen          |
| small      | Haiku, GPT Luna, DeepSeek Flash⁺ |

`⁺` marks a model that can stand in for the tier above when effort is raised one level.

Apex models are the strongest at carrying out the hardest work and cost more per token than frontier. Reach for apex where frontier would need effort above `high`: past `high`, one more effort level costs about as much as the next tier and buys less.

## Staleness

This doc is stale when you judge a pick in it a poor fit for a case, such as one that took repeated retries; when a provider (subscription) already in the tier list offers a better pick than the one listed, such as Gemini 4 over Gemini 3; or when the list names a retired model. Then suggest an update to the user, naming the role, the pick that failed, and the pick that worked.
