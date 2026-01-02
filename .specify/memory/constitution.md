# Sync Impact Report

<!--
Version change: unset -> 1.0.0
Modified principles:
- [PRINCIPLE_1_NAME] -> Learner-Centered Design
- [PRINCIPLE_2_NAME] -> Evidence-Based Assessment
- [PRINCIPLE_3_NAME] -> Privacy & Data Minimization
- [PRINCIPLE_4_NAME] -> Test-First Development
Technology preferences:
- Preferred runtime: Node.js / TypeScript with Next.js App Router for server-side routes and oRPC procedures.
- Preferred data layer: Prisma ORM with Neon (Postgres) as primary datastore for the skill graph and analytics.
- API contracts: oRPC + Zod schemas for end-to-end typing and validation.
- AI orchestration: AI SDK v6 or equivalent, with model-agnostic configuration (Groq/Kimi2 recommended for early stages).

- [PRINCIPLE_5_NAME] -> Simplicity & Incremental Delivery
Added sections:
- Additional Constraints (Security & Performance)
- Development Workflow (PRs, CI, Quality Gates)
Removed sections:
- None
Templates requiring updates:
- .specify/templates/plan-template.md ✅ updated
- .specify/templates/spec-template.md ⚠ pending review
- .specify/templates/tasks-template.md ⚠ pending review
Follow-up TODOs:
- TODO(RATIFICATION_DATE): original ratification date unknown — project team to set
-->

# Skills Improver Constitution

<!-- Governing document for the Skills Improver project. -->

## Core Principles

### Learner-Centered Design

The project MUST prioritize measurable learner outcomes and clarity of intent for every feature. Design decisions are validated against concrete learner scenarios and acceptance criteria. Any feature that does not demonstrably improve learner progress or clarity MUST be questioned and justified.

### Evidence-Based Assessment

Assessments, diagnostics, and skill measurements MUST be rooted in observable, testable signals. Models and heuristics used to infer skill levels MUST be explainable and accompanied by acceptance tests and representative datasets or simulations.

### Privacy & Data Minimization

User data collection MUST follow data minimization principles: collect only what is required for improving learner outcomes. Personal data MUST be protected, stored encrypted at rest and in transit, and retained only for explicitly stated periods. Any analytics or experiments using user data MUST be reviewed and approved by an explicit privacy checklist.

### Test-First Development

Code and feature changes MUST follow a test-first approach: write failing unit/contract/integration tests that capture the required behavior, then implement until tests pass. All new features MUST include automated tests and acceptance scenarios that can be executed in CI.

### Simplicity & Incremental Delivery

Prefer the simplest implementation that delivers measurable value. Features MUST be delivered incrementally with clear checkpoints and metrics. Avoid speculative generalization until validated by usage or tests.

## Additional Constraints

Security and privacy requirements:

- All sensitive user data MUST be encrypted at rest and in transit.
- Data access MUST be role-based and auditable.

Performance and availability:

- Define performance goals per feature in the implementation plan (e.g., response-time targets, concurrency expectations).

Technology constraints:

- Use well-supported, actively maintained libraries for core functionality. Avoid experimental-only dependencies for production paths.

## Development Workflow

- All code changes MUST be submitted via PR and include a clear description, linked issue/spec, and relevant tests.
- CI gates: all unit tests, linters, and contract tests MUST pass before merging.
- Changes that affect data models, user privacy, or assessment logic REQUIRE an explicit design review and cross-functional sign-off.
- Release process: follow semantic versioning (see Governance). Breaking changes MUST include a migration plan and communication notes.

## AI & Model Governance

- Every AI-generated artifact that contributes to assessment, scoring, or advice MUST be validated against a typed schema (for example, Zod). Invalid or malformed outputs MUST trigger a safe fallback and a logged incident for triage.
- AI components MUST never execute or modify database queries directly. The flow MUST be: structured input → AI → schema validation → explicit writes by server-side domain logic.
- All uses of AI in assessments that affect user outcomes MUST be auditable: store a redacted input snapshot, model identifier, schema validation result, and a short reasoning summary in an append-only audit log.
- Cost-control and safety: systems using third-party LLMs MUST implement caching of evaluation results, rate limits, and graceful degradation to deterministic heuristics when model quotas fail.

## Evidence Upload & Privacy

- Evidence uploads (GitHub, CV, portfolio artifacts) MUST be optional and clearly consented to. The UI MUST present a concise purpose and retention statement before upload.
- For each evidence type, specs MUST list the minimal data elements required to extract signals. Evidence processing MUST extract only those signals and discard raw artifacts unless the user explicitly consents to retention for a stated period.
- Evidence analytics MUST be performed on derived signals; raw artifacts that are retained require explicit user consent and an auditable retention policy.

## Governance

Amendments and scope:

- This Constitution is the authoritative statement of project governance and supersedes informal practices only where explicitly stated.
- Amendments: propose changes via a documented PR referencing the amendment rationale, implementation/migration plan, and tests. Amendments MUST be approved by at least two maintainers and one cross-functional reviewer for privacy/security-impacting changes.

Versioning policy:

- The Constitution follows semantic versioning. MAJOR version increases for incompatible governance changes, MINOR for added principles or material expansions, PATCH for clarifications and typos.

Compliance review:

- Every PR MUST include a short checklist indicating which Constitution principles it touches and whether it introduces any privacy, security, or measurement changes.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): set original adoption date | **Last Amended**: 2026-01-02

<!-- Dates are ISO format YYYY-MM-DD -->
