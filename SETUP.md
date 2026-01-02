# Skills Improver - Setup Guide

Complete implementation of the Skills Improver platform with oRPC API and auth middleware.

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- PostgreSQL database (Neon recommended)
- GitHub OAuth application
- Groq API key

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
pnpm install
```

### 2. Setup GitHub OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Skills Improver (Dev)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID** and generate a **Client Secret**

### 3. Setup Groq API

1. Go to [Groq Console](https://console.groq.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```env
# Your Neon or PostgreSQL connection string
DATABASE_URL="postgresql://user:password@host:5432/database"

# GitHub OAuth credentials from step 2
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"

# Generate a random 32+ character string
BETTER_AUTH_SECRET="your_random_secret_key_min_32_chars"

# Local development URL
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Groq API key from step 3
GROQ_API_KEY="your_groq_api_key"
```

To generate a random secret:

```bash
openssl rand -base64 32
```

### 5. Setup Database

Run Prisma migrations to create the database schema:

```bash
pnpm prisma migrate dev --name init
```

Generate Prisma Client:

```bash
pnpm prisma generate
```

### 6. (Optional) Seed Database

Open Prisma Studio to add some initial skills:

```bash
pnpm prisma studio
```

Or create a seed script if needed.

### 7. Run Development Server

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: better-auth with GitHub OAuth
- **API**: oRPC for typed RPC procedures
- **AI**: AI SDK v6 with Groq (Llama 3.3 70B)
- **Validation**: Zod schemas
- **UI**: shadcn/ui with base-ui primitives

### Project Structure

```
skills-improver/
├── app/
│   ├── api/
│   │   ├── auth/[...all]/route.ts     # better-auth handlers
│   │   └── orpc/[...path]/route.ts    # oRPC API handlers
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── db.ts                          # Prisma Client singleton
│   ├── auth.ts                        # better-auth configuration
│   ├── auth-client.ts                 # Client-side auth helpers
│   ├── orpc/
│   │   ├── context.ts                 # oRPC context types
│   │   ├── procedures.ts              # Base and protected procedures
│   │   ├── router.ts                  # oRPC router with all procedures
│   │   └── client.ts                  # Typed oRPC client
│   └── ai/
│       ├── models.ts                  # AI model configurations
│       ├── assessSkill.ts             # Skill evaluation function
│       └── schemas/                   # Zod schemas for AI outputs
├── prisma/
│   └── schema.prisma                  # Database schema
└── components/
    └── ui/                            # shadcn/ui components
```

## Key Features

### Authentication

- GitHub OAuth integration via better-auth
- Session management with database persistence
- Protected routes with middleware validation

### oRPC API

The API is fully typed end-to-end with the following namespaces:

#### Health

- `health.ping` (public) - Health check endpoint

#### Assessment

- `assessment.start` (protected) - Create a new assessment
- `assessment.submitAnswer` (protected) - Submit answer for AI evaluation
- `assessment.getResults` (protected) - Get assessment results
- `assessment.list` (protected) - List user's assessments

#### Skills

- `skills.list` (public) - List all skills with optional filters
- `skills.get` (public) - Get skill by ID with relations
- `skills.getGraph` (public) - Get complete skill graph

#### User

- `user.me` (protected) - Get current user profile
- `user.update` (protected) - Update user profile

### AI Evaluation

Skill assessments are evaluated using:

- Groq's Llama 3.3 70B model
- Structured outputs validated with Zod schemas
- Fallback heuristics if AI fails
- Detailed evaluation with level, confidence, notes, strengths, and weaknesses

### Middleware Proxy Pattern

Protected procedures use a middleware proxy that:

1. Validates better-auth session from request headers
2. Fetches user from database
3. Extends context with user object
4. Throws unauthorized error if validation fails

Example usage:

```typescript
// In procedures.ts
const withAuth = createMiddleware<BaseContext, AuthenticatedContext>(
  async ({ ctx, next }) => {
    const session = await auth.api.getSession({ headers: ctx.headers });
    if (!session?.user) {
      throw new ORPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }
    const user = await ctx.db.user.findUnique({
      where: { id: session.user.id },
    });
    return next({ ctx: { ...ctx, user } });
  }
);

export const protectedProcedure = baseProcedure.use(withAuth);
```

## Using the oRPC Client

### Client-Side Usage

```typescript
"use client";

import { client } from "@/lib/orpc/client";
import { useSession } from "@/lib/auth-client";

export function AssessmentForm() {
  const { data: session } = useSession();

  const handleSubmit = async (answer: string) => {
    try {
      const result = await client.assessment.submitAnswer({
        assessmentId: "...",
        skillId: "...",
        answer: answer,
        question: "Explain React hooks",
      });

      // result is fully typed!
      console.log(result.level, result.confidence);
    } catch (error) {
      console.error("Failed to submit:", error);
    }
  };

  return <form>...</form>;
}
```

### Server-Side Usage

```typescript
import { client } from "@/lib/orpc/client";

export async function ServerComponent() {
  const skills = await client.skills.list();

  return (
    <div>
      {skills.map((skill) => (
        <div key={skill.id}>{skill.name}</div>
      ))}
    </div>
  );
}
```

## Database Schema

Key models:

- **User**: Auth user with GitHub profile
- **Session**: better-auth session management
- **Account**: OAuth account connections
- **Skill**: Skills with categories (HARD, SOFT, META)
- **SkillRelation**: Graph relationships between skills
- **Assessment**: User assessment sessions
- **AssessmentResult**: AI-evaluated skill results
- **Resource**: External learning resources
- **Evidence**: Optional evidence uploads with consent

## Next Steps

### For Development

1. **Add Seed Data**: Create initial skills and skill relations
2. **Build UI**: Create assessment flow components
3. **Add Tests**: Contract tests for oRPC procedures
4. **Implement Caching**: Cache AI evaluations to reduce costs

### For Production

1. **Environment Variables**: Update for production URLs
2. **GitHub OAuth**: Create production OAuth app
3. **Database**: Ensure production database is set up
4. **Error Monitoring**: Add Sentry or similar
5. **Rate Limiting**: Protect API endpoints

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm prisma migrate dev     # Create and apply migrations
pnpm prisma generate        # Generate Prisma Client
pnpm prisma studio          # Open Prisma Studio GUI

# Code Quality
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript checks
```

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` in `.env.local`
- Ensure PostgreSQL is running
- Check firewall/network settings for remote databases

### Auth Issues

- Verify GitHub OAuth credentials
- Check callback URL matches exactly
- Ensure `BETTER_AUTH_SECRET` is set and sufficiently random

### AI Evaluation Errors

- Verify `GROQ_API_KEY` is valid
- Check Groq API rate limits
- Review fallback logic in `assessSkill.ts`

### Type Errors

- Run `pnpm prisma generate` after schema changes
- Restart TypeScript server in VS Code
- Check oRPC client import paths

## Documentation References

- [oRPC Documentation](https://orpc.dev)
- [better-auth Documentation](https://better-auth.com)
- [Prisma Documentation](https://prisma.io/docs)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Groq Documentation](https://console.groq.com/docs)

## License

See LICENSE file for details.
