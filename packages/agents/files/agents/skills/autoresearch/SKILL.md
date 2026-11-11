---
name: autoresearch
description: Autonomous experiment loop that tries one idea at a time, keeps it only on a real measured win, and runs unattended until the stop condition. A generalization of karpathy/autoresearch.
disable-model-invocation: true
---

# Autoresearch

Run research as a **ratchet**: try one idea at a time against a metric, keep it only when it is a real win, set it aside otherwise, and repeat for hours while the human is away. Karpathy's autoresearch does this for LLM training (edit `train.py`, train for a fixed 5 minutes, read `val_bpb`); this skill carries the idea to any repo with a measurable goal.

## The contract

Find the repo's own research protocol first; it outranks this skill. Then settle these with the human and write them down in `autoresearch.md` at the repo root, where a resumed run will find them:

- the goal, the metric that measures it, and what must stay true whatever the metric says (e.g. tests pass, no look-ahead, a memory cap);
- what you may change, and the **referee**: the evaluation, data and budget that make experiments comparable;
- how a win is judged (below);
- where the record lives;
- when to stop.

Where the protocol says how to judge results, which data to hold out, who approves a read, or where findings go, the contract cites it.

Then run the baseline end to end while the human is still there, so whatever needs them (a permission, missing data, a login) shows up now; it also gives the baseline and its noise. Settling the contract and the baseline is the last time you ask the human anything.

## Principles

- **Autonomy.** The human is asleep or away, so the loop runs until the stop condition, never pausing to ask whether to continue. What only the human can decide (a read their protocol reserves for approval, a broken referee) waits in the record, and the loop moves on to what it can do. Keep run output in log files rather than your context, so the run lasts. When ideas run out, find more: mine past results, combine near-misses, invert failures, read the references the code cites, try something more radical.
- **Real wins only.** The ratchet only moves forward, so a false win becomes the bar for every later experiment. Two things make false wins. One is noise: the metric moves by chance between runs, seeds or samples. The other is search overfitting: hundreds of reads of the same data make some idea win by chance. Guard against both in a way that fits the metric, for example:
  - noisy timings: repeat a candidate and compare medians against their spread;
  - seeded training: vary the seed, since rerunning one seed measures nothing;
  - a statistic with a standard error: require a gain of about two standard errors;
  - search over one dataset: hold out data the loop never reads, and read it once at the stop.

  Simplicity is a win too: keep a change that removes code and holds the metric within noise; set aside a hair's gain that adds tangle.
- **A fixed referee.** A win comes from the idea, never from a changed evaluation, a bigger budget, or a broken constraint.
- **Every experiment leaves a record**, failures included: what was tried, the result, and what it teaches, with the code still retrievable, and in the repo's own ledgers too where its protocol keeps them. The record is your memory across context resets and the human's morning report, so keep it where neither a reset nor a cleanup erases it (e.g. a ledger under `~/.agents/artifacts/`, discarded commits parked under a git ref).

## At the stop

Report the baseline and the best, the number of experiments, the held-out read if any, what was kept and why, and the lessons from what failed. Merging is the human's call.
