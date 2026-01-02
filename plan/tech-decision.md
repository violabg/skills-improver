""""markdown

# Tech Decisions & Scope — Learning Path Generator

Date: 2026-01-02

## Decisions (finalized)

- Runtime & Language: Node.js 18+ with TypeScript for frontend and server (Next.js App Router for server routes and server components).
- Backend architecture: Next.js server routes + oRPC procedures for typed RPC. Domain services live in `packages/server`.
- Authentication: use `better-auth` library; MVP uses GitHub login only (OAuth via better-auth). Documented flow: GitHub OAuth → better-auth session → map to `User` in DB.
- ORM & Primary Data Store: Prisma ORM with Neon (Postgres) as the single source of truth for the skill graph and analytics.
- API contracts & validation: oRPC + Zod for all procedure inputs/outputs. Contract tests required.
- AI orchestration: AI SDK v6 or equivalent (Groq/Kimi2 recommended early). Pattern: structured input → AI → Zod validation → domain write.
- Component library: shadcn/ui using `base-ui` primitives. Because `base-ui` does not support `asChild`, developers must use `render` prop pattern or explicit wrapper components and provided composition primitives.
- Vector DB: Deferred to Phase 2. Embeddings/Vector DB only introduced after validated use-case.
- Graph DB: Use Postgres/Prisma with recursive CTEs for graph traversals. Neo4j deferred unless profiling shows need.

## Scope Boundaries (MVP)

Included in MVP (Phase 1–3):

- Persona: Frontend developers aiming to move to Senior/Tech Lead.
- Core flow: onboarding → self-assessment → AI-driven assessment → processing → skill gap report → 30-day action plan.
- Data types: user profile, self-assessment sliders, assessment answers, assessment results, skill graph, external resource metadata.
- Evidence upload: optional connectors (GitHub) and extracted signals; raw artifacts NOT retained unless user opts in.
- AI validation: All AI outputs that impact scores or recommendations must be validated via Zod schemas and logged.

Out of scope for MVP:

- Hosting course content or building a learning content platform.
- Vector DB-backed semantic search or embeddings-driven recommendation (deferred to Phase 2).
- Full enterprise features (SSO, multi-tenant billing) — may be Phase 2.

## Acceptance Criteria (MVP)

1. User can complete the full assessment flow and receive a gap report with a prioritized 30-day plan.
2. `orpc.assessment.submitAnswer` procedure validates AI output against a Zod schema and persists structured results.
3. Tests: unit tests for business logic, contract tests for oRPC procedures, and a Playwright end-to-end test for the happy path.
4. Optional evidence upload flow presents consent and retention choices; evidence signals are extracted and used in scoring only with consent.

## Non-functional Requirements

- AI evaluation caching: avoid re-evaluating identical inputs to control costs.
- Audit logs: append-only records for AI-influenced decisions (redacted inputs, model id, schema validation result, reasoning summary).
- Performance: non-AI endpoints p95 < 200ms; streaming AI endpoints begin emitting within 500ms of model response when available.
- Security & Privacy: encryption at rest/in transit, role-based access to sensitive data, and documented retention policy for retained artifacts.

## Immediate Next Actions

1. Draft `plan/data-model.md` (Prisma schema): include `Skill`, `SkillRelation`, `User`, `Assessment`, `AssessmentResult`, `Resource`.
2. Produce `/contracts/` folder with oRPC/Zod contracts for key procedures: `assessment.start`, `assessment.submitAnswer`, `skills.getGraph`, `report.generate`.
3. Create `plan/quickstart.md` with local dev steps and Neon connection guidance.
4. Add `docs/ui-guidelines.md` showing `render`-prop and wrapper patterns for shadcn/base-ui components.

""""
