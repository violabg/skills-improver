# Assessment Flow: Database Seeding Fix

## Problem

Assessment results were not being saved to the database. The root cause: the `Skill` table was empty, so when the skill-test form tried to save assessment results with skill IDs, the foreign key constraint failed.

## Solution Implemented

### 1. Created Seed API Endpoint

Created `/app/api/seed/route.ts` - a POST endpoint that:

- Clears existing skills from the database
- Creates 15 skills across three categories:
  - **6 Hard Skills**: React, TypeScript, Testing, API Design, Database Design, System Architecture
  - **5 Soft Skills**: Communication, Collaboration, Problem Solving, Mentoring, Feedback
  - **4 Meta Skills**: Learning Agility, Prioritization, Adaptability, Ownership

### 2. Worked Around Direct Database Connection Issue

- Direct Prisma seeding (`npx tsx prisma/seed.ts`) was failing with ECONNREFUSED on the Neon database
- Solution: Accessed the running Next.js dev server's database connection through the API endpoint
- Called endpoint via `curl -X POST http://localhost:3000/api/seed`

### 3. Result

✅ 15 skills successfully seeded into the database

## Current Data Flow

### Assessment Creation (`ProfileSetupForm`)

```
User fills profile form
→ Calls: client.assessment.start({ userId, role, experience, industry })
→ Creates: Assessment record in database with status IN_PROGRESS
→ Returns: assessmentId (passed via URL search params)
```

### Self-Evaluation (`SelfEvaluationForm`)

```
User rates 15 skills (1-5)
→ Calls: client.assessment.submitAnswer() for each skill
→ Creates: AssessmentResult records in database
→ Maintains: assessmentId in URL throughout
```

### AI Skill Testing (`SkillTestForm`)

```
User answers 5 adaptive questions
→ For each answer:
  1. Fetches actual skill records: client.skills.list()
  2. Maps question.skillName → skill.id
  3. Calls: client.assessment.submitAnswer({
       assessmentId,
       skillId,
       level,
       confidence,
       notes
     })
  4. AI evaluates and saves AssessmentResult
```

### Processing & Finalization (`ProcessingContent`)

```
Processing page displays animated progress
→ Calls: client.assessment.finalize(assessmentId)
→ Updates: Assessment status = COMPLETED
→ Redirects: /assessment/results?assessmentId={id}
```

### Results Display (`ResultsContent`)

```
Results page fetches completed assessment
→ Calls: db.assessment.findFirst({
     where: { id: assessmentId },
     include: { results: { include: { skill: true } } }
   })
→ Displays: Skill gaps, readiness score, recommendations
```

## How to Test the Full Flow

1. **Start dev server** (already running):

   ```bash
   pnpm dev
   ```

2. **Navigate to app**:

   - Open http://localhost:3000 in browser
   - Click "Start Skill Assessment"
   - Login with GitHub (required)

3. **Complete assessment**:

   - Step 1: ProfileSetupForm - Enter role, experience, industry, career goal
   - Step 2: CareerGoalForm - Select target career path
   - Step 3: SelfEvaluationForm - Rate 15 skills (1-5)
   - Step 4: SkillTestForm - Answer 5 AI-evaluated questions
   - Step 5: EvidenceUploadForm - Optional GitHub/portfolio upload
   - Step 6: ProcessingContent - View animated progress (calls finalize)
   - Step 7: ResultsContent - View skill gap report

4. **Verify data persistence**:
   ```bash
   pnpm prisma studio
   ```
   - Check `Assessment` table for completed assessment
   - Check `AssessmentResult` table for 20 result records (15 self-eval + 5 test)
   - Verify all results have valid skillIds and evaluations

## Key Files Modified

- **app/api/seed/route.ts** (NEW) - Seed endpoint
- **lib/orpc/router.ts** - oRPC procedures (already wired)
- **components/assessment/skill-test-form.tsx** - Maps skill names to IDs
- **components/assessment/processing-content.tsx** - Calls finalize
- All assessment pages - Handle assessmentId from search params

## Database Schema

### Skill Table

```
id: UUID
name: String (unique) - e.g., "React"
category: HARD | SOFT | META
domain: String - e.g., "Frontend Framework"
difficulty: Integer (1-10)
marketRelevance: Float (0-10)
assessable: Boolean
transferable: Boolean
```

### AssessmentResult Table

```
id: UUID
assessmentId: UUID (FK to Assessment)
skillId: UUID (FK to Skill)
level: Integer (1-5) - Final assessed skill level
confidence: Float (0-1) - Model confidence
notes: String - AI feedback
rawAIOutput: JSON - Full AI response
```

## Next Steps

1. ✅ Database seeding working
2. ✅ All forms wired to oRPC
3. ✅ Assessment flow maintains state through all pages
4. ✅ Build compiles without errors

**Verify**: Complete an assessment end-to-end and check that results appear in database via `pnpm prisma studio`

If data doesn't persist:

- Check browser console for API errors
- Check Next.js dev server logs for oRPC procedure errors
- Verify assessmentId is being passed correctly through URL params
- Check that skill IDs match actual database skill UUIDs
