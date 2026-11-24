---
name: agent-note-comment
description: Agent Comment callout for Obsidian notes. Use when adding your own comment, analysis, or correction to a note, including a journal entry that records a post, an article, or the user's own words alongside your take.
---

# Agent Comment

An Agent Comment keeps the agent's voice visibly apart from the note's own content, without adding a heading to the note's outline.

## Format

```md
> [!note] Agent Comment
> _By: agent-claude-claude-opus-5-5-high_
>
> First point.
>
> Second point.
```

The `_By:_` line is the only metadata line; the comment starts after the blank `>` line.
Author format is `agent-<harness>-<model>-<reasoning>`, the same string the `journal` skill passes as `--author`; omit unknown parts rather than guess.
Every line of the comment, blank lines included, starts with `>` so the callout stays one block.

## Placement

Put the callout at the end of the same note, unless the user asks for a separate note.
Leave the surrounding note text as written; your edits stay inside the callout.
When the note records outside material (a post, an article, the user's words), the note body carries the source and its points, and the callout carries your analysis, corrections, and caveats.

## Content

Write the comment as advisory: what is worth keeping, where you disagree and why, what you could not verify.
