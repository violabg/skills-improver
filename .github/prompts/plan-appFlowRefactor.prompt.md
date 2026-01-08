# Skills Improver App Flow Refactor Plan

**Date**: January 8, 2026  
**Status**: Under Review  
**Priority**: Medium-High

---

## 1. Prisma Schema Assessment

### Current State: ✅ CORRECT OVERALL

The schema is well-structured with proper relationships and validations.

| Aspect               | Status  | Notes                                                          |
| -------------------- | ------- | -------------------------------------------------------------- |
| **User & Auth**      | ✅ Good | `emailVerified` ✓, `image` ✓, cascading deletes ✓              |
| **Assessment Flow**  | ✅ Good | `IN_PROGRESS` → `COMPLETED` → `REVIEW_PENDING` status enum     |
| **AssessmentResult** | ✅ Good | `@@unique([assessmentId, skillId])` prevents duplicate entries |
| **Skill Graph**      | ✅ Good | `SkillRelation` models prerequisites via `strength` field      |
| **Gap Analysis**     | ✅ Good | `AssessmentGaps` stores JSON for flexibility                   |
| **Evidence Privacy** | ✅ Good | `retentionUntil` allows GDPR compliance                        |

### Minor Suggestions (Not Critical)

#### 1. Add `updatedAt` to `AssessmentResult`

Currently only has `createdAt`. Useful for tracking when scores were updated by AI re-evaluation.

```prisma
model AssessmentResult {
  id           String   @id @default(uuid())
  assessmentId String
  skillId      String
  level        Int
  confidence   Float
  shouldTest   Boolean  @default(false)
  notes        String?
  rawAIOutput  Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt  // ADD THIS

  assessment Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  skill      Skill      @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@unique([assessmentId, skillId])
  @@index([assessmentId])
  @@index([skillId])
}
```

**Impact**: Low. Useful for analytics ("When did AI score improve?") but not critical for MVP.

#### 2. Add Index on `Assessment.completedAt`

For filtering completed assessments and paginating on dashboard.

```prisma
model Assessment {
  // ... fields ...

  @@index([userId])
  @@index([status])
  @@index([completedAt])  // ADD THIS for results filtering
  @@index([userId, status, completedAt])  // Optional: composite for dashboard queries
}
```

**Impact**: Low. Helps with dashboard pagination queries later.

#### 3. `GapResources` Naming Inconsistency

Consider singular naming to match pattern (Skill, Evidence, User).

```prisma
// Current (plural):
model GapResources { ... }

// Better (singular):
model GapResource { ... }
```

**Impact**: Very Low. Naming preference; either works.

---

## 2. URL Structure: Query Params vs `/assessment/[id]`

### Current Approach: Query Params

```
/assessment/start
/assessment/goal?assessmentId=123
/assessment/test?assessmentId=123
/assessment/results?assessmentId=123
```

### Issues with Current Approach

| Issue                            | Impact | Example                                                       |
| -------------------------------- | ------ | ------------------------------------------------------------- |
| Assessment ID in query, not path | Medium | If user edits URL to `?assessmentId=wrong-id`, fails silently |
| Not RESTful                      | Low    | Violates REST semantics                                       |
| Browser history cluttered        | Low    | Multiple entries for same step with different IDs             |
| Query params can be lost         | Medium | Relative navigation without preserving query state            |
| No type safety for step names    | Medium | Can navigate to `/assessment/invalid-step?assessmentId=123`   |

### RECOMMENDATION: Switch to `/assessment/[id]/{step}`

#### Proposed Structure

```
CURRENT:           PROPOSED:
/assessment/start  /assessment/start (unchanged for initial creation)
/assessment/goal?assessmentId=123    → /assessment/123/goal
/assessment/self-evaluation?assessmentId=123 → /assessment/123/self-evaluation
/assessment/test?assessmentId=123    → /assessment/123/test
/assessment/evidence?assessmentId=123 → /assessment/123/evidence
/assessment/processing?assessmentId=123 → /assessment/123/processing
/assessment/results?assessmentId=123 → /assessment/123/results
```

#### Benefits

✅ RESTful semantics — assessment ID in path, not query  
✅ Natural Back button — stays in assessment context  
✅ Type-safe with Next.js typed routes (`/assessment/[id]/{step}`)  
✅ Easier sharing — URL is self-contained  
✅ Prevents orphaned steps — can't jump to `/test` without assessment ID  
✅ Better error handling — 404 if assessment doesn't exist  
✅ Cleaner browser history — each step is a logical page

#### Implementation Architecture

```
app/(app)/assessment/
├── start/
│   └── page.tsx          // CREATE NEW ASSESSMENT (no [id] here)
└── [id]/
    ├── layout.tsx        // SHARED LAYOUT: Auth check, load assessment, provider
    ├── goal/
    │   └── page.tsx      // Step 2
    ├── self-evaluation/
    │   └── page.tsx      // Step 3
    ├── test/
    │   └── page.tsx      // Step 4
    ├── evidence/
    │   └── page.tsx      // Step 5
    ├── processing/
    │   └── page.tsx      // Step 6
    └── results/
        └── page.tsx      // Step 7
```

#### Step 1: Profile Setup — Unchanged

```tsx
// app/(app)/assessment/start/page.tsx
// Creates assessment, redirects to /assessment/[id]/goal
export default function StartPage() {
  return (
    <PageShell variant="narrow">
      <ProfileSetupForm />{" "}
      {/* On submit: create assessment, navigate to /assessment/123/goal */}
    </PageShell>
  );
}
```

#### Step 2-7: Shared Layout + Minimal Pages

```tsx
// app/(app)/assessment/[id]/layout.tsx
export default async function AssessmentLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(`/login?redirect=/assessment/${id}`);
  }

  // Verify assessment belongs to user
  const assessment = await db.assessment.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!assessment) {
    redirect("/assessment/start");
  }

  return (
    <AssessmentProvider assessment={assessment}>{children}</AssessmentProvider>
  );
}
```

```tsx
// app/(app)/assessment/[id]/goal/page.tsx
export default function GoalPage() {
  return (
    <PageShell variant="narrow">
      <div className="space-y-2 mb-8">
        <div className="text-muted-foreground text-sm">Step 2 of 7</div>
        <h1 className="font-bold text-foreground text-3xl">
          Choose Your Target Goal
        </h1>
      </div>
      <CareerGoalForm />
    </PageShell>
  );
}
```

#### Migration Path (Gradual, Safe)

1. **Create new routes** under `[id]/` (new files, no breaking changes)
2. **Keep old routes** for backward compatibility
3. **Add redirects** in old pages:
   ```tsx
   // app/(app)/assessment/goal/page.tsx (OLD)
   const assessmentId = searchParams.get("assessmentId");
   if (assessmentId) {
     return redirect(`/assessment/${assessmentId}/goal`);
   }
   ```
4. **Update links** in components to use new URLs
5. **Remove old routes** after 1-2 weeks in production

---

## 3. Page Organization: Separate Pages vs Single Page

### Analysis: Separate Pages (Current) is Correct

| Approach                 | Pros                                                              | Cons                                                               |
| ------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Separate pages**       | ✅ Clear boundaries, cacheability, independent auth, SEO-friendly | ❌ Boilerplate, repeated session checks                            |
| **Single client page**   | ✅ Shared state, smooth transitions                               | ❌ All data in client memory, SEO nightmare, state loss on refresh |
| **Hybrid (recommended)** | ✅ Separate routes + shared layout                                | ✓ Best approach                                                    |

### RECOMMENDATION: Keep Separate Pages + Add Shared Layout

**Why separate pages are better:**

- Each step is independently cacheable
- Users can share/bookmark intermediate steps
- Server-side auth checks at each boundary
- Progressive form completion (if user closes browser mid-flow, data is in DB, not lost)
- Better for analytics (track drop-off per step)

**Improvement: Reduce Boilerplate with Shared Layout**

Current repetition:

```tsx
// Every page repeats this
async function PageContent() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?redirect=/assessment/goal");
  return <CareerGoalForm />;
}

export default function Page() {
  return (
    <PageShell variant="narrow">
      <Header />
      <Suspense fallback={<Skeleton />}>
        <PageContent />
      </Suspense>
    </PageShell>
  );
}
```

Solution: Move auth check to `[id]/layout.tsx` (as shown in section 2).

---

## 4. Additional Observations & Fixes

### Issue A: The `/assessment/new` Folder is Unused

```
assessment/
  evidence/
  goal/
  new/          ← DELETE THIS
  processing/
  start/
  test/
  results/
  self-evaluation/
```

**Action**: Delete the folder. It serves no purpose.

### Issue B: Step Counter Off By One

All pages say "Step X of 6" but there are 7 steps.

**Current**:

```tsx
// /assessment/goal/page.tsx
<div className="text-muted-foreground text-sm">Step 2 of 6</div> ❌

// /assessment/test/page.tsx
<div className="text-muted-foreground text-sm">Step 4 of 6</div> ❌
```

**Fix**: Update all to "of 7":

- Step 1 of 7: Profile Setup
- Step 2 of 7: Career Goal
- Step 3 of 7: Self-Evaluation
- Step 4 of 7: Skill Validation Test
- Step 5 of 7: Evidence Upload
- Step 6 of 7: Processing
- Step 7 of 7: Results

**Action**: Search and replace "Step X of 6" → "Step X of 7" across all assessment pages.

### Issue C: Processing Step Runs for ~15 Seconds

```tsx
const PROCESSING_STEPS = [
  { text: "Analyzing self-assessment...", duration: 2000 },
  { text: "Evaluating responses...", duration: 3000 },
  // ... hardcoded delays
];
```

**Enhancement (Future)**:
Use server-sent events (SSE) to stream real AI processing status:

```tsx
// Instead of hardcoded delays, actually show progress:
// "Analyzing 5 skills..." → "Skill 1/5: React - evaluated ✓"
// "Skill 2/5: TypeScript - evaluating..."
```

**Priority**: Low. Current UX is acceptable.

### Issue D: Evidence Step Not Clearly Optional

Users might think evidence upload is required for assessment completion.

**Fix**: Add explicit "Skip" button:

```tsx
<div className="flex gap-4">
  <Button
    variant="outline"
    onClick={() => router.push(`/assessment/${id}/processing`)}
  >
    Skip for now
  </Button>
  <Button type="submit">Upload Evidence</Button>
</div>
```

### Issue E: Results Page Recomputes Gaps on Every View

```tsx
if (assessment.gaps) {
  // Use existing
  assessmentGapsId = assessment.gaps.id;
} else {
  // Compute new
  const gaps = await calculateGaps(...);
}
```

**Current state**: ✅ Correct. Gap computation is idempotent (one-time calc per assessment).  
**Action**: Document this behavior in code comments.

### Issue F: No Back Button Between Steps

Users must use browser back or restart.

**Fix**: Add explicit back navigation:

```tsx
<div className="flex gap-4">
  <Button variant="outline" onClick={() => router.back()}>
    ← Back
  </Button>
  <Button type="submit" disabled={isPending}>
    Continue →
  </Button>
</div>
```

### Issue G: No Breadcrumb Navigation

Users don't know their location in flow.

**Add**: Breadcrumb component

```tsx
<Breadcrumb>
  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
  <BreadcrumbLink href={`/assessment/${id}`}>
    Assessment {id.slice(0, 8)}
  </BreadcrumbLink>
  <BreadcrumbCurrent>Career Goal</BreadcrumbCurrent>
</Breadcrumb>
```

### Issue H: No Visual Progress Indicator

Users don't see how far they've progressed.

**Add**: Progress bar

```tsx
<Progress value={(currentStep / 7) * 100} className="mb-8" />
```

---

## 5. Implementation Priority & Roadmap

### Phase 1: High Priority (Do First)

| Task                            | Effort | Impact | Files Affected |
| ------------------------------- | ------ | ------ | -------------- |
| Delete `/assessment/new` folder | 5 min  | High   | 1 folder       |
| Fix step counters (6 → 7)       | 10 min | High   | 7 files        |
| Add "Skip" button to evidence   | 15 min | High   | 1 file         |
| Add back button to all forms    | 20 min | High   | 7 files        |

### Phase 2: Medium Priority (Do Next)

| Task                                    | Effort    | Impact | Files Affected |
| --------------------------------------- | --------- | ------ | -------------- |
| Migrate to `/[id]/{step}` URL structure | 3-4 hours | High   | 15+ files      |
| Create shared `[id]/layout.tsx`         | 1 hour    | High   | 8 files        |
| Add breadcrumb navigation               | 30 min    | Medium | 8 files        |

### Phase 3: Low Priority (Polish)

| Task                                | Effort    | Impact | Files Affected               |
| ----------------------------------- | --------- | ------ | ---------------------------- |
| Add progress indicator bar          | 20 min    | Low    | 8 files                      |
| Add `updatedAt` to schema           | 15 min    | Low    | 2 files (schema + migration) |
| Stream real processing status (SSE) | 2-3 hours | Low    | 2 files                      |

---

## 6. Schema Changes (Optional)

### If Adding `updatedAt` to AssessmentResult

1. Edit `prisma/schema.prisma`
2. Add `updatedAt    DateTime @updatedAt` to AssessmentResult model
3. Run migration:
   ```bash
   pnpm db:push
   pnpm db:generate
   ```

### If Adding Indices

1. Edit `prisma/schema.prisma`
2. Add indices to Assessment model
3. Run migration (same as above)

---

## 7. Summary: What to Do Now

### Immediate (This Session)

- [ ] Delete `/assessment/new` folder
- [ ] Update step counters in all 7 pages (6 → 7)
- [ ] Add back buttons to all form components
- [ ] Add "Skip" button to evidence step
- [ ] Add breadcrumb navigation

### Next Session (URL Refactor)

- [ ] Create new `/assessment/[id]/layout.tsx` with shared auth logic
- [ ] Create new step pages under `/assessment/[id]/{step}/`
- [ ] Add redirects in old pages
- [ ] Update all navigation links
- [ ] Test backward compatibility
- [ ] Remove old routes

### Later (Polish)

- [ ] Add progress bar
- [ ] Stream real processing status
- [ ] Schema improvements (updatedAt, indices)

---

## 8. Testing Checklist

Before deploying any changes:

- [ ] All step counters display correctly (1-7)
- [ ] Back button works on all steps (not on /start)
- [ ] Evidence "Skip" button navigates to processing
- [ ] New `/[id]/{step}` routes work
- [ ] Old query-param routes redirect correctly
- [ ] Breadcrumbs display correct current step
- [ ] Progress bar fills as user advances
- [ ] Can resume assessment from dashboard after clicking "Continue"
- [ ] Mobile navigation still works (back button, skip button)
- [ ] Browser back button works (doesn't go back into old URL structure)

---

## Notes for Implementation

- **Don't delete `/new` folder in production** if there's any code referencing it
- **Keep query-param routes for 1-2 weeks** after deploying new URLs for backward compat
- **Update tests** if you have E2E tests (Playwright) for assessment flow
- **Update documentation** in `APP_FLOW.md` and `ASSESSMENT_FLOW.md` after changes
- **Monitor analytics** to see if users drop off at certain steps post-refactor

---

**Status**: Ready for review and implementation approval.
