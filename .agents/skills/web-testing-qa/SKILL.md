---
name: web-testing-qa
description: Automated web testing, visual regression audit, and RTL Arabic responsiveness verification. Use whenever validating UI changes, customer journeys, form flows, or multi-viewport rendering.
---

# Web Testing & Visual QA Skill

Comprehensive quality assurance protocol for modern luxury web applications, focusing on automated browser verification, RTL (Right-to-Left) Arabic layouts, mobile touch experiences, and zero-defect regression testing.

## Core QA Mandates
1. **Never Assume Visual Correctness**: Always inspect actual rendered UI states via headless browser or visual snapshots.
2. **RTL Arabic Bidi Verification**: Ensure icons, chevrons, labels, text padding, and numerical inputs align naturally for Arabic readers without horizontal overflow.
3. **End-to-End User Journeys**: Verify complete flows from start to finish (e.g., compounding an oil blend -> adding to cart -> checkout modal -> receipt generation).
4. **Console & Network Cleanliness**: Zero unhandled exceptions, zero 404 image assets, and zero broken links.

---

## 4-Tier Verification Matrix

### Tier 1: Layout & Viewport Resilience
- **Desktop (1920x1080 & 1440x900)**: Multi-column grids, sidebar navigation, table data density.
- **Tablet (768x1024)**: Responsive wrapping, touch target sizing, overlay drawers.
- **Mobile (375x812 - iPhone X/13/14)**:
  - Bottom navigation bar visibility.
  - Sticky cart bar does not occlude buttons or inputs.
  - Full-screen modal dismissibility.
  - No horizontal scrolling (`overflow-x: hidden`).

### Tier 2: RTL & Typography Integrity
- Text direction: `dir="rtl"` applied at document root or primary container.
- Mirrored UI components:
  - Back buttons point right (`ChevronRight` in RTL represents 'back').
  - Forward buttons point left (`ChevronLeft` in RTL represents 'next').
  - Currency symbols (`$`, `د.ع`) positioned consistently next to amounts.
  - Sliders and progress bars fill from right to left.

### Tier 3: State & Form Validation
- Boundary values: Zero, negative numbers, extremely large values, empty search inputs.
- Custom blend compounding:
  - Sliders sum to 100%.
  - Equalize button redistributes remaining percentage evenly.
  - Adding ingredients disables already selected oils.
  - Saved customer recipes persist across page refreshes.

### Tier 4: Automated Verification Protocol
```bash
# 1. Typecheck and Production Build
npm run build

# 2. Start Dev Server
npm run dev -- --host 127.0.0.1 --port 5173

# 3. Visual Verification Checklist
# - Navigate to target URL
# - Perform test interactions (click, input, select)
# - Capture full-page screenshot
# - Confirm expected UI elements exist and have correct contrast
```
