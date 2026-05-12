# Implementation Plan: [FEATURE_NAME]

**Frame**: `[FRAME_ID]-[FRAME_NAME]`
**Date**: [DATE]
**Spec**: `specs/[FRAME_ID]-[FRAME_NAME]/spec.md`

---

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

---

## Technical Context

**Language/Framework**: [e.g., TypeScript/Next.js, TypeScript/NestJS]
**Primary Dependencies**: [e.g., React, TailwindCSS, Prisma]
**Database**: [e.g., PostgreSQL, MongoDB, or N/A]
**Testing**: [e.g., Jest, Vitest, Playwright]
**State Management**: [e.g., Zustand, Redux, Context API]
**API Style**: [e.g., REST, GraphQL]

---

## Constitution Compliance Check

*GATE: Must pass before implementation can begin*

- [ ] Follows project coding conventions
- [ ] Uses approved libraries and patterns
- [ ] Adheres to folder structure guidelines
- [ ] Meets security requirements
- [ ] Follows testing standards

**Violations (if any)**:

| Violation | Justification | Alternative Rejected |
|-----------|---------------|---------------------|
| [e.g., New library] | [Why needed] | [Why existing won't work] |

---

## Architecture Decisions

### Frontend Approach

- **Component Structure**: [e.g., Atomic design, Feature-based]
- **Styling Strategy**: [e.g., Tailwind utilities, CSS Modules]
- **Data Fetching**: [e.g., React Query, SWR, Server Components]

### Backend Approach

- **API Design**: [e.g., RESTful endpoints, GraphQL resolvers]
- **Data Access**: [e.g., Repository pattern, Direct ORM]
- **Validation**: [e.g., Zod, class-validator]

### Integration Points

- **Existing Services**: [List services this feature integrates with]
- **Shared Components**: [List reusable components to leverage]
- **API Contracts**: [Reference to contract definitions]

---

## Project Structure

### Documentation (this feature)

```text
.momorph/specs/[FRAME_ID]-[FRAME_NAME]/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Codebase research findings
├── tasks.md             # Task breakdown (next step)
├── testcase.md          # (optional) Test cases
└── contract.md          # (optional) API contracts
```

### Source Code (affected areas)

```text
# Frontend
src/
├── components/[feature]/     # Feature-specific components
├── pages/[feature]/          # Page components
├── hooks/use[Feature].ts     # Custom hooks
├── services/[feature].ts     # API calls
└── types/[feature].ts        # TypeScript types

# Backend
src/
├── modules/[feature]/        # Feature module
│   ├── [feature].controller.ts
│   ├── [feature].service.ts
│   ├── [feature].repository.ts
│   └── dto/
├── entities/[entity].ts      # Database entities
└── migrations/               # Database migrations

# Tests
tests/
├── unit/[feature]/
├── integration/[feature]/
└── e2e/[feature]/
```

---

## Implementation Strategy

### Phase Breakdown

1. **Setup**: Project scaffolding, dependencies
2. **Foundation**: Shared infrastructure, base components
3. **User Story 1 (P1)**: Core MVP functionality
4. **User Story 2 (P2)**: Enhanced features
5. **User Story 3 (P3)**: Additional features
6. **Polish**: Refinements, optimizations

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | [Low/Med/High] | [Low/Med/High] | [Strategy] |
| [Risk 2] | [Low/Med/High] | [Low/Med/High] | [Strategy] |

### Estimated Complexity

- **Frontend**: [Low/Medium/High]
- **Backend**: [Low/Medium/High]
- **Testing**: [Low/Medium/High]

---

## Integration Testing Strategy

### Test Scope

*Define what needs integration testing for this feature:*

- [ ] **Component/Module interactions**: [List internal components that need integration verification]
- [ ] **External dependencies**: [List external services, APIs, or systems to test against]
- [ ] **Data layer**: [Database, storage, cache - if applicable]
- [ ] **User workflows**: [End-to-end flows spanning multiple components]

### Test Categories

*Select applicable categories and define specific test scenarios:*

| Category | Applicable? | Key Scenarios |
|----------|-------------|---------------|
| UI ↔ Logic | [Yes/No] | [e.g., Form submission flow, navigation] |
| Service ↔ Service | [Yes/No] | [e.g., Auth service integration] |
| App ↔ External API | [Yes/No] | [e.g., Payment gateway, third-party SDK] |
| App ↔ Data Layer | [Yes/No] | [e.g., CRUD operations, sync] |
| Cross-platform | [Yes/No] | [e.g., iOS/Android parity, responsive behavior] |

### Test Environment

- **Environment type**: [e.g., Local, Staging, Emulator/Simulator, Test containers]
- **Test data strategy**: [e.g., Fixtures, Factories, Seeded database, Mock server]
- **Isolation approach**: [e.g., Fresh state per test, Transaction rollback, Sandboxed environment]

### Mocking Strategy

| Dependency Type | Strategy | Rationale |
|-----------------|----------|-----------|
| [e.g., Core services] | [Real/Mock/Stub] | [Why this choice] |
| [e.g., External APIs] | [Real/Mock/Stub] | [Why this choice] |
| [e.g., Platform features] | [Real/Mock/Stub] | [Why this choice] |

### Test Scenarios Outline

*List key integration test scenarios for this feature:*

1. **Happy Path**
   - [ ] [Scenario description]
   - [ ] [Scenario description]

2. **Error Handling**
   - [ ] [Scenario description]
   - [ ] [Scenario description]

3. **Edge Cases**
   - [ ] [Scenario description]
   - [ ] [Scenario description]

### Tooling & Framework

- **Test framework**: [e.g., Jest, XCTest, Espresso, Flutter Test, Pytest]
- **Supporting tools**: [e.g., Mock server, Test containers, Device farm]
- **CI integration**: [How tests will run in pipeline]

### Coverage Goals

| Area | Target | Priority |
|------|--------|----------|
| [e.g., Core user flows] | [e.g., 90%+] | [High/Medium/Low] |
| [e.g., Integration points] | [e.g., 85%+] | [High/Medium/Low] |
| [e.g., Error scenarios] | [e.g., 75%+] | [High/Medium/Low] |

---

## Dependencies & Prerequisites

### Required Before Start

- [ ] `constitution.md` reviewed and understood
- [ ] `spec.md` approved by stakeholders
- [ ] `research.md` completed
- [ ] API contracts defined (if applicable)
- [ ] Database migrations planned (if applicable)

### External Dependencies

- [List any external APIs, services, or resources needed]

---

## Next Steps

After plan approval:

1. **Run** `/momorph.tasks` to generate task breakdown
2. **Review** tasks.md for parallelization opportunities
3. **Begin** implementation following task order

---

## Notes

[Any additional context, assumptions, or design decisions]
