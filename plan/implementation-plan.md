""""markdown

# Implementation Plan: Learning Path Generator (Skill Gap & Growth Engine)

**Branch**: `999-align-stack` | **Date**: 2026-01-02 | **Spec**: plan/1.main-spec.md
**Input**: Feature specification from `plan/1.main-spec.md`, `plan/2.graph.md`, `plan/3.ux.md`, `plan/4.layout.md`

## Summary

Build a web application that generates continuously adaptive, outcome-focused learning paths. The system analyzes observable signals (assessments, optional evidence, artifacts) to detect skill gaps, rank them by impact for a target role, and recommend minimal, actionable learning steps. The MVP targets frontend developers aiming to move to senior/lead roles.

## Technical Context

**Language/Version**: Node.js 18+ with TypeScript
**Primary Dependencies**: Next.js (App Router), oRPC, Prisma, Zod, AI SDK v6 (Groq/Kimi2), React, Tailwind (optional)
**Component Library**: shadcn/ui with base-ui (preferred). Note: `base-ui` does not support the `asChild` prop pattern — do not use `asChild`. Use the `render` prop pattern or explicit wrapper components instead, and prefer the composition primitives provided by the library.
**Storage**: Neon (Postgres) via Prisma ORM
**Testing**: Jest or Vitest for unit tests, Playwright for end-to-end and UX flows, contract tests for oRPC procedures
**Target Platform**: Vercel (frontend + server) or similar cloud platform; Neon for serverless Postgres
**Project Type**: Web application (frontend + server) using Next.js App Router with typed backend procedures
**Performance Goals**: Non-AI API responses p95 < 200ms; AI orchestration latency depends on model but streaming responses should begin within 500ms of model start where possible; system should support 1k concurrent active users with graceful degradation for AI-dependent endpoints
**Constraints**: Keep costs low in MVP (use Groq/Kimi2 free tiers, cache AI evaluations); defer vector DB to Phase 2 unless embedding use-case validated
**Scale/Scope**: MVP supports 1k monthly active users; plan for scaling to 10k+ in Phase 2

## Constitution Check

Gates required before Phase 0 research and re-check after Phase 1 design:

- **Learner-Centered Design**: Plan includes measurable learner outcomes and an acceptance scenario: a user completes the assessment flow and receives a prioritized 30-day action plan with measurable improvement after reassessment.
- **Evidence-Based Assessment**: Document signals used (self-assessment sliders, assessment answers, derived repo metrics) and a validation strategy (simulated datasets + human-labeled checks for early models).
- **Privacy & Data Minimization**: Optional evidence upload flow defined with consent, minimal extracted signals, and retention options. No raw artifact retention unless explicitly consented.
- **Test-First Development**: List of required tests: unit, oRPC contract tests, integration tests for full assessment flow; CI must run these before merging.
- **Simplicity & Incremental Delivery**: MVP checkpoint defined (single career path: Frontend → Senior Frontend/Tech Lead; end-to-end assessment for 6–8 skills with action plan) and an incremental roadmap.
- **AI Output Validation**: All AI outputs that affect user scores or recommendations MUST have Zod schemas and a documented fallback strategy.

## Project Structure

### Documentation (this feature)

```text
specs/learning-path-generator/
├── plan.md              # This file (implementation-plan.md)
├── research.md          # Phase 0 research outputs
├── data-model.md        # Phase 1 data model (Prisma schema)
├── quickstart.md        # Phase 1 quickstart for local dev
├── contracts/           # oRPC/Zod procedure contracts
└── tasks.md             # Tasks for implementation
```

### Source Code (recommended layout)

```text
apps/web/                # Next.js frontend + server routes
  ├─ app/
  ├─ components/
  └─ orpc/                # typed procedure client usage

packages/server/         # Domain services and orpc procedure implementations
  ├─ src/
  │  ├─ db/               # Prisma + Neon setup
  │  ├─ ai/               # AI orchestration (validate → persist)
  │  └─ orpc/             # procedure implementations
  └─ tests/

packages/shared/         # Zod schemas, TypeScript types shared between client/server

tests/                   # Playwright E2E tests
```

**Structure Decision**: Use a monorepo with `apps/web` (Next.js) and `packages/server` (domain services). This keeps client/server typing aligned via `packages/shared` and enables independent deployment if needed.

## Complexity Tracking

No constitution violations requiring complexity exceptions identified. If the team later chooses Neo4j or a hybrid datastore, treat as a complexity violation requiring justification.

## Implementation Phases

### Phase 1: Setup (1 week)

- Initialize monorepo scaffold (Next.js app + server package + shared types)
- Configure Prisma with Neon dev database and add initial `Skill` and `SkillRelation` models
- Add oRPC + Zod baseline and a sample `orpc.health.ping` procedure
- Add CI: run TypeScript checks + unit tests + contract tests

### Phase 2: Foundational (2 weeks)

- Implement authentication (email-based or OAuth) — minimal for MVP
- Implement core DB models: `User`, `Skill`, `SkillRelation`, `Assessment`, `AssessmentResult`, `Resource`
- Implement AI orchestration module (server-side) with schema validation hooks
- Implement `orpc.assessment.start`, `orpc.assessment.submitAnswer`, `orpc.skills.getGraph`
- Add contract tests for these procedures

### Phase 3: User Story 1 - Assessment Flow (Priority P1) (2–3 weeks)

**Goal**: Deliver an end-to-end assessment that produces a 30-day action plan

- Implement UI flows (profile → goal → self-assessment → AI-driven testing → processing → gap report)
- Implement AI prompts and Zod schemas for `SkillEvaluation` and `GapExplanation`
- Persist assessment results and compute readiness score for the selected role
- Add integration tests (Playwright) for the happy path

### Phase 4: User Story 2 - Evidence Upload & Analysis (P2) (2 weeks)

- Implement optional evidence upload connectors (GitHub OAuth) and signal extraction pipelines; require explicit consent UI
- Add privacy retention settings and audit logging for evidence usage

### Phase 5: Polish & Cross-Cutting (1–2 weeks)

- Add caching for AI evaluations and cost controls
- Add analytics: assessment pass/fail rates, progression metrics
- Performance tuning, security hardening, and documentation

## Parallel Opportunities

- Setup, linting, and task scaffolding can be parallelized
- AI prompt engineering and DB schema work can proceed in parallel with frontend skeleton

## Implementation Strategy

1. MVP First: deliver Phase 1–3 to validate core value (assessment → gap report → action plan)
2. Validate embedding/vector use-cases before Phase 4; keep vector DB out of Phase 1 unless essential
3. Enforce test-first for all procedures and AI validation schemas

## Notes

- All AI outputs that affect user decisions must be validated and auditable.
- The plan favors Postgres/Prisma and TypeScript for reduced operational complexity and maximum type safety.

""""
