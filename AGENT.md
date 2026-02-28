# Project Guidelines

## Scope

These instructions are the default for this repository. For deeper architecture details and examples, see `README.md`.

## Architecture

- Stack: Next.js App Router (`next@16.1.6`) + React 19 + TypeScript + Prisma + oRPC + better-auth.
- Prefer Server Components by default. Add `"use client"` only for state/effects/browser APIs.
- `next.config.ts` enables `cacheComponents: true` and `typedRoutes: true`; do not introduce legacy caching patterns.
- Backend contracts live in `lib/orpc/router.ts`; data model is in `prisma/schema.prisma`.

## Build And Test

- Install: `pnpm install`
- Dev server: `pnpm dev`
- Lint: `pnpm lint`
- Test: `pnpm test:run` (or `pnpm test` for watch mode)
- Build: `pnpm build`
- DB: `pnpm db:push`, `pnpm db:generate`, `pnpm db:seed`

## Core Conventions

- Database access: always import Prisma client as `import db from "@/lib/db"`.
- Forms: use `react-hook-form` + Zod and project RHF field components in `components/ui/rhf-inputs/`.
- UI base components: do not use `asChild` with base-ui wrappers; use `render` prop composition.
- Colors and styling: prefer semantic theme tokens from `app/globals.css` over hardcoded color values.
- Logging: use scoped loggers from `lib/services/logger.ts`; avoid `console.log`/`console.error`.
- Auth checks: validate session server-side using better-auth before protected operations.
- AI outputs: validate with Zod schemas before persistence.

## Documentation Requirements

- If you change user flow, routes, or major feature behavior, update both `APP_FLOW.md` and `README.md` in the same change.

## Pitfalls To Avoid

- Avoid adding `"use client"` to server-first pages without clear need.
- Do not export `revalidate` in App Router pages when using cache components.
- Do not bypass ownership checks in server actions or oRPC procedures.
