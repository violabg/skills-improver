# Skills Improver App Flow Documentation

## Overview

The Skills Improver application is an AI-powered career growth platform that guides users through a 6-step assessment process to analyze skill gaps and generate personalized learning paths for frontend developers transitioning to senior/lead roles.

- **Backend**: oRPC procedures (type-safe API layer)
- **Database**: PostgreSQL with Prisma ORM (Assessment, AssessmentResult, AssessmentGaps, GapResources)
- **AI**: Vercel AI SDK with Groq (Llama 3) and Moonshot (Kimi) models
- **UI**: Next.js App Router (Dynamic Routes), Tailwind CSS, React Context (`AssessmentProvider`)

## Assessment Flow Steps

### Step 1: Profile Setup (`/assessment/start`)

**Purpose**: Collect basic user information to personalize the assessment experience.

**UI Components**:

- `PageShell` (variant: "narrow")
- `ProfileSetupForm` (client component with react-hook-form + Zod validation)
- `FormShellSkeleton` (loading state)
- Form fields: `currentRole`, `yearsExperience`, `industry`, `careerIntent`
- **Dynamic Fields**: Conditional `customRole` and `customIndustry` inputs appear when "Other" is selected in the respective dropdowns.
  **API Calls**:
  - Persistence: `assessment.start` creates the Assessment record with profile data. If "Other" was selected, the custom values are passed as the primary `currentRole` or `industry`.

```typescript
// oRPC Call: assessment.start
const assessment = await client.assessment.start({
  currentRole: data.customRole || data.currentRole,
  yearsExperience: data.yearsExperience,
  industry: data.customIndustry || data.industry,
  careerIntent: data.careerIntent,
});
```

1. **Authentication Check**: Server component verifies user session via `auth.api.getSession()`
2. **Form Validation**: Zod schema validates input data, including refining requirements for custom fields.
3. **Navigation**: Redirects to `/assessment/${id}/goal`

**Database Changes**:

- Creates `Assessment` record with all profile metadata.

---

### Step 2: Career Goal (`/assessment/[id]/goal`)

**Purpose**: Define the specific career target or goal the user is working towards.

**UI Components**:

- `PageShell` (variant: "narrow")
- `CareerGoalForm` (client component)
- Predefined goals: "Frontend → Senior Frontend", "Developer → Tech Lead", etc.

**API Calls**:

- `client.assessment.updateGoal({ assessmentId: assessment.id, targetRole })`: Persists the selected goal to the `Assessment` record.

**Business Logic**:

1. **Authentication Check**: Server component verifies session and fetches assessment via `[id]` param.
2. **Goal Selection**: User chooses from predefined options or enters custom goal.
3. **Context Usage**: Uses `useAssessment()` hook to access the current assessment.
4. **Navigation**: Redirects to `/assessment/${id}/self-evaluation`.

**Database Changes**:

- Updates `Assessment` record with `targetRole`.

---

### Step 3: Self-Evaluation (`/assessment/[id]/self-evaluation`)

**Purpose**: User rates their confidence in AI-generated skills tailored to their profile and goals.

**UI Components**:

- `PageShell` (variant: "narrow")
- `SelfEvaluationForm` (client component)
- `FormShellSkeleton` (loading state)

**API Calls**:

- `client.skills.generateForProfile({ assessmentId: assessment.id })`: Fetches/generates the personalized skill list from AI and database.
- `client.assessment.saveSelfEvaluations({ assessmentId: assessment.id, evaluations })`: Persists ratings and the `shouldTest` flag to `AssessmentResult`.

**Business Logic**:

1. **Authentication Check**: Server component verifies session.
2. **Skill Generation**: AI selects the best skills from the database and suggests new ones (persisted automatically) for the user's target role.
3. **Validation**: Ensures all skills are rated before proceeding.
4. **Navigation**: Redirects to `/assessment/${id}/test`.

**Database Changes**:

- Upserts `AssessmentResult` rows with `level`, `confidence`, and `shouldTest` flags.
- May create new `Skill` records if AI suggests novel ones.

---

### Step 4: Skill Validation Test (`/assessment/[id]/test`)

**Purpose**: AI generates specific interview questions for skills the user marked with "Test Me".

**UI Components**:

- `PageShell` (variant: "default")
- `SkillTestForm` (client component)
- `FormShellSkeleton` (loading state)

**API Calls**:

```typescript
// 1. Generate questions for marked skills
const questions = await client.questions.generateForSkills({
  assessmentId: assessment.id,
  skillIds,
});

// 2. Submit answer for AI assessment
await client.assessment.submitAnswer({
  assessmentId: assessment.id,
  skillId,
  question,
  answer,
});
```

**Business Logic**:

1. **Data Loading**:

   - Fetches assessment results to identify skills with `shouldTest: true`.
   - Calls AI to generate 1 tailored question for each selected skill.
   - If no skills were marked for testing, skips to Step 5.

2. **Answer Processing**:

   - Each answer is sent to AI for immediate evaluation.
   - AI assesses level (1-5), confidence, and provides feedback (notes).
   - If a question is skipped, the system uses the user's self-evaluation score for that skill.

3. **Navigation**: Redirects to `/assessment/${id}/evidence`

**Database Changes**:

- Updates `AssessmentResult` records with:
  - AI-evaluated `level` and `confidence`
  - `notes`, `rawAIOutput` (strengths/weaknesses)

---

### Step 5: Evidence Upload (`/assessment/[id]/evidence`)

**Purpose**: Optional step to connect external evidence (GitHub, portfolio, CV) for enhanced analysis.

**UI Components**:

- `PageShell` (variant: "default")
- `EvidenceUploadForm` (client component)
- GitHub connection button (simulated)
- Portfolio URL input (optional)
- CV file upload (optional)

**API Calls**:

- Currently uses placeholders for GitHub/CV upload. Portfolio URL is saved as part of the evidence record.

**Business Logic**:

1. **Authentication Check**: Server component verifies session.
2. **Evidence Collection**:
   - GitHub connection (simulated)
   - Portfolio URL input (validated as optional)
3. **Optional Processing**: User can skip this step entirely.
4. **Navigation**: Redirects to `/assessment/${id}/processing`.

**Database Changes**:

- Creates `Evidence` record on successful submission.

---

### Step 6: Processing (`/assessment/[id]/processing`)

**Purpose**: Animated processing screen while AI analyzes results and generates gap analysis.

**UI Components**:

- `PageShell` (variant: "wide")
- `ProcessingContent` (client component)
- Animated progress indicator with sequential steps
- `ProcessingSkeleton`

**API Calls**:

```typescript
// Finalize assessment
await client.assessment.finalize({
  assessmentId: assessment.id,
});
```

**Business Logic**:

1. **Authentication Check**: Server component verifies session.
2. **Sequential Processing**:
   - Shows 6 processing steps with timed delays (approx. 15s total).
   - Step texts: "Analyzing self-assessment...", "Evaluating responses...", etc.
3. **Assessment Finalization**:
   - Calls `client.assessment.finalize({ assessmentId })` which updates the `Assessment` record `status` to "COMPLETED".
4. **Navigation**: Redirects to `/assessment/${id}/results`.

**Database Changes**:

- Updates `Assessment` record:
  - `status`: "COMPLETED"
  - `completedAt`: current timestamp

---

### Step 7: Results Display (`/assessment/[id]/results`)

**Purpose**: Present comprehensive skill gap analysis with personalized recommendations.

**UI Components**:

- `PageShell` (variant: "default")
- `ResultsContent` (client component)
- `GapCard` (expandable detailed analysis)
- `ResultsShellSkeleton`

**Server-Side Logic (`ResultsPageContent`):**

1. **Data Retrieval**: Fetches `Assessment` with `AssessmentResult` and `AssessmentGaps`.
2. **Gap Generation**: If `AssessmentGaps` don't exist, they are calculated and saved to the database immediately.
3. **Readiness Score**: Calculated based on current vs target levels, weighted by career intent.
4. **Resource Enrichment**: Top 5 priority gaps are enriched with existing resources from `GapResources`.

**Client-Side Logic (`GapCard`):**

1. **On-Demand Loading**: Resources are loaded/generated when a user expands a skill gap.
2. **Server Action**: `loadGapResources` action calls AI to find curated resources if not already in DB.

**Database Changes**:

- Creates `AssessmentGaps` record (if first time viewing).
- Creates `GapResources` records as user expands skill gaps.

## Key Business Logic Patterns

### UI/UX Standards

- **Consistency**: All pages wrap content in `PageShell` for uniform padding, centering, and background effects.
- **Loading States**: `Suspense` with specific skeletons (`FormShellSkeleton`, `ResultsShellSkeleton`) ensures a smooth transition between steps.
- **Aesthetics**: Modern design with subtle gradients, glassmorphism, and smooth animations (ping/pulse indicators).

### Authentication Flow

- **Server Components**: Check session via `auth.api.getSession()`
- **Client Components**: Use oRPC client (inherits server context)
- **Redirect Pattern**: Unauthenticated users → `/login?redirect={currentPath}`

### Data Validation

- **Input Validation**: Zod schemas at API boundaries
- **AI Output Validation**: Structured outputs with Zod validation
- **Form Validation**: react-hook-form with Zod resolvers

### Error Handling

- **API Errors**: Caught in oRPC procedures, returned as structured errors
- **Client Errors**: Console logging + user-friendly messages
- **Fallback Mechanisms**: AI evaluation fallbacks to self-assessment scores

### State Management & Context

- **Server-Side Data**: The `layout.tsx` in `/assessment/[id]` fetches the assessment record and verifies ownership before rendering any sub-pages.
- **AssessmentProvider**: Wraps all assessment sub-pages, making the `assessment` record available via the `useAssessment()` hook.
- **Client State**: `useAssessment()` eliminates the need to pass `assessmentId` through query parameters between steps.
- **URL State**: The assessment ID is part of the path (`/assessment/[id]/...`), serving as the primary identifier.

## Data Flow Architecture

```
User Input → Form Validation → oRPC Call → Business Logic → Database → AI Processing → Response → UI Update
```

### Key Data Transformations

1. **Form Data → API Input**: Zod validation and type coercion
2. **API Response → Database**: Prisma type-safe inserts/updates
3. **AI Raw Output → Structured Data**: Zod schema validation
4. **Database Records → UI Props**: Server component data fetching

## Future Implementation Notes

### TODO Items in Codebase

- **Evidence Ingestion**: Complete GitHub repo analysis and automated CV scraping.
- **Background Processing**: Move heavy AI calculations to background jobs for faster UI response.
- **Interactive Roadmap**: Convert the results list into an interactive, time-bound learning roadmap.

### Planned Enhancements

- **AI-Powered Gap Analysis**: Further refine the gap calculation with direct AI analysis of self-eval vs test answers.
- **Learning Path Generation**: AI-generated weekly study plans.
- **Progress Tracking**: Real-time update of readiness score as user completes resources.

## Performance Considerations

### Current Optimizations

- **Next.js Cache Components**: Automatic caching of server components
- **Suspense Boundaries**: Progressive loading of async content
- **Database Indexing**: Optimized queries with proper indexes
- **Lazy Loading**: Components loaded as needed

### Potential Improvements

- **Assessment Persistence**: Save partial progress to prevent data loss
- **Background Processing**: Move AI evaluation to background jobs
- **Caching Strategy**: Redis for frequently accessed skill data
- **CDN Integration**: Static asset optimization

## Security Considerations

### Current Security Measures

- **Authentication**: GitHub OAuth with session management
- **Authorization**: User-scoped data access in all queries
- **Input Validation**: Zod schemas prevent malformed data
- **AI Safety**: Structured outputs prevent prompt injection

### Security Boundaries

- **Database Layer**: Prisma prevents SQL injection
- **API Layer**: oRPC type safety prevents invalid calls
- **Client Layer**: Form validation prevents malicious input
- **AI Layer**: Schema validation ensures safe AI outputs

---

_This documentation reflects the current implementation as of January 8, 2026. The application uses dynamic AI generation for skills and validation questions, with server-side persistence for analysis and resources._
