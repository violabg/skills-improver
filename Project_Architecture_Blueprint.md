# Project Architecture Blueprint: Skills Improver

## 1. Architecture Detection and Analysis

### Technology Stack

**Primary Framework**: Next.js 16.1.1 (App Router) with Cache Components Mode enabled
**Database**: PostgreSQL via Prisma 7.2.0 with custom client output path (`lib/prisma`)
**Authentication**: better-auth 1.4.10 (GitHub OAuth only)
**API Layer**: oRPC 1.13.2 for type-safe RPC calls
**AI Integration**: AI SDK 6.0.5 with Groq (Moonshot AI Kimi 2 model)
**UI Framework**: shadcn/ui with base-ui (React Aria Components)
**Form Management**: react-hook-form with Zod validation
**Styling**: Tailwind CSS with OkLCH color system
**State Management**: React hooks (useState, useTransition) + Server State via Suspense

### Architectural Pattern

**Primary Pattern**: Layered Architecture with Clean Architecture principles

- **Presentation Layer**: Next.js App Router with Server/Client component separation
- **Application Layer**: oRPC procedures handling business logic
- **Domain Layer**: Prisma models with business rules
- **Infrastructure Layer**: Database, external APIs, AI services

**Secondary Patterns**:

- Repository Pattern (Prisma client abstraction)
- Service Layer Pattern (oRPC procedures)
- Component Composition Pattern (React)
- Strategy Pattern (AI model selection)

## 2. Architectural Overview

The Skills Improver application follows a modern React/Next.js architecture optimized for Next.js 16's Cache Components Mode. The system is designed as an AI-powered career growth platform that analyzes skill gaps and generates personalized learning paths for frontend developers transitioning to senior/lead roles.

### Guiding Principles

1. **Server-First**: Server components by default, client components only when necessary
2. **Type Safety**: End-to-end TypeScript with Zod validation
3. **Performance**: Cache Components Mode for optimal caching and revalidation
4. **Developer Experience**: Strong typing, auto-completion, and clear separation of concerns
5. **Scalability**: Modular architecture allowing independent scaling of services

### Architectural Boundaries

- **Authentication Boundary**: GitHub OAuth only, no email/password
- **Data Access Boundary**: All database operations through Prisma client
- **AI Boundary**: Structured outputs only, no raw LLM responses
- **UI Boundary**: Semantic color tokens, no hardcoded colors

## 3. Architecture Visualization

### High-Level System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │     oRPC API    │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
│                 │    │                 │    │                 │
│ • Server Comp.  │    │ • Procedures    │    │ • Users         │
│ • Client Forms  │    │ • Validation    │    │ • Assessments   │
│ • Suspense      │    │ • Business Logic│    │ • Skills        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                        │                        │
       ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Services    │    │   External APIs │    │   File Storage  │
│   (Groq/Kimi)   │    │   (GitHub OAuth)│    │   (AWS S3)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Interaction Flow

```
User Request → Next.js Route → Auth Check → Suspense Boundary →
Server Component → oRPC Call → Business Logic → Database Query →
AI Processing (if needed) → Response → Client Component (if needed)
```

### Data Flow Architecture

```
Input Validation → oRPC Procedure → Prisma Query →
AI Structured Output → Zod Validation → Database Storage →
Typed Response → UI Rendering
```

## 4. Core Architectural Components

### 4.1 Presentation Layer (Next.js App Router)

**Purpose and Responsibility**:

- Handle HTTP requests and routing
- Manage authentication state
- Coordinate between server and client components
- Provide Suspense boundaries for async operations

**Internal Structure**:

- `app/(app)/` - Protected routes with auth checks
- `app/(auth)/` - Authentication routes
- `app/api/orpc/` - oRPC endpoint
- `components/` - Reusable UI components

**Interaction Patterns**:

- Server components call oRPC procedures directly
- Client components use oRPC client for API calls
- Authentication checked in server components via headers

### 4.2 Application Layer (oRPC Procedures)

**Purpose and Responsibility**:

- Implement business logic
- Handle data validation and transformation
- Coordinate between domain and infrastructure layers
- Provide type-safe API contracts

**Internal Structure**:

- `lib/orpc/router.ts` - Procedure definitions
- `lib/orpc/procedures.ts` - Base procedure configurations
- `lib/orpc/context.ts` - Request context types

**Interaction Patterns**:

- Procedures receive validated input via Zod schemas
- Context provides authenticated user and database access
- Results validated before returning to client

### 4.3 Domain Layer (Prisma Models)

**Purpose and Responsibility**:

- Define business entities and relationships
- Enforce data integrity constraints
- Provide type-safe data access

**Internal Structure**:

- `prisma/schema.prisma` - Database schema
- `lib/prisma/` - Generated client
- `lib/db.ts` - Database connection singleton

**Interaction Patterns**:

- All database operations through Prisma client
- Relations defined explicitly in schema
- Custom output path prevents node_modules conflicts

### 4.4 Infrastructure Layer (External Services)

**Purpose and Responsibility**:

- Handle external API integrations
- Manage AI model interactions
- Provide file storage capabilities

**Internal Structure**:

- `lib/ai/` - AI service integrations
- `lib/services/` - External service adapters
- `lib/auth.ts` - Authentication provider

## 5. Architectural Layers and Dependencies

### Layer Structure

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  • Next.js Routes & Components      │
│  • Authentication Guards            │
│  • Suspense Boundaries              │
└─────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│        Application Layer            │
│  • oRPC Procedures                  │
│  • Business Logic                   │
│  • Input/Output Validation          │
└─────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│          Domain Layer               │
│  • Prisma Models                    │
│  • Business Entities                │
│  • Data Relationships               │
└─────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│      Infrastructure Layer           │
│  • Database Connection              │
│  • AI Services                      │
│  • External APIs                    │
└─────────────────────────────────────┘
```

### Dependency Rules

- **Presentation** → **Application**: oRPC calls
- **Application** → **Domain**: Prisma queries
- **Application** → **Infrastructure**: Service calls
- **No circular dependencies** between layers
- **Dependency injection** via context objects

### Abstraction Mechanisms

- **oRPC**: Type-safe API contracts
- **Zod**: Runtime type validation
- **Prisma**: Database abstraction
- **AI SDK**: Model abstraction

## 6. Data Architecture

### Domain Model Structure

```typescript
// Core Entities
User (GitHub OAuth)
├── Assessments (many)
├── Evidence (many)
└── Sessions/Accounts (auth)

Assessment (Skill Evaluation)
├── AssessmentResults (many)
└── User (belongs to)

Skill (Taxonomy)
├── SkillRelations (many-to-many)
├── AssessmentResults (many)
└── ResourceSkills (many-to-many)

Resource (Learning Materials)
└── ResourceSkills (many-to-many)

Evidence (User Portfolio)
└── User (belongs to)
```

### Data Access Patterns

- **Repository Pattern**: Prisma client as repository
- **Query Objects**: Prisma's fluent API for complex queries
- **Unit of Work**: Transaction support via Prisma
- **Identity Map**: Prisma's caching and identity management

### Data Transformation

- **Input Validation**: Zod schemas at API boundaries
- **AI Output Validation**: Structured outputs with Zod
- **Database Mapping**: Prisma handles ORM mapping
- **API Serialization**: oRPC handles response formatting

### Caching Strategy

- **Next.js Cache Components**: Automatic caching of server components
- **Prisma Query Caching**: Built-in query result caching
- **No manual caching layers** (relying on framework defaults)

## 7. Cross-Cutting Concerns Implementation

### 7.1 Authentication & Authorization

**Implementation**:

- GitHub OAuth via better-auth
- Session management with database storage
- Protected routes via server component auth checks
- Type-safe session types exported from auth config

**Security Boundaries**:

- Server-side session validation
- Protected oRPC procedures
- User-scoped data access

### 7.2 Error Handling & Resilience

**Patterns**:

- Try-catch in oRPC procedures
- Fallback AI evaluation for failures
- Zod validation errors
- Client-side error boundaries

**Resilience Strategies**:

- AI service fallbacks
- Database connection pooling
- Graceful degradation in UI

### 7.3 Logging & Monitoring

**Implementation**:

- Console logging in development
- Error logging in procedures
- AI evaluation confidence tracking
- Performance monitoring via Next.js

### 7.4 Validation

**Input Validation**:

- Zod schemas for all API inputs
- Form validation via react-hook-form
- Database constraints via Prisma

**Business Rule Validation**:

- Assessment ownership checks
- Skill existence validation
- User permission validation

### 7.5 Configuration Management

**Environment Variables**:

- Database connection strings
- OAuth credentials
- AI API keys
- App URLs

**Configuration Sources**:

- Environment variables only
- No runtime configuration files
- Build-time configuration via Next.js

## 8. Service Communication Patterns

### Internal Communication

- **oRPC**: Type-safe RPC between frontend and backend
- **Direct Database Access**: Server components query database directly
- **Client-Side API Calls**: oRPC client for client components

### External Communication

- **GitHub OAuth**: REST API integration
- **AI Services**: Structured prompts via AI SDK
- **File Storage**: AWS S3 for evidence uploads

### Communication Protocols

- **HTTP/HTTPS**: All external communications
- **WebSocket**: Not currently used
- **GraphQL**: Not used (oRPC provides similar benefits)

## 9. Technology-Specific Architectural Patterns

### Next.js 16 Patterns

**Cache Components Mode**:

- All pages are server components by default
- No `revalidate` exports (incompatible)
- Async data wrapped in Suspense
- Typed routes enabled

**App Router Patterns**:

- Route groups for auth/protected areas
- Server actions for form submissions
- Parallel routes for complex layouts

### React Patterns

**Component Patterns**:

- Server components for data fetching
- Client components for interactivity
- Custom hooks for shared logic
- Compound components for complex UI

**State Management**:

- Server state via Suspense/async
- Client state via useState/useTransition
- Form state via react-hook-form

### Database Patterns (Prisma)

**Schema Design**:

- UUID primary keys
- Explicit foreign key relationships
- Enum types for constrained values
- Custom output path for client generation

**Query Patterns**:

- Include relations for efficient fetching
- Transaction support for multi-table operations
- Raw SQL for complex queries (when needed)

## 10. Implementation Patterns

### Interface Design Patterns

**oRPC Procedure Interfaces**:

```typescript
// Input validation
input: z.object({
  assessmentId: z.string().uuid(),
});

// Context injection
handler: async ({ input, context }) => {
  // Business logic
};
```

### Service Implementation Patterns

**oRPC Procedures**:

- Protected procedures for authenticated operations
- Public procedures for open data
- Input validation at procedure boundaries
- Context-aware business logic

### Repository Implementation Patterns

**Prisma Client Usage**:

```typescript
// Type-safe queries
const assessment = await db.assessment.findFirst({
  where: { id: input.id, userId: ctx.user.id },
  include: { results: { include: { skill: true } } },
});
```

### Controller/API Implementation Patterns

**oRPC Router Structure**:

- Logical grouping by domain (assessment, skills, chat)
- Consistent error handling
- Type-safe return values

### Domain Model Implementation

**Prisma Schema Patterns**:

- Explicit relation definitions
- Database-level constraints
- Index optimization
- Migration-friendly schemas

## 11. Testing Architecture

### Testing Strategy (Planned)

- **Unit Tests**: Jest/Vitest for component and utility testing
- **Integration Tests**: Playwright for assessment flow E2E
- **Contract Tests**: oRPC procedure validation
- **AI Validation**: Zod schema checks for LLM outputs

### Test Boundaries

- Component testing at React component level
- API testing at oRPC procedure level
- Database testing with test database
- AI testing with mocked responses

## 12. Deployment Architecture

### Runtime Architecture

- **Serverless Deployment**: Vercel/Netlify compatible
- **Database**: Neon PostgreSQL (serverless)
- **AI Services**: Cloud-based (Groq)
- **File Storage**: AWS S3

### Environment Architecture

- **Development**: Local PostgreSQL via Docker
- **Staging**: Separate database instance
- **Production**: Production database with backups

### Configuration Management

- **Environment Variables**: All configuration externalized
- **Build-time Configuration**: Next.js environment handling
- **Runtime Configuration**: Database URLs and API keys

## 13. Extension and Evolution Patterns

### Feature Addition Patterns

**New Assessment Steps**:

1. Add route in `app/(app)/assessment/`
2. Create form component in `components/assessment/`
3. Add oRPC procedure in router
4. Update navigation logic

**New Skills**:

1. Add to Prisma schema
2. Seed database
3. Update assessment logic
4. Add to skill relations

### Modification Patterns

**Schema Changes**:

1. Update `prisma/schema.prisma`
2. Run `pnpm db:push` (dev) or migrate (prod)
3. Run `pnpm db:generate`
4. Update TypeScript types

**API Changes**:

1. Update oRPC procedure signature
2. Update Zod schemas
3. Update client calls
4. Test type safety

### Integration Patterns

**New AI Models**:

- Add to `lib/ai/models.ts`
- Update assessment functions
- Maintain structured output pattern

**New External Services**:

- Add service adapter in `lib/services/`
- Integrate via oRPC procedures
- Maintain error handling patterns

## 14. Architectural Pattern Examples

### Layer Separation Example

```typescript
// Server Component (Presentation)
async function AssessmentPage({ params }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return <AssessmentClient assessmentId={params.id} />;
}

// oRPC Procedure (Application)
start: protectedProcedure
  .input(z.object({ targetRole: z.string() }))
  .handler(async ({ input, context }) => {
    const assessment = await context.db.assessment.create({
      data: { userId: context.user.id, targetRole: input.targetRole },
    });
    return assessment;
  });

// Client Component (Presentation)
function AssessmentClient({ assessmentId }) {
  const [data, setData] = useState(null);
  // Client-side logic
}
```

### Component Communication Example

```typescript
// Form submission via oRPC
const onSubmit = async (data) => {
  startTransition(async () => {
    const result = await client.assessment.submitAnswer({
      assessmentId,
      skillId,
      answer: data.answer,
    });
    router.push(nextStep);
  });
};
```

### Extension Point Example

```typescript
// AI Model Abstraction
export const skillEvaluationModel = groq("moonshotai/kimi-k2-instruct-0905");

// Easily swappable
export const gapAnalysisModel = groq("moonshotai/kimi-k2-instruct-0905");
```

## 15. Architectural Decision Records

### ADR 1: Next.js 16 Cache Components Mode

**Context**: Need for optimal performance and caching in a data-heavy application
**Decision**: Enable Cache Components Mode with typed routes
**Consequences**:

- All pages must be server components by default
- No `revalidate` exports allowed
- Improved performance through automatic caching
- Complex migration from Pages Router patterns

### ADR 2: oRPC over REST/GraphQL

**Context**: Need for type-safe API layer with minimal boilerplate
**Decision**: Use oRPC for all backend communication
**Consequences**:

- End-to-end type safety
- Reduced API surface area
- Steeper learning curve
- Excellent developer experience

### ADR 3: GitHub OAuth Only

**Context**: Simplify authentication for developer-focused platform
**Decision**: GitHub OAuth exclusively, no email/password
**Consequences**:

- Reduced security surface area
- Built-in developer profiling
- Limited user base to GitHub users
- Simplified user management

### ADR 4: Structured AI Outputs

**Context**: Need for reliable AI-generated content
**Decision**: Always validate AI outputs with Zod schemas
**Consequences**:

- Guaranteed type safety for AI responses
- Fallback mechanisms for validation failures
- Increased complexity in prompt engineering
- Reliable data for downstream processing

## 16. Architecture Governance

### Consistency Enforcement

- **TypeScript Strict Mode**: Enforced type checking
- **ESLint**: Code quality and style consistency
- **Prettier**: Automatic code formatting
- **Prisma Generate**: Automatic type generation

### Architectural Review Process

- **Pull Request Reviews**: Architecture-aware review process
- **Automated Checks**: Type checking and linting in CI
- **Migration Scripts**: Database schema changes reviewed
- **API Contract Reviews**: oRPC procedure changes reviewed

### Documentation Standards

- **Code Comments**: Complex business logic documented
- **README Files**: Setup and development instructions
- **Architecture Diagrams**: Visual documentation of changes
- **Changelog**: Breaking changes documented

## 17. Blueprint for New Development

### Development Workflow

1. **Feature Planning**: Define requirements and architectural impact
2. **Schema Design**: Update Prisma schema if needed
3. **API Design**: Define oRPC procedures and schemas
4. **Component Development**: Build UI components following patterns
5. **Integration**: Connect components to oRPC procedures
6. **Testing**: Add tests following established patterns

### Implementation Templates

#### New oRPC Procedure Template

```typescript
newFeature: protectedProcedure
  .input(
    z.object({
      requiredField: z.string(),
      optionalField: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    // Business logic here
    const result = await context.db.someModel.create({
      data: { ...input, userId: context.user.id },
    });
    return result;
  });
```

#### New Form Component Template

```tsx
"use client";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputField, SelectField } from "@/components/rhf-inputs";

export function NewFeatureForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(Schema),
    defaultValues: { ... }
  });

  return (
    <form onSubmit={form.handleSubmit((data) => {
      startTransition(async () => {
        await client.newFeature.create(data);
      });
    })}>
      {/* Form fields */}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
```

### Common Pitfalls to Avoid

1. **Client Components by Default**: Always start with server components
2. **Missing Suspense**: Wrap async server components in Suspense
3. **Direct Database Calls in Client**: Use oRPC procedures instead
4. **Hardcoded Colors**: Use semantic color tokens only
5. **Generic Field Components**: Use specific rhf-inputs components
6. **API Routes Instead of oRPC**: Prefer oRPC for type safety
7. **Raw AI Outputs**: Always validate with Zod schemas

### Architectural Checklist for New Features

- [ ] Server component by default?
- [ ] Suspense boundaries for async data?
- [ ] oRPC procedures for data operations?
- [ ] Zod validation for all inputs/outputs?
- [ ] Type-safe throughout?
- [ ] Semantic color tokens used?
- [ ] Proper error handling?
- [ ] Loading states implemented?
- [ ] Authentication checks in place?

---

_This blueprint was generated on January 5, 2026, based on the Skills Improver codebase. Regular updates recommended as the architecture evolves._</content>
<parameter name="filePath">/Users/paolo/Sites/ai/skills-improver/Project_Architecture_Blueprint.md
