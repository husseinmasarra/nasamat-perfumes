---
name: task-planner
description: Superpowers architectural task planning and execution framework. Use whenever designing multi-step features, refactoring subsystems, or structuring complex technical workflows.
---

# Task Planner Skill (Superpowers Framework)

A rigorous architectural planning protocol ensuring complex features, refactors, and technical workflows are decomposed into verifiable, incremental milestones with zero regressions.

## Core Tenets
1. **Plan Before Execution**: Understand the full problem space, dependencies, and state boundaries before editing code.
2. **Atomic Steps**: Each task should represent a small, cohesive, testable increment.
3. **Continuous Verification**: Verify after every step (type checks, builds, or browser assertions) before proceeding to the next.
4. **Preserve Integrity**: Protect existing working functionality and luxury design aesthetics at all times.

---

## 5-Stage Planning Protocol

### Stage 1: Architectural Discovery & Requirements
- Read relevant component files, state definitions, and types.
- Identify all touchpoints (e.g., storefront, admin modules, POS, calculator, database).
- Clarify data flow: Where is data created, modified, persisted, and displayed?

### Stage 2: Milestone Decomposition
- Divide the overall goal into 3-5 distinct, non-overlapping milestones:
  - **Milestone 1: Data Model & Types**: Define interfaces, default states, and helper logic.
  - **Milestone 2: Core Logic & Handlers**: Implement calculations, storage hooks, and mutations.
  - **Milestone 3: UI Integration**: Build customer or admin interfaces with responsive, luxury styling.
  - **Milestone 4: Cross-Module Propagation**: Ensure data flows cleanly to POS, invoices, and settings.
  - **Milestone 5: End-to-End QA**: Test in browser, verify RTL Arabic layout, and run production builds.

### Stage 3: Risk Assessment & Mitigation
- Identify breaking risks:
  - Will schema changes invalidate user `localStorage` or backend tables?
  - Does new CSS conflict with dark mode or luxury amber/gold palette?
  - Are number/string conversions safe against `NaN` or `undefined`?

### Stage 4: Execution Checklist
- Work down the checklist sequentially.
- Mark each item complete only after verifying it locally.
- Never batch multiple risky changes together without an intermediate build check.

### Stage 5: Post-Implementation Audit
- Run `npm run build` to confirm zero TypeScript errors.
- Confirm end-to-end user journeys (e.g., add to cart, compounding bespoke fragrance, checkout, admin print).
- Ensure zero regression on existing features.
