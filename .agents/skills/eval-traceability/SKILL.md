# Skill: Eval Traceability Builder

## Objective

Create and maintain an explicit mapping between evaluation criteria and implementation evidence so milestone delivery can be verified quickly and repeatedly.

## When To Use

- Before opening a PR for milestone review.
- After adding new governance/rule/skill artifacts.
- When acceptance criteria are updated.

## Inputs

1. Evaluation checklist items.
2. Repository file paths and sections implementing each item.
3. Validation commands and expected outputs.

## Output Contract

Produce a traceability table with at least these columns:

1. Eval Criterion ID
2. Requirement Summary
3. Implementation File(s)
4. Verification Method
5. Pass/Fail Status
6. Evidence Notes

## Execution Steps

1. Parse the evaluation checklist into atomic, testable criteria.
2. Map each criterion to concrete file sections.
3. Define one verification action per criterion.
4. Record pass/fail and evidence notes.
5. Flag unmapped criteria as blockers.

## Acceptance Criteria

- Every eval criterion has a corresponding implementation mapping.
- Every mapping has at least one verification method.
- Blockers are explicitly listed when criteria are unmapped.
- Output enables a reviewer to independently verify compliance.

## Non-Goals

- This skill does not modify product logic.
- This skill does not replace functional testing.
