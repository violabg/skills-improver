# Skills Improver

An AI-powered career growth platform that analyzes skill gaps and generates personalized learning paths. Built for frontend developers transitioning to senior/lead roles.

## Overview

**Skills Improver** is a web application designed to help technical professionals identify skill gaps and create actionable learning plans. Instead of recommending generic courses, it uses AI to assess your current abilities, understand your career goals, and deliver a prioritized roadmap of exactly what you need to learn.

### Key capabilities

- **AI-Powered Assessment** - 6-step guided process that combines self-evaluation with AI-driven skill testing
- **Skill Gap Analysis** - Individualized reports showing readiness scores and prioritized gaps
- **Interactive Roadmap** - AI-generated weekly learning path with milestones and verification
- **AI Career Advisor** - Persistent chat with auto-load history, invalid ID handling, and Markdown support
- **Evidence Integration** - Connect GitHub repos and upload CVs for more accurate analysis
- **Goal-Centric Growth** - Define targets (e.g., "Senior Frontend Developer") and focus your efforts

## Tech Stack

| Layer        | Technology                       | Purpose                                |
| ------------ | -------------------------------- | -------------------------------------- |
| **Frontend** | Next.js 16 (App Router)          | Server components with React 19        |
| **Backend**  | Node.js + TypeScript             | Server-side logic and AI orchestration |
| **API**      | oRPC 1.13                        | Type-safe RPC procedures               |
| **Database** | PostgreSQL (Neon) via Prisma     | Skill graph, assessments, results      |
| **AI**       | AI SDK 6 with Groq (Kimi 2)      | Structured skill evaluation            |
| **Markdown** | react-markdown 10.1              | Chat message rendering                 |
| **Auth**     | better-auth 1.4                  | GitHub OAuth                           |
| **UI**       | shadcn/ui + HugeIcons + Tailwind | Component library with dark theme      |
| **Forms**    | react-hook-form + Zod            | Type-safe form validation              |

## Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** (or npm/yarn)
- **PostgreSQL** database (Neon recommended for serverless Postgres)
- **GitHub OAuth app** credentials (for authentication)

### Installation

1. **Clone and install**

   ```bash
   git clone <repository>
   cd skills-improver
   pnpm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env.local
   ```

   Set these variables:

   ```env
   DATABASE_URL=postgresql://[user]:[password]@[host]/[database]
   GITHUB_CLIENT_ID=your_github_oauth_id
   GITHUB_CLIENT_SECRET=your_github_oauth_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Initialize database**

   ```bash
   pnpm db:push          # Push schema to dev database
   pnpm db:seed          # Seed with 15 core skills
   ```

4. **Start development server**

   ```bash
   pnpm dev
   ```

   Open <http://localhost:3000> in your browser.

## Assessment Flow

The core user experience guides learners through a structured 6-step process:

### Step 1: Profile Setup

User provides context: current role, years of experience, industry, and career intent.

### Step 2: Career Goal

Select or define the target role (e.g., "Senior Frontend Developer" or "Tech Lead").

### Step 3: Self-Evaluation

Rate your confidence in 15 core skills across hard skills, soft skills, and meta-skills using a 1-5 scale.

### Step 4: Skill Validation Test

AI generates personalized interview questions for skills you want validated. Each answer is evaluated for actual competence level.

### Step 5: Evidence (Optional)

Connect external evidence: GitHub profile for repository analysis, or upload your CV (PDF) for enhanced skill assessment.

### Step 6: Results

Comprehensive skill gap report with real-time per-skill AI analysis:

- **Progress UI** - Watch each skill analyzed in real-time
- **Readiness Score** - Overall readiness for target role (0-100%)
- **Strengths** - Core competencies you already have
- **Prioritized Gaps** - Skills ranked by impact on your goal
- **Resources** - AI-curated learning materials for each gap

### Step 7: Learning Roadmap

A personalized, time-bound plan to close your gaps:

- **Weekly Milestones** - Structured learning journey
- **Interactive Verification** - Self-report or AI-verify your progress
- **Rich Resources** - Direct links to curated learning materials

## Project Structure

```text
skills-improver/
├── app/
│   ├── (app)/              # Protected routes (requires auth)
│   │   ├── assessment/     # 6-step assessment flow
│   │   │   ├── [id]/       # Dynamic route for assessment sessions
│   │   │   └── start/      # Entry point for new assessments
│   │   ├── dashboard/      # User dashboard
│   │   └── skills/         # Skills explorer
│   ├── (auth)/             # Auth routes
│   │   └── login/
│   ├── api/
│   │   ├── auth/          # OAuth handler
│   │   ├── chat/          # AI Chat streaming & history
│   │   ├── orpc/          # oRPC endpoint
│   │   └── seed/          # Database seeding
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/
│   ├── assessment/        # Assessment form components
│   ├── ui/                # shadcn/ui wrappers (base-ui)
│   ├── rhf-inputs/        # react-hook-form field components
│   └── theme-provider.tsx # Dark mode setup
├── lib/
│   ├── auth.ts            # better-auth configuration
│   ├── db.ts              # Prisma client singleton
│   ├── ai/                # AI orchestration
│   ├── actions/           # Server actions
│   └── orpc/              # oRPC procedure router
├── prisma/
│   ├── schema.prisma      # Data model
│   └── seed.ts            # Database seeding
├── plan/                  # Project documentation
│   ├── 1.main-spec.md     # Feature specification
│   ├── implementation-plan.md
│   └── data-model.md
└── types/                 # TypeScript definitions
```

## Database Schema

### Core Tables

**Assessment** - Tracks individual assessment runs

- `id`, `userId`, `status`, `startedAt`, `completedAt`
- Profile: `currentRole`, `yearsExperience`, `industry`, `careerIntent`
- Goal: `currentRole`, `yearsExperience`, `industry`, `careerIntent`, `targetRole`

**ChatConversation** - Tracks AI-powered mentorship sessions

- `id`, `userId`, `title`, `messages` (JSON), `createdAt`, `updatedAt`

**Skill** - Master list of skills

- 15 core skills across 3 categories: Hard Skills (React, TypeScript, etc.), Soft Skills (Communication, Collaboration, etc.), Meta Skills (Learning Agility, Prioritization, etc.)

**AssessmentResult** - Combines self-assessment ratings with AI evaluations

- `assessmentId`, `skillId`
- `level` (1-5), `confidence` (0-1)
- AI feedback: `notes`, `rawAIOutput`

**AssessmentGaps** - Calculated skill gaps prioritized by impact

- `assessmentId`, `skillId`
- `gapSize`, `priority`, `readinessScore`

**GapResources** - Learning materials for each gap

- Links to courses, articles, projects
- Sourced from AI recommendations or manual curation

## Development

### Available Commands

```bash
pnpm dev                    # Start dev server (port 3000)
pnpm build                  # Production build
pnpm lint                   # Run ESLint
pnpm db:generate            # Regenerate Prisma client
pnpm db:push                # Push schema changes to database
pnpm db:seed                # Seed database with core skills
pnpm prisma studio          # Open Prisma Studio (visual database browser)
```

### Architecture Patterns

#### Server Components by Default

All pages are server components with async data fetching:

```tsx
async function PageContent() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const data = await db.assessment.findFirst(...);
  return <ClientForm data={data} />;
}
```

#### Suspense + Skeleton Fallbacks

Every async server component is wrapped in Suspense:

```tsx
export default function Page() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
```

#### Form Handling with react-hook-form + Zod

All forms use typed input components:

```tsx
<InputField
  label="Name"
  control={form.control}
  name="name"
  required
  disabled={isPending}
/>
```

#### Type-Safe API via oRPC

Backend procedures are fully typed:

```tsx
const assessment = await client.assessment.start({
  currentRole: "Frontend Developer",
  yearsExperience: 5,
  // TypeScript ensures all required fields are present
});
```

### Key Files to Know

| File                                                       | Purpose                                 |
| ---------------------------------------------------------- | --------------------------------------- |
| [lib/auth.ts](lib/auth.ts)                                 | better-auth GitHub OAuth setup          |
| [lib/orpc/router.ts](lib/orpc/router.ts)                   | oRPC procedure definitions              |
| [CHAT_FLOW.md](CHAT_FLOW.md)                               | AI Chat Advisor architecture & flow     |
| [prisma/schema.prisma](prisma/schema.prisma)               | Database schema                         |
| [app/globals.css](app/globals.css)                         | OkLCH dark theme system                 |
| [components/ui/](components/ui/)                           | shadcn/ui components (base-ui wrappers) |
| [plan/implementation-plan.md](plan/implementation-plan.md) | Full technical roadmap                  |

## Deployment

### Vercel (Recommended)

```bash
# Connect repository to Vercel and deploy
vercel
```

Set environment variables in Vercel project settings:

- `DATABASE_URL` - Neon PostgreSQL connection string
- `GITHUB_CLIENT_ID` - OAuth app ID
- `GITHUB_CLIENT_SECRET` - OAuth app secret
- `NEXT_PUBLIC_APP_URL` - Production URL

### Self-Hosted

Requirements:

- Node.js 18+ runtime
- PostgreSQL database
- GitHub OAuth application

```bash
pnpm build
pnpm start
```

## Performance & Scale

### Current Targets

- **Non-AI endpoints** - p95 < 200ms
- **AI orchestration** - Response start within 500ms
- **Concurrent users** - 1k active users with graceful degradation

### Optimization Strategies

- Next.js cache components for automatic server-side caching
- Suspense boundaries for progressive loading
- Database indexing on assessment and skill queries
- AI response caching and cost controls (Phase 2)

## Validation & Testing

### Data Validation

- **Forms** - Zod schemas with react-hook-form
- **API** - oRPC ensures type safety
- **AI Output** - Zod schema validation before persistence

### Testing Strategy (Planned)

- Unit tests: Vitest
- Integration tests: Playwright (assessment flow)
- Contract tests: oRPC procedures

## Common Patterns

### ❌ Mistakes to Avoid

1. **Using `asChild` prop** - base-ui doesn't support it; use `render` prop or composition instead
2. **Hardcoded colors** - Always use semantic tokens (`bg-card`, `text-foreground`)
3. **Client components by default** - Server components first; add `"use client"` only when needed
4. **Missing Suspense** - Async data needs Suspense boundaries with Skeleton fallback
5. **Forgetting `suppressHydrationWarning`** - Required on theme provider to avoid hydration mismatches

### ✅ Best Practices

- Server components by default, client only for interactivity
- Forms use specific rhf-inputs components (`InputField`, `SelectField`, etc.)
- All async operations wrapped in Suspense with skeleton fallbacks
- Loading states on forms via `useTransition()`
- Semantic color tokens for dark mode compatibility
- Type-safe data flow: Zod → Prisma → oRPC → React

## Roadmap

### ✅ MVP (Jan 2026)

- Next.js 16 setup with cache components
- GitHub OAuth authentication
- 6-step assessment flow
- Skill gap analysis and report
- Dark theme implementation
- CV upload with R2 storage and AI integration
- Lucide to HugeIcons migration

### ✅ Phase 2 (Feb-Mar 2026)

- oRPC procedures implementation
- Evidence ingestion (GitHub analysis + CV upload)
- Learning path generation (weekly plans)
- ✅ Interactive learning roadmap UI
- ✅ AI SDK Chat Streaming with History Persistence
- ✅ Markdown chat rendering with Prism syntax highlighting
- [ ] Progress tracking and reassessment

### 🎯 Phase 3+ (Apr 2026+)

- Background job processing for heavy AI tasks
- Analytics and learning outcome tracking

## Contributing

> See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

This project is in active development. We welcome feedback and contributions.

## Architecture Notes

### Why Next.js 16 Cache Components?

- Automatic server-side caching without explicit `revalidate` exports
- Type safety with App Router and server components
- Seamless async/await in components

### Why base-ui over Radix?

- Headless component library with better dark mode support
- More control over styling without `asChild` complexity
- Better alignment with OkLCH color system

### Why oRPC over REST/GraphQL?

- Type-safe end-to-end contracts between frontend and backend
- No API documentation drift (types are source of truth)
- Excellent TypeScript DX

### Why Groq/Kimi2 for MVP?

- Free tier sufficient for MVP load
- Low latency (important for interactive assessment)
- Structured output support via AI SDK

## License

See [LICENSE](LICENSE) file.

---

**Last updated:** January 12, 2026  
**Status:** MVP Phase - Core assessment flow complete, CV upload and AI orchestration active

For detailed technical documentation, see [plan/](plan/) directory.
