# UI Design Anti-Patterns Reference

Complete list of prohibited design elements and patterns. All items listed here are **absolutely banned** from professional UI design.

## Table of Contents

1. [AI-Generated Style Signatures (CRITICAL)](#ai-generated-style-signatures-critical)
2. [Icon Anti-Patterns](#icon-anti-patterns)
3. [Logo Anti-Patterns](#logo-anti-patterns)
4. [Color Anti-Patterns](#color-anti-patterns)
5. [Placeholder Anti-Patterns](#placeholder-anti-patterns)
6. [Layout Anti-Patterns](#layout-anti-patterns)
7. [Typography Anti-Patterns](#typography-anti-patterns)
8. [Interaction Anti-Patterns](#interaction-anti-patterns)
9. [Accessibility Violations](#accessibility-violations)

---

## AI-Generated Style Signatures (CRITICAL)

### ⛔ The "Cyberpunk Dashboard" Syndrome (ALL BANNED)

This is the #1 indicator of AI-generated design. If your design looks like a sci-fi movie control panel, **DELETE IT AND START OVER**.

```
THE AI FORMULA (ABSOLUTELY FORBIDDEN):
Deep purple/blue background (#0D0B1A, #0F0E17, #1A1625, #13111C)
+ Purple/blue gradient cards
+ Semi-transparent glassmorphism with glow borders
+ Neon accent colors (#A78BFA, #8B5CF6, #6366F1)
+ "Futuristic" sans-serif fonts
= INSTANT AI DETECTION → Professional credibility = 0
```

### ⛔ Banned Background Colors (Dark Mode)

| Color | Hex | Why Banned |
|-------|-----|------------|
| **Deep Purple-Black** | #0D0B1A, #0F0E17, #13111C | AI's favorite "premium dark" |
| **Blue-Tinted Black** | #0A0E1A, #0D1117, #161B22 | Overused "tech" background |
| **Purple-Tinted Dark** | #1A1625, #1E1B2E, #2D2640 | Cyberpunk cliché |
| **Pure Black** | #000000 | Harsh, unprofessional |

**✅ Use Instead (Professional Dark Mode)**:
```css
/* Neutral dark (Linear, Vercel, Raycast style) */
--bg-dark: #18181B;      /* Zinc-900 */
--bg-dark-alt: #1C1C1E;  /* Apple Dark */
--bg-dark-warm: #1A1A1A; /* Neutral warm */

/* Surface colors */
--surface-dark: #27272A; /* Zinc-800 */
--surface-dark-elevated: #3F3F46; /* Zinc-700 */
```

### ⛔ Banned Card/Surface Styles

| Style | Description | Why Banned |
|-------|-------------|------------|
| **Purple gradient cards** | Linear gradient from purple to blue | AI signature |
| **Glassmorphism + glow** | Blur + colored border glow | Overused, dated |
| **Neon border on dark** | Bright colored border on dark surface | Cheap "tech" feel |
| **Multi-layer transparency** | Stacked semi-transparent panels | Visual noise |

**✅ Use Instead**:
```css
/* Clean card on dark */
.card-dark {
  background: #27272A;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

/* Subtle elevation */
.card-elevated {
  background: #27272A;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
```

### ⛔ Banned Accent Color Combinations

| Combination | Why Banned |
|-------------|------------|
| **Purple primary (#A78BFA, #8B5CF6)** on dark background | AI's default "premium" choice |
| **Blue + Purple pairing** (#3B82F6 + #8B5CF6) | Overused AI combo, even as "AI accent" |
| **Blue-purple gradient** buttons | Overused AI pattern |
| **Cyan highlights** (#22D3EE, #06B6D4) on purple/dark | Cyberpunk cliché |
| **Pink + Cyan** anywhere | Vaporwave/AI signature |

### ⛔ The "Blue + Purple" Trap

**Even when purple is used as secondary/accent color, the Blue + Purple combo screams "AI generated".**

Common excuses (all rejected):
- "Purple is just for AI thinking states" → Still creates AI aesthetic
- "It's only 5% of the UI" → Still pollutes the visual identity
- "Blue is primary, purple is secondary" → The combination itself is the problem

**Action**: Exclude purple entirely from your palette. Use a single accent color family.

**✅ Use Instead (Professional Accent Colors)**:
```css
/* Pick ONE accent color family, stay consistent */
--accent-blue: #3B82F6;   /* Clean blue */
--accent-green: #22C55E;  /* Fresh green */
--accent-orange: #F97316; /* Warm orange */
--accent-teal: #14B8A6;   /* Teal */

/* For secondary states, use same hue with different lightness */
--accent-blue-light: #60A5FA;  /* Blue-400 for hover */
--accent-blue-dark: #2563EB;   /* Blue-600 for active */

/* Exclude purple entirely - even for "AI" states */
```

### ⛔ AI Style Detection Checklist

**If your design has 3+ of these, DELETE AND RESTART:**

- [ ] Remove deep purple/blue-black backgrounds
- [ ] Exclude purple/violet from primary accent options
- [ ] Discard glassmorphism with colored glow borders
- [ ] Replace gradient buttons with solid single-color
- [ ] Discard "futuristic" dashboard layouts
- [ ] Remove neon text from dark backgrounds
- [ ] Eliminate semi-transparent overlapping cards
- [ ] Reduce blur effects to minimum
- [ ] Remove "sci-fi" styled icons or elements
- [ ] Discard rainbow or multi-color gradients

### ✅ Professional Dark Mode Reference

**Study these products for proper dark mode**:
- Linear (linear.app) - Clean, minimal, zinc-based
- Vercel (vercel.com) - Neutral blacks, single accent
- Raycast (raycast.com) - Warm darks, subtle depth
- Arc Browser - Sophisticated, personality without gimmicks
- Apple Human Interface - Semantic colors, proper contrast

---

## Lazy Design Patterns (BANNED)

**Lazy design = Using default templates, stereotypes, and "everyone does it" patterns. All banned.**

---

### ⛔ Industry Color Stereotypes

| Industry | Stereotype (Avoid) | Why it's bad |
|----------|-------------------|--------------|
| **Food / Dining** | 🟠 Orange / Red | "Appetite appeal" cliché. Looks cheap/fast-food. |
| **Pets / Animals** | 🟠 Orange / Yellow | "Warm/Playful" default. Lacks sophistication. |
| **Eco / Nature** | 🟢 Green | "Natural" default. Boring and expected. |
| **Tech / SaaS** | 🔵 Blue | "Trust" default. Safe but undifferentiated. |
| **Finance** | 🔵 Blue / Green | "Security/Money" default. Cold and corporate. |
| **Health / Medical** | 🔵 Blue / White | "Clinical" default. Feels like a hospital. |
| **Kids / Education** | 🌈 Rainbow / Primary | "Fun" cliché. Patronizing and dated. |
| **Luxury** | ⚫ Black + Gold | "Premium" cliché. Feels like a fake Rolex. |

---

### ⛔ Layout Stereotypes (Lazy Design)

| Product Type | Stereotype (Avoid) | Why it's bad |
|--------------|-------------------|--------------|
| **Dashboard** | Left sidebar + Top nav + Cards grid | Looks like every SaaS template |
| **E-commerce** | Hero banner + Product grid + Footer | Amazon/Shopify clone feel |
| **Social App** | Bottom tab bar + Feed + FAB | Instagram/TikTok clone feel |
| **Landing Page** | Hero → Features → Testimonials → CTA | Template website syndrome |
| **Chat App** | Left contacts + Right messages | WhatsApp/Slack clone feel |

**Action**: Study the CONTENT and USER FLOW first. Let layout emerge from needs, not templates.

---

### ⛔ Layout Implementation Anti-Patterns (Fragile Code)

**These are implementation failures that cause UI bugs (like text overflow).**

| Anti-Pattern | Description | Why it breaks | Fix |
|--------------|-------------|---------------|-----|
| **Hardcoded Widths** | `w-[200px]` | Content overflow on long text | Use `flex`, `min-w-0`, `truncate` |
| **Absolute Positioning** | `absolute left-10` | Overlaps when screen resizes | Use Flexbox/Grid for layout |
| **Negative Margins** | `ml-[-20px]` | Unpredictable overlap | Use proper spacing/gap |
| **Missing Truncation** | No `truncate` | Text bleeds out of card | Add `truncate` class to text containers |
| **Magic Numbers** | `top-[37px]` | Breaks if font size changes | Use standard spacing tokens |

**The "Symmetric Layout" Trap**:
Attempting to align text symmetrically (e.g., `[Name] [Avatar] VS [Avatar] [Name]`) often fails if the left-side name is long.
- ❌ **Bad**: `flex-row-reverse` without width constraints.
- ✅ **Good**: `grid grid-cols-[1fr_auto_1fr]` with `truncate` on text columns.

---

### ⛔ Typography Stereotypes

| Context | Stereotype (Avoid) | Why it's bad |
|---------|-------------------|--------------|
| **"Modern" app** | Inter / SF Pro everywhere | Safe but zero personality |
| **"Premium" brand** | Thin weight + Massive spacing | Looks like every luxury template |
| **"Friendly" app** | Rounded sans-serif (Nunito, Quicksand) | Childish, lacks credibility |
| **"Tech" product** | Monospace for everything | Programmer aesthetic, not user-friendly |
| **Chinese product** | 思源黑体 for everything | Default, no brand identity |

**Action**: Choose typography that reflects the BRAND VOICE, not the category expectation.

---

### ⛔ Icon Stereotypes

| Feature | Stereotype (Avoid) | Why it's bad |
|---------|-------------------|--------------|
| **Home** | 🏠 House icon | Overused, no brand personality |
| **Profile** | 👤 Person silhouette | Generic, seen everywhere |
| **Settings** | ⚙️ Gear icon | Mechanical, cold feeling |
| **Search** | 🔍 Magnifying glass | Expected but boring |
| **Like** | ❤️ Heart | Instagram clone signal |

**Action**: Consider custom icons or unexpected metaphors that align with brand personality.

---

### ⛔ Animation Stereotypes

| Interaction | Stereotype (Avoid) | Why it's bad |
|-------------|-------------------|--------------|
| **Page transition** | Slide left/right | Mobile 101, no personality |
| **Button hover** | Scale up 1.05x | Seen on every website |
| **Loading** | Spinning circle | Boring, anxiety-inducing |
| **Success** | Green checkmark bounce | Template animation |
| **Modal appear** | Fade + Scale from center | Default behavior |

**Action**: Design motion that reflects the MATERIAL METAPHOR of your brand.

---

### ⛔ Copy/UX Writing Stereotypes

| Context | Stereotype (Avoid) | Why it's bad |
|---------|-------------------|--------------|
| **Empty state** | "Nothing here yet" | Lazy, unhelpful |
| **Error message** | "Something went wrong" | Vague, frustrating |
| **CTA button** | "Get Started" / "Learn More" | Generic, low conversion |
| **Onboarding** | "Welcome to [App Name]!" | Boring first impression |
| **Loading** | "Loading..." | Wasted opportunity |

**Action**: Every piece of text is a brand touchpoint. Make it count.

---

### ✅ Brand-First Design Process

**Before ANY design decision, ask:**

1. **What is the brand personality?** (Not the industry category)
2. **What emotion should users feel?** (Not what they "expect")
3. **How is this different from competitors?** (Not how it's similar)
4. **Would this work for a completely different industry?** (If yes, it's too generic)

**Example - Pet Food App:**
- ❌ Lazy: Orange color, paw print icons, playful rounded fonts, dog photos
- ✅ Brand-first: What if it's a *premium pet nutrition* brand? → Minimal white, scientific typography, ingredient photography, health-focused

**Example - Finance App:**
- ❌ Lazy: Blue color, shield icons, serious serif fonts, stock graphs
- ✅ Brand-first: What if it's for *Gen-Z investors*? → Bold colors, meme-friendly, casual voice, gamified elements

---

## Icon Anti-Patterns

### ⛔ Banned Icon Styles

| Type | Description | Why Banned |
|------|-------------|------------|
| **Neon Glow Icons** | Icons with glow/outer shadow effects | Cheap "tech" feel, dated |
| **Rainbow Gradients** | Multi-color gradient fills | AI-generated signature |
| **Plastic 3D** | Shiny, glossy 3D with reflections | 2015-2018 dated style |
| **Star Decorations** | ✨ sparkles around icons | AI-generated signature |
| **Deep Background + Neon Border** | Dark plate with neon outline | Cheap cyberpunk cliché |
| **Emoji Style** | Cartoon emoji-like icons | Unprofessional |
| **Over-Detailed** | Too many lines/details | Unreadable at small sizes |
| **Inconsistent Weight** | Mixed stroke widths | Visual chaos |

### ⛔ Icon Colors to Exclude

```
REMOVE FROM PALETTE:
- Neon Cyan: #00F0FF, #00FFFF
- Neon Pink: #FF6B9D, #FF00FF
- Neon Purple: #A855F7, #9333EA with glow
- Any color with outer glow/shadow
- Rainbow/multi-color within single icon
```

### ⛔ Banned Icon Sources

| Source | Reason |
|--------|--------|
| **Flaticon** | Quality varies, overused, no consistency |
| **Freepik** | Free tier is low quality |
| **IconFinder** | Flooded with 3D/gradient garbage |
| **AI-Generated** | All AI icons banned without exception |
| **Noun Project (free)** | Inconsistent styles |
| **Iconfont (阿里)** | Mixed quality, style chaos |

### ✅ Icon Quality Standards

All icons MUST meet these criteria:

```
Required:
- Single color (or brand color only)
- No glow, no shadows, no gradients
- Uniform stroke weight: 1.5px or 2px
- Pixel-perfect grid alignment: 24×24 or 20×20
- Round or square caps (consistent globally)
- From approved libraries only
```

---

## Logo Anti-Patterns

### ⛔ Banned Logo Characteristics

| Characteristic | Description | Why Banned |
|----------------|-------------|------------|
| **Pink-Cyan Gradient** | Rounded rect with #FF6B9D → #00F0FF | AI default style |
| **Plastic Glossy** | High-gloss reflection/shine | Dated, cheap 3D |
| **Sparkle Decorations** | ✨ stars around logo | AI signature |
| **Abstract White Symbol** | Meaningless white lines on gradient | No brand meaning |
| **Over-Rounded** | Everything extremely rounded | Lacks design tension |
| **Gradient Stroke** | Rainbow edges/outlines | Over-decorated |

### ⛔ The "AI Logo" Formula (DISCARD ENTIRELY)

```
REMOVE ALL OF THESE:
Rounded rectangle (gradient background)
+ White abstract symbol (stars/waves/geometric)
+ Sparkle decorations (✨)
+ Plastic glossy texture
= Obvious AI-generated appearance
```

### ✅ Logo Quality Standards

All logos MUST:

- Work in pure black or white (monochrome test)
- Be recognizable at 16px (favicon test)
- Have clear meaning explainable in one sentence
- Avoid dependency on gradients for recognition
- Use geometry based on simple shapes

---

## Color Anti-Patterns

### ⛔ Banned Color Combinations

| Combination | Hex Values | Why Banned |
|-------------|------------|------------|
| **Pink → Cyan gradient** | #FF6B9D → #00F0FF | AI signature |
| **Purple → Blue neon** | #A855F7 → #3B82F6 with glow | Cheap tech |
| **Rainbow gradient** | Any multi-color rainbow | AI signature |
| **Neon on dark** | Bright neon on #0D0D0D | Overused, harsh |
| **Violet/Lavender primary** | #A78BFA, #8B5CF6, #7C3AED | AI's default "premium" |
| **Deep purple background** | #0D0B1A, #1A1625, #2D2640 | Cyberpunk cliché |

### ⛔ Color Effects to Remove

Remove all of these from your design:
- Outer glow on any element
- Inner glow for "premium" feel
- Gradient fills on icons
- Multiple gradients in one view
- Neon colors (#00FFFF, #FF00FF, #00FF00)
- Colored border glow on dark backgrounds
- Purple/blue tinted shadows
- Gradient borders (border-image with gradient)

### ⛔ Color Usage Violations

| Violation | Description | Fix |
|-----------|-------------|-----|
| **Brand color overload** | >15% of surface area | Limit to 8-12% |
| **Non-semantic red** | Red used for non-error/non-warning | Reserve red for alerts |
| **Low contrast text** | Gray on white below 4.5:1 | Use #666 minimum |
| **Competing accents** | Multiple bright colors fighting | Single accent color |
| **Purple as primary** | Violet/lavender as main brand color | Choose blue, green, or warm colors |
| **Dark mode purple tint** | Purple-tinted backgrounds/surfaces | Use neutral zinc/slate |

### ⛔ The "Premium Purple" Trap

**AI models default to purple/violet for "premium" or "modern" designs. Exclude purple entirely.**

Reasons to exclude purple:
- Overused by AI → instant "generated" detection
- Culturally ambiguous (mourning in some cultures)
- Hard to pair with other colors
- Poor for accessibility (low contrast ratios)

**Action**: Remove purple from your color palette. Study Linear, Stripe, and Apple for professional alternatives.

---

## Placeholder Anti-Patterns

### ⛔ Banned Placeholder Types

| Type | Description | Why Banned |
|------|-------------|------------|
| **Emoji** | 😀 🎉 📱 as icons/decoration | Unprofessional |
| **Cartoon Illustrations** | Free cartoon characters | Cheap, no brand fit |
| **Wireframe X-Box** | Rectangle with X for images | Looks unfinished |
| **Gray Rectangles** | Solid gray image placeholders | Lazy design |
| **Lorem Ipsum** | Latin filler in high-fidelity | Unrealistic |
| **Stock Smiles** | Obviously staged stock photos | Fake, untrustworthy |
| **"Image" Text** | Word "Image" as placeholder | Amateur |

### ⛔ Banned Avatar Types

| Type | Description | Why Banned |
|------|-------------|------------|
| **Generic Cartoon** | Free cartoon character avatars | Cheap, no personality |
| **AI-Generated Cartoon** | AI cartoon/anime avatars | Obviously AI |
| **Emoji Avatars** | 😀 as profile picture | Unprofessional |
| **Free Stock Avatar** | Flaticon/Freepik avatars | Overused, cheap |
| **Outdated 3D** | 2015-era 3D characters | Dated |

### ✅ Approved Placeholder Solutions

| Use Case | Solution |
|----------|----------|
| **Image placeholder** | BlurHash / ThumbHash |
| **Avatar placeholder** | Boring Avatars, DiceBear, initials |
| **User photos** | Real photos or geometric abstract |
| **Loading** | Skeleton matching content layout |
| **Text placeholder** | Realistic fake content |

---

## Layout Anti-Patterns

### ⛔ Information Density Issues

| Issue | Description | Fix |
|-------|-------------|-----|
| **Over 7 actions** | Too many primary CTAs on screen | Group and fold, reduce 15-30% |
| **Buried high-frequency** | Core features in hamburger menu | Surface to main nav |
| **Tab overflow** | >5 bottom tabs, or scrollable tabs | Max 5, use "More" |
| **Dead zones** | CTA in thumb-unreachable areas | Bottom 1/3 for primary actions |

### ⛔ Navigation Issues

| Issue | Description | Fix |
|-------|-------------|-----|
| **No back button** | User cannot return | All pages must support back |
| **Drawer treasure** | Core features hidden in side menu | High-frequency on main screen |
| **Mixed transitions** | Left-slide and up-slide mixed | Consistent direction system |

### ⛔ Responsive Issues

| Issue | Description | Fix |
|-------|-------------|-----|
| **Fixed columns** | No breakpoint adaptation | Implement device-adaptive grid |
| **Waterfall misuse** | Structured data in masonry | Use grid for comparisons |
| **Dense touch targets** | >3 clickable areas in list item | Max 2 per item |

---

## Typography Anti-Patterns

### ⛔ Text Violations

| Issue | Criteria | Fix |
|-------|----------|-----|
| **Tiny text** | Body <14sp | Minimum 14sp body |
| **Thin on dark** | Light weight on dark backgrounds | Regular or higher |
| **Low contrast** | Gray (#999) on white | Minimum 4.5:1 ratio |
| **Mixed systems** | Different fonts for same purpose | Unified type scale |
| **Improper CJK** | Chinese/English weight mismatch | Match visual weight |

### ⛔ Character Usage

| Issue | Fix |
|-------|-----|
| **Full-width numbers** | Use half-width numbers |
| **Full-width punctuation in mixed text** | Use half-width with Latin |
| **Inconsistent quotes** | Standardize quote style |

---

## Interaction Anti-Patterns

### ⛔ Feedback Issues

| Issue | Description | Fix |
|-------|-------------|-----|
| **Dead buttons** | No visual change on press | Scale/highlight on interaction |
| **Silent errors** | Red border only, no explanation | Text explanation + fix suggestion |
| **Rogue modals** | Full-screen blocking, no close | Support swipe-to-close, clear close button |
| **Auto-loading popups** | Unexpected modals on page load | User-initiated only |

### ⛔ Motion Issues

| Issue | Description | Fix |
|-------|-------------|-----|
| **Inconsistent timing** | Random duration/easing | Global motion tokens, ±20% variance max |
| **Mixed directions** | Conflicting enter/exit directions | Consistent spatial model |
| **Excessive animation** | Everything animates | Meaningful motion only |
| **Jarring transitions** | No easing, instant snaps | Proper easing curves |

---

## Accessibility Violations

### ⛔ Must-Fix Issues

| Issue | WCAG | Fix |
|-------|------|-----|
| **Text contrast <4.5:1** | AA | Increase contrast ratio |
| **Touch target <44pt** | 2.5.5 | Minimum 44×44pt hit area |
| **No focus indicator** | 2.4.7 | Visible focus ring |
| **Color-only feedback** | 1.4.1 | Add text/icon indicators |
| **No alt text** | 1.1.1 | Describe all images |
| **Keyboard trap** | 2.1.2 | Escape must work |

### ⛔ Contrast Requirements

| Element | Minimum Ratio |
|---------|---------------|
| Normal text | 4.5:1 |
| Large text (18pt+) | 3:1 |
| UI components | 3:1 |
| Focus indicators | 3:1 |

---

## Quick Reference: Audit Checklist

Before finalizing any design, verify:

### 🚨 AI Detection (CHECK FIRST)
- [ ] Remove all purple/blue-black backgrounds
- [ ] Exclude purple/violet from accent color options
- [ ] Discard glassmorphism with glow borders
- [ ] Replace gradient buttons with solid colors
- [ ] Discard "cyberpunk dashboard" aesthetics
- [ ] Remove neon text/elements
- [ ] **Would a human designer at Linear/Stripe/Apple approve this?**

### Icons
- [ ] Use single color only
- [ ] Source from approved libraries only
- [ ] Keep consistent stroke weight (1.5-2px)
- [ ] Exclude emoji and AI-generated icons

### Colors
- [ ] Remove all neon glow effects
- [ ] Discard pink-cyan gradients
- [ ] Exclude purple from primary color options
- [ ] Limit brand color to 8-12% of surface
- [ ] Ensure all text meets 4.5:1 contrast
- [ ] Use neutral zinc/slate for dark mode

### Logo
- [ ] Ensure logo works in monochrome
- [ ] Ensure logo is clear at 16px
- [ ] Remove gradient dependency
- [ ] Discard sparkle decorations

### Layout
- [ ] Limit to <7 primary actions visible
- [ ] Surface core features to main nav
- [ ] Ensure touch targets ≥44pt
- [ ] Include back navigation on all pages

### Typography
- [ ] Set body text ≥14sp minimum
- [ ] Use regular+ weight on dark backgrounds
- [ ] Match CJK/Latin visual weights

### Interaction
- [ ] Add feedback to all buttons
- [ ] Include explanations with errors
- [ ] Ensure modals can be closed
- [ ] Keep motion timing consistent

---

## The Golden Rule

> **If it looks like a sci-fi movie interface, a gaming dashboard, or something from Blade Runner — DELETE IT AND START OVER.**
> 
> Professional design is **invisible**. It serves the content, not the aesthetic ego of the designer (or AI).
> 
> **Reference products to study**: Linear, Notion, Figma, Stripe, Apple, Vercel, Raycast. Discard Dribbble "dark dashboard" shots as references.
