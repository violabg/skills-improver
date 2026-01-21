---
trigger: always_on
---

# AI Agent Development Guide: Skills Improver

**Skills Improver** is an AI-powered career growth platform that analyzes skill gaps and generates personalized learning paths for frontend developers transitioning to senior/lead roles.

**Tech Stack**: Next.js 16.1.1 (App Router, cache components enabled), Prisma 7.2.0 → `lib/prisma`, oRPC 1.13.2, better-auth 1.4.10 (GitHub OAuth), AI SDK 6.0.5 (Groq/Kimi2), react-markdown 10.1.0, HugeIcons (free-icons + react), shadcn/ui (base-ui), PostgreSQL (Neon)

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

| Path                     | Purpose                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `app/(app)/`             | Protected routes (auth required)                                                          |
| `components/assessment/` | Client forms: `ProfileSetupForm`, `SelfEvaluationForm`, `SkillTestForm`, `ResultsContent` |
| `components/ui/`         | shadcn/ui wrappers (base-ui components)                                                   |
| `components/rhf-inputs/` | react-hook-form field components                                                          |
| `lib/ai/`                | AI orchestration: `assessSkill()`, `generateAdvisorResponse()`                            |
| `lib/orpc/`              | Router (procedures), client, context                                                      |
| `prisma/`                | Schema, migrations, seed data                                                             |
| `plan/`                  | Project specs: `1.main-spec.md`, `implementation-plan.md`                                 |

## Development Commands

```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm db:push          # Push Prisma schema to database
pnpm db:generate      # Regenerate Prisma client (runs auto in build)
pnpm db:seed          # Seed 15 core skills from prisma/seed.ts
pnpm prisma studio   # Visual database browser
pnpm build            # Production build
```

**Required environment** (`.env.local`): `DATABASE_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `NEXT_PUBLIC_APP_URL`

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

**Pattern**: All tables properly indexed; `onDelete: Cascade` ensures clean removal

## Critical Patterns (Do This)

| Pattern             | ✅ DO                                                    | ❌ DON'T                               |
| ------------------- | -------------------------------------------------------- | -------------------------------------- |
| **base-ui buttons** | `<Button render={(props) => <Link {...props} />}>`       | `<Button asChild>`                     |
| **Colors**          | Semantic tokens: `bg-card`, `text-foreground`            | Hardcode: `bg-white`, `text-slate-900` |
| **Components**      | Server by default; `"use client"` only for interactivity | `"use client"` on every component      |
| **Async rendering** | Wrap in `Suspense` with `Skeleton`                       | Raw loading states                     |
| **Forms**           | `useTransition()` for pending, disable submit            | Missing loading states                 |
| **rhf-inputs**      | Specific components: `InputField`, `SelectField`         | Generic `Field` component              |
| **Auth routes**     | Check session in server component, redirect              | Trust client-side checks               |
| **AI Stream**       | Use `onFinish` for conversation persistence              | Save only partial history              |
| **API calls**       | Call oRPC from forms                                     | Create REST endpoints                  |

## Status: MVP Phase (Jan 2026)

- ✅ Next.js 16 setup with cache components
- ✅ Authentication (GitHub OAuth)
- ✅ Dark theme implementation
- ✅ Database schema (Prisma + Neon)
- ✅ Assessment flow UI (6 steps)
- ✅ oRPC procedures implemented
- ✅ AI evaluation layer active
- ✅ Gap report generation (completed)
- ✅ Assessment route refactoring (dynamic routes + context)
- ✅ CV upload with R2 storage and AI integration
- ✅ Interactive Learning Roadmap UI
- ✅ Milestone-based progress tracking (Manual + AI verification)
- ✅ AI SDK Chat Streaming with History Persistence
- ✅ Markdown chat rendering with Prism syntax highlighting
- ✅ Lucide to HugeIcons replacement (free-icons set)

## Reference Files

- [oRPC Router](lib/orpc/router.ts) — Procedure definitions (start here for backend logic)
- [Prisma Schema](prisma/schema.prisma) — Data model + constraints
- [Assessment Forms](components/assessment/) — All flow forms
- [AI Functions]
