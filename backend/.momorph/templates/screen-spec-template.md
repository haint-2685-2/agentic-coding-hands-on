# Screen: [SCREEN_NAME]

## Screen Info

| Property | Value |
|----------|-------|
| **Figma Frame ID** | [FRAME_ID] |
| **Figma Link** | [FIGMA_DIRECT_LINK] |
| **Screen Group** | [GROUP_NAME] |
| **Status** | discovered / analyzed / implemented |
| **Discovered At** | [TIMESTAMP] |
| **Last Updated** | [TIMESTAMP] |

---

## Description

[Brief description of the screen's purpose and main functionality]

---

## Navigation Analysis

### Incoming Navigations (From)

| Source Screen | Trigger | Condition |
|---------------|---------|-----------|
| [screen_name] | [button/link/auto] | [condition if any] |

### Outgoing Navigations (To)

| Target Screen | Trigger Element | Node ID | Confidence | Notes |
|---------------|-----------------|---------|------------|-------|
| [screen_name] | [Button: "Submit"] | [node_id] | high/medium/low | [reasoning] |

### Navigation Rules
- **Back behavior**: [Returns to previous / Specific screen]
- **Deep link support**: [Yes/No] - `/path/to/screen`
- **Auth required**: [Yes/No]

---

## Component Schema

### Layout Structure

```
┌─────────────────────────────────────┐
│            HEADER                    │
│  [Logo] [Title]        [Actions]    │
├─────────────────────────────────────┤
│                                      │
│            BODY                      │
│                                      │
│  ┌─────────────────────────────┐    │
│  │      Main Content           │    │
│  │                             │    │
│  │  [Component 1]              │    │
│  │  [Component 2]              │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                      │
├─────────────────────────────────────┤
│            FOOTER                    │
│  [Primary Action]  [Secondary]      │
└─────────────────────────────────────┘
```

### Component Hierarchy

```
Screen
├── Header (Organism)
│   ├── Logo (Atom)
│   ├── Title (Atom)
│   └── ActionButtons (Molecule)
├── Body (Organism)
│   ├── Form (Organism)
│   │   ├── InputField (Molecule)
│   │   │   ├── Label (Atom)
│   │   │   ├── Input (Atom)
│   │   │   └── ErrorText (Atom)
│   │   └── SubmitButton (Atom)
│   └── InfoSection (Molecule)
└── Footer (Organism)
    ├── PrimaryButton (Atom)
    └── SecondaryButton (Atom)
```

### Main Components

| Component | Type | Node ID | Description | Reusable |
|-----------|------|---------|-------------|----------|
| [Header] | Organism | [id] | Screen header with navigation | Yes |
| [LoginForm] | Organism | [id] | Email/password form | No |
| [SubmitButton] | Atom | [id] | Primary action button | Yes |

---

## Form Fields (If Applicable)

| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|------------|-------------|
| email | email | Yes | Valid email format | "Enter your email" |
| password | password | Yes | Min 8 chars, 1 number | "Enter password" |

### Validation Rules

```typescript
const schema = {
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least one number"),
};
```

---

## API Mapping

### On Screen Load

| API | Method | Purpose | Response Usage |
|-----|--------|---------|----------------|
| [/api/endpoint] | GET | [Load initial data] | [Populate form/display] |

### On User Action

| Action | API | Method | Request Body | Response |
|--------|-----|--------|--------------|----------|
| Submit Form | /auth/login | POST | `{email, password}` | `{token, user}` |
| Click Forgot | - | - | Navigation only | - |

### Error Handling

| Error Code | Message | UI Action |
|------------|---------|-----------|
| 401 | Invalid credentials | Show error toast |
| 422 | Validation failed | Show field errors |
| 500 | Server error | Show retry option |

---

## State Management

### Local State

| State | Type | Initial | Purpose |
|-------|------|---------|---------|
| formData | object | `{}` | Form input values |
| isLoading | boolean | false | Submit loading state |
| errors | object | `{}` | Validation errors |

### Global State (If Applicable)

| State | Store | Read/Write | Purpose |
|-------|-------|------------|---------|
| user | authStore | Write | Save user after login |
| token | authStore | Write | Save JWT token |

---

## UI States

### Loading State
- Show spinner on submit button
- Disable form inputs
- Show skeleton for data loading

### Error State
- Inline field errors below inputs
- Toast notification for API errors
- Retry button for network errors

### Success State
- Success toast message
- Auto-redirect to [target_screen]
- Animation/transition

### Empty State
- N/A for this screen

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Focus management | Auto-focus email field on mount |
| Keyboard navigation | Tab through form fields |
| Screen reader | ARIA labels on all inputs |
| Error announcement | Live region for errors |
| Color contrast | WCAG AA compliant |

---

## Responsive Behavior

| Breakpoint | Layout Changes |
|------------|----------------|
| Mobile (<768px) | Full width form, stacked buttons |
| Tablet (768-1024px) | Centered form, max-width 400px |
| Desktop (>1024px) | Split layout with illustration |

---

## Analytics Events (Optional)

| Event | Trigger | Properties |
|-------|---------|------------|
| screen_view | On mount | `{screen: "login"}` |
| login_attempt | Form submit | `{method: "email"}` |
| login_success | API success | `{user_id}` |
| login_error | API error | `{error_code}` |

---

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| --color-primary | #3B82F6 | Primary buttons |
| --color-error | #EF4444 | Error messages |
| --spacing-form | 16px | Form field gaps |
| --border-radius | 8px | Input corners |

---

## Implementation Notes

### Dependencies
- Form library: [react-hook-form]
- Validation: [zod]
- HTTP client: [axios/fetch]

### Special Considerations
- [Note about specific implementation detail]
- [Edge case to handle]
- [Performance consideration]

---

## Analysis Metadata

| Property | Value |
|----------|-------|
| Analyzed By | Screen Flow Discovery |
| Analysis Date | [DATE] |
| Needs Deep Analysis | Yes/No |
| Confidence Score | High/Medium/Low |

### Next Steps
- [ ] Get detailed design items via list_frame_design_items
- [ ] Extract styles via list_frame_styles
- [ ] Define validation rules with team
- [ ] Review API contract with backend
