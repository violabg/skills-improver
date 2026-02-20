# AI Agent Development Guide: Skills Improver

**Skills Improver** is an AI-powered career growth platform that analyzes skill gaps and generates personalized learning paths for frontend developers transitioning to senior/lead roles.

**Tech Stack**: Next.js 16.1.6 (App Router, cache components enabled), React 19.2.4, Prisma 7.4.0 → `lib/prisma`, oRPC 1.13.5, better-auth 1.4.18 (GitHub OAuth), AI SDK 6.0.90 (Groq/Kimi2), react-markdown 10.1.0, lucide-react 0.574.0, shadcn/ui (base-ui 1.2.0), PostgreSQL (Neon), Vitest 4.0.18

## Critical Architecture Patterns

### Next.js 16 Cache Components

- **`next.config.ts`**: `cacheComponents: true` and `typedRoutes: true` enabled
- **ALL pages are server components by default** — only add `"use client"` for forms, state, browser APIs
- **Never export `revalidate`** — incompatible with cache components
- **Typed routes**: Via `types/routes.d.ts` (route paths type-checked at import)
- **Async pattern**: Wrap async data in `Suspense` with `Skeleton` fallback

```tsx
// ✅ CORRECT: Server component with Suspense
async function PageContent() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return <ClientForm />;
}

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <PageContent />
    </Suspense>
  );
}
```

### Authentication (better-auth)

- **GitHub OAuth only** — email/password disabled
- **Session retrieval**: `await auth.api.getSession({ headers: await headers() })`
- **Auth handler**: Use `auth.toNextJsHandler()` (NOT `auth.handler`)
- **Protected routes**: Check session in server component; redirect to `/login?redirect={path}` if null
- **Schema requirements**: User needs `emailVerified: Boolean` and `image: String?` fields

### Component Library (base-ui)

**CRITICAL**: base-ui does NOT support `asChild` prop. Use `render` prop.

```tsx
// ✅ CORRECT: Use render prop
<Button
  render={(props) => (
    <Link {...props} href="/path">
      Text
    </Link>
  )}
/>
```

### Dark Theme System

- **OkLCH color system** in `app/globals.css` (semantic tokens).
- **Always use tokens**: `bg-card`, `text-foreground`, `border-border`, `bg-primary`.
- **Theme provider**: `suppressHydrationWarning` required.

### Security Configuration

**HTTP Headers** (`next.config.ts`):

- Applied to all `/api/*` routes
- HSTS enabled (1 year max-age)
- CSP: Restricts scripts to self + groq.com/github.com
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: origin-when-cross-origin

**Environment validation** (`lib/env.ts`):

- Lazy Proxy-based validation (validates on first access)
- Prevents client bundle pollution
- Helper functions: `isR2Configured()`, `isAIConfigured()`

### Client vs Server Components

- **Server components by default**. Add `"use client"` ONLY for:
  - Form state (`useState`, `useForm`)
  - Browser APIs (`useRouter`, `localStorage`)
  - React hooks (`useEffect`, `useCallback`)

## Documentation Rule

**CRITICAL**: Any edits that change the app flow (e.g., routing, new features) **MUST** be accompanied by updates to `APP_FLOW.md` and `README.md`.

### Form Handling

- **ALWAYS use react-hook-form + Zod** for validation
- **ALWAYS use specific rhf-inputs components**: `InputField`, `SelectField`, `TextareaField`, `SliderField`, `CheckboxField`, `RadioGroupField`, `PasswordField`, `FileUploadField`, `MultiSelectField`, `SwitchField`
- **NEVER use raw `<input>` or generic `Field` component**
- **ALWAYS show loading states**: `useTransition()`, disable submit/inputs, show spinner text

## Data Layer: Prisma + oRPC

### Testing Configuration

**Vitest Setup** (`vitest.config.ts`):

- Minimal config with path alias `@` → root
- Test files: `lib/orpc/__tests__/*.test.ts`
- Mocking pattern: `vi.mock()` for auth/AI, manual objects for DB
- **No CI/CD or pre-commit hooks configured** - run tests manually

**Example test structure**:

```typescript
import { vi, describe, test, expect, beforeEach } from "vitest";

// Mock external dependencies
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));

describe("procedure tests", () => {
  beforeEach(() => {
    /* reset mocks */
  });
  test("validates input", () => {
    /* ... */
  });
});
```

### Storage Service (R2/S3)

**R2 Storage** (`lib/services/r2-storage.ts`):

- **Lazy env loading**: `getEnvModule()` prevents env bundling in client
- **Separate validation**: `validateResumeFile()` exported for client-side use
- **Error wrapping**: User-friendly messages from AWS SDK errors
- **URL handling**: `extractKeyFromResumeUrl()` supports custom domains

```typescript
import { uploadResume, deleteResume } from "@/lib/services/r2-storage";
import { validateResumeFile } from "@/lib/services/r2-storage";

// Client-side validation (no env access)
const validation = validateResumeFile(file);
if (!validation.valid) return { error: validation.error };

// Server-side upload
const result = await uploadResume(file, userId);
if (!result.success) throw new Error(result.error);
```

**Evidence Processor** (`lib/services/evidenceProcessor.ts`):

- **Graceful degradation**: GitHub API failures return `{ error }` (don't throw)
- **Skill matching**: Text search across skill name + domain
- **Return structure**: `{ signals, rawStored: boolean }`

### Database Access

- **Prisma client**: `import db from "@/lib/db"`
- **Output path**: `lib/prisma` (custom, not `node_modules/.prisma`)
- **Migration workflow**:
  1. Edit `prisma/schema.prisma`
  2. Run `pnpm db:push` (dev) or `prisma migrate dev` (production)
  3. Run `pnpm db:generate` to regenerate client

### oRPC Procedures (ACTIVE)

- **Location**: `lib/orpc/router.ts` (1227 lines)
- **Exposed procedures**: `health.ping` (public); `assessment.*`, `skills.*`, `questions.*` (protected)
- **Type-safe contracts**: Zod schemas on all inputs/outputs
- **Context pattern**: `protectedProcedure` provides `{ input, context }` with authenticated DB access
- **AI outputs**: ALWAYS validate with Zod before storing

```typescript
submitAnswer: protectedProcedure
  .input(
    z.object({
      assessmentId: z.string().uuid(),
      skillId: z.string().uuid(),
      answer: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    const assessment = await context.db.assessment.findFirst({
      where: { id: input.assessmentId },
    });
    // Verify ownership + evaluate
  });
```

**Key procedures**:

- `assessment.*`: `start`, `submitAnswer`, `finalize`, `updateGoal`
- `skills.list`: Standard skill library
- `questions.generateForSkills`: AI question generation
- `gaps.*`: `analyzeSkill`, `save`
- `user.*`: `uploadCv`, `deleteCv`, `getCvSettings`
- `roadmap.*`: `generate`, `startVerification`, `updateMilestone`, `getLatest`

### AI Integration (ACTIVE)

- **Location**: `lib/ai/` — `assessSkill()`, `generateAdvisorResponse()`, schema definitions
- **Model**: Groq Kimi 2 (`moonshotai/kimi-k2-instruct-0905`), `temperature: 0.3`
- **Pattern**: AI SDK v6 `generateText()` with `Output.object({ schema })` for structured outputs
- **Streaming Pattern**: Chat uses `useChat` from `@ai-sdk/react` with `toUIMessageStreamResponse()` for real-time AI responses.
- **Persistence**: Chat history stored as JSON (`UIMessage[]`) in `ChatConversation` model via `onFinish` callback in `/api/chat/route.ts`.
- **Validation**: `GapAnalysisSchema`, `SkillEvaluationSchema` validate all LLM responses before persistence
- **Data flow**: Assessment evaluation in `router.ts` handlers → AI evaluates → Zod validates → stores in `AssessmentResult`
- **CV Integration**: If user enables `useCvForAnalysis`, CV text extracted via `unpdf` and included in gap analysis prompt

### Server Actions (`lib/actions/`)

**Pattern**: Server actions for form submissions and mutations

```typescript
"use server";

export async function submitAnswer(input: AnswerInput) {
  // 1. Validate session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  // 2. Validate ownership
  const assessment = await db.assessment.findFirst({
    where: { id: input.assessmentId, userId: session.user.id },
  });
  if (!assessment) throw new Error("Not found");

  // 3. Perform operation with logging
  try {
    const result = await processAnswer(input);
    dbLogger.info("Answer submitted", { assessmentId: input.assessmentId });
    return result;
  } catch (error) {
    dbLogger.error("Answer submission failed", { error, input });
    throw error;
  }

  // 4. Redirect on success (not return)
  redirect(`/assessment/${input.assessmentId}/next-step`);
}
```

**Key patterns**:

- Validate ownership early: `findFirst({ where: { id, userId } })`
- Use scoped loggers for context
- Redirect for navigation (not return values)
- Batch operations in loops when needed

## Assessment Flow Architecture

**6-step flow** (`/app/(app)/assessment/*`):

| Step | Route                   | Purpose                       | Client Form          | DB Ops                                             |
| ---- | ----------------------- | ----------------------------- | -------------------- | -------------------------------------------------- |
| 1    | `/assessment/start`     | Profile (role, exp, industry) | `ProfileSetupForm`   | Create `Assessment`                                |
| 2    | `/[id]/goal`            | Career target selection       | `CareerGoalForm`     | Update `targetRole`                                |
| 3    | `/[id]/self-evaluation` | Rate 15 skills (1-5)          | `SelfEvaluationForm` | Create `AssessmentResult` (×15)                    |
| 4    | `/[id]/test`            | AI evaluates answers          | `SkillTestForm`      | Update `AssessmentResult` (×5) via `assessSkill()` |
| 5    | `/[id]/evidence`        | Optional GitHub/CV upload     | `EvidenceUploadForm` | Create `Evidence`, update User `cvUrl`             |
| 6    | `/[id]/results`         | Gap report + readiness        | `ResultsContent`     | Create/update `AssessmentGaps`, `GapResources`     |
| 7    | `/[id]/roadmap`         | Interactive learning plan     | `RoadmapContent`     | Create `Roadmap`, `RoadmapWeek`, `Milestone`       |

**Key patterns**:

- Assessment state preserved in React Context (`AssessmentProvider`) and dynamic route `[id]`.
- `assessmentId` accessed via `useAssessment()` hook in client components.
- Shared layout in `/assessment/[id]/layout.tsx` handles authentication and assessment ownership verification.

## Key Directories

| Path                        | Purpose                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| `app/(app)/`                | Protected routes (auth required)                                                          |
| `components/assessment/`    | Client forms: `ProfileSetupForm`, `SelfEvaluationForm`, `SkillTestForm`, `ResultsContent` |
| `components/ui/`            | shadcn/ui wrappers (base-ui components)                                                   |
| `components/ui/rhf-inputs/` | react-hook-form field components                                                          |
| `lib/ai/`                   | AI orchestration: `assessSkill()`, `generateAdvisorResponse()`                            |
| `lib/orpc/`                 | Router (procedures), client, context                                                      |
| `prisma/`                   | Schema, migrations, seed data                                                             |
| `plan/`                     | Project specs: `1.main-spec.md`, `implementation-plan.md`                                 |

## Development Commands

```bash
# Development
pnpm dev              # Start dev server (localhost:3000)
pnpm devAi            # Launch AI SDK devtools inspector

# Database
pnpm db:generate      # Regenerate Prisma client (runs auto in build)
pnpm db:push          # Push Prisma schema to database (dev)
pnpm db:seed          # Seed database with 15 core skills

# Testing
pnpm test             # Run tests in watch mode
pnpm test:ui          # Open Vitest UI dashboard
pnpm test:run         # Single run (CI mode)
pnpm test:coverage    # Generate coverage report

# Build & Deploy
pnpm lint             # Run ESLint (Next.js config)
pnpm build            # Production build (runs db:generate first)
pnpm start            # Run production server
```

**Required environment** (`.env.local`):

- `DATABASE_URL` - PostgreSQL connection string
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `BETTER_AUTH_SECRET` - Required in production
- `GROQ_API_KEY` - AI model access
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` - CV storage
- `NEXT_PUBLIC_APP_URL` - App URL (defaults to localhost:3000)

## Data Model (Prisma)

**Core tables**:

- `User` — GitHub OAuth identity via better-auth, `cvUrl` (String?), `useCvForAnalysis` (Boolean)
- `ChatConversation` — Tracks full AI chat histories as `messages` (Json array of `UIMessage`).
- `Skill` — 15 core skills (HARD/SOFT/META categories)
- `SkillRelation` — Graph edges (prerequisites, dependencies)
- `Assessment` — Run with status IN_PROGRESS/COMPLETED
- `AssessmentResult` — Self-eval + AI test result (level 1-5, confidence, notes, rawAIOutput)
- `AssessmentGaps` — Calculated gaps prioritized by impact
- `GapResources` — Learning materials per gap
- `Evidence` — User evidence uploads (GitHub, portfolio)

**Pattern**: All tables properly indexed; `onDelete: Cascade` ensures clean removal.

## Logging & Error Handling

### Logger Service (`lib/services/logger.ts`)

**ALWAYS use logger instead of console.log**. The logger service provides:

- Environment-aware output (colored dev, JSON prod, suppressed in test)
- Contextual metadata for debugging
- Scoped loggers with automatic prefixes

```typescript
// Use scoped loggers for domain-specific logs
import {
  aiLogger,
  dbLogger,
  authLogger,
  storageLogger,
} from "@/lib/services/logger";

aiLogger.info("Evaluating skill", { skillId, assessmentId });
dbLogger.error("Query failed", { error, query });

// Or create custom scope
import { createScopedLogger } from "@/lib/services/logger";
const roadmapLogger = createScopedLogger("Roadmap");
roadmapLogger.debug("Generating milestones", { weekCount, skills });
```

**Log levels**: `debug` (dev only) → `info` → `warn` → `error`

### Error Handling Conventions

| Layer                | Pattern                                   | Example                                                                  |
| -------------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| **API Routes**       | Return Response with status               | `return new Response("Unauthorized", { status: 401 })`                   |
| **Server Actions**   | Throw for validation, redirect on success | `if (!input) throw new Error("Invalid"); redirect("/success")`           |
| **Server Functions** | Try-catch with scoped logger              | `try { ... } catch (error) { dbLogger.error("...", { error }); throw; }` |
| **oRPC Procedures**  | onError hook logs, returns error          | Configured in router setup                                               |
| **Forms**            | Zod validation + disabled states          | `form.handleSubmit()` with `isPending` from `useTransition()`            |

**Key patterns**:

- ✅ Early returns for 401/404 (authentication, ownership)
- ✅ Structured error objects for recoverable failures
- ✅ Include context: `{ error, userId, resourceId }`
- ❌ Don't use `console.log/error/warn` directly

## Chat & Roadmap Implementation

### Chat Architecture (`/app/api/chat`, `components/chat/`)

**API streaming pattern** (`/app/api/chat/route.ts`):

1. **Context building**: Fetches latest assessment + gaps + recent history
2. **AI streaming**: `streamText()` from AI SDK, wrapped with devtools in dev
3. **Persistence**: `onFinish` callback saves full conversation atomically

```typescript
return streamText({
  model,
  messages: [systemPrompt, ...messages],
  onFinish: async ({ messages: finalMessages }) => {
    // Save full conversation history
    await db.chatConversation.upsert({
      where: { id: chatId },
      update: { messages: finalMessages as unknown as object[] },
      create: {
        /* ... */
      },
    });
  },
}).toUIMessageStreamResponse();
```

**Client patterns** (`components/chat/chat-content.tsx`):

- **Transport memoization**: `useMemo([chatId])` prevents recreations
- **Message sync**: `useEffect` watches `initialMessages`, calls `setMessages()`
- **Loading states**: Track `status === "submitted" | "streaming"`
- **Composition**: `<Conversation>` → `<ConversationContent>` → `<Message>`

**AI Elements** (`components/ai-elements/conversation.tsx`):

- Built on `use-stick-to-bottom` for auto-scroll
- Compound component pattern: `<Message>`, `<MessageContent>`, `<MessageBranch>` exported separately
- Enables flexible composition without prop explosion

### Roadmap Patterns (`components/roadmap/`)

**Data transformation**:

```typescript
// Group milestones by week
const weekGroups = milestones.reduce(
  (acc, m) => {
    if (!acc[m.weekNumber]) acc[m.weekNumber] = [];
    acc[m.weekNumber].push(m);
    return acc;
  },
  {} as Record<number, Milestone[]>,
);

// Find current week (first with incomplete milestones)
const currentWeek = Object.entries(weekGroups).find(([_, ms]) =>
  ms.some((m) => !m.completed),
)?.[0];
```

**State management**:

- Optimistic local updates: `setMilestones(updated)`
- Server refresh: `startTransition(() => router.refresh())`
- Progress calculation: `Math.round((completed / total) * 100)`

## Critical Patterns (Do This)

| Pattern             | ✅ DO                                                     | ❌ DON'T                               |
| ------------------- | --------------------------------------------------------- | -------------------------------------- |
| **base-ui buttons** | `<Button render={(props) => <Link {...props} />}>`        | `<Button asChild>`                     |
| **Colors**          | Semantic tokens: `bg-card`, `text-foreground`             | Hardcode: `bg-white`, `text-slate-900` |
| **Components**      | Server by default; `"use client"` only for interactivity  | `"use client"` on every component      |
| **Async rendering** | Wrap in `Suspense` with `Skeleton`                        | Raw loading states                     |
| **Forms**           | `useTransition()` for pending, disable submit             | Missing loading states                 |
| **rhf-inputs**      | Specific components: `InputField`, `SelectField`          | Generic `Field` component              |
| **Auth routes**     | Check session in server component, redirect               | Trust client-side checks               |
| **AI Stream**       | Use `onFinish` for conversation persistence               | Save only partial history              |
| **API calls**       | Call oRPC from forms                                      | Create REST endpoints                  |
| **Logging**         | Use scoped loggers: `aiLogger.info()`, `dbLogger.error()` | `console.log()`, `console.error()`     |
| **Error context**   | Include metadata: `{ error, userId, resourceId }`         | Plain error strings                    |

## Reference Files

**Core Architecture**:

- [oRPC Router](lib/orpc/router.ts) — Procedure definitions (start here for backend logic)
- [Prisma Schema](prisma/schema.prisma) — Data model + constraints
- [Auth Config](lib/auth.ts) — better-auth setup
- [Environment Config](lib/env.ts) — Centralized env validation

**AI & Services**:

- [AI Functions](lib/ai/) — `assessSkill()`, `generateAdvisorResponse()`
- [Logger Service](lib/services/logger.ts) — Scoped logging utilities
- [Storage Service](lib/services/r2-storage.ts) — R2/S3 file uploads
- [Evidence Processor](lib/services/evidenceProcessor.ts) — GitHub analysis

**UI Components**:

- [Assessment Forms](components/assessment/) — All flow forms
- [Chat Components](components/chat/) — AI chat interface
- [Roadmap Components](components/roadmap/) — Learning plan UI
- [AI Elements](components/ai-elements/) — Conversation primitives

**Testing & Config**:

- [Vitest Config](vitest.config.ts) — Test setup
- [Test Suite](lib/orpc/__tests__/) — Procedure tests
- [Next Config](next.config.ts) — App configuration + security headers

## Quick Start for New Agents

1. **Read first**: This file + [README.md](README.md)
2. **Understand data model**: [prisma/schema.prisma](prisma/schema.prisma)
3. **Check procedures**: [lib/orpc/router.ts](lib/orpc/router.ts)
4. **Test setup**: Run `pnpm dev` and visit `/` to see landing page
5. **Verify auth**: Visit `/login` and test GitHub OAuth
6. **Run tests**: `pnpm test:run` to verify setup

**Common pitfalls**:

- ❌ Using `console.log` instead of logger service
- ❌ Adding `"use client"` unnecessarily
- ❌ Using `asChild` prop (not supported by base-ui)
- ❌ Hardcoding colors instead of semantic tokens
- ❌ Missing Suspense boundaries on async components
- ❌ Not validating ownership in server actions/procedures
