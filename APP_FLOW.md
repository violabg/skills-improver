# Skills Improver App Flow Documentation

## Overview

The Skills Improver application is an AI-powered career growth platform that guides users through a 6-step assessment process to analyze skill gaps and generate personalized learning paths for frontend developers transitioning to senior/lead roles.

## Application Architecture

- **Frontend**: Next.js 16 with App Router (Cache Components Mode)
- **Backend**: oRPC procedures (type-safe API layer)
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Groq API with structured outputs
- **Authentication**: GitHub OAuth via better-auth

## Assessment Flow Steps

### Step 1: Profile Setup (`/assessment/start`)

**Purpose**: Collect basic user information to personalize the assessment experience.

**UI Components**:

- `ProfileSetupForm` (client component with react-hook-form + Zod validation)
- Form fields: currentRole, yearsExperience, industry, careerIntent

**API Calls**:

```typescript
// oRPC Call: assessment.start
const assessment = await client.assessment.start({
  targetRole:
    data.currentRole === "Other" ? data.careerIntent : data.currentRole,
});
```

**Business Logic**:

1. **Authentication Check**: Server component verifies user session via `auth.api.getSession()`
2. **Form Validation**: Zod schema validates input data
3. **Assessment Creation**: Creates new assessment record in database with:
   - `userId`: authenticated user's ID
   - `targetRole`: derived from currentRole or careerIntent
   - `status`: "IN_PROGRESS"
   - `startedAt`: current timestamp
4. **Navigation**: Redirects to `/assessment/goal?assessmentId={id}`

**Database Changes**:

- Creates `Assessment` record with initial metadata

---

### Step 2: Career Goal Selection (`/assessment/goal`)

**Purpose**: Define the specific career target or goal the user is working towards.

**UI Components**:

- `CareerGoalForm` (client component)
- Predefined goals: "Frontend → Senior Frontend", "Developer → Tech Lead", etc.
- Custom goal input field

**API Calls**:

- **No API calls** - Goal stored in URL parameters for now
- TODO: Future implementation will save via oRPC

**Business Logic**:

1. **Authentication Check**: Server component verifies session
2. **Goal Selection**: User chooses from predefined options or enters custom goal
3. **URL Parameter Storage**: Goal encoded in query params (`?assessmentId={id}&goal={encodedGoal}`)
4. **Navigation**: Redirects to `/assessment/self-evaluation?assessmentId={id}&goal={encodedGoal}`

**Database Changes**:

- None (goal stored temporarily in URL)

---

### Step 3: Self-Evaluation (`/assessment/self-evaluation`)

**Purpose**: User rates their confidence in 15 skills across hard/soft/meta categories.

**UI Components**:

- `SelfEvaluationForm` (client component)
- Skills grouped by category: Hard (6), Soft (5), Meta (4)
- 5-point confidence scale for each skill

**API Calls**:

- **No API calls** - Ratings stored in component state
- TODO: Future implementation will save via oRPC

**Business Logic**:

1. **Authentication Check**: Server component verifies session
2. **Skill Rating**: User rates all 15 skills (1-5 scale)
3. **Validation**: Ensures all skills are rated before proceeding
4. **State Storage**: Ratings stored in component state (not persisted yet)
5. **Navigation**: Redirects to `/assessment/test?assessmentId={id}`

**Database Changes**:

- None (self-evaluations stored temporarily in memory)

---

### Step 4: Skill Validation Test (`/assessment/test`)

**Purpose**: AI-powered validation of user's skill levels through adaptive questioning.

**UI Components**:

- `SkillTestForm` (client component)
- Question types: code, scenario, explain
- Progress bar and skip functionality
- Textarea for answers

**API Calls**:

```typescript
// 1. Load skills from database
const skills = await client.skills.list();

// 2. Load existing assessment results
const assessment = await client.assessment.getResults({ assessmentId });

// 3. Submit each answer for AI evaluation
const result = await client.assessment.submitAnswer({
  assessmentId,
  skillId: question.skillId,
  question: question.question,
  answer: answer.trim(),
});
```

**Business Logic**:

1. **Data Loading**:

   - Fetches all skills from database to map question skills to IDs
   - Loads existing self-evaluation results for fallback
   - Selects 3-5 random questions from question bank

2. **Question Mapping**:

   - Maps question skill names to database skill IDs
   - Handles mapping errors gracefully
   - Falls back to self-evaluation scores for unmapped skills

3. **Answer Processing**:

   - For each answer: calls AI evaluation via oRPC
   - AI assesses skill level (1-5), confidence, strengths, weaknesses
   - Persists results to `AssessmentResult` table
   - For skipped questions: uses self-evaluation score

4. **Error Handling**:

   - Validates skill ID format (UUID)
   - Continues with successful submissions even if some fail
   - Provides user feedback on submission status

5. **Navigation**: Redirects to `/assessment/evidence?assessmentId={id}`

**Database Changes**:

- Creates `AssessmentResult` records for each evaluated skill:
  - `assessmentId`, `skillId`, `level`, `confidence`
  - `notes`, `rawAIOutput` (structured AI response)

---

### Step 5: Evidence Upload (`/assessment/evidence`)

**Purpose**: Optional step to connect external evidence (GitHub, portfolio, CV) for enhanced analysis.

**UI Components**:

- `EvidenceUploadForm` (client component)
- GitHub connection button
- Portfolio URL input
- CV file upload
- Privacy notice

**API Calls**:

- **No API calls implemented** - TODO placeholders
- Future: `orpc.assessment.connectGithub()`, `orpc.assessment.uploadEvidence()`

**Business Logic**:

1. **Authentication Check**: Server component verifies session
2. **Evidence Collection**:
   - GitHub connection (simulated)
   - Portfolio URL input
   - CV file selection
3. **Optional Processing**: User can skip this step entirely
4. **Navigation**: Redirects to `/assessment/processing?assessmentId={id}`

**Database Changes**:

- None (evidence processing not yet implemented)

---

### Step 6: Processing (`/assessment/processing`)

**Purpose**: Animated processing screen while AI analyzes results and generates gap analysis.

**UI Components**:

- `ProcessingContent` (client component)
- Animated progress indicator
- Sequential processing steps
- Error handling UI

**API Calls**:

```typescript
// Finalize assessment
await client.assessment.finalize({
  assessmentId,
});
```

**Business Logic**:

1. **Authentication Check**: Server component verifies session
2. **Sequential Processing**:
   - Shows 6 processing steps with timed delays
   - Simulates AI analysis (actual gap analysis happens on results page)
3. **Assessment Finalization**:
   - Updates assessment status to "COMPLETED"
   - Sets `completedAt` timestamp
4. **Error Handling**: Shows error UI if finalization fails
5. **Navigation**: Redirects to `/assessment/results?assessmentId={id}`

**Database Changes**:

- Updates `Assessment` record:
  - `status`: "COMPLETED"
  - `completedAt`: current timestamp

---

### Step 7: Results Display (`/assessment/results`)

**Purpose**: Present comprehensive skill gap analysis with personalized recommendations.

**UI Components**:

- `ResultsContent` (client component)
- Readiness score visualization
- Strengths and gaps display
- Expandable gap details with resources
- Action buttons (Dashboard, Chat)

**API Calls**:

- **No additional API calls** - Data fetched server-side

**Business Logic**:

1. **Authentication Check**: Server component verifies session
2. **Data Fetching**: Server-side database queries:

   - Fetches assessment with all results and skills
   - Calculates gaps using same logic as `skills.getGaps` procedure

3. **Gap Calculation Algorithm**:

   ```typescript
   // For each assessable skill:
   const currentLevel = result?.level ?? 0;
   const targetLevel = skill.difficulty ?? 3;
   const gapSize = Math.max(0, targetLevel - currentLevel);
   const impact = gapSize > 2 ? "CRITICAL" : gapSize > 1 ? "HIGH" : "MEDIUM";
   ```

4. **Readiness Score**:

   ```typescript
   const readinessScore = Math.round(
     ((totalSkills - gapsWithSize > 0) / totalSkills) * 100
   );
   ```

5. **Resource Matching**: Links skills to learning resources via `ResourceSkill` relations
6. **Evidence Integration**: Shows relevant user-uploaded evidence
7. **Prioritization**: Sorts gaps by priority (higher gaps = higher priority)

**Database Queries**:

- Assessment with results and skills
- All assessable skills
- Resource links and evidence items

## Key Business Logic Patterns

### Authentication Flow

- **Server Components**: Check session via `auth.api.getSession({ headers: await headers() })`
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

### State Management

- **Server State**: Database queries in server components
- **Client State**: React hooks for form state and UI interactions
- **URL State**: Temporary storage in query parameters

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

- **oRPC Procedures**: Many forms have `// TODO: Save via oRPC` comments
- **Evidence Processing**: GitHub/portfolio analysis not implemented
- **Gap Analysis**: Currently calculated client-side, should be server-side
- **Resource Recommendations**: Basic matching, needs AI enhancement

### Planned Enhancements

- **AI-Powered Gap Analysis**: Server-side gap calculation with AI insights
- **Evidence Integration**: GitHub repo analysis, portfolio scraping
- **Learning Path Generation**: AI-generated personalized roadmaps
- **Progress Tracking**: Assessment history and improvement tracking

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

_This documentation reflects the current implementation as of January 5, 2026. The application is in MVP phase with several TODO items for future enhancement._
