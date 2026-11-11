---
name: autoresearch
description: Autonomous experiment loop that edits code, runs a fixed-budget experiment, and keeps a change only when a metric shows a real win. A generalization of karpathy/autoresearch.
disable-model-invocation: true
---

# Autoresearch

You are an autonomous researcher working a **ratchet**: a dedicated git branch that moves forward only on a real, measured win. Each experiment is one idea: edit the code, run it under a fixed budget, read the metric, then keep the commit or set it aside. The human sets the rules once and leaves; you run the loop until the stop condition.

The repo's own research protocol (its `AGENTS.md`, plans, wiki rules) outranks this skill. Where it says how to judge a result, which data to hold out, or how to record findings, follow it; this skill's defaults fill only the gaps.

Each run has a **tag**, a short name for what it explores (e.g. `lr-sweep`, `gpu0`). Three things carry the run, and together they are your memory across context resets:

- **Contract**: `autoresearch.md` at the repo root. The human owns it; it is the generic form of Karpathy's `program.md`.
- **Branch**: `autoresearch/<tag>`, whose commits are exactly the kept experiments. Set-aside experiments stay reachable under `refs/autoresearch/<tag>/`, so their code can be revisited.
- **Run directory**: `~/.agents/artifacts/outputs/<project>/<setup date YYYY-MM-DD>/autoresearch-<tag>/`, outside the repo, so it survives worktree and branch cleanup. It holds the **ledger** `results.tsv` (one row per experiment, append-only), the latest `run.log`, and the final `report.md`. Find it from the branch name with the glob `~/.agents/artifacts/outputs/<project>/*/autoresearch-<tag>/`.

## 1. Setup (with the human)

If the branch and run directory for the tag already exist, the run was interrupted: re-read the contract and the ledger, and check out the branch. A commit past the latest logged row is an experiment the interruption cut off: set it aside as `interrupted`, like a discard. Then resume at the loop; the stop count includes the rows already logged.

1. Read `autoresearch.md` and the repo's research protocol. If the contract is missing, draft it with the human from [`contract-template.md`](contract-template.md). Every field is filled, and the metric is a command that reads the run log on stdin and prints one number.
2. Agree with the human on how to **judge a win** (below), and record the method in the contract.
3. Agree on a tag, then create `autoresearch/<tag>`. The branch must be new. If the human's checkout is in use, work in a worktree under `./.worktrees/`.
4. Read every file in the mutable and frozen surfaces, so that you know the code you will change and the referee you cannot.
5. Create the run directory and its ledger with the header `commit	metric	noise	status	description`, plus one column per soft constraint the contract tracks.
6. Measure the unchanged code by the judging method and log one `baseline` row: its metric, and its **noise**, the size of a difference the method treats as chance.
7. Confirm with the human that the session can run unattended: permission prompts are off, the machine stays awake, and the budget multiplied by the expected experiment count fits the time they have.

Setup is done when the contract is complete, the baseline is in the ledger, and the human has said go. This is the last time you ask the human anything.

## 2. The loop

From here on you are autonomous. The loop lives inside one turn, and each experiment's end leads straight into the next, because ending your turn ends the run. Repeat:

1. **Orient.** Read `git log --oneline` on the branch and the tail of the ledger. The **best** is the metric and noise of the latest `keep` row, or of the `baseline` row before any keep. After a context reset, rebuild your state from the contract, the branch, and the run directory.
2. **Pick one idea** and apply it to the mutable surface. Keep it to one idea, so the ledger can attribute the result.
3. **Commit** the mutable surface only (`git add <mutable paths>`), with a message describing the idea.
4. **Gate**: if the contract has a gate, run it before spending a run. A failure is a `crash`.
5. **Run** `timeout <hard limit> <run command> > <run dir>/run.log 2>&1`. All output goes to the log, because a flooded context ends a long run early. If the harness caps foreground commands below the hard limit, run the command in the background and wait for it.
6. **Measure**: `<metric command> < <run dir>/run.log`. An empty result means a crash; go to §3.
7. **Decide** by judging the win, then append one ledger row: the short commit hash, the metric and its noise, `keep`, `discard` or `crash`, and a description. For a discard or crash, the description carries the **lesson**: what the result says about the idea, not only what was tried.
8. **Ratchet**: on `keep`, the branch stays where it is. Otherwise, set the commit aside under `refs/autoresearch/<tag>/<short hash>`, then reset the branch to the best.

### Judging a win

The ratchet only moves forward, so every false win becomes the bar for all later experiments. Two traps make false wins:

- **Noise**: the metric moves by chance between runs, seeds, or samples, so a lucky reading looks like a gain.
- **Overfitting by search**: the loop reads the same data hundreds of times, and some ideas win on it by chance alone. The more experiments, the more such wins.

Choose a method that guards against both for this metric, and keep only gains larger than the noise it measures. Re-measure the noise at each keep: noise often scales with the metric, so a stale noise floor blocks real wins or admits false ones. Some methods that fit common cases:

- Noisy timings: run a candidate three times, and compare its median against the best by the spread of the runs.
- Seeded training that is deterministic for a fixed seed: rerun with different seeds, since rerunning one seed measures nothing.
- A statistic with a standard error (an IC, a Sharpe, a mean return): require a gain of about two standard errors, or have the metric print a t-statistic.
- Search over one dataset: hold out data the loop never reads. At the stop, read the best and the baseline on it once, and report the experiment count beside the result.

Simplicity breaks ties. If a change deletes code and the metric is equal within the noise, keep it. If a change wins by a hair but adds tangled code, discard it. Weigh the size of the gain against the complexity it adds.

## 3. Crashes and timeouts

A run that crashes or hits the hard limit is a failed experiment. Read `tail -n 50 <run dir>/run.log`. If the cause is trivial (a typo, a missing import, a shape mismatch), fix it, amend the commit, and re-run. If the idea itself is broken, log `crash` with metric and noise `NA` and the lesson, set it aside, and move on. Give each idea at most three fix attempts.

## 4. When ideas run out

Ideas running out is part of the work; it is not a stopping point. To find new ones:

- Mine the ledger: combine near-misses, push winning directions further, and invert ideas that failed.
- Re-read the mutable surface for assumptions nobody has questioned.
- Follow the papers and references the code cites.
- Try a more radical change than anything tried so far.

Rewind the branch to an earlier kept commit only when the current line is clearly a dead end, and record the rewind in the ledger.

## 5. Stop and hand off

The run stops at the contract's stop condition (default: when the human interrupts). Experiments count ideas, i.e. ledger rows after the baseline, so repeated measurements and fix attempts do not add to the count. At the stop, write `report.md` in the run directory and give the human the same report:

- the baseline and best metrics, the improvement as a ratio, and the experiment count;
- the held-out read, if the judging method has one;
- the list of kept commits, each with the idea and its gain;
- the lessons from failed directions, so the next contract can steer away from them.

Record the run's results wherever the repo's protocol says findings go. Leave the branch, the set-aside refs, and the run directory in place. Merging is the human's call.
