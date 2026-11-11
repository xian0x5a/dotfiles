# Autoresearch contract template

Copy this file to `autoresearch.md` at the repo root and fill in every field with the human. The human edits this file; the agent edits only the mutable surface.

```markdown
# Autoresearch: <short title>

## Goal
<One sentence: what "better" means here and why it matters.>

## Run
- Command: `<e.g. uv run train.py>`
- Budget: <e.g. 5 min of training per experiment>
- Hard limit: <e.g. 10 min wall clock; a longer run is killed and logged as a crash>

## Metric
- Command: `<e.g. grep '^val_bpb:' | awk '{print $2}'>`; it reads the run log on stdin and prints one number
- Direction: <lower | higher> is better

## Mutable surface
- <files or directories the agent may change>

## Frozen surface
- <evaluation, data loading, benchmarks, tests: everything the metric depends on but the agent must leave alone>

## Gate
- <optional command that must exit 0 for an experiment to be kept, e.g. `uv run pytest -q`; write "none" if there is none>

## Soft constraints
- <secondary numbers to track in the ledger, with how far each may regress for a clear win, e.g. "peak memory: up to +10%">

## Stop
- <until interrupted | after N experiments | at HH:MM>

## Notes
- <directions to try or avoid, known dead ends, references worth reading>
```

## Before you sign off on a contract

- **The budget lives on the frozen side.** If more time or more compute could buy a better metric, the run command itself must enforce the budget. For example, `train.py` stops at a fixed wall clock, or the benchmark counts a fixed number of iterations. Otherwise the agent wins by running longer. If the budget cannot be moved to the frozen side, put the time into the metric itself.
- **The metric command cannot be fooled.** It must read a number that frozen code produced. A metric the mutable surface prints is a metric the agent can rewrite.
- **The gate guards correctness.** For performance work, the gate keeps a faster but wrong program off the ratchet. If correctness matters and the contract has no gate, a fast program that gives wrong answers will pass.
- **One experiment fits inside the human's absence.** About 12 experiments per hour at 5 minutes each gives about 100 overnight. A 1-hour budget gives about 8.
