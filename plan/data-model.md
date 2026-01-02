""""markdown

# Data Model — Prisma schema (draft)

This document defines the primary entities for the Learning Path Generator MVP and provides a Prisma schema draft that can be used as the basis for migrations. It focuses on the core models needed for Phase 1–3: users, skills and relations, assessments and results, resources, and optional evidence uploads.

## Overview

- Store structured, auditable results for assessments. AI outputs are validated and persisted as typed fields.
- Skill graph modeled in Postgres via Prisma; recursive CTEs are used for traversals when necessary.
- Evidence uploads are optional and require explicit consent. Raw artifacts are not stored unless the user opts in.

## Key Entities

- `User`: identity mapped from `better-auth` sessions (GitHub OAuth). Contains minimal profile info.
- `Skill`: domain skill node. Basic attributes include category, difficulty, assessable flag.
- `SkillRelation`: directed relationship between skills used for prerequisites and graph traversal.
- `Assessment`: represents an assessment session (set of questions/tasks) for a user and a target role or skill set.
- `AssessmentResult`: structured, validated output for a single assessed skill or question (validated via Zod schema before persist).
- `Resource`: external learning resource metadata (no content hosted).
- `Evidence`: optional artifacts (metadata + signals extracted). Raw storage requires explicit consent; otherwise only derived signals are stored.

## Prisma schema (draft)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum SkillCategory {
  HARD
  SOFT
  META
}

model User {
  id         String   @id @default(uuid())
  githubId   String?  @unique
  email      String?  @unique
  name       String?
  avatarUrl  String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  assessments Assessment[]
  evidences   Evidence[]
}

model Skill {
  id          String         @id @default(uuid())
  name        String         @unique
  category    SkillCategory
  domain      String?
  difficulty  Int?           // 1-5
  marketRelevance Float?     // 0.0 - 1.0
  assessable  Boolean       @default(true)
  transferable Boolean       @default(false)

  fromRelations SkillRelation[] @relation("fromSkill")
  toRelations   SkillRelation[] @relation("toSkill")
}

model SkillRelation {
  id          String   @id @default(uuid())
  fromSkillId String
  toSkillId   String
  strength    Float    @default(1.0)

  fromSkill Skill @relation("fromSkill", fields: [fromSkillId], references: [id])
  toSkill   Skill @relation("toSkill", fields: [toSkillId], references: [id])
}

model Assessment {
  id           String   @id @default(uuid())
  userId       String
  targetRole   String?  // e.g., "Senior Frontend"
  status       String   @default("IN_PROGRESS")
  startedAt    DateTime @default(now())
  completedAt  DateTime?

  user          User            @relation(fields: [userId], references: [id])
  results       AssessmentResult[]
}

model AssessmentResult {
  id             String   @id @default(uuid())
  assessmentId   String
  skillId        String
  level          Int      // normalized 0-5
  confidence     Float    // 0.0 - 1.0
  notes          String?
  rawAIOutput    Json?    // stored only when needed and allowed by policy (prefer schema fields)
  createdAt      DateTime @default(now())

  assessment Assessment @relation(fields: [assessmentId], references: [id])
  skill      Skill      @relation(fields: [skillId], references: [id])
}

model Resource {
  id            String   @id @default(uuid())
  provider      String
  url           String
  title         String?
  cost          String?  // free / paid
  estimatedTime Int?     // minutes
}

model Evidence {
  id           String   @id @default(uuid())
  userId       String
  provider     String?  // e.g., github
  referenceUrl String?  // link to artifact
  signals      Json?    // extracted signals (metrics) — stored by default
  rawStored    Boolean  @default(false) // true only if user consented to storage
  retentionUntil DateTime?
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}

// Indexes
index on Assessment(userId)
index on AssessmentResult(assessmentId)
```

## Validation rules & conventions

- All AI outputs written to `AssessmentResult` MUST be validated via Zod schemas in the server layer before persisting. If validation fails, use fallback heuristics and log the incident.
- `rawAIOutput` should be used sparingly; prefer normalized fields (`level`, `confidence`, `notes`). Raw outputs require explicit policy approval and consent when they contain personal data.
- Evidence `signals` should be minimized to necessary metrics (e.g., lines changed, PR size, language detection). Store raw artifacts only when `rawStored` is true and `retentionUntil` is set.

## State transitions

- `Assessment.status`: IN_PROGRESS → COMPLETED when user finishes and `Assessment.completedAt` is set. Optionally: REVIEW_PENDING if manual review is required.
- `Evidence.rawStored`: false → true only after explicit user opt-in; set `retentionUntil` accordingly.

## Migration notes

- Start with the above schema, run `prisma migrate dev --name init` to generate initial migration.
- Add constraints and additional indexes after profiling (e.g., indexes for skill name search, role readiness queries).

""""
