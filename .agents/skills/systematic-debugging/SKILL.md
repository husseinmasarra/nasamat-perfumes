---
name: systematic-debugging
description: Jesse Vincent's Superpowers systematic debugging framework. Use whenever diagnosing bugs, UI glitches, build errors, state mismatches, or unexpected application behavior.
---

# Systematic Debugging Skill (Superpowers Framework)

A rigorous, evidence-based debugging methodology designed to find and eliminate the true root cause of any bug without guesswork or introducing regressions.

## The 4 Core Principles
1. **Never guess**: Every conclusion must be grounded in verified observations or logs.
2. **Reproduce before fixing**: If you cannot reproduce it, you cannot verify it is fixed.
3. **Isolate the root cause**: Do not patch symptoms. Find the exact mechanism that fails.
4. **Minimal, surgical fixes**: Change only what is necessary, then verify end-to-end.

---

## Phase 1: Problem Definition & Reproduction
1. **Define the Symptom**: State clearly what fails, what was expected, and under what conditions.
2. **Inspect Host Evidence**: Check browser screenshots, console errors, network requests, or terminal logs.
3. **Identify Triggers**: Determine the exact user actions or state mutations that trigger the issue.

---

## Phase 2: Root Cause Tracing
1. **Trace Data Flow**: Trace data from user input/state through handlers, hooks, and downstream rendering.
2. **Check Assumptions**:
   - Are types aligned? (e.g., string vs. number comparisons, undefined properties).
   - Are state updates synchronous or asynchronous?
   - Is there a stale closure in `useMemo`, `useEffect`, or callback handlers?
   - Is text contrast or CSS visibility causing invisible UI elements?
3. **Find the Fault Line**: Identify the single file and line range where reality diverges from expectation.

---

## Phase 3: Surgical Formulation
1. **Draft the Minimal Fix**: Plan a targeted replacement that directly addresses the root cause.
2. **Check for Ripple Effects**:
   - Will this break related components or parent views?
   - Does this respect existing RTL/Arabic layout and styling conventions?
   - Are build tools and TypeScript compilers satisfied (`npm run build`)?

---

## Phase 4: Verification & Regression Guard
1. **Run Full Build**: Verify compilation with `npm run build` or `tsc -b`.
2. **Test Reproduction Case**: Run automated browser tests or inspect the exact UI scenario.
3. **Verify Edge Cases**: Test with empty data, extreme values, and boundary states.
4. **Document Prevention**: Note why it failed so future changes do not re-introduce the flaw.
