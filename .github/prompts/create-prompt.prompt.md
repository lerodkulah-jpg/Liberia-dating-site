---
mode: agent
description: "Turn a repeatable task pattern into a reusable .prompt.md file for this workspace"
---

# Create a reusable prompt

## Purpose

Generalize a recurring task into a reusable prompt that can be invoked consistently in Copilot Chat, with clear inputs, workflow, and output expectations.

## What to extract from the conversation

Before writing the prompt, identify:

- the core task being done repeatedly
- the implicit inputs that usually matter, such as selected code, file type, project context, or stack
- the desired output style or format, such as summary, patch, test, checklist, or refactor plan
- any constraints, assumptions, or local conventions the task should respect

## Decision rules

- If the task pattern is clear, proceed without asking unnecessary questions.
- If the task is ambiguous, ask only the missing questions needed to finalize the prompt.
- Prefer a prompt that works with arguments or selected context rather than hardcoded assumptions when possible.
- Keep the prompt scoped to the intended use case, not a general-purpose helper.

## Required prompt structure

Create a .prompt.md file with:

1. Frontmatter that includes a clear name and description.
2. A concise purpose statement.
3. A section describing when to use the prompt.
4. A section listing required inputs, such as code selection, file path, or project context.
5. A step-by-step workflow for the agent.
6. A required output format.
7. Constraints or guardrails that keep the prompt effective and safe.
8. Example invocations or usage patterns where helpful.

## Workflow

1. Review the ongoing task pattern and identify the real repeated behavior.
2. Map the task to a reusable pattern instead of one-off instructions.
3. Decide whether the prompt should take arguments, rely on selected code, or assume workspace context.
4. Draft the prompt with explicit steps, constraints, and expected output.
5. Review the draft for ambiguity, missing inputs, or over-generalization.
6. Ask the user about the most uncertain part if needed.
7. Finalize the prompt and summarize what it does, how to invoke it, and what related customizations would be useful next.

## Quality bar

A strong prompt should be:

- specific enough to be useful without a long setup
- constrained enough to avoid wandering or broad exploration
- structured enough to produce predictable output
- grounded in the project context and repo conventions
- concise, but not so sparse that it leaves unclear decisions unresolved

## Output expectation

After finishing, provide:

- a short explanation of what the prompt does
- the prompt file location
- a brief example of how to invoke it
- one or two related prompt ideas that could be created next

## Example prompt content pattern

Use this shape when writing the final .prompt.md:

- Title and purpose
- When to use
- Inputs
- Procedure
- Constraints
- Output format
- Example usage

This prompt is intended to turn repeatable work into a reusable Copilot workflow rather than documenting one-off tasks.
