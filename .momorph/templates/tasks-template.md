# Tasks: [FEATURE_NAME]

**Frame**: `[FRAME_ID]-[FRAME_NAME]`
**Prerequisites**: plan.md (required), spec.md (required), research.md (recommended)

---

## Task Format

```
- [ ] T### [P?] [Story?] Description | file/path.ts
```

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (US1, US2, US3)
- **|**: File path affected by this task

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools
- [ ] T004 Load assets from media files as per plan.md instructions (IMPORTANT)
---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: Core infrastructure required by ALL user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T005 Setup database schema and migrations framework
- [ ] T006 [P] Implement authentication/authorization framework
- [ ] T007 [P] Setup API routing and middleware structure
- [ ] T008 Create base models/entities that all stories depend on
- [ ] T009 Configure error handling and logging infrastructure
- [ ] T010 Setup environment configuration management

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel
---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works]

### Frontend (US1)

- [ ] T011 [P] [US1] Create [Component1] | src/components/[feature]/[Component1].tsx
- [ ] T012 [P] [US1] Create [Component2] | src/components/[feature]/[Component2].tsx
- [ ] T013 [US1] Create page component | src/pages/[feature]/index.tsx
- [ ] T014 [US1] Implement form handling | src/hooks/use[Feature]Form.ts
- [ ] T015 [US1] Connect API integration | src/services/[feature].ts
### Backend (US1)

- [ ] T016 [P] [US1] Create DTO classes | src/modules/[feature]/dto/
- [ ] T017 [US1] Implement service methods | src/modules/[feature]/[feature].service.ts
- [ ] T018 [US1] Create controller endpoints | src/modules/[feature]/[feature].controller.ts
- [ ] T019 [US1] Add input validation | src/modules/[feature]/pipes/

### Tests (US1)

- [ ] T020 [P] [US1] Integration tests | tests/integration/[feature].spec.ts
**Checkpoint**: User Story 1 complete and independently testable

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]
**Independent Test**: [How to verify this story works]

### Frontend (US2)

- [ ] T021 [P] [US2] Create [Component] | src/components/[feature]/[Component].tsx
- [ ] T022 [US2] Extend page functionality | src/pages/[feature]/index.tsx
- [ ] T023 [US2] Add additional hooks | src/hooks/use[Feature][Aspect].ts

### Backend (US2)

- [ ] T024 [P] [US2] Add DTOs | src/modules/[feature]/dto/
- [ ] T025 [US2] Extend service | src/modules/[feature]/[feature].service.ts
- [ ] T026 [US2] Add endpoints | src/modules/[feature]/[feature].controller.ts

### Tests (US2)

- [ ] T027 [US2] Integration tests | tests/integration/[feature].us2.spec.ts

**Checkpoint**: User Stories 1 & 2 complete

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]
**Independent Test**: [How to verify this story works]

### Frontend (US3)

- [ ] T028 [P] [US3] Create components | src/components/[feature]/
- [ ] T029 [US3] Implement functionality | src/pages/[feature]/

### Backend (US3)

- [ ] T030 [P] [US3] Add DTOs | src/modules/[feature]/dto/
- [ ] T031 [US3] Implement logic | src/modules/[feature]/[feature].service.ts

### Tests (US3)

- [ ] T032 [P] [US3] Tests | tests/

**Checkpoint**: All user stories complete

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Refinements affecting multiple stories

- [ ] TXXX [P] Add loading states and error handling
- [ ] TXXX [P] Implement accessibility improvements
- [ ] TXXX [P] Add documentation/comments
- [ ] TXXX Performance optimization
- [ ] TXXX Security hardening
- [ ] TXXX Code cleanup and refactoring

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete


### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Implementation Strategy

### MVP First (Recommended)

1. Complete Phase 1 + 2
2. Complete Phase 3 (User Story 1 only)
3. **STOP and VALIDATE**: Test independently
4. Deploy if ready

### Incremental Delivery

1. Setup + Foundation
2. Add User Story 1 → Test → Deploy
3. Add User Story 2 → Test → Deploy
4. Add User Story 3 → Test → Deploy

---

## Notes

- Commit after each task or logical group
- Run tests before moving to next phase
- Update spec.md if requirements change during implementation
- Mark tasks complete as you go: `[x]`
