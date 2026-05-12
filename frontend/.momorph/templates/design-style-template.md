```markdown
# Design Style: [FEATURE_NAME]

**Frame ID**: `[FRAME_ID]`
**Frame Name**: `[FRAME_NAME]`
**Figma Link**: [FIGMA_DIRECT_LINK]
**Extracted At**: [DATE]

---

## Design Tokens

### Colors

| Token Name | Hex Value | Opacity | Usage |
|------------|-----------|---------|-------|
| --color-primary | #3B82F6 | 100% | Primary buttons, links |
| --color-primary-hover | #2563EB | 100% | Button hover state |
| --color-secondary | #6B7280 | 100% | Secondary text |
| --color-background | #FFFFFF | 100% | Page background |
| --color-surface | #F9FAFB | 100% | Card backgrounds |
| --color-border | #E5E7EB | 100% | Input borders |
| --color-error | #EF4444 | 100% | Error messages |
| --color-success | #10B981 | 100% | Success messages |
| --color-text-primary | #111827 | 100% | Headings, body |
| --color-text-secondary | #6B7280 | 100% | Labels, hints |

### Typography

| Token Name | Font Family | Size | Weight | Line Height | Letter Spacing |
|------------|-------------|------|--------|-------------|----------------|
| --text-heading-1 | Inter | 32px | 700 | 40px | -0.02em |
| --text-heading-2 | Inter | 24px | 600 | 32px | -0.01em |
| --text-heading-3 | Inter | 20px | 600 | 28px | 0 |
| --text-body | Inter | 16px | 400 | 24px | 0 |
| --text-body-sm | Inter | 14px | 400 | 20px | 0 |
| --text-label | Inter | 14px | 500 | 20px | 0 |
| --text-caption | Inter | 12px | 400 | 16px | 0.01em |
| --text-button | Inter | 16px | 500 | 24px | 0 |

### Spacing

| Token Name | Value | Usage |
|------------|-------|-------|
| --spacing-xs | 4px | Tight gaps |
| --spacing-sm | 8px | Small gaps |
| --spacing-md | 16px | Default gaps |
| --spacing-lg | 24px | Section gaps |
| --spacing-xl | 32px | Large sections |
| --spacing-2xl | 48px | Page sections |

### Border & Radius

| Token Name | Value | Usage |
|------------|-------|-------|
| --radius-sm | 4px | Small elements |
| --radius-md | 8px | Buttons, inputs |
| --radius-lg | 12px | Cards |
| --radius-xl | 16px | Modals |
| --radius-full | 9999px | Pills, avatars |
| --border-width | 1px | Default border |
| --border-width-focus | 2px | Focus state |

### Shadows

| Token Name | Value | Usage |
|------------|-------|-------|
| --shadow-sm | 0 1px 2px rgba(0,0,0,0.05) | Subtle elevation |
| --shadow-md | 0 4px 6px rgba(0,0,0,0.1) | Cards |
| --shadow-lg | 0 10px 15px rgba(0,0,0,0.1) | Dropdowns |
| --shadow-xl | 0 20px 25px rgba(0,0,0,0.15) | Modals |

---

## Layout Specifications

### Container

| Property | Value | Notes |
|----------|-------|-------|
| max-width | 1200px | Desktop max |
| padding-x | 24px | Horizontal padding |
| padding-y | 32px | Vertical padding |

### Grid/Flex Layout

| Property | Value | Notes |
|----------|-------|-------|
| display | flex | Main layout |
| flex-direction | column | Vertical stack |
| gap | 16px | Between items |
| align-items | stretch | Full width children |

### Layout Structure (ASCII)

```
┌─────────────────────────────────────────────────────────────┐
│  Container (max-width: [X]px, padding: [Y]px)               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Header Section (height: [X]px, padding: [Y]px)       │  │
│  │  ┌─────────┐  ┌──────────────────────────────────┐    │  │
│  │  │  Logo   │  │  Title (font: [X], color: [Y])   │    │  │
│  │  └─────────┘  └──────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Main Content (gap: [X]px)                            │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Component A (w: [X], h: [Y], p: [Z])           │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Component B                                    │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Footer (padding: [X]px, gap: [Y]px)                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Style Details

### [Component Name 1] - e.g., Primary Button

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | [FIGMA_NODE_ID] | - |
| width | 100% / [X]px | `width: 100%` |
| height | 48px | `height: 48px` |
| padding | 12px 24px | `padding: 12px 24px` |
| background | #3B82F6 | `background-color: var(--color-primary)` |
| border | none | `border: none` |
| border-radius | 8px | `border-radius: var(--radius-md)` |
| font-family | Inter | `font-family: 'Inter', sans-serif` |
| font-size | 16px | `font-size: 16px` |
| font-weight | 500 | `font-weight: 500` |
| color | #FFFFFF | `color: white` |
| cursor | pointer | `cursor: pointer` |

**States:**
| State | Changes |
|-------|---------|
| Hover | background: #2563EB |
| Active | background: #1D4ED8 |
| Disabled | background: #9CA3AF, cursor: not-allowed |
| Focus | outline: 2px solid #3B82F6, outline-offset: 2px |

---

### [Component Name 2] - e.g., Input Field

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | [FIGMA_NODE_ID] | - |
| width | 100% | `width: 100%` |
| height | 48px | `height: 48px` |
| padding | 12px 16px | `padding: 12px 16px` |
| background | #FFFFFF | `background-color: white` |
| border | 1px solid #E5E7EB | `border: 1px solid var(--color-border)` |
| border-radius | 8px | `border-radius: var(--radius-md)` |
| font-size | 16px | `font-size: 16px` |
| color | #111827 | `color: var(--color-text-primary)` |

**States:**
| State | Changes |
|-------|---------|
| Placeholder | color: #9CA3AF |
| Focus | border-color: #3B82F6, box-shadow: 0 0 0 3px rgba(59,130,246,0.1) |
| Error | border-color: #EF4444 |
| Disabled | background: #F3F4F6, cursor: not-allowed |

---

### [Component Name 3] - e.g., Card

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | [FIGMA_NODE_ID] | - |
| width | 100% | `width: 100%` |
| padding | 24px | `padding: 24px` |
| background | #FFFFFF | `background-color: white` |
| border | 1px solid #E5E7EB | `border: 1px solid var(--color-border)` |
| border-radius | 12px | `border-radius: var(--radius-lg)` |
| box-shadow | 0 1px 3px rgba(0,0,0,0.1) | `box-shadow: var(--shadow-sm)` |

---

## Component Hierarchy with Styles

```
Screen (bg: --color-background)
├── Container (max-w: 1200px, px: 24px, py: 32px)
│   ├── Header (h: 64px, flex, items-center, justify-between)
│   │   ├── Logo (w: 120px, h: 32px)
│   │   └── Navigation (flex, gap: 24px)
│   │       └── NavItem (text: --text-body, color: --color-text-secondary)
│   │
│   ├── Main (flex-1, py: 48px)
│   │   ├── Title (text: --text-heading-1, color: --color-text-primary, mb: 8px)
│   │   ├── Subtitle (text: --text-body, color: --color-text-secondary, mb: 32px)
│   │   │
│   │   └── Form (w: 100%, max-w: 400px, flex, flex-col, gap: 16px)
│   │       ├── FormField (flex, flex-col, gap: 6px)
│   │       │   ├── Label (text: --text-label, color: --color-text-primary)
│   │       │   ├── Input (see Input Field styles above)
│   │       │   └── ErrorText (text: --text-caption, color: --color-error)
│   │       │
│   │       ├── FormField (same structure)
│   │       │
│   │       └── SubmitButton (see Primary Button styles above)
│   │
│   └── Footer (h: 64px, flex, items-center, justify-center)
│       └── FooterText (text: --text-caption, color: --color-text-secondary)
```

---

## Responsive Specifications

### Breakpoints

| Name | Min Width | Max Width |
|------|-----------|-----------|
| Mobile | 0 | 767px |
| Tablet | 768px | 1023px |
| Desktop | 1024px | ∞ |

### Responsive Changes

#### Mobile (< 768px)

| Component | Changes |
|-----------|---------|
| Container | padding: 16px |
| Title | font-size: 24px |
| Form | width: 100% |
| Button | width: 100% |
| Navigation | display: none (hamburger menu) |

#### Tablet (768px - 1023px)

| Component | Changes |
|-----------|---------|
| Container | padding: 24px |
| Form | max-width: 400px, margin: 0 auto |

#### Desktop (≥ 1024px)

| Component | Changes |
|-----------|---------|
| Container | max-width: 1200px, margin: 0 auto |
| Layout | May use 2-column (form + illustration) |

---

## Icon Specifications

| Icon Name | Size | Color | Usage |
|-----------|------|-------|-------|
| icon-email | 20x20 | #6B7280 | Input prefix |
| icon-password | 20x20 | #6B7280 | Input prefix |
| icon-eye | 20x20 | #6B7280 | Password toggle |
| icon-check | 16x16 | #10B981 | Success indicator |
| icon-error | 16x16 | #EF4444 | Error indicator |

---

## Animation & Transitions

| Element | Property | Duration | Easing | Trigger |
|---------|----------|----------|--------|---------|
| Button | background-color | 150ms | ease-in-out | Hover |
| Input | border-color, box-shadow | 150ms | ease-in-out | Focus |
| Card | transform, box-shadow | 200ms | ease-out | Hover |
| Modal | opacity, transform | 200ms | ease-out | Open/Close |
| Dropdown | opacity, transform | 150ms | ease-out | Toggle |

---

## Implementation Mapping

| Design Element | Figma Node ID | Tailwind / CSS Class | React Component |
|----------------|---------------|---------------------|-----------------|
| Primary Button | 123:456 | `btn-primary` / `bg-blue-500 hover:bg-blue-600 ...` | `<Button variant="primary">` |
| Input Field | 123:457 | `input-default` / `border border-gray-200 ...` | `<Input />` |
| Card | 123:458 | `card` / `bg-white rounded-xl shadow-sm ...` | `<Card />` |
| Form Container | 123:459 | `form-container` / `flex flex-col gap-4 ...` | `<Form />` |

---

## Notes

- All colors should use CSS variables for theming support
- Prefer Tailwind utility classes where project uses Tailwind
- Icons should be SVG for scalability
- Font should be loaded via Google Fonts or local files
- Ensure color contrast meets WCAG AA (4.5:1 for normal text)
- All icons **MUST BE** in **Icon Component** instead of svg files or img tags.
```
