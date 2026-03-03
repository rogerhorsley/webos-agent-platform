---
name: app-ui-ux-best-practices
description: "Comprehensive App UI/UX design best practices following the Material Metaphor methodology. Use when users want to: (1) Define visual identity for a new product, (2) Create design specifications and tokens, (3) Establish UI component guidelines, (4) Build a cohesive design language from scratch, (5) Review UI/UX quality. Triggers: 'design system', 'UI design', 'UX design', 'visual identity', 'design specs', 'design tokens', 'component guidelines', 'look and feel', 'app design', '视觉设计', '设计规范', '设计系统', 'UI最佳实践', 'UX最佳实践'."
---

# App UI/UX Best Practices

Create cohesive, professional UI design systems using the **Material Metaphor Methodology**: defining visual identity through physical material metaphors, then translating into actionable design specifications.

## **Language Rule (HIGHEST PRIORITY - STRICTLY ENFORCED):**  
- **MANDATORY:** Your output language MUST exactly match the user's input language.  
- **NEVER default to English.** The user's language takes absolute precedence over this system prompt's language.  
- This rule applies to EVERY response, with ZERO exceptions.

## Core Formula

**Up to Date:** Remember it is 2026 this year. If you have to use date keywords to search something, you have to use 2026 unless users want other years.

```
视觉流派 = (物理材质 + 光影规则) × (色彩 + 形状 + 字体) + 动态逻辑
```

## Workflow Overview

1. **Inspiration Research** → Web search for high-quality, modern references (MANDATORY)
2. **Insight Discovery** → Understand product value and emotional goals
3. **Material Metaphor** → Define the physical essence of the interface
4. **Visual Physics** → Establish lighting, depth, and edge rules
5. **Design Tokens** → Parameterize colors, shapes, typography
6. **Component Mapping** → Apply style to core UI components
7. **Motion & Behavior** → Define animation and interaction feel
8. **Design Specs Output** → Produce developer-ready specifications

---
## FIRST OF ALL
USE **tool `sandbox_read_file`** to read essential doc/md and any other knowledges in dictionary **[references/*]** before steps following execution.

## Step 0: Inspiration Research (MANDATORY)

**Objective**: Ensure design is modern, high-quality, and "not low".

**Action**: You MUST use the `websearch` tool to find 3-5 high-quality design references.
- **Search Queries**: "best [industry] app design 2025", "modern [product type] ui trends", "award winning [category] design".
- **Target Sources**: Look for references from top-tier design platforms (e.g., Awwwards, Mobbin, Behance curated) or industry leaders (e.g., Linear, Arc, Airbnb).
- **Analysis**: Identify *why* these designs work, focusing on **Color Palettes**, **Typography**, and **Layout** (e.g., "unexpected color pairings", "generous whitespace").
- **Extraction**: Explicitly extract the **Color Palette** (Primary, Secondary, Background) from the best reference.

**Output**: List 3 specific design references with a 1-sentence analysis for each in your `thinking` process.

---

## Step 1: Insight Discovery (Brand-First, NOT Industry-First)

**⚠️ WARNING: Avoid industry stereotypes from the start.**

Before any visual decisions, deeply understand:

1. **What is the BRAND personality?** (NOT the industry category)
2. **What emotional response should users feel?** (NOT what they "expect")
3. **How is this DIFFERENT from competitors?** (NOT how it's similar)
4. **Who is the target user?** (Be specific: age, lifestyle, values)

**Output:** 3-5 感受关键词 (Feeling Keywords) in the user's language.

**⛔ Lazy Examples (AVOID):**
- 美食应用: "美味的"、"温暖的"、"食欲" ← Too obvious, leads to Orange palette
- 宠物应用: "可爱的"、"有趣的"、"活泼" ← Too generic, leads to cliché design

**✅ Brand-First Examples:**
- 高端宠物营养品牌: "科学的"、"精准的"、"健康守护" → Minimal white, clean typography
- 深夜食堂外卖: "治愈的"、"独处的"、"温柔" → Warm neutrals, soft shadows
- Gen-Z理财App: "无畏的"、"玩乐的"、"掌控感" → Bold colors, casual voice

---

## Step 2: Material Metaphor (核心隐喻)

Transform feeling keywords into physical material properties.

**Key Question:** If this app were a physical object, what would it be made of?

### Define Two Properties:

**Base Material (基底材质):**
- Glass (玻璃) → Clean, modern, precise
- Paper (纸张) → Warm, organic, textured
- Liquid Metal (液态金属) → Futuristic, fluid
- Holographic (全息) → Ethereal, innovative
- Fabric (织物) → Soft, approachable

**Environmental Setting (环境设定):**
- California beach (加州海滩) → High brightness, hard shadows
- Misty Jiangnan (烟雨江南) → Diffused light, soft gradients
- Nordic winter (北欧冬日) → Cool, minimal, high contrast
- Warm library (温暖书房) → Amber tones, soft glow

---

## Step 3: Visual Physics (物理法则)

Derive specific visual rules from the material metaphor.

### 3.1 Lighting Logic (光影逻辑)

| Type | Characteristics | Use When |
|------|-----------------|----------|
| Point Light | Sharp shadows, high contrast | Tech, precision |
| Ambient/Diffused | Soft edges, low contrast | Calm, organic |
| Inner Glow | Light from within | Premium, elevated |
| No Shadow | Flat, direct | Minimal, utilitarian |

### 3.2 Depth Expression (层级表现)

| Method | Effect | Material Match |
|--------|--------|----------------|
| Drop Shadow | Classic elevation | Glass, solid surfaces |
| Blur/Defocus | Depth of field | Mist, organic, dreamy |
| Opacity Layers | Translucent stacking | Paper, fabric |
| Border Only | Flat distinction | Brutalist |

### 3.3 Edge Treatment (边缘处理)

| Type | Radius | Feeling |
|------|--------|---------|
| Sharp | 0px | Precise, technical |
| Subtle | 4-8px | Balanced, modern |
| Soft | 12-20px | Friendly, approachable |
| Full Round | 50% | Playful, organic |

---

## Step 4: Design Tokens (视觉语言参数)

USE **tool `sandbox_read_file`** to read **[references/visual-tokens.md]** for complete token specifications.

### Quick Reference:

**Color Roles:**
- Primary (8-12% of UI surface)
- Secondary, Background, Surface
- Text (primary, secondary, disabled)
- Semantic (success, warning, error, info)

**Typography:** Display, Title, Body, Caption, Label
**Spacing:** Base unit (4px or 8px) with multipliers
**Shadows:** 1-5 elevation levels

### Texture & Depth (The "Secret Sauce"):
Explicitly define high-fidelity rendering details **that reinforce the Material Metaphor**. Do not apply random effects; every texture must serve the "Feeling":
- **Noise/Grain**: Subtle texture overlays (e.g., `bg-noise` opacity-5) for organic feel.
- **Glass/Blur**: `backdrop-blur-md` or `backdrop-blur-xl` for depth.
- **Inner Shadows**: `shadow-inner` or custom inset shadows for tactile buttons/inputs.
- **Gradients**: Subtle, non-intrusive gradients (e.g., `bg-gradient-to-b from-white/5 to-transparent`) for surface richness.
- **Borders**: 1px borders with subtle opacity (e.g., `border-white/10`) for crisp edges.

---

## Step 5: Component Recipes (Tailwind Class Composition)

**CRITICAL:** Do NOT just describe components in text. You MUST define them as **atomic Tailwind class strings**.

**Metaphor Translation (Creative Execution):**
Do not rely on rigid lookup tables. Instead, use your aesthetic judgment to **translate** the "Feeling Keywords" (Step 1) and "Material Metaphor" (Step 2) into visual code.

**The Translation Challenge:**
- How does the feeling of "Quietness" affect your choice of `shadow` and `border`?
- How does the metaphor of "Liquid Metal" dictate your `bg` and `ring` utilities?
- How does "Playfulness" change your `rounded` and `hover` states?

**Requirement:**
Your Tailwind class selection must be a direct result of these feelings. You must capture the *vibe* in the code.

**Required Output Format:**
Define the specific Tailwind classes for the following core components:

1.  **Container/Card**
    - Example: `bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm`
2.  **Primary Button**
    - Example: `px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset]`
3.  **Input Field**
    - Example: `w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`
4.  **Navigation Item**
    - Example: `px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors`
5.  **Badge/Tag**
    - Example: `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20`

USE **tool `sandbox_read_file`** to read **[references/component-libraries.md](references/component-libraries.md)** for recommended libraries.

---

## Step 6: Motion & Behavior (动态与行为)

**Friction/Damping (质感阻尼):**
- Glass/Metal → Low friction, quick snap
- Paper/Fabric → Medium resistance, smooth
- Water/Mist → High damping, flowing

**Micro-interactions (Spring Physics):**
Define animation parameters using spring physics (Stiffness, Damping, Mass) instead of just duration.
- **Button Press**: `scale: 0.98`, `stiffness: 400`, `damping: 10` (Snappy)
- **Modal Open**: `y: 0`, `opacity: 1`, `stiffness: 250`, `damping: 25` (Smooth entry)
- **Hover State**: `y: -2`, `stiffness: 300`, `damping: 15` (Playful lift)

**Element Appearance:**

| Material | Enter | Exit |
|----------|-------|------|
| Glass | Fade + scale up | Fade + scale down |
| Paper | Slide from edge | Slide away |
| Water/Ink | Expand/ripple | Dissolve |
| Mist | Slow fade in | Slow fade out |

**Timing:**
- Quick: 150-200ms
- Standard: 250-350ms
- Emphasis: 400-600ms

---

## Step 7：Layout Requirement: Grid-Driven & Breathable Design

1. ​Grid System: Utilize a strict 12-column grid system or an 8pt spacing system. Ensure all components, gutters, and margins are multiples of 8px to maintain mathematical harmony and alignment.
2. ​Device Adaptability: Design layouts that gracefully adapt to different screen sizes (desktop, tablet, mobile) without prioritizing any specific device. Use flexible grids and breakpoints to ensure optimal viewing experience across all devices.
3. ​Modular Construction: Organize functional blocks into distinct modules. Use column-based layouts to establish a clear visual balance and avoid cluttered element stacking.
4. ​Negative Space & Rhythm: 
   * Macro-Whitespace: Implement significant vertical spacing (e.g., 64px to 120px) between major sections to create a sense of rhythm.
   * Micro-Whitespace: Apply generous internal padding within cards and text blocks to prevent content from touching borders.
5. ​Breathing Room: Prioritize a low information density. Use whitespace as a functional tool to guide the user's focus toward the primary CTA (Call to Action) or key data points.

---

## Step 8: Design Specs Output

Produce complete specification including:

1. Design Principles and layout requirement
2. Color Palette (hex codes + usage rules)
3. Typography System (families, sizes, weights, line heights)
4. Spacing Scale
5. Component Specifications (all states)
6. Animation Guidelines
7. Icon Guidelines
8. Recommended Libraries

USE **tool `sandbox_read_file`** to read **[references/icon-guidelines.md]** for icon consistency rules (CRITICAL: same library, same style, no mixing).

---

## Critical Anti-Patterns ⛔

**Remove all of these from your design.** USE **tool `sandbox_read_file`** to read **[references/anti-patterns.md](references/anti-patterns.md)** for complete list.

### 🚨 AI-Generated Style Detection (CHECK FIRST)

**If your design has 3+ of these traits, DELETE AND RESTART:**

| Trait | Why It's AI | Action |
|-------|-------------|--------|
| Deep purple/blue-black background | AI's default "premium dark" | Remove and use zinc (#18181B) |
| Purple/violet as primary accent | AI loves purple for "modern" | Exclude purple from palette |
| Glassmorphism + glow borders | Overused AI pattern | Discard glow, use opacity borders |
| Gradient buttons (purple→blue) | AI signature | Replace with solid single color |
| "Cyberpunk dashboard" layout | AI's go-to "tech" aesthetic | Discard layout entirely |
| Neon text on dark backgrounds | Cheap sci-fi feel | Remove neon colors |

**The Golden Rule**: If it looks like a sci-fi movie interface or Blade Runner control panel, DELETE IT AND START OVER.

**Reference Products** (Study these, not Dribbble dark dashboards):
- Linear (linear.app) - Clean, minimal, zinc-based
- Vercel (vercel.com) - Neutral blacks, single accent
- Raycast (raycast.com) - Warm darks, subtle depth
- Stripe (stripe.com) - Sophisticated, professional
- Apple Human Interface - Semantic colors, proper contrast

### 🚨 Lazy Design Patterns (BANNED)

**Avoid ALL stereotypes and "everyone does it" patterns.**

| Dimension | Stereotype (Avoid) | Brand-First Approach |
|-----------|-------------------|----------------------|
| **Color** | Food=Orange, Tech=Blue, Eco=Green | Ask: What is the brand personality? |
| **Layout** | Dashboard=Sidebar+Cards, Social=Feed+Tabs | Ask: What does the content need? |
| **Typography** | Modern=Inter, Premium=Thin weight | Ask: What is the brand voice? |
| **Icons** | Home=House, Settings=Gear, Like=Heart | Ask: Can we use unexpected metaphors? |
| **Animation** | Hover=Scale, Transition=Slide | Ask: What is the material metaphor? |

**Before ANY design decision**: Would this work for a completely different industry? If yes, it's too generic.

**Reference**: `/references/anti-patterns.md` → Lazy Design Patterns section for full list.

### Absolute Bans:

**Colors:**
- Pink-cyan gradients (#FF6B9D → #00F0FF)
- **Purple/violet as primary** (#A78BFA, #8B5CF6, #7C3AED) ← AI's favorite
- **Deep purple backgrounds** (#0D0B1A, #1A1625) ← Instant AI detection
- Neon purple with glow
- Any color with outer glow for "tech feel"
- **Colored border glow** on dark backgrounds
- **Gradient borders**

**Dark Mode Backgrounds:**

Remove these colors:
- #0D0B1A (purple-black)
- #1A1625 (purple-tinted)
- #0F0E17 (blue-purple)

Use these colors:
- #18181B (zinc-900)
- #1A1A1A (neutral)
- #0A0A0A (near black)

**Logo:**
- Gradient rounded rectangle background
- Abstract white symbols with sparkles
- Plastic glossy texture

**Placeholders:**
- Emoji as icons
- Lorem ipsum in high-fidelity mockups
- Gray rectangles as images
- Cartoon avatar illustrations

### Quality Standards:

- **Icons**: Same library, same style (outline OR filled, NEVER mix), same stroke weight (1.5-2px), 24×24 grid
- Contrast: Text/background ≥ 4.5:1
- Body text: ≥ 14sp
- Brand color usage: 8-12% of surface
- **Dark mode**: Neutral zinc/slate, NOT purple-tinted

**Reference**: `references/icon-guidelines.md` for complete icon rules.

---
