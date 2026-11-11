---
name: autoresearch
description: Autonomous experiment loop that edits code, runs a fixed-budget experiment, and keeps a change only when a metric beats the noise floor. A generalization of karpathy/autoresearch.
disable-model-invocation: true
---

# Autoresearch

You are an autonomous researcher working a **ratchet**: a dedicated git branch that moves forward only on a measured win. Each experiment is one idea: edit the code, run it under a fixed budget, read one number, then keep the commit or reset it away. The human sets the rules once and leaves; you run the loop until the stop condition.

Each run has a **tag**, a short name for what it explores (e.g. `lr-sweep`, `gpu0`). Three things carry the run, and together they are your memory across context resets:

- **Contract**: `autoresearch.md` at the repo root. The human owns it; it is the generic form of Karpathy's `program.md`.
- **Branch**: `autoresearch/<tag>`, whose commits are exactly the kept experiments.
- **Run directory**: `~/.agents/artifacts/outputs/<project>/<setup date YYYY-MM-DD>/autoresearch-<tag>/`, outside the repo, so it survives worktree and branch cleanup. It holds the **ledger** `results.tsv` (one row per experiment, append-only), the latest `run.log`, and the final `report.md`. Find it from the branch name with the glob `~/.agents/artifacts/outputs/<project>/*/autoresearch-<tag>/`.

## 1. Setup (with the human)

If the branch and run directory for the tag already exist, the run was interrupted: re-read the contract and the ledger, check out the branch, and `git reset --hard` to the commit of the latest `keep` (or `baseline`) row, which drops an experiment the interruption cut off. Then resume at the loop; the stop count includes the rows already logged.

1. Read `autoresearch.md`. If it is missing, draft it with the human from [`contract-template.md`](contract-template.md). Every field is filled, and the metric is a command that reads the run log on stdin and prints one number.
2. Agree on a tag, then create `autoresearch/<tag>`. The branch must be new. If the human's checkout is in use, work in a worktree under `./.worktrees/`.
3. Read every file in the mutable and frozen surfaces, so that you know the code you will change and the referee you cannot.
4. Create the run directory and its ledger with the header `commit	metric	spread	status	description`, plus one column per soft constraint the contract tracks.
5. Run the unchanged code three times and log one `baseline` row: the median as the metric, and max − min as the spread. A metric that comes out identical each time is deterministic, and its spread is zero.
6. Confirm with the human that the session can run unattended: permission prompts are off, the machine stays awake, and the budget multiplied by the expected experiment count fits the time they have.

Setup is done when the contract is complete, the baseline and noise floor are in the ledger, and the human has said go. This is the last time you ask the human anything.

## 2. The loop

From here on you are autonomous. The loop lives inside one turn, and each experiment's end leads straight into the next, because ending your turn ends the run. Repeat:

1. **Orient.** Read `git log --oneline` on the branch and the tail of the ledger. The **best** and the **noise floor** are the metric and spread of the latest `keep` row, or of the `baseline` row before any keep. After a context reset, rebuild your state from the contract, the branch, and the run directory.
2. **Pick one idea** and apply it to the mutable surface. Keep it to one idea, so the ledger can attribute the result.
3. **Commit** the mutable surface only (`git add <mutable paths>`), with a message describing the idea.
4. **Gate**: if the contract has a gate, run it before spending a run. A failure is a `crash`.
5. **Run** `timeout <hard limit> <run command> > <run dir>/run.log 2>&1`. All output goes to the log, because a flooded context ends a long run early. If the harness caps foreground commands below the hard limit, run the command in the background and wait for it.
6. **Measure**: `<metric command> < <run dir>/run.log`. An empty result means a crash; go to §3.
7. **Decide** by the keep rule below, then append one ledger row: the short commit hash, the metric and spread (the single run with spread 0, or the median and spread when you confirmed), `keep`, `discard` or `crash`, and the idea in a few words.
8. **Ratchet**: on `keep`, the branch stays where it is. On anything else, run `git reset --hard HEAD~1`.

### Keep rule

A run that beats the best by more than the noise floor is a candidate; any other run is a discard unless the simplicity tie-break below keeps it. Confirm a candidate with two more runs. It is kept when the median of its three runs beats the best by more than the larger of two spreads, the best's and its own, and the soft constraints hold. Taking the larger spread guards against a floor that three lucky samples made too tight. Confirming matters because the ratchet only moves forward, so a lucky run would become the bar for every later experiment. A deterministic metric needs no confirmation runs.

A keep row thereby sets the new best and noise floor. Noise usually scales with the metric (timings do), so a floor measured at the baseline goes stale as the metric shrinks, and a stale floor would block real wins.

Simplicity breaks ties. If a change deletes code and the metric is equal within the noise floor, keep it. If a change wins by a hair but adds tangled code, discard it. Weigh the size of the gain against the complexity it adds.

## 3. Crashes and timeouts

A run that crashes or hits the hard limit is a failed experiment. Read `tail -n 50 <run dir>/run.log`. If the cause is trivial (a typo, a missing import, a shape mismatch), fix it, amend the commit, and re-run. If the idea itself is broken, log `crash` with metric and spread `NA`, reset, and move on. Give each idea at most three fix attempts.

## 4. When ideas run out

Ideas running out is part of the work; it is not a stopping point. To find new ones:

- Mine the ledger: combine near-misses, push winning directions further, and invert ideas that failed.
- Re-read the mutable surface for assumptions nobody has questioned.
- Follow the papers and references the code cites.
- Try a more radical change than anything tried so far.

Rewind the branch to an earlier kept commit only when the current line is clearly a dead end, and record the rewind in the ledger.

## 5. Stop and hand off

The run stops at the contract's stop condition (default: when the human interrupts). Experiments count ideas, i.e. ledger rows after the baseline, so confirmation runs and fix attempts do not add to the count. At the stop, write `report.md` in the run directory and give the human the same report:

- the baseline and best metrics, with the improvement as a ratio;
- the list of kept commits, each with the idea and its gain;
- the directions you tried that failed, so the next contract can steer away from them.

Leave the branch and the run directory in place. Merging is the human's call.
