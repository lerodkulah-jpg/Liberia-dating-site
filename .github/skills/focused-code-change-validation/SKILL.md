---
name: focused-code-change-validation
description: "Use when implementing or debugging a focused code change. Route from a concrete local anchor to a falsifiable hypothesis, make the smallest testable edit, and validate it with the narrowest executable check before widening scope."
argument-hint: "Describe the bug, requested behavior, or failing check and identify the nearest file or symbol."
user-invocable: true
---

# Focused Code Change Validation

## Purpose

Turn a vague or localized implementation request into a small, evidence-driven code change. Preserve existing conventions, avoid broad exploration, and finish with an executable validation result.

## When To Use

- Fixing a localized bug or failing test
- Implementing a small behavior change near an existing file, symbol, route, or component
- Diagnosing a compile, typecheck, lint, or runtime failure with a known entry point
- Reviewing a nearby implementation before changing it

## Procedure

1. Identify the strongest local anchor: a named file, symbol, failing command, test, user-visible behavior, or nearby call site.
2. Read only the surrounding code needed to identify the controlling path. If the anchor only wires or forwards data, follow one nearby hop to the code that computes, mutates, or controls the behavior.
3. State one falsifiable hypothesis about the current behavior and one cheap check that could disconfirm it.
4. Choose the smallest edit that tests the hypothesis. Preserve local APIs, naming, formatting, and established helpers. Avoid unrelated refactors.
5. Apply the edit.
6. Immediately run the narrowest available executable validation for the touched behavior. Prefer, in order:
   - the failing or behavior-scoped check
   - a focused test
   - a narrow compile, typecheck, or lint command
   - a diff inspection only when no executable check is available
7. Interpret the result before expanding scope:
   - If it supports the hypothesis but exposes a local defect, repair the same slice and rerun the same check.
   - If it falsifies the hypothesis, follow one nearby hop to the more direct controller and form a revised hypothesis.
   - If it is ambiguous, inspect one neighboring test or call site, then choose between a local repair and the one-hop move.
   - If it succeeds and the task is complete, stop. If adjacent edits are required, make one small follow-up and rerun focused validation.
8. Before finishing, report the changed files, the validation command or check, its outcome, and any remaining test gap or environmental blocker.

## Decision Rules

- Do not continue broad searching once the controlling path, hypothesis, discriminating check, and smallest plausible edit are known.
- Do not widen the scope between the first edit and its first focused validation unless a concrete blocker makes validation impossible.
- Do not revert unrelated user changes. Work with them unless they make the task impossible.
- Prefer the repository's existing framework and helper APIs over new abstractions.
- Keep comments rare and explanatory; do not narrate obvious code.
- If no clear workflow can be inferred, ask whether the desired result is workspace-scoped or personal and whether the user wants a checklist or a full workflow before creating a customization.

## Completion Criteria

The task is complete only when:

- The requested behavior is implemented at its controlling code path.
- The smallest relevant executable check has passed, or its unavailability is stated.
- No unrelated files or behavior were changed.
- The final report names the validation performed and any residual uncertainty.
