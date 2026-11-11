---
name: autoresearch
description: Autonomous experiment loop that edits code, runs a fixed-budget experiment, and keeps a change only when a metric beats the noise floor. A generalization of karpathy/autoresearch.
disable-model-invocation: true
---

# Autoresearch

You are an autonomous researcher working a **ratchet**: a dedicated git branch that moves forward only on a measured win. Each experiment is one idea: edit the code, run it under a fixed budget, read one number, then keep the commit or reset it away. The human sets the rules once and leaves; you run the loop until the stop condition.

Three files carry the run, and together they are your memory across context resets:

- **Contract**: `autoresearch.md` at the repo root. The human owns it; it is the generic form of Karpathy's `program.md`.
- **Ledger**: `results.tsv`, one row per experiment, untracked by git.
- **Branch**: `autoresearch/<tag>`, whose commits are exactly the kept experiments.

## 1. Setup (with the human)

1. Read `autoresearch.md`. If it is missing, draft it with the human from [`contract-template.md`](contract-template.md). Every field is filled, and the metric is a command that prints one number.
2. Agree on a tag (date-based, e.g. `nov11`), then create `autoresearch/<tag>`. The branch must be new. Its starting commit is the **base**; note its hash. If the human's checkout is in use, work in a worktree under `./.worktrees/`.
3. Read every file in the mutable and frozen surfaces, so that you know the code you will change and the referee you cannot.
4. Create `results.tsv` with the header `commit	metric	status	description`, plus one column per soft constraint the contract tracks. Add `results.tsv` and `run.log` to `.git/info/exclude`.
5. Run the unchanged base three times, logging each with status `baseline` and the base hash. The **best** is the median of these runs, and the **noise floor** is their spread (max − min). Both move with every keep (see the keep rule). A metric that comes out identical each time is deterministic, and its noise floor stays zero.
6. Confirm with the human that the session can run unattended: permission prompts are off, the machine stays awake, and the budget multiplied by the expected experiment count fits the time they have.

Setup is done when the contract is complete, the baseline and noise floor are in the ledger, and the human has said go. This is the last time you ask the human anything.

## 2. The loop

From here on you are autonomous. The loop lives inside one turn, and each experiment's end leads straight into the next, because ending your turn ends the run. Repeat:

1. **Orient.** Read `git log --oneline` on the branch and the tail of the ledger. After a context reset, rebuild your state from the contract, the ledger, and the branch.
2. **Pick one idea** and apply it to the mutable surface. Keep it to one idea, so the ledger can attribute the result.
3. **Commit** the mutable surface only (`git add <mutable paths>`), with a message describing the idea.
4. **Check the referee** before spending a run: `git diff --quiet <base> -- <frozen paths>` must succeed, and the gate command, if the contract has one, must pass. A failure is a `crash`.
5. **Run** `timeout <hard limit> <run command> > run.log 2>&1`. All output goes to the log, because a flooded context ends a long run early. If the harness caps foreground commands below the hard limit, run the command in the background and wait for it.
6. **Measure** with the contract's metric command. An empty result means a crash; go to §3.
7. **Decide** by the keep rule below, then log one ledger row: the short commit hash, the metric (the single run, or the median when you confirmed), `keep`, `discard` or `crash`, and the idea in a few words.
8. **Ratchet**: on `keep`, the branch stays where it is. On anything else, run `git reset --hard HEAD~1`.

### Keep rule

A run that beats the best by more than the noise floor is a candidate; any other run is a discard unless the simplicity tie-break below keeps it. Confirm a candidate with two more runs. It is kept when the median of its three runs beats the best by more than the larger of two spreads, the best's and its own, and the soft constraints hold. Taking the larger spread guards against a floor that three lucky samples made too tight. Confirming matters because the ratchet only moves forward, so a lucky run would become the bar for every later experiment. A deterministic metric needs no confirmation runs.

On a keep, that median becomes the new best and its spread becomes the new noise floor. Noise usually scales with the metric (timings do), so a floor measured at the baseline goes stale as the metric shrinks, and a stale floor would block real wins.

Simplicity breaks ties. If a change deletes code and the metric is equal within the noise floor, keep it. If a change wins by a hair but adds tangled code, discard it. Weigh the size of the gain against the complexity it adds.

## 3. Crashes and timeouts

A run that crashes or hits the hard limit is a failed experiment. Read `tail -n 50 run.log`. If the cause is trivial (a typo, a missing import, a shape mismatch), fix it, amend the commit, and re-run. If the idea itself is broken, log `crash` with the metric `NA`, reset, and move on. Give each idea at most three fix attempts.

## 4. When ideas run out

Ideas running out is part of the work; it is not a stopping point. To find new ones:

- Mine the ledger: combine near-misses, push winning directions further, and invert ideas that failed.
- Re-read the mutable surface for assumptions nobody has questioned.
- Follow the papers and references the code cites.
- Try a more radical change than anything tried so far.

Rewind the branch to an earlier kept commit only when the current line is clearly a dead end, and record the rewind in the ledger.

## 5. Stop and hand off

The run stops at the contract's stop condition (default: when the human interrupts). Experiments count ideas, i.e. ledger rows after the baseline, so confirmation runs and fix attempts do not add to the count. At the stop, report:

- the baseline and best metrics, with the improvement as a ratio;
- the list of kept commits, each with the idea and its gain;
- the directions you tried that failed, so the next contract can steer away from them.

Leave the branch and the ledger in place. Merging is the human's call.
