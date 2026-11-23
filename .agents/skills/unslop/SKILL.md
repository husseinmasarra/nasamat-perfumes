---
name: unslop
description: Turns vibecoded, AI-looking UI into a human-crafted, designed interface with its own distinct character. Eliminates generic AI slop (overused purple/cyan gradients, glowing blobs, emoji badges, generic cards, noisy drop shadows, and cookie-cutter layouts). Uses the Quiet Chrome principle and executes a systematic 9-pass refinement (Spacing, Color, Icons, Copy, Typography, Layout, Micro-details, Visuals, Motion). Use whenever polishing, redesigning, or refining web interfaces so they look bespoke, professional, and authentic.
---

# Unslop Design Skill (De-AI Your UI)

Adapted from Damir Sokolovsky's `heydamir/unslop` design system.

Vibecoded and AI-generated UIs fail predictably: glowing surfaces, random emoji labels, messy spacing, shouty copy (`New ✨`, `AI-Powered 🚀`), uniform rounded cards, and overused purple/indigo gradients. 

**Unsloping** fixes the design craft while preserving the underlying functional code and user flow. Every size, color, typography weight, and component becomes an intentional choice that reflects the brand's unique identity.

---

## Core Philosophy: The "Quiet Chrome" Principle

1. **Slop spreads color and decoration everywhere**:
   - Slop adds borders to borders, gradients to backgrounds, glows to buttons, and emojis to every label.
2. **Craft keeps the chrome quiet**:
   - The interface chrome (navbars, sidebars, backgrounds, modal headers, standard tables) should be calm, restrained, and functional.
   - Visual richness belongs to **one or two key content moments** (e.g., the perfume bottle showcase, an interactive fragrance notes pyramid, or an elegant receipt).
3. **Strict Color Budget**:
   - Neutral ramp: 3 distinct text hierarchy levels (`primary`, `secondary`, `muted`). Never 10 slightly different shades of gray/lavender.
   - Accent color: **One single accent color** (e.g., Imperial Gold `#f59e0b` or Amber `#d97706` for Nasamat). Use it strictly for the primary call-to-action, active selection state, or key focal metric.

---

## The 9-Pass Systematic Refinement Protocol

When asked to "unslop" or polish a screen or component, execute these passes in strict sequential order:

### Pass 1: Audit & Brand Direction
- Identify the telltale AI slop indicators:
  - Are there unnecessary background radial gradients or blurry blobs?
  - Are buttons using generic `bg-gradient-to-r from-purple-500 to-indigo-600`?
  - Are emojis used as icons inside buttons or table headers (`📦 الطلب`, `⚡ سريع`)?
  - Are card borders uniformly `border-white/10` or overly thick?
- Establish a 3-sentence creative direction rooted in the product's actual domain (e.g., Parisian Haute Parfumerie with Middle Eastern royal heritage: obsidian black, gold foil accents, crisp serif/sans Arabic typography).

### Pass 2: Spacing & Layout Rhythm
- Replace arbitrary margins/paddings (`p-7`, `m-3`, `gap-5`) with a strict 4px/8px modular scale (`gap-2`, `gap-4`, `gap-6`, `p-4`, `p-6`, `p-8`).
- Ensure consistent container padding across viewports (`px-4 sm:px-6 lg:px-8`).
- Eliminate double-nested padding that causes excessive white/dark space.

### Pass 3: Color Palette & Contrast
- Clean up backgrounds: Use flat or very subtle tone shifts rather than aggressive diagonal gradients.
- Ensure strict WCAG AA contrast (minimum 4.5:1 for text, 3:1 for UI elements).
- Never place dark gray (`text-slate-600`) on dark backgrounds (`bg-slate-900`).
- Convert noisy multi-colored badges into monochromatic or subtle tonal tags.

### Pass 4: Icons & Semiotics
- **Eliminate emoji spam**: Emojis belong in conversational copy, not inside UI system controls, table headers, or input prefixes.
- Replace emojis with clean, cohesive SVG line icons (from Lucide or Heroicons) with consistent stroke widths (`stroke-[1.5]` or `stroke-2`).
- Align icons with text baselines using `inline-flex items-center gap-1.5`.

### Pass 5: Copywriting & Microcopy
- Remove "botsplaining", robotic greetings, and filler text.
- Replace generic marketing hype with precise, human, authoritative phrasing.
- In Arabic interfaces: Ensure authentic, natural Arabic terminology (e.g., `المجموع الجزئي` instead of `المجموع الفرعي الآلي`, `تأكيد الطلب` instead of `إرسال البيانات`).

### Pass 6: Typography & Hierarchy
- Establish a clear type scale: Heading 1, Heading 2, Body, Caption, Monospace/Tabular.
- Use `tabular-nums` or `font-mono` for all prices, quantities, SKU codes, and currency amounts to prevent jitter and misalignment.
- For Arabic text: Ensure sufficient line-height (`leading-relaxed` or `leading-loose`) so diacritics and letters aren't clipped.

### Pass 7: Layout Alignment & Density
- Eliminate fragmented floating elements by grouping related controls into cohesive toolbars.
- Align form inputs and action buttons cleanly.
- Choose deliberate density: High-density for administrative tables and POS terminals; airy, spacious density for luxury customer boutiques.

### Pass 8: Micro-details & Borders
- Replace heavy borders with subtle 1px translucent borders (`border-neutral-200` in light mode, `border-white/[0.08]` in dark mode).
- Replace muddy black drop shadows with layered, diffuse elevation shadows (`shadow-sm`, `shadow-md` with low opacity).
- Ensure interactive elements have distinct hover, focus-visible, and active states.

### Pass 9: Motion & Micro-interactions
- Remove dizzying continuous animations, bouncing badges, or pulsating glowing rings.
- Limit motion to purposeful micro-transitions (`transition-colors duration-200`, `transition-transform duration-150`).
- Honor `prefers-reduced-motion` accessibility standards.

---

## Anti-Patterns Checklist (Never Do This)

| ❌ AI Slop Anti-Pattern | ✅ Human-Crafted Solution |
| :--- | :--- |
| Rainbow gradient buttons (`from-pink-500 via-purple-500 to-indigo-500`) | Solid, high-contrast brand action button (`bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold`) |
| Floating blurry gradient blobs (`blur-3xl bg-purple-500/30`) | Clean architectural background with subtle grid or flat tone |
| Emoji prefixes in every button (`🛒 اضغط هنا للشراء 🚀`) | Clean SVG icon + concise verb (`<ShoppingBag className="w-4 h-4" /> إضافة إلى السلة`) |
| Low contrast gray text on dark cards | Crisp white `#ffffff` for primary, `#cbd5e1` for secondary |
| Inconsistent card border radiuses (`rounded-3xl` mixed with `rounded-sm`) | Consistent radius token (`rounded-xl` for cards, `rounded-lg` for inputs) |
