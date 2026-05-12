# Next.js — Backend Conventions

This document describes backend conventions for Next.js route handlers and server-side code in this project. Keep rules concise and practical.

File naming and structure
- Use kebab-case for non-component module filenames (e.g., `user-service.ts`).
- Use PascalCase for React components and classes (e.g., `UserCard.tsx`, `AuthService.ts`).

Data Transfer Objects (DTOs)
- Use decorators like `@Exclude()` when serializing responses to hide sensitive fields (passwords, tokens, secrets).
- DTOs should describe shapes and mapping only; do not put business logic in DTOs.

Avoid circular imports
- Prefer small modules with a clear dependency direction: controllers → services → repositories/utilities.
- Avoid barrel (index) files that import and re-export many modules if they create cycles; if you use barrels, keep them limited and only for types or constants.

# Next.js - Business rules
- Keep business logic in service layer classes. Services should be called from controllers. API routes (route handlers) must not implement business logic.

Coding conventions
- Single responsibility per file; prefer small modules.
- 2-space indentation and ~100 character line width.
- Use single quotes for strings and template literals for interpolation.
- Prefer `const` and immutable patterns for collections.


Next.js — API Routes (route handlers)

Controllers vs Services (tiny contract)
- Controller: Input/out mapping, HTTP-specific concerns, orchestrates services. Should be thin.
- Service: Pure business logic, side effects (DB, external APIs). Should be testable without framework types.

Middleware (concise guidance and short examples)

- Prefer small, composable middleware helpers that can be reused by route handlers or applied globally.
- For route handlers, a common pattern is a wrapper function that validates/authenticates then calls the handler.

Short conceptual examples:

- Auth wrapper (concept): a `withAuth` wrapper that checks the Authorization header and forwards the request to the handler; if missing/invalid, return a 401-style error response.

- Usage (concept): `export const GET = withAuth(async (req) => { /* extract userId, call controller.getProfile({ userId }) */ })` — keep route handler thin and delegate to controller.

- Global middleware (concept): `middleware` performs lightweight checks (headers, redirects, cache) and returns `NextResponse.next()`; configure `matcher` for `/api/:path*`.