# Implementation Plan: Skills-Improver - oRPC API with Auth Middleware

## Overview

Build a typed RPC server using oRPC with a proxy middleware pattern to protect authenticated routes. Implement GitHub OAuth via better-auth, set up the database schema with Prisma, and create core assessment procedures with validated AI outputs.

## Architecture Context

Based on the attached plan files and oRPC documentation, this implementation follows these key decisions:

- **Stack**: Next.js 16.1.1 (App Router), oRPC 1.13.2, Prisma 7.2.0, better-auth 1.4.10, AI SDK 6.0.5
- **Database**: PostgreSQL (Neon) via Prisma ORM as single source of truth
- **Auth**: GitHub OAuth only for MVP using better-auth with Prisma adapter
- **AI**: AI SDK v6 with Groq/Kimi2 for skill assessment evaluation
- **Validation**: Zod schemas for all inputs/outputs, especially AI responses
- **Component Library**: shadcn/ui with base-ui (note: no `asChild` support, use `render` prop)

## Implementation Steps

### Step 1: Initialize Database with Prisma Schema

**Goal**: Create the database schema and run initial migrations

**Actions**:

1. Create `prisma/schema.prisma` with models from `plan/data-model.md`:

   - `User` (id, githubId, email, name, avatarUrl, timestamps)
   - `Skill` (id, name, category enum, domain, difficulty, assessable, transferable)
   - `SkillRelation` (id, fromSkillId, toSkillId, strength for graph traversal)
   - `Assessment` (id, userId, targetRole, status, timestamps)
   - `AssessmentResult` (id, assessmentId, skillId, level, confidence, notes, rawAIOutput)
   - `Resource` (id, provider, url, title, cost, estimatedTime)
   - `Evidence` (id, userId, provider, referenceUrl, signals, rawStored, retentionUntil)

2. Run `prisma migrate dev --name init` to create tables
3. Create `lib/db.ts` with Prisma Client singleton instance
4. Test connection with `npx prisma studio`

**Critical Requirements**:

- All AI outputs to `AssessmentResult` must be validated via Zod before persist
- Evidence `signals` minimized to necessary metrics only
- `rawStored` defaults to false unless explicit consent

**Files to Create**:

- `prisma/schema.prisma`
- `lib/db.ts`

### Step 2: Configure GitHub OAuth and better-auth

**Goal**: Set up authentication flow with GitHub OAuth

**Actions**:

1. Create GitHub OAuth App at https://github.com/settings/developers
   - Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
   - Obtain `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
2. Add to `.env.local`:

   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

3. Create `lib/auth.ts` with better-auth configuration:

   - Use `prismaAdapter` with Postgres provider
   - Configure GitHub social provider
   - Export auth instance and helper functions

4. Create auth route handler at `app/api/auth/[...all]/route.ts`:

   - Import auth instance
   - Export GET and POST handlers
   - Handle all better-auth routes

5. Create `lib/auth-client.ts` for frontend:
   - Export typed auth client
   - Provide hooks for session management

**Critical Requirements**:

- Session mapped to `User` record in database
- Clear privacy/consent wording on login screen
- Public routes accessible without auth
- Protected routes require valid session

**Files to Create**:

- `lib/auth.ts`
- `lib/auth-client.ts`
- `app/api/auth/[...all]/route.ts`

### Step 3: Build oRPC Infrastructure with Auth Middleware

**Goal**: Create oRPC base infrastructure with authentication middleware using proxy pattern

**Actions**:

1. Create `lib/orpc/context.ts`:

   - Define base context with `db` (Prisma Client)
   - Define authenticated context extending base with `user`
   - Export context type inference helpers

2. Create `lib/orpc/procedures.ts`:

   - Import auth helpers from `lib/auth.ts`
   - Create base `procedure` with db in context
   - Create `withAuth` middleware that:
     - Validates better-auth session from request headers
     - Fetches user from database
     - Extends context with `user` object
     - Throws unauthorized error if session invalid
   - Export `publicProcedure` (base procedure)
   - Export `protectedProcedure` (base procedure with withAuth middleware)

3. Example middleware pattern:
   ```typescript
   const withAuth = middleware(async ({ ctx, next }) => {
     const session = await auth.api.getSession({ headers: ctx.headers });
     if (!session) {
       throw new ORPCError({
         code: "UNAUTHORIZED",
         message: "Not authenticated",
       });
     }
     const user = await ctx.db.user.findUnique({
       where: { id: session.user.id },
     });
     if (!user) {
       throw new ORPCError({ code: "UNAUTHORIZED", message: "User not found" });
     }
     return next({ ctx: { ...ctx, user } });
   });
   ```

**Critical Requirements**:

- Middleware validates session on every protected procedure call
- Clear error messages for auth failures
- Context properly typed for TypeScript inference

**Files to Create**:

- `lib/orpc/context.ts`
- `lib/orpc/procedures.ts`

### Step 4: Setup oRPC Router and Handler

**Goal**: Create router with namespaced procedures and Next.js API handler

**Actions**:

1. Create `lib/orpc/router.ts`:

   - Import public/protected procedures
   - Define router with namespaces:
     - `health`: public procedures (ping)
     - `assessment`: protected procedures (start, submitAnswer, getResults)
     - `skills`: mixed (getGraph public, others protected)
   - Export router and inferred types

2. Example router structure:

   ```typescript
   export const router = {
     health: {
       ping: publicProcedure.query(() => ({ ok: true })),
     },
     assessment: {
       start: protectedProcedure
         .input(z.object({ targetRole: z.string() }))
         .mutation(async ({ input, ctx }) => {
           /* ... */
         }),
       submitAnswer: protectedProcedure
         .input(z.object({ assessmentId: z.string(), answer: z.string() }))
         .mutation(async ({ input, ctx }) => {
           /* ... */
         }),
     },
   };
   ```

3. Create `app/api/orpc/[...path]/route.ts`:

   - Import `RPCHandler` from `@orpc/server/fetch`
   - Import router
   - Create handler instance with router and interceptors
   - Define `handleRequest` function per orpc.dev docs
   - Export HEAD, GET, POST, PUT, PATCH, DELETE methods

4. Create `lib/orpc/client.ts`:
   - Import `RPCLink` from `@orpc/client/fetch`
   - Configure link with URL and headers (Next.js headers support)
   - Create and export typed client
   - Support both browser and server environments

**Critical Requirements**:

- Follow oRPC Next.js adapter pattern from https://orpc.dev/docs/adapters/next
- Proper error handling with `onError` interceptor
- Typed client for end-to-end type safety
- Support SSR optimization (server-side client)

**Files to Create**:

- `lib/orpc/router.ts`
- `app/api/orpc/[...path]/route.ts`
- `lib/orpc/client.ts`

### Step 5: Implement AI Evaluation Layer

**Goal**: Create AI orchestration with validated outputs for skill assessment

**Actions**:

1. Create `lib/ai/models.ts`:

   - Import AI SDK and Groq provider
   - Configure Groq model (Kimi2)
   - Export model instance with settings

2. Create Zod schemas in `lib/ai/schemas/`:

   - `skillEvaluation.schema.ts`:
     ```typescript
     export const SkillEvaluationSchema = z.object({
       skillId: z.string(),
       level: z.number().min(0).max(5),
       confidence: z.number().min(0).max(1),
       notes: z.string(),
     });
     ```
   - `gapExplanation.schema.ts`: schema for gap analysis outputs
   - `resourceRecommendation.schema.ts`: schema for resource suggestions

3. Create assessment evaluation functions in `lib/ai/`:

   - `assessSkill.ts`: use `generateObject` from AI SDK
   - Validate outputs with Zod before returning
   - Handle AI errors gracefully with fallbacks
   - Cache evaluations to control costs

4. Update `assessment.submitAnswer` procedure:
   - Call AI evaluation function
   - Validate response with Zod schema
   - Persist to `AssessmentResult` table
   - Return typed result to client

**Critical Requirements**:

- Never expose raw AI output to frontend
- All AI responses validated before DB writes
- Temperature set low (0.3) for consistent evaluation
- Implement caching to avoid duplicate evaluations
- Log validation failures for monitoring

**Files to Create**:

- `lib/ai/models.ts`
- `lib/ai/schemas/skillEvaluation.schema.ts`
- `lib/ai/schemas/gapExplanation.schema.ts`
- `lib/ai/assessSkill.ts`

### Step 6: Add Contract Tests and Validation

**Goal**: Ensure type safety and auth protection with automated tests

**Actions**:

1. Setup testing framework (Vitest recommended):

   - Install `vitest` and related dependencies
   - Configure `vitest.config.ts`
   - Setup test database or mocking strategy

2. Write oRPC contract tests:

   - Test input validation (invalid schemas rejected)
   - Test output schemas (returned data matches contract)
   - Test error handling (proper error codes returned)
   - Example tests:
     - `health.ping` returns `{ ok: true }`
     - `assessment.start` requires auth
     - `assessment.submitAnswer` validates AI output schema

3. Write auth middleware tests:

   - Protected procedures reject requests without session
   - Protected procedures reject invalid/expired sessions
   - Protected procedures succeed with valid session
   - Context properly extended with user object

4. Write integration test for assessment flow:

   - User authenticates
   - Starts assessment (`assessment.start`)
   - Submits answers (`assessment.submitAnswer`)
   - Retrieves results (`assessment.getResults`)
   - Validates full data flow and persistence

5. Optional: Add Playwright E2E test:
   - Full browser test of login → assessment → results
   - Validates UI integration with oRPC client

**Critical Requirements**:

- All procedures have contract tests
- Auth middleware thoroughly tested
- CI pipeline runs tests before merge
- Test coverage for critical paths (auth, AI validation, data persistence)

**Files to Create**:

- `vitest.config.ts`
- `lib/orpc/__tests__/procedures.test.ts`
- `lib/orpc/__tests__/auth.test.ts`
- `lib/ai/__tests__/validation.test.ts`

## Technical Patterns & Best Practices

### Middleware Proxy Pattern (from orpc.dev)

The `withAuth` middleware acts as a proxy that intercepts procedure calls and extends context:

```typescript
const withAuth = middleware(async ({ ctx, next }) => {
  // Validate session
  const session = await validateSession(ctx.headers);

  // Fetch user data
  const user = await ctx.db.user.findUnique({ where: { id: session.userId } });

  // Extend context and continue
  return next({ ctx: { ...ctx, user } });
});
```

### AI Output Validation Pattern

All AI outputs must follow this pattern:

1. Call AI with structured prompt
2. Validate response with Zod schema
3. Handle validation failures gracefully
4. Persist only validated data
5. Return typed result

```typescript
const result = await generateObject({
  model: groq("kimi2"),
  schema: SkillEvaluationSchema,
  prompt: buildPrompt(input),
  temperature: 0.3,
});

// Validation happens inside generateObject
// If invalid, error is thrown
// Only valid data reaches this point

await ctx.db.assessmentResult.create({ data: result });
```

### oRPC Client Usage (Frontend)

```typescript
import { client } from "@/lib/orpc/client";

// Fully typed, auto-completed
const result = await client.assessment.submitAnswer({
  assessmentId: "...",
  answer: "React hooks...",
});

// result is typed as SkillEvaluation
console.log(result.level, result.confidence);
```

## Project Structure Recommendation

For MVP, use single Next.js app structure (not monorepo):

```
skills-improver/
├── app/
│   ├── api/
│   │   ├── auth/[...all]/route.ts
│   │   └── orpc/[...path]/route.ts
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/page.tsx
│   └── (app)/
│       ├── dashboard/page.tsx
│       └── assessment/page.tsx
├── lib/
│   ├── auth.ts
│   ├── auth-client.ts
│   ├── db.ts
│   ├── orpc/
│   │   ├── context.ts
│   │   ├── procedures.ts
│   │   ├── router.ts
│   │   └── client.ts
│   └── ai/
│       ├── models.ts
│       ├── assessSkill.ts
│       └── schemas/
├── prisma/
│   └── schema.prisma
├── components/
└── tests/
```

Refactor to monorepo later if:

- Multiple deployment targets needed
- Clear separation between teams
- Shared logic across multiple apps

## Further Considerations

### 1. Project Structure Decision

**Question**: Monorepo with `packages/server` vs single Next.js app?

**Recommendation**: Single Next.js app for MVP

- Reduces complexity and tooling overhead
- Next.js App Router naturally separates client/server code
- Easier to deploy and manage initially
- Can refactor to monorepo later if needed

**Defer to monorepo if**:

- Building multiple frontends (admin panel, mobile app)
- Deploying server independently from frontend
- Multiple teams working on different parts

### 2. Middleware Proxy Pattern

**Question**: Place `withAuth` inline in procedures vs separate factory?

**Recommendation**: Factory pattern with `protectedProcedure`

- Cleaner reuse across multiple procedures
- Clear distinction between public/protected routes
- Easier to add more middleware layers later
- Standard pattern in tRPC/oRPC ecosystems

**Pattern**:

```typescript
// Clear and reusable
export const publicProcedure = baseProcedure;
export const protectedProcedure = baseProcedure.use(withAuth);
```

### 3. Error Handling Strategy

**Question**: Standard error codes and custom error classes?

**Recommendation**: Define standard error codes extending `ORPCError`

- `UNAUTHORIZED`: Missing or invalid auth
- `FORBIDDEN`: Valid auth but insufficient permissions
- `VALIDATION_FAILED`: Input validation errors
- `AI_TIMEOUT`: AI provider timeout/failure
- `RESOURCE_NOT_FOUND`: Entity not found in database

**Pattern**:

```typescript
import { ORPCError } from "@orpc/server";

export class AuthError extends ORPCError {
  constructor(message = "Not authenticated") {
    super({ code: "UNAUTHORIZED", message });
  }
}

export class ValidationError extends ORPCError {
  constructor(issues: z.ZodIssue[]) {
    super({
      code: "VALIDATION_FAILED",
      message: "Validation failed",
      data: issues,
    });
  }
}
```

### 4. Cost Control & Caching

**Strategies**:

- Cache AI evaluations in database (keyed by skillId + answer hash)
- Set request rate limits per user
- Monitor Groq free tier usage
- Implement fallback heuristics if AI fails
- Pre-compute common assessments

### 5. Privacy & Evidence Handling

**Requirements from plan**:

- Evidence upload optional and requires explicit consent
- Only minimal signals extracted and stored by default
- Raw artifacts stored only if user opts in with `retentionUntil`
- Clear UI showing what will be extracted before upload
- Audit log for all evidence processing

## Success Criteria

MVP is complete when:

1. ✅ User can authenticate with GitHub OAuth
2. ✅ User can start an assessment (creates `Assessment` record)
3. ✅ User can submit answers that are evaluated by AI
4. ✅ AI outputs are validated with Zod and persisted correctly
5. ✅ User can view assessment results and skill gaps
6. ✅ Protected routes reject unauthenticated requests
7. ✅ Contract tests pass for all procedures
8. ✅ Integration test covers full assessment flow

## Timeline Estimate

- **Week 1**: Steps 1-2 (Database + Auth) — 5 days
- **Week 2**: Steps 3-4 (oRPC infrastructure + Router) — 5 days
- **Week 3**: Step 5 (AI evaluation) — 5 days
- **Week 4**: Step 6 (Tests + Polish) — 5 days

Total: 4 weeks for MVP foundation

## References

- oRPC Next.js Adapter: https://orpc.dev/docs/adapters/next
- better-auth Documentation: https://better-auth.com
- AI SDK Documentation: https://sdk.vercel.ai/docs
- Prisma Documentation: https://www.prisma.io/docs
- Plan files in `/plan/` directory

## Next Actions

1. Create GitHub OAuth app and obtain credentials
2. Implement Step 1 (Prisma schema) and validate with `prisma studio`
3. Implement Step 2 (better-auth) and test login flow
4. Proceed with Steps 3-6 in sequence
