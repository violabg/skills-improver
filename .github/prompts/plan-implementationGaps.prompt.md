# Plan: Complete Implementation Gaps & Missing CRUD Operations

Your assessment flow works but uses mock data, and multiple database entities (SkillRelation, Resource, Evidence) remain completely unused. The skill graph structure exists but has no relationships seeded and no visualization.

## Steps

1. **Wire real data to results page**: Replace mock data in [results-content.tsx](components/assessment/results-content.tsx) with oRPC queries to `assessment.getById` and `assessment.analyzeGaps`, fetch actual readiness score and recommendations.

2. **Seed skill relationships**: Add 40+ SkillRelation entries to [seed.ts](prisma/seed.ts) mapping prerequisites between the 15 existing skills (e.g., TypeScript REQUIRES JavaScript, System Design REQUIRES API Design).

3. **Implement Resource CRUD**: Create oRPC procedures in [lib/orpc/procedures/](lib/orpc/procedures/) for `resource.create/list/update/delete`, seed 20+ learning resources (YouTube/Coursera/FreeCodeCamp links) with skill mappings.

4. **Build evidence processing**: Implement `evidence.create` procedure in [lib/orpc/procedures/](lib/orpc/procedures/), add GitHub OAuth connector to [evidence-upload-form.tsx](components/assessment/evidence-upload-form.tsx) removing TODO comments, create signal extraction service in [lib/services/](lib/services/).

5. **Add graph visualization component**: Create `components/assessment/skill-graph.tsx` using react-flow/d3.js to render skill nodes and prerequisite edges from `assessment.getGraph()`, display on results page below gap analysis.

6. **Replace mock chat with AI advisor**: Update [chat-shell.tsx](components/chat/chat-shell.tsx) to call new `chat.sendMessage` oRPC procedure, implement context-aware AI using assessment data and AI SDK's `generateText()` with conversation history.

## Further Considerations

1. **Add delete operations?** User/Assessment deletion flows aren't implemented—do you want soft deletes with retention policies or hard deletes? Also consider GDPR compliance for user data.

2. **Graph traversal algorithm?** Should prerequisite detection use recursive CTEs in Postgres or in-memory BFS/DFS in TypeScript? CTE is more scalable but requires SQL expertise.

3. **Resource API integration?** Plan mentions YouTube/Coursera APIs—do you want live API fetching during gap analysis or pre-seeded static resources? Live fetching adds latency and API costs.
