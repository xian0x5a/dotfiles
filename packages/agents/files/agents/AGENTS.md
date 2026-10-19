## Communication

- Intention oriented; highlight intention over technical jargon.
- Explain a theory through intuition.
- Reduce noise, emphasise what matters
- Format long responses into headed sections; put the answer first, without a heading.
- Prioritize time pressure over comfort. Do not sugarcoat. Apply direct, explicit pressure when I am avoiding action, looping, or reopening settled decisions. If I am deliberately weighing a trade-off for something meaningful, respect the process.
- Requests for evaluation or advice authorize investigation and recommendations, not implementation.

## Instruction Precedence

- For workflow preferences: explicit user instructions > AGENTS.md > tool guidance > skills.
- When an instruction blocks requested work, identify the file and rule, explain the conflict, and continue unblocked work.

## Disk Operations

- Use soft deletion instead of `rm`, e.g. `trash-put` (Linux)
- Avoid recursive searches of large directories like `$HOME`; bound any that are necessary with a timeout

## Storage Locations

- For disposable files, probes, or transient scratch data on this machine, prefer `/tmp` or `$XDG_RUNTIME_DIR` when appropriate instead of writing into regular project or user directories.
- For experimenting with source code, you can pull the repo to `~/sandbox` after checking its existence. If it exists, pull the latest changes first.
- For agent-managed tools, helper artifacts, small task-local environments, or temporary installs needed to complete a task, prefer `~/.agents/tools`.
- Store durable agent artifacts under `~/.agents/artifacts/`; use `~/.agents/artifacts/outputs/<project>/YYYY-MM-DD/<task-slug>/` for generated task outputs, including research reports and investigation evidence.
- Use a consistent project name across branches and worktrees; use `_general` for work without a project or spanning multiple projects.
- Use repo-local ignored artifact directories when project commands generate or consume those files, following the project's conventions.
- Store maintained project knowledge in the repo's `./docs/` directory: accepted decisions, current architecture, supported behavior, and reusable guidance. Distill accepted findings into docs; retain evidence in artifacts.

## Computer Use

- Avoid stealing focus from user's current active window unless focus is genuinely needed to finish user's requests

## Documentation

- document for features or techniques of a project, that worth mention or review
- Use portable paths in docs.
- Use an ExecPlan (`~/.agents/docs/plans.md`), or another tracker that fits better, when work crosses a context boundary: delegated to subagents or likely to outlive one context window. Write it before the first code edit.

## Problem Solving

- Do not blindly patch for a narrow case, especially if the patch seems over-complicated. Take a chance to see if a simpler and generic approach can be taken as a fresh design
- For consequential designs, challenge the proposal with a concrete failure case and address it before implementation.
- Use first principles thinking
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- When choosing between viable solutions, use a scored weighted decision matrix: criteria from the user's goals and constraints, numeric weights summing to 100%, each option scored 1–5 per criterion, and a weighted total per option. Recommend the top total, or justify picking another.

## Legacy Handling

- Within the requested change, remove superseded code and documentation rather than adding compatibility paths. Ask before retaining compatibility behavior.
- Keep migration handling separate from normal runtime logic. Propose unrelated cleanup separately.

## Coding

- Choose the simplest implementation that fully meets the current requirements
- Avoid speculative abstractions, configuration, and indirection.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Reference latest doc with web access.
- Use descriptive, intention-revealing names; prioritize readability over brevity
- Prefer DRY code
- Add concise comments when they clarify non-obvious or confusing logic, or make review easier
- Mandatory comment cases: when a change may look arbitrary or unjustified during later review because the reason is not obvious from local context. In those cases, comment the reason, constraint, or symptom being handled, not just what the code does
- Declarative over imperative. Prefer declarative style when it improves readability and maintainability. Encapsulate imperative logic in small, well-named functions, and keep core logic primarily compositional
- Keep components modular and concerns clearly separated.
- During implementation, separate enabling refactors from opportunistic changes. Small local refactors are OK if they directly support the requested change. For adjacent cleanup, robustness improvements, behavior changes, or unrelated bug fixes: do not include them silently; track them as follow-ups (see GitHub) or ask before expanding scope.
- Failed fast, do not abuse fallback cases and try-catch blocks in core logic for hiding the issues
- Keep environment-specific and user-configurable values out of source. Use named constants for meaningful fixed values.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Do not let review feedback expand the task beyond the user's original goal. Address real shortcomings, but avoid scope creep.
- If a solution is still not ready after three or more rounds of review, reconsider whether a better solution exists.

## Verification

Applies to non-trivial changes.

- Match verification cost to the change. When a test, fixture, or checker would outweigh the change it guards, verify by running the change and checking its output, and say so in the handoff.
- When a change warrants tests, have an independent agent write them.
- When an independent test fails, decide whether the code or the test misreads the requirement, and fix that side.
- Then have another independent agent review the final change before shipping.
- Test observable behavior and stable contracts, not incidental implementation details. Tests should survive behavior-preserving refactors and rewrites; test internals only when they encode intentional, stable invariants.
- Size tests to the change's risk, not its surface: one test per distinct behavior, at the highest stable layer that exposes it. Avoid overlapping tests. Prefer table-driven tests for input validation.
- For bug fixes that warrant a test, have the independent agent write the regression test before the fix and see it fail for the expected reason; it replaces the post-fix test.
- Use bounded test timeouts appropriate to the operation; distinguish slow tests from hung tests.
- Run tests scoped to the change by default. Run the full suite only when the blast radius is wide, and if it is slow (>10s), only once when ready to finish.

## Context Efficiency

- Save tokens without reducing accuracy or skipping needed verification.
- Prefer targeted inspection over full-file reads

## Subagent Policy

- Delegate when it saves time, improves quality, or keeps low-value intermediate details out of the main context.
- Use an independent agent for an outside perspective, such as a second opinion.
- Set subagent timeouts or budgets only when requested or required; keep them generous.
- Avoid multiple agents working on tasks with overlapping scopes, which can cause undesired high context inefficiency.

## Python Related

- Use `uv` for python package management
- Use `uv run` for running python scripts

## Git

- use semantic commit messages
- prefer a local worktree dir in `./.worktrees/` if unspecified when a worktree is needed
- Rebase onto the base before merging.
- PR branches: merge with a merge commit (`gh pr merge --merge`) so history links to the PR, unless the repo restricts merge methods.
- Branches without a PR: fast-forward; use `--no-ff` only for large multi-concern branches, for a one-step revert.

### Implementation commits

- Commit at meaningful boundaries.
- Commit all task-owned changes and report the new commit hashes before handoff for easier review.

### GitHub

- Link parent/sub-issues natively in GitHub when both repositories are owned by the user.
- Silent references (no timeline events on repositories not owned by the user): only when the user asks; follow `~/.agents/docs/github-silent-refs.md`.
- Out-of-scope review findings: in user-owned repos with issues enabled, file an issue per verified unfixed finding without asking; dedupe first, include evidence, list links in the handoff. Elsewhere, or if speculative, ask.

## CLI Tools

- `gh` for github

## Skill Management

- Use the `find-skills` skill to discover relevant skills when possible
- Use `npx skills` to manage skills when possible
