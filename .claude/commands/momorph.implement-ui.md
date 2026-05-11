---
description: Implement UI code from Figma design data. Queries MoMorph MCP for component styles on-demand, downloads assets, implements pixel-perfect UI, then uses Playwright to capture screenshot and compare with Figma design. Auto-fixes visual differences up to 3 iterations.
---

## User Input

```text
$ARGUMENTS
```

# MoMorph: Implement UI from Figma Design Data

You are a **Senior UI Developer** implementing a screen pixel-perfectly by querying Figma design data on-demand via MoMorph MCP — fetching only the component data you need at each step, not the entire frame at once.

**SCOPE**: UI implementation only — no business logic, no API, no database.

---

## Step 0: Parse Input

Extract from `$ARGUMENTS`:
- `SCREEN_ID` — MoMorph screen ID (e.g. `i87tDx10uM`)
- `FILE_KEY` — Figma file key (optional, needed for asset download. e.g. `9ypp4enmFmdK3YAFJLIu6C`)
- `ROUTE` — The page route for Playwright screenshot (optional, e.g. `/homepage-saa`). If not provided, infer from frame name.

If `SCREEN_ID` is missing, **STOP** and ask:

```text
Please provide the screen ID and optionally the file key and route.

Usage: /momorph.implement-ui <screenId> [fileKey] [route]
Example: /momorph.implement-ui i87tDx10uM 9ypp4enmFmdK3YAFJLIu6C /homepage-saa
```

---

## Step 1: Understand Frame Structure

Get an overview of the frame to plan implementation. Use `maxDepth=3` for a lightweight structural view:

```
Tool: mcp__momorph__get_overview
Input: screenId = SCREEN_ID, maxDepth = 3
```

From the overview, identify:
- Top-level sections (Header, Hero, Content, Footer, etc.)
- Component hierarchy and nesting
- Implementation order (top-to-bottom, outside-in)

For more structural detail, increase depth:

```
Tool: mcp__momorph__get_overview
Input: screenId = SCREEN_ID, maxDepth = 5
```

---

## Step 2: Download & Audit Assets

If `FILE_KEY` is provided, download all media assets:

```
Tool: mcp__momorph__get_media_files
Input: screenId = SCREEN_ID
```

For each asset returned:
- Download to `public/assets/{FRAME_NAME}/` (derive FRAME_NAME from the frame name, lowercase hyphenated)
- Create the directory if it doesn't exist
- Track all downloaded assets for use in implementation

Also fetch the frame design image for later comparison:

```
Tool: mcp__momorph__get_frame_image
Input: screenId = SCREEN_ID
```

Save to `.momorph/specs/{FRAME_DIR}/assets/frame.png` for visual comparison.

### 2.1 Asset Audit (MANDATORY)

After downloading, **audit every asset** before using it:

```bash
file public/assets/{FRAME_NAME}/*
```

This reveals the **actual pixel dimensions** of each image. Record them in a mapping:

```
MM_MEDIA_Logo.png         → 52x48    (small icon)
MM_MEDIA_Award_BG.png     → 336x336  (full background)
MM_MEDIA_Top_Talent.png   → 222x36   (text label overlay)
```

**Why**: Asset filenames do NOT indicate their role. A file named `MM_MEDIA_Top_Talent.png` might be a tiny text label (222x36), not a full card image. Using it as a 336x336 background will stretch and break it.

### 2.2 Query Media Node Map

Use the dedicated media listing tool to understand ALL assets at once:

```
Tool: mcp__momorph__list_media_nodes
Input: screenId = SCREEN_ID
```

This returns every `MM_MEDIA_*` node with:
- **Dimensions** (width x height from Figma styles)
- **Parent container** (name, type, size)
- **Sibling count** (how many layers share the same parent)
- **Role hint** (`background`, `icon`, `text-label`, `overlay`, `image`)

Example output:
```
MM_MEDIA_Award_BG       336px x 336px  role=background     parent=D.1.1_Picture-Award
MM_MEDIA_Top_Talent     222px x  36px  role=text-label     parent=Awards-Name
MM_MEDIA_Logo            52px x  48px  role=icon           parent=LOGO
```

### 2.3 Verify Layer Composition for Composite Nodes

When `list_media_nodes` shows sibling count > 1 for a parent, the node is ONE LAYER of a composite. Use `get_node_context` to see all layers:

```
Tool: mcp__momorph__get_node_context
Input: screenId = SCREEN_ID, nodeId = "{asset_node_id}"
```

This returns the node + parent + ALL sibling layers with automatic role analysis:

```
Parent: D.1.1_Picture-Award (INSTANCE) 336px x 336px
Layers:
  [RECTANGLE] Rectangle 5     336px x 336px  role=background (fills parent)
  [INSTANCE]  Awards-Name     221px x  35px  role=text-label/overlay
```

**CRITICAL RULE**: If `layerAnalysis` shows multiple layers, implement them as **separate stacked HTML elements**, NOT as a single `<Image>`:

Wrong: `<Image src="label.png" width={336} height={336} />` (stretches 222x36 label to 336x336)
Right:
```jsx
<div className="relative w-[336px] h-[336px]">
  <Image src="background.png" fill className="object-cover" />          {/* background layer */}
  <Image src="label.png" width={222} height={36} className="relative z-10" /> {/* overlay layer */}
</div>
```

---

## Step 3: Read Project Context (MANDATORY)

**Read constitution FIRST — it governs every line of code you write.**

```text
Read: .momorph/constitution.md
```

This defines the project's **non-negotiable standards**: tech stack, CSS methodology, component patterns, naming conventions, folder structure, import rules. Every implementation decision MUST align with the constitution. If the constitution says "use CSS modules", do NOT use Tailwind. If it says "mobile-first", do NOT write desktop-first media queries.

Then read supporting context:

- `package.json` — framework, dependencies
- `tailwind.config.ts` or `tailwind.config.js` — theme configuration (if Tailwind)
- `src/app/globals.css` — existing global styles
- Existing components in the project — reuse patterns, don't reinvent

Determine and **strictly follow**:
- Framework (Next.js, React, etc.)
- CSS approach (Tailwind classes / CSS modules / styled-components — as the constitution says)
- Existing component patterns (naming, props, file structure)
- Font loading strategy
- Image component conventions (next/image, img, etc.)

---

## Step 4: Implement Section by Section

**⚠️ HARD RULE: query_section → implement → save → THEN next section. No exceptions.**

This is the single most important rule in this command. Violating it will cause incorrect implementation because CSS values are lost from context before they are used.

### What is FORBIDDEN

- ❌ Calling `query_section` on section B before section A's code is written to disk
- ❌ Calling `query_section` on the root frame node to get everything at once
- ❌ Calling `query_by_type` with `includeStyles=true` to bulk-fetch CSS for all nodes of a type (use `includeStyles=false` for lightweight lookups if needed)
- ❌ Having more than ONE section's CSS data in context at a time
- ❌ Writing code from memory of a previous query — if you don't have the CSS data in your current context, re-query

### What is REQUIRED

```text
FOR each section in [Header, Hero, Content subsections..., Footer]:
  1. QUERY  — call query_section for THIS section only (scoped by nodeId, maxDepth ≤ 5)
  2. IMPLEMENT — write the code for THIS section IMMEDIATELY, using exact CSS values from the query
  3. SAVE — write the file to disk
  4. NEXT — only now move to the next section
END FOR
```

**Why**: Querying all sections upfront loads 100+ nodes into context. By the time you implement the 5th section, details from the 1st are pushed out. Query-then-implement keeps only ~20-30 nodes in working memory at a time.

### 4.1 Query THIS Section's Styles

Fetch ONLY the current section's subtree. Scope by `nodeId` (preferred — from Step 1 overview) or resolve by name. Use `query_section` for implementation-ready data including all CSS:

```
Tool: mcp__momorph__query_section
Input: screenId = SCREEN_ID, nodeId = "{current_section_id}", maxDepth = 5
```

If you only have a name, use `nodeName` for fuzzy search:

```
Tool: mcp__momorph__query_section
Input: screenId = SCREEN_ID, nodeName = "{current_section_name}", maxDepth = 5
```

If the section has image nodes, also check their layer composition:

```
Tool: mcp__momorph__get_node_context
Input: screenId = SCREEN_ID, nodeId = "{image_node_id}"
```

### 4.2 Implement THIS Section Immediately

Write the code for THIS section NOW, while the data is fresh in context:
- **Exact CSS values** from the just-queried styles
- **Asset paths** from Step 2 downloads
- **Project conventions** from Step 3 context

**Write the file to disk** (Edit/Write tool) before proceeding to the next section.

### 4.3 Query Next Section (if needed)

Only after the current section's code is saved, query the next section. If a specific component within the section needs more detail, look it up by name:

```
Tool: mcp__momorph__query_component
Input: screenId = SCREEN_ID, name = "{component_name}", includeStyles = true, limit = 3
```

Implement them immediately, then move on.

Implementation rules:

1. Use exact values from Figma — do NOT guess colors, sizes, or spacing
2. Import assets from `public/assets/{FRAME_NAME}/` paths
3. Implement ALL visual states where documented (hover, focus, active, disabled)
4. Follow the project's CSS methodology (Tailwind classes / CSS modules)
5. Handle responsive layout if breakpoints are in the design
6. Use semantic HTML elements where appropriate
7. **Image sizing** — ALWAYS use the audited pixel dimensions from Step 2.1. Set `width` and `height` to the ACTUAL file dimensions, never to the container size. Use `object-contain` or `object-cover` for scaling.
8. **Composite image nodes** — When a Figma INSTANCE/FRAME has multiple image children (background + overlay), implement as stacked layers with `position: relative` parent, `fill` for the background, and explicit dimensions for overlays. NEVER flatten multiple layers into a single `<Image>`.
9. **Reused shared components** — When reusing components from other screens (Header, Footer, etc.), verify that image dimensions in the shared component match the Figma spec for THIS screen. If they differ, either fix the shared component or override locally.

### 4.4 Repeat — NEVER batch queries

Loop Steps 4.1–4.3 for each section. Order: Header → Hero/Main content → Footer.

**Anti-pattern** (DO NOT DO THIS):
```
query_section(nodeId=headerId)     ← query
query_section(nodeId=heroId)       ← query
query_section(nodeId=awardsId)     ← query
query_by_type("TEXT")              ← query ALL text
... now implement everything from memory  ← WRONG: details lost
```

**Correct pattern**:
```
query_section(nodeId=headerId)   → implement Header → save file
query_section(nodeId=heroId)     → implement Hero   → save file
query_section(nodeId=awardsId)   → implement Awards → save file
```

Each query-implement cycle should be self-contained. The only data carried forward between cycles is the file structure (what files exist), not style details.

---

## Step 5: Build Verification

Run a build to ensure no compile errors:

```bash
npm run build
# or
yarn build
```

Fix any build errors before proceeding.

---

## Step 6: Visual Comparison with Playwright

### 6.1 Start Dev Server

Check if a dev server is running. If not:

```bash
npm run dev &
```

Wait for the server to be ready (check `http://localhost:3000` or the configured port).

### 6.2 Capture Implementation Screenshot

Use Playwright MCP to take a full-page screenshot:

```
Tool: mcp__playwright__browser_navigate
Input: url = http://localhost:{port}{ROUTE}

Tool: mcp__playwright__browser_screenshot
Input: width = 1512 (match Figma frame width)
```

Save screenshot to `.momorph/specs/{FRAME_DIR}/assets/implementation.png`.

### 6.3 Compare with Design

Read both images and compare visually:
- `.momorph/specs/{FRAME_DIR}/assets/frame.png` (Figma design)
- `.momorph/specs/{FRAME_DIR}/assets/implementation.png` (implementation)

Identify discrepancies by section:
- Color mismatches
- Spacing/padding differences
- Font size/weight differences
- Missing or misplaced elements
- Layout alignment issues

---

## Step 7: Fix Visual Differences (Max 3 Iterations)

```
FOR iteration = 1 TO 3:
  1. Identify the TOP discrepancies from comparison
  2. For each discrepancy, query the exact component:
     Tool: mcp__momorph__query_component
     Input: screenId = SCREEN_ID, name = "{affected_component}"
  3. Compare queried Figma values vs implemented values
  4. Apply TARGETED fixes — only change what's wrong
  5. Re-build to verify no errors
  6. Re-capture screenshot with Playwright
  7. Re-compare with design
  8. IF visual match is acceptable → EXIT loop
END FOR
```

If still mismatched after 3 iterations, log remaining issues.

---

## Step 8: Report

Print final summary:

```markdown
# Implementation Report: {Frame Name}

## Sections Implemented
- [ ] {Section 1} — {component count} components
- [ ] {Section 2} — {component count} components
- ...

## Assets Used
- {N} images downloaded to public/assets/{FRAME_NAME}/

## Build Status
- {PASS/FAIL}

## Visual Comparison
- Iteration 1: {description of fixes}
- Iteration 2: {description of fixes} (if needed)
- Iteration 3: {description of fixes} (if needed)
- Final status: {MATCH / PARTIAL MATCH / MISMATCH}

## Remaining Issues
- {list any unfixed visual differences}

## Files Created/Modified
- {list of files}
```

---

## Key Principles

1. **Constitution is law** — Read `.momorph/constitution.md` before writing any code. Every decision (CSS approach, naming, folder structure, component pattern) must conform. If you're unsure, re-read the constitution — don't guess.
2. **Query per section, never per frame** — NEVER call `query_section` on the root frame to dump all CSS. Each `query_section` call must be scoped to ONE section by nodeId with bounded maxDepth. `query_by_type` is OK for lightweight lookups (includeStyles=false) but NEVER with includeStyles=true. If CSS data isn't in your current context, re-query — don't write from memory.
3. **Query → implement → save → next** — The strict loop. No exceptions. Having two sections' CSS in context at the same time is a violation. Save code to disk before querying the next section.
4. **Exact values** — Every color, font-size, padding, margin, border-radius comes from the just-queried Figma data. Zero guessing. If you can't find a value, use `query_component` or `get_node` to look it up — don't approximate.
5. **Visual verification** — Always compare with Playwright screenshot. The Figma design image is ground truth.
6. **Targeted fixes** — When fixing visual differences, re-query the specific component to get the correct values. Don't make broad changes.
7. **Audit before render** — ALWAYS run `file` on downloaded assets to check actual pixel dimensions BEFORE writing any `<Image>` tag. Never assume an asset's role from its filename alone.
8. **Respect layer hierarchy** — Figma components with multiple children are multi-layer composites. Use `get_node_context` to understand the stacking order. Implement each layer separately, not as one flattened image.
9. **Verify shared components** — When reusing components from other screens, cross-check dimensions in `get_node` against what the shared code renders. Fix mismatches immediately.
