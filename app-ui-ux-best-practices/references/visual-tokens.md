# Visual Design Tokens Reference

A structural guide for design tokens: tells you **which** variables to define, but does NOT preset **specific values**. Specific values must be translated by the model based on "Feeling Keywords".

---

## Token Structure Checklist

### 1. Color System

Your design must define the following color roles:

| Role | Purpose | Notes |
|------|---------|-------|
| `primary` | Primary buttons, key emphasis | 8-12% of UI surface |
| `secondary` | Secondary actions, tags | 3-5% of UI surface |
| `background` | Page base color | 60-70% of UI surface |
| `surface` | Cards, container backgrounds | 20-30% of UI surface |
| `text-primary` | Body text | Contrast ≥ 4.5:1 |
| `text-secondary` | Helper text, descriptions | |
| `text-disabled` | Disabled state text | |
| `border` | Borders, dividers | |
| `success` | Success state | Green family |
| `warning` | Warning state | Yellow/Orange family |
| `error` | Error state | Red family |

### 2. Typography System

Font roles to define:

| Role | Purpose | Reference Size Range |
|------|---------|---------------------|
| `display` | Hero headlines | 48-72px |
| `h1` | Page titles | 36-40px |
| `h2` | Section headers | 28-32px |
| `body` | Body text | 16px (min 14px) |
| `caption` | Helper text, labels | 12-14px |

### 3. Spacing System

Choose a base unit of **4px** or **8px**, then define multiplier scale.

### 4. Border Radius System

Define border radius for:
- Buttons
- Cards
- Input fields
- Avatars/Badges

### 5. Shadow System

Define 3-5 elevation levels (from light to heavy).

---

## Non-Negotiable Rules

### Contrast Requirements (WCAG AA)

| Element | Minimum Contrast |
|---------|-----------------|
| Body text | 4.5:1 |
| Large text (18pt+) | 3:1 |
| UI components | 3:1 |

### ⛔ Banned Colors (Anti-Pattern)

**Dark Mode Backgrounds - BANNED:**
- `#0D0B1A` (purple-black)
- `#1A1625` (purple-gray)
- `#0F0E17` (blue-purple-black)

**Primary Colors - BANNED:**
- `#A78BFA` (lavender)
- `#8B5CF6` (violet)
- `#7C3AED` (deep purple)
- Any purple as primary color

**Combinations - BANNED:**
- Blue + Purple as primary + secondary
- Pink → Cyan gradients
- Any "cyberpunk" palette

### ✅ Safe Dark Mode Backgrounds

If dark mode is needed, choose from:
- `#18181B` (zinc-900) — Recommended
- `#1A1A1A` (neutral black)
- `#0A0A0A` (near black)

---

## Important Note

This file provides **structure only**. Specific color values, font choices, border radius sizes, etc. must be translated by the model based on Step 1 "Feeling Keywords" and Step 2 "Material Metaphor".

**Do NOT** copy any values directly from here. **DO** create based on feeling.
