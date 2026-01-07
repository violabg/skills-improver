# Skills Improver App Flow Documentation

## Overview

The Skills Improver application is an AI-powered career growth platform that guides users through a 6-step assessment process to analyze skill gaps and generate personalized learning paths for frontend developers transitioning to senior/lead roles.

- **Backend**: oRPC procedures (type-safe API layer)
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Groq API with structured outputs

## Assessment Flow Steps

### Step 1: Profile Setup (`/assessment/start`)

**Purpose**: Collect basic user information to personalize the assessment experience.

**UI Components**:

- `ProfileSetupForm` (client component with react-hook-form + Zod validation)
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
3. **Navigation**: Redirects to `/assessment/goal?assessmentId={id}`

**Database Changes**:

- Creates `Assessment` record with all profile metadata.

---

### Step 2: Career Goal (`/assessment/goal`)

**Purpose**: Define the specific career target or goal the user is working towards.

**UI Components**:

- `CareerGoalForm` (client component)
- Predefined goals: "Frontend → Senior Frontend", "Developer → Tech Lead", etc.
- **API calls**: The `CareerGoalForm` attempts to persist the selected goal by calling `client.assessment.updateGoal({ assessmentId, targetRole })`. The save is best-effort; navigation proceeds even if the RPC fails.

**Business Logic**:

1. **Authentication Check**: Server component verifies session
2. **Goal Selection**: User chooses from predefined options or enters custom goal
3. **URL Parameter Storage**: Goal encoded in query params (`?assessmentId={id}&goal={encodedGoal}`)
4. **Navigation**: Redirects to `/assessment/self-evaluation?assessmentId={id}&goal={encodedGoal}`

**Database Changes**:

- Updates `Assessment` record with `targetRole`.

---

### Step 3: Self-Evaluation (`/assessment/self-evaluation`)

**Purpose**: User rates their confidence in AI-generated skills tailored to their profile and goals.

**UI Components**:

- `SelfEvaluationForm` (client component)
- **Dynamic Skills**: Skills are fetched dynamically based on user profile (8-12 existing skills + 1-3 novel skills suggested by AI).
- **"Test Me" Toggle**: Users can mark specific skills they want to be practically tested on.
- 5-point confidence scale for each skill.

**API Calls**:

- `client.skills.generateForProfile({ assessmentId })`: Fetches/generates the personalized skill list.
- `client.assessment.saveSelfEvaluations({ assessmentId, evaluations })`: Persists ratings and the `shouldTest` flag to `AssessmentResult`.

**Business Logic**:

1. **Authentication Check**: Server component verifies session.
2. **Skill Generation**: AI selects the best skills from the database and suggests new ones (persisted automatically) for the user's target role.
3. **Validation**: Ensures all skills are rated before proceeding.
4. **Navigation**: Redirects to `/assessment/test?assessmentId={id}`.

**Database Changes**:

- Upserts `AssessmentResult` rows with `level`, `confidence`, and `shouldTest` flags.
- May create new `Skill` records if AI suggests novel ones.

---

### Step 4: Skill Validation Test (`/assessment/test`)

**Purpose**: AI generates specific interview questions for skills the user marked with "Test Me".

**UI Components**:

- `SkillTestForm` (client component)
- **AI Questions**: Contextual questions (code, scenario, explain) generated on-the-fly for selected skills.
- Progress bar and skip functionality.
- Textarea for answers.

**API Calls**:

```typescript
// 1. Generate questions for marked skills
const questions = await client.questions.generateForSkills({
  assessmentId,
  skillIds,
});

// 2. Submit answer for AI assessment
await client.assessment.submitAnswer({
  assessmentId,
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

3. **Navigation**: Redirects to `/assessment/evidence?assessmentId={id}`

**Database Changes**:

- Updates `AssessmentResult` records with:
  - AI-evaluated `level` and `confidence`
  - `notes`, `rawAIOutput`

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

- **Partial/placeholder**: The UI contains controls for GitHub connection and CV upload, but server-side ingestion is currently placeholder. Planned oRPC procedures include `assessment.connectGithub()` and `assessment.uploadEvidence()` for full evidence ingestion and processing.

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
   - Calls `client.assessment.finalize({ assessmentId })` which updates the `Assessment` record `status` to "COMPLETED" and sets `completedAt` timestamp.
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

3. **Profile-Aware Gap Calculation**:

   The gap analysis uses profile data for personalized skill targeting:

   - **Experience Adjustment**: `0-2` years → lower targets (-1), `10+` years → higher targets (+1)
   - **Career Intent Weights**:
     - `LEADERSHIP` → +40% weight on SOFT/META skills
     - `SWITCH` → +30% weight on HARD skills (need new tech)
     - `GROW` → balanced weights
   - **Industry Context**: Included in recommendations for relevance

4. **Readiness Score**: Weighted by target levels and career intent

5. **Resource Matching**: Links skills to learning resources via `ResourceSkill` relations
6. **Evidence Integration**: Shows relevant user-uploaded evidence
7. **Prioritization**: Sorted by priority (gap size × category weight)

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

_This documentation reflects the current implementation as of January 7, 2026. The application uses dynamic AI generation for skills and validation questions._
