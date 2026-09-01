# Design System Strategy: The Fluid Social Curator

## 1. Overview & Creative North Star
The creative direction for this design system is **"The Fluid Social Curator."** In a world of cluttered social calendars and rigid planning tools, this system prioritizes momentum over administration. It moves away from the "static table" look of legacy event apps, instead embracing an editorial, mobile-first aesthetic that feels like a premium lifestyle magazine in motion.

### The Creative North Star: Editorial Frictionlessness
We break the "template" look by using **intentional asymmetry** and **tonal depth**. Rather than boxing users into grids, we use overlapping elements—such as "Status Rings" that break the bounds of their parent cards—to create a sense of urgency and life. High-contrast typography scales (the juxtaposition of the expressive `display-lg` with the functional `label-sm`) ensure that "status-awareness" is felt immediately, not just read.

---

## 2. Color & Surface Philosophy
This design system uses a sophisticated Material-derived palette to move beyond "standard" UI. The primary Electric Indigo (`#5D5FEF`) is our pulse, while the Soft Mint (`#D1FAE5`) acts as a calming "ready" state.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. Use `surface-container-low` sections sitting on a `surface` background to define regions. 

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
- **Base:** `surface` (#f8f9fa)
- **Secondary Content:** `surface-container-low` (#f3f4f5)
- **Interactive Cards:** `surface-container-lowest` (#ffffff) to create a natural, "paper-on-top" lift.
- **Deep Inset (Actionable areas):** `surface-container-high` (#e7e8e9) for search bars or inactive status areas.

### The "Glass & Gradient" Rule
To achieve a "signature" feel, floating navigation and high-priority RSVP modals must use **Glassmorphism**. Apply `surface` at 70% opacity with a `backdrop-blur` of 12px. Main Action Buttons should utilize a subtle linear gradient from `primary` (#4343d5) to `primary_container` (#5d5fef) at a 135-degree angle to provide a "tactile glow" that flat colors lack.

---

## 3. Typography
We pair **Plus Jakarta Sans** (Display/Headlines) with **Inter** (Body/Labels) to balance editorial flair with high-performance readability.

| Token | Font | Size | Weight/Usage |
| :--- | :--- | :--- | :--- |
| `display-lg` | Plus Jakarta Sans | 3.5rem | Bold; reserved for event titles or "Going" counts. |
| `headline-sm` | Plus Jakarta Sans | 1.5rem | Semi-bold; for category headers. |
| `title-md` | Inter | 1.125rem | Medium; for event sub-details (Time/Location). |
| `body-md` | Inter | 0.875rem | Regular; for descriptions and social proof text. |
| `label-md` | Inter | 0.75rem | Bold/All-caps; for "Status-Aware" badges. |

The typographic hierarchy is the primary tool for status awareness. As an RSVP changes, the weight and color of the `title` tokens should shift from `on_surface_variant` (Quiet/Interested) to `primary` (Confirmed).

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering** and **Ambient Light Simulation** rather than structural lines.

- **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background to create a soft, natural lift. 
- **Ambient Shadows:** For floating elements (like the 'Create Event' FAB), use a large 24px blur with only 6% opacity. The shadow color must be a tinted version of `primary` (e.g., `#4343d510`) to create a "neon aura" rather than a dirty grey shadow.
- **The "Ghost Border" Fallback:** If a container is placed on an identical background, use `outline_variant` at **15% opacity**. Never use a 100% opaque border.
- **Glassmorphism:** Use for persistent headers. It allows event imagery to bleed through as the user scrolls, creating an integrated, high-end feel.

---

## 5. Components & Signature Elements

### Status Rings (Signature Component)
Circular progress bars utilizing `secondary` (#416656) for the track and `primary_container` (#5d5fef) for the fill. They represent capacity. When capacity is >90%, the ring should subtly pulse using a CSS scale animation to signal urgency.

### Action Buttons
- **Primary:** High-elevation, gradient fill (`primary` to `primary_container`), `xl` (1.5rem) roundedness. 
- **Secondary:** `secondary_container` background with `on_secondary_container` text. No shadow.
- **Tertiary:** Ghost style; `surface_container_highest` background on hover only.

### RSVP Chips & Category Chips
- **Category Chips:** Use `surface-container-high` with `body-sm`.
- **Status Badges:** These are "Status-Aware." A 'Confirmed' badge uses `secondary_fixed` (#c3ecd7) with `on_secondary_fixed` text. A 'Pending' badge uses `tertiary_fixed` with a subtle pulse.

### Cards & Lists
**Strict Rule:** No divider lines. Use `spacing-6` (1.5rem) of vertical white space to separate event items. Cards should use `lg` (1rem) corner radius. To group content within a card, use a 2px vertical "accent bar" of `surface_tint` on the far left rather than a full border.

### Input Fields
Avoid traditional boxes. Use a "Minimalist Tray" approach: a `surface-container-low` background with an `md` (0.75rem) radius and no border. On focus, the background transitions to `surface-container-lowest` with a `primary` ghost-border (20% opacity).

---

## 6. Do’s and Don’ts

### Do
- **Do** use `spacing-8` and `spacing-10` to create dramatic, editorial white space.
- **Do** use "Status-Aware" colors: shift the entire card's background to `primary_fixed` when a user marks themselves as "Organizing."
- **Do** use `plusJakartaSans` for numbers—it adds a premium, bespoke feel to time and date displays.

### Don't
- **Don't** use 1px solid dividers or borders (The "No-Line" Rule).
- **Don't** use pure black (#000000) for text; always use `on_surface` (#191c1d) for a softer, high-end look.
- **Don't** use standard Material shadows. Always tint your shadows with the `primary` token to maintain brand vibrancy.
- **Don't** cram text. If a detail isn't essential for "Coordination," hide it behind a progressive disclosure pattern or a "Glass" drawer.