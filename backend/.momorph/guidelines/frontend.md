# Frontend Guidelines


## Tailwind & Design Tokens Implementation Guide

This document centralizes the project's Tailwind and design-token guidance for frontend agents. All agents and automated prompts must read and strictly follow this file instead of embedding Tailwind rules directly in prompt templates.

### Purpose

Provide a single source of truth for how design tokens, Tailwind utilities and CSS variables are defined and consumed across the codebase. This ensures consistent usage of tokens, avoids hard-coded values in components, and makes theme updates straightforward.

### Preferred approach (Tailwind + CSS variables)

- Define design tokens (colors, spacing, radii, font sizes, etc.) as CSS variables in the global CSS (for example `src/main.css`, `index.css`, or `global.css`).
- Use Tailwind's utilities generated from CSS variables (Tailwind v4 style) when available. This keeps component code using Tailwind classes like `bg-primary`, `text-brand-500`, `p-layout-4` instead of raw values.

#### Example global CSS snippet

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Colors */
  --color-primary: #0070f3;
  --color-brand-500: #10b981;

  /* Spacing */
  --spacing-layout-4: 1rem;
}
```

### How to use tokens in components

- Prefer Tailwind utility classes that map to tokens (e.g. `bg-primary`, `text-brand-500`).
- If a utility isn't available, use the CSS variable directly (e.g. `style="color: var(--color-primary)"`) as a fallback.
- Never hard-code raw colors, spacing, or typography values in component files.

### Fallback when Tailwind or tokens are unavailable

- If the project or particular package doesn't include Tailwind utilities, use the documented CSS variables directly.
- If CSS variables are missing from the MD specs for a screen, consult `.momorph/contexts/group_specs/*_group.md` `sharedResources.cssVariables` first. If still missing, report back and create a placeholder variable in the global CSS and document the decision.

### Enforcement & agent responsibilities

- Agents must always read this file before generating or modifying UI code.
- Agents must prefer existing utilities and shared styles from `.momorph/contexts/group_specs/*_group.md` over introducing new tokens.
- When adding new tokens, update the global CSS and add a brief note in the corresponding group spec file describing the new token and the reason for adding it.

### Asset and naming conventions

- Use kebab-case for asset filenames: `google-icon.svg`, `hero-image.png`.
- Place assets under `public/assets/{group_name}/{icons|images|logos}/` and import via `/assets/{group_name}/...`.

### Notes

- This file is the canonical Tailwind + design token guideline. Do not replicate this content inline in prompt templates — update templates to reference this file instead.


## Mandatory Guideline: URL and Navigation Implementation

### 1. Core Principle

**ABSOLUTELY NO GUESSWORK. ABSOLUTELY NO HARD-CODING.**

All navigation logic (e.g., `href` for `<a>` tags, `onClick` for `<button>`, navigation after form submission) **MUST** be derived directly from the analyzed documentation files.

Arbitrarily assuming a URL (e.g., seeing a "Sign Up" button and assuming it navigates to `/signup`) is **STRICTLY FORBIDDEN**. Always find the evidence in the documentation first.

---

### 2. Sources of Truth

You have 2 primary sources of truth. Each serves a specific purpose:

#### A. `SCREENFLOW.md` (Primary Source for User Flow)

* **Purpose:** To identify navigation **directly triggered by the user** (e.g., clicking a link, pressing a button).
* **Where to find:** Look for the **"Navigation Graph"** (or "User Flow") section.
* **How to use:**
    1.  Find the current screen you are implementing in the "Navigation Graph".
    2.  Create a "navigation map" for ALL "edges" originating from that screen.
    3.  This map must be in the format: `[Trigger Element Text/Name]` -> `[Exact Destination URL]`

    **Example excerpt from `SCREENFLOW.md`:**
    ```
    Landing Page (/)
      ├─> "Sign In" button          → /auth/signin
      └─> "Sign Up" link            → /auth/signup

    Sign In Page (/auth/signin)
      ├─> "Forgot Password?" link   → /auth/forgot-password
      ├─> Logo click                → /
      └─> Form submit (success)     → /dashboard
    ```
    *From this, you must create this map:*
    * "Sign In" button -> `/auth/signin`
    * "Sign Up" link -> `/auth/signup`

#### B. `group_specs/{group_name}_group.md` (Primary Source for Logic Flow)

* **Purpose:** To identify navigation **triggered by business logic** (e.g., successful form submission, API error response, validation conditions).
* **Where to find:**
    1.  **`apiEndpoints`**: Check API scenarios (success/failure) and see if they require navigation.
    2.  **`validation` / `businessLogic`**: Check for business rules.
    3.  **`componentSpecs`**: Identify the *type* of element (e.g., `type: "submit"` for a button).

* **How to use:**
    * If `componentSpecs` has a button with `type: "submit"`, you **DO NOT** look for its `onClick` action in `SCREENFLOW.md`.
    * Instead, you must look in `SCREENFLOW.md` (the "Navigation Graph") or `businessLogic` to find: "After Form submit (success), where does it go?" (e.g., `/dashboard`).
    * Your logic must be: "When the form is submitted and is successful, *then* navigate to `/dashboard`".

---

### 3. Implementation Workflow

**YOU MUST FOLLOW THESE STEPS BEFORE WRITING CODE:**

#### Step 1: Build the Navigation Map from `SCREENFLOW.md`

1.  Open `.momorph/contexts/SCREENFLOW.md`.
2.  Find the current screen (e.g., `Sign In Page`).
3.  Extract all **direct** navigation (links, buttons) into a map.
    * *Example Map (in the bot's memory):*
        * `"Forgot Password?"` -> `/auth/forgot-password`
        * `Logo` -> `/`

#### Step 2: Build the Logic Map from `group_specs/*.md` and `SCREENFLOW.md`

1.  Open `.momorph/contexts/group_specs/{group_name}_group.md`.
2.  Scan `componentSpecs` to find logic elements (e.g., forms, submit buttons).
3.  Return to `SCREENFLOW.md` ("Navigation Graph") or `group_specs/*.md` (`businessLogic`) to find **conditional** navigation.
    * *Example Logic Map (in the bot's memory):*
        * `Form Submit (Success)` -> `/dashboard`
        * `Form Submit (Failure)` -> `(Stay on page)`
        * `API [POST /api/login] (Success)` -> (Triggers `Form Submit (Success)` logic)

#### Step 3: Cross-Reference and Write Code

1.  Now, begin iterating through `componentSpecs` in `group_specs/*.md` to build the component.
2.  **For each interactive element (button, link, etc.):**
    * **Case 1: The element is a direct navigation Link/Button** (e.g., text is "Forgot Password?").
        * Look up the text "Forgot Password?" in the **Navigation Map (Step 1)**.
        * Found URL is `/auth/forgot-password`.
        * Write code: `<Link href="/auth/forgot-password">Forgot Password?</Link>` (React/Next.js example).
    * **Case 2: The element is a Submit Button** (e.g., text is "Sign In", `type: "submit"`).
        * **DO NOT** assign a navigation `onClick` to this button.
        * Assign it to the form's `submit` action.
        * Write the logic for the `form` (e.g., `onSubmit`):
            * Call the API (from the `apiEndpoints` section).
            * `if (success)`: look up `Form Submit (Success)` in the **Logic Map (Step 2)**.
            * Found URL is `/dashboard`.
            * Write code: `Maps('/dashboard')`.
    * **Case 3: Not Found (Critical Error)**
        * If `componentSpecs` has a "Terms of Service" link, but neither map (Step 1 or 2) defines a URL for it.
        * **STOP.** **Report to the user:** "I found a 'Terms of Service' link in the design, but `SCREENFLOW.md` does not define a destination URL for it. Please update the documentation or provide the URL."

---

### 4. Mandatory Checklist

Before finishing, check yourself:

- [ ] Did I create a "Navigation Map" from `SCREENFLOW.md`?
- [ ] Did I create a "Logic Map" for forms/APIs from both files?
- [ ] Is there any interactive element in my code using a URL that did **NOT** come from these two maps? (If yes -> FIX IT).
- [ ] Have all links/buttons in `componentSpecs` been processed (either assigned a URL or identified as a submit button)?
- [ ] Am I arbitrarily *guessing* any URLs? (If yes -> FIX IT).