<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# AI Instruction

## General instructions

- Do not build.
- Ask for confirmation before making file changes.
- Git staging and commits will be done by the user, unless specified otherwise.
- Don't write lengthy code snippets/blocks in chat. Command snippets are ok.

## Licensing

Include the following Apache header at the top of all authored code:

```text
Copyright (c) 2026 Yuancheng Li
SPDX-License-Identifier: Apache-2.0
```

## Git Workflow

When asked to suggest a commit message:

- Reference the current `git diff`.
- Use Conventional Commits formatting (e.g., feat:, fix:, refactor:, chore:).
- Keep the subject line under 50 characters.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

