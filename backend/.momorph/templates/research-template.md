# Research: [FEATURE_NAME]

**Frame**: `[FRAME_ID]-[FRAME_NAME]`
**Date**: [DATE]
**Spec**: `specs/[FRAME_ID]-[FRAME_NAME]/spec.md`

---

## Purpose

This document captures findings from codebase analysis to inform the implementation plan.

---

## Codebase Analysis

### Existing Patterns Identified

#### Component Patterns
| Pattern | Location | Relevance |
|---------|----------|-----------|
| [e.g., Form handling] | `src/components/forms/` | [How it applies to this feature] |
| [e.g., Data fetching] | `src/hooks/useQuery.ts` | [How it applies to this feature] |
| [e.g., Error handling] | `src/utils/errors.ts` | [How it applies to this feature] |

#### API Patterns
| Pattern | Location | Relevance |
|---------|----------|-----------|
| [e.g., REST endpoints] | `src/api/` | [How it applies] |
| [e.g., Validation] | `src/validators/` | [How it applies] |
| [e.g., Auth middleware] | `src/middleware/` | [How it applies] |

#### Testing Patterns
| Pattern | Location | Relevance |
|---------|----------|-----------|
| [e.g., Unit test setup] | `tests/setup.ts` | [How it applies] |
| [e.g., Mock factories] | `tests/factories/` | [How it applies] |
| [e.g., E2E helpers] | `tests/e2e/helpers/` | [How it applies] |

---

## Reusable Components

### Components to Leverage

| Component | Path | Usage in Feature |
|-----------|------|------------------|
| [e.g., Button] | `src/components/ui/Button.tsx` | [Where/how to use] |
| [e.g., Modal] | `src/components/ui/Modal.tsx` | [Where/how to use] |
| [e.g., DataTable] | `src/components/ui/DataTable.tsx` | [Where/how to use] |

### Hooks to Leverage

| Hook | Path | Usage in Feature |
|------|------|------------------|
| [e.g., useAuth] | `src/hooks/useAuth.ts` | [Where/how to use] |
| [e.g., useForm] | `src/hooks/useForm.ts` | [Where/how to use] |
| [e.g., useToast] | `src/hooks/useToast.ts` | [Where/how to use] |

### Services to Leverage

| Service | Path | Usage in Feature |
|---------|------|------------------|
| [e.g., ApiClient] | `src/services/api.ts` | [Where/how to use] |
| [e.g., Storage] | `src/services/storage.ts` | [Where/how to use] |

---

## Integration Points

### APIs to Connect

| API Endpoint | Method | Current Status | Notes |
|--------------|--------|----------------|-------|
| [/api/users] | GET | Exists | [Any modifications needed] |
| [/api/feature] | POST | New | [Must be created] |

### Database Entities

| Entity | Table | Status | Notes |
|--------|-------|--------|-------|
| [User] | users | Exists | [Relationship to add] |
| [Feature] | features | New | [Must be created] |

### External Services

| Service | Purpose | Integration Method |
|---------|---------|-------------------|
| [e.g., Auth0] | Authentication | [SDK/API] |
| [e.g., Stripe] | Payments | [SDK/Webhooks] |

---

## Potential Challenges

### Technical Challenges

| Challenge | Impact | Proposed Solution |
|-----------|--------|-------------------|
| [e.g., State management complexity] | [Med/High] | [Use Zustand with slices] |
| [e.g., Real-time updates] | [High] | [WebSocket integration] |
| [e.g., Large data sets] | [Med] | [Pagination + virtualization] |

### Integration Challenges

| Challenge | Impact | Proposed Solution |
|-----------|--------|-------------------|
| [e.g., Legacy API compatibility] | [High] | [Adapter pattern] |
| [e.g., Auth flow] | [Med] | [Reuse existing middleware] |

---

## Recommendations

### Architecture Recommendations

1. **[Recommendation 1]**: [Explanation and rationale]
2. **[Recommendation 2]**: [Explanation and rationale]
3. **[Recommendation 3]**: [Explanation and rationale]

### Implementation Recommendations

1. **Start with**: [What to implement first and why]
2. **Leverage**: [Existing code/patterns to reuse]
3. **Avoid**: [Anti-patterns or pitfalls to watch for]

### Testing Recommendations

1. **Focus on**: [Critical paths to test]
2. **Mock**: [External dependencies to mock]
3. **E2E scenarios**: [Key user journeys to test end-to-end]

---

## Files to Review Before Implementation

### Must Read

- [ ] `src/[path]` - [Why important]
- [ ] `src/[path]` - [Why important]
- [ ] `tests/[path]` - [Why important]

### Recommended

- [ ] `docs/[path]` - [Context it provides]
- [ ] `src/[path]` - [Pattern to follow]

---

## Open Questions

- [ ] [Question 1 that needs clarification]
- [ ] [Question 2 that needs clarification]
- [ ] [Question 3 that needs clarification]

---

## Notes

[Any additional observations, insights, or context from the research]
