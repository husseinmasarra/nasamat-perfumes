---
name: luxury-web-styling
description: High-end luxury web design system, haute parfumerie aesthetics, Arabic typography, contrast optimization, and responsive luxury styling. Use whenever crafting or refining user interfaces.
---

# Luxury Web Styling Skill (Haute Parfumerie Design System)

Expert styling rules and visual standards for Nasamat Haute Parfumerie, blending Middle Eastern royal heritage with modern Parisian luxury aesthetics.

## Core Visual Palette

| Token | Hex / Class | Purpose |
|---|---|---|
| **Obsidian Black** | `#0b0f17` / `bg-slate-950` | Primary app background |
| **Dark Velvet** | `#131b2e` / `bg-slate-900` | Card, container, and modal backgrounds |
| **Imperial Gold** | `#f59e0b` / `text-amber-500` | Primary brand accent, ratings, luxury icons |
| **Warm Amber** | `#d97706` / `text-amber-600` | Interactive hover states, active badges |
| **Champagne Foil** | `#fef3c7` / `text-amber-100` | High-contrast luxury headings and highlights |
| **Pure Crisp White**| `#ffffff` / `text-white` | Primary readable text |
| **Muted Platinum** | `#94a3b8` / `text-slate-400` | Secondary descriptions and metadata |
| **Emerald Reserve**| `#10b981` / `text-emerald-500`| Stock in-hand, profit indicators, success states |

---

## Typography Standards
1. **Arabic Font Stack**:
   - Primary: `Tajawal`, `Cairo`, or `system-ui, -apple-system, sans-serif`
   - Formal / Certificates: `Amiri` or `Traditional Arabic`
2. **Numeral Presentation**:
   - Use `font-variant-numeric: tabular-nums` or `font-mono` for prices, serial codes, and batch numbers to guarantee column alignment.
3. **Contrast Rules**:
   - **Never** render dark gray (`text-slate-600` or `text-gray-500`) against dark backgrounds (`bg-slate-900`).
   - Use `text-slate-300` or `text-slate-200` for secondary body text.
   - Maintain minimum **4.5:1** contrast ratio across all interactive text.

---

## Component Guidelines

### 1. Luxury Cards & Bottles
```tsx
// Example Luxury Container Card
<div className="relative group rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/20 hover:border-amber-500/50 transition-all duration-300 shadow-lg hover:shadow-amber-500/10 p-5 overflow-hidden">
  {/* Subtle Ambient Gold Glow */}
  <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
  
  {/* Content */}
  <div className="relative z-10">
    ...
  </div>
</div>
```

### 2. High-End Action Buttons
- Primary CTA:
  `bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all`
- Secondary / Outline CTA:
  `border border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/10 text-amber-300 font-medium px-4 py-2 rounded-xl transition-all`

### 3. Micro-Interactions & Transitions
- Button active states: `active:scale-95` or `active:scale-[0.98]`.
- Image zoom on hover: `group-hover:scale-105 transition-transform duration-500 ease-out`.
- Toast notifications & modal backdrops: `backdrop-blur-md bg-slate-950/80`.
