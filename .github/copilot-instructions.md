# AI Agent Development Guide

## Project Overview

**Skills Improver** - AI-powered career growth platform that analyzes skill gaps and generates personalized learning paths. Target: frontend developers moving to senior/lead roles.

**Tech Stack**: Next.js 16.1.1 (App Router), Prisma 7.2.0, oRPC 1.13.2, better-auth 1.4.10, AI SDK 6.0.5 (Groq), shadcn/ui with base-ui, PostgreSQL (Neon)

## Critical Architecture Patterns

### Next.js 16 Cache Components Mode

- **Cache components enabled** (`next.config.ts`): ALL pages MUST be server components by default
- **Never use `revalidate` exports** - incompatible with cache components mode
- **Async data pattern**: Wrap async operations in Suspense boundaries
- **Typed routes enabled**: Route paths are type-checked via `types/routes.d.ts`

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

- **GitHub OAuth only** - email/password disabled
- **Session retrieval**: `await auth.api.getSession({ headers: await headers() })`
- **Auth handler**: Use `auth.toNextJsHandler()` in route handlers (NOT `auth.handler`)
- **Protected routes**: Check session in server components, redirect to `/login?redirect={path}` if null
- **Schema requirements**: User model needs `emailVerified: Boolean` and `image: String?`

### Component Library (base-ui)

**CRITICAL**: base-ui does NOT support the `asChild` prop pattern used in Radix UI

```tsx
// ❌ WRONG - asChild doesn't exist in base-ui
<Button asChild><Link href="/path">Text</Link></Button>

// ✅ CORRECT - Use render prop pattern
<Button render={(props) => <Link {...props} href="/path">Text</Link>} />

// ✅ CORRECT - Use composition
<Link href="/path"
    className={`${buttonVariants({
    variant: "outline",
    size: "sm",
  })}`}>Text</Link>
```

### Dark Theme System

- **OkLCH color system** defined in `app/globals.css`
- **Theme provider** with `suppressHydrationWarning` in root layout
- **ALWAYS use semantic tokens**, never hardcoded colors:
  - `bg-card` (not `bg-white`)
  - `text-foreground` (not `text-slate-900`)
  - `bg-primary` (not `bg-blue-600`)
  - `border-border` (not `border-slate-200`)

### Client vs Server Components

- **Server components by default** - no `"use client"` needed
- **Add `"use client"` ONLY for**:
  - Form state management (`useState`, `useForm`)
  - Browser APIs (`useRouter`, `useSearchParams`)
  - Event handlers (`onClick`, `onChange`)
  - React hooks (`useEffect`, `useCallback`)
- **Pattern**: Server page → wraps Client form component

### Server Actions vs API Routes

- **Prefer Server Actions** over API routes when possible
- Server Actions provide better type safety and are co-located with forms
- Use API routes only for:
  - External webhooks (auth callbacks, payment providers)
  - oRPC endpoints
  - Public APIs consumed by external clients

```tsx
// ✅ CORRECT: Server Action
"use server"

async function submitAssessment(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Unauthorized")

  const data = AssessmentSchema.parse(Object.fromEntries(formData))
  await db.assessment.create({ data })
  revalidatePath("/dashboard")
}

// ❌ AVOID: Unnecessary API route
// app/api/assessment/route.ts
export async function POST(request: Request) { ... }
```

### Form Handling Pattern

- **ALWAYS use react-hook-form with Zod** for form validation
- **ALWAYS use `<Field>` component from shadcn** for form fields
- **ALWAYS show loading states** - use `useTransition` or `useFormState`, disable submit, show spinner
- Never use raw `<input>` elements in forms

```tsx
"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field } from "@/components/ui/field";
import { z } from "zod";

const FormSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

export function MyForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: "", name: "" },
  });

  return (
    <form
      onSubmit={form.handleSubmit((data) => {
        startTransition(async () => {
          // Call server action or oRPC procedure
          await submitAction(data);
        });
      })}
    >
      <Field
        label="Name"
        control={form.control}
        name="name"
        render={({ field }) => <Input {...field} disabled={isPending} />}
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
```

### Loading States Pattern

- **Forms**: Use `useTransition` or `useFormState` for pending state, disable inputs and submit button, show text/spinner feedback
- **Data queries**: ALWAYS wrap async server components in Suspense with skeleton fallback from shadcn

```tsx
// ✅ CORRECT: Server component with skeleton fallback
import { Skeleton } from "@/components/ui/skeleton";

function DataSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

async function DataContent() {
  const data = await db.user.findMany();
  return <DataList items={data} />;
}

export default function Page() {
  return (
    <Suspense fallback={<DataSkeleton />}>
      <DataContent />
    </Suspense>
  );
}
```

## Data Layer (Prisma + oRPC)

### Database Access

- **Prisma client**: `import db from "@/lib/db"`
- **Custom output path**: `lib/prisma` (not default `node_modules/.prisma`)
- **Migration workflow**:
  1. Edit `prisma/schema.prisma`
  2. Run `pnpm db:push` (dev) or `prisma migrate dev` (production)
  3. Run `pnpm db:generate` to regenerate client

### oRPC Procedures (TODO - Not Yet Implemented)

- **Type-safe RPC**: All backend calls through oRPC procedures
- **TODO markers**: Assessment flow forms have `// TODO: Save via oRPC` comments
- **Validation**: All inputs/outputs validated with Zod schemas
- **AI outputs**: NEVER return raw LLM output - always validate with Zod first

```typescript
// Future pattern (not yet implemented)
const result = await orpc.assessment.submitAnswer({
  assessmentId: "...",
  answer: "...",
});
```

## AI Integration (Planned)

- **AI SDK v6** with Groq (Kimi 2 model)
- **Structured outputs**: Use `generateObject()` with Zod schemas
- **AI layer**: Server-side only, never expose raw outputs
- **Pattern**: AI returns JSON → validate with Zod → store in Prisma → return typed response

## Assessment Flow (Current Implementation)

**6-step process** (`/app/(app)/assessment/*`):

1. `/start` - Profile setup (role, experience, industry, career intent)
2. `/goal` - Career goal selection (common paths + custom)
3. `/self-evaluation` - 15 skills rated 1-5 across hard/soft/meta categories
4. `/test` - AI skill testing (5 adaptive questions with skip option)
5. `/evidence` - Optional GitHub/portfolio/CV upload
6. `/processing` - Animated processing screen
7. `/results` - Gap report with readiness score, strengths, prioritized gaps

**Pattern**: Each step has server page + client form component with state management and navigation.

## Development Workflow

### Commands

```bash
pnpm dev                 # Start dev server (http://localhost:3000)
pnpm build               # Production build (runs db:generate automatically)
pnpm db:generate         # Regenerate Prisma client
pnpm db:push             # Push schema changes to dev DB
pnpm db:seed             # Seed database with initial data
```

### Environment Variables Required

```env
DATABASE_URL=                 # Neon PostgreSQL connection string
GITHUB_CLIENT_ID=            # GitHub OAuth app ID
GITHUB_CLIENT_SECRET=        # GitHub OAuth app secret
NEXT_PUBLIC_APP_URL=         # App URL (http://localhost:3000 for dev)
```

## File Organization

```
app/(app)/              # Protected routes (requires auth)
app/(auth)/             # Auth routes (login, etc.)
components/assessment/  # Assessment flow forms (client components)
components/ui/          # shadcn/ui components (base-ui wrappers)
lib/                    # Shared utilities
  ├─ auth.ts           # better-auth config
  ├─ db.ts             # Prisma client singleton
  └─ utils.ts          # Tailwind merge utility
plan/                   # Project specs and documentation
prisma/                 # Database schema and migrations
types/                  # TypeScript type definitions
```

## Common Mistakes to Avoid

1. **❌ Using `asChild` prop** - base-ui doesn't support it
2. **❌ Hardcoded colors** - breaks dark mode, use semantic tokens
3. **❌ Client components by default** - causes cache component errors
4. **❌ Missing Suspense** - async data needs Suspense boundaries with Skeleton fallback
5. **❌ Old auth API** - use `toNextJsHandler()` not `handler`
6. **❌ Forgetting `suppressHydrationWarning`** - causes hydration errors with theme provider
7. **❌ Creating API routes instead of Server Actions** - prefer Server Actions for form submissions
8. **❌ Using raw `<input>` in forms** - always use react-hook-form with `<Field>` component
9. **❌ Missing loading states** - forms must show pending state and disable submit; data queries need Skeleton fallback

## Type Safety

- **Strict TypeScript** enabled
- **Typed routes** via Next.js config
- **Zod validation** for forms and API inputs
- **Prisma types** for database models
- **better-auth types**: `Session` and `User` exported from `lib/auth.ts`

## Testing Strategy (Planned)

- Unit tests: Jest/Vitest
- Integration tests: Playwright (assessment flow end-to-end)
- Contract tests: oRPC procedure validation
- AI validation: Zod schema checks for all LLM outputs

## Key Files to Reference

- [Prisma schema](prisma/schema.prisma) - Data model with User, Assessment, Skill, etc.
- [Auth config](lib/auth.ts) - better-auth GitHub OAuth setup
- [Color system](app/globals.css) - OkLCH theme definitions
- [Button component](components/ui/button.tsx) - Example of base-ui wrapper pattern
- [Assessment flow](<app/(app)/assessment/>) - Multi-step form implementation
- [Implementation plan](plan/implementation-plan.md) - Full project roadmap

## Status: MVP Phase (Jan 2026)

- ✅ Next.js 16 setup with cache components
- ✅ Authentication (GitHub OAuth)
- ✅ Dark theme implementation
- ✅ Database schema (Prisma + Neon)
- ✅ Assessment flow UI (6 steps)
- ⏳ oRPC procedures (pending)
- ⏳ AI evaluation layer (pending)
- ⏳ Gap report generation (pending)
