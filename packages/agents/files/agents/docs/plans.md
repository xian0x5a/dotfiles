# Execution Plans

- Execution plans live flat under `./plans/`.
- Use filename for plan identity; do not put a title in frontmatter.
- Record status in frontmatter as `status: open` or `status: done`. Note waiting states, such as awaiting user review or blocked on something, in Progress.

Plan body is not strict-schema validated. Use the shape that best fits the task, but keep the plan self-contained enough that another agent can continue from it.

Plans should cover, under clear headings when relevant:

- Goal.
- Intention.
- Scope & Constraints.
- Work Plan.
- Validation.
- Progress.
- Surprises & Discoveries.
- Decisions. Record rejected alternatives with their reason.
- Outcomes & Retrospective.

During implementation, update progress only for real checkpoints.

Close the plan in the commit that lands the work: fill Outcomes & Retrospective, move decisions worth keeping into `docs/`, then set `status: done`.

When work is abandoned or reverted, delete the plan in that commit. If the reason would stop the idea from being proposed again, record it in the relevant `docs/` note first; git history keeps the full plan.
