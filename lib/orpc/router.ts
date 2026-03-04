import { os } from "./procedures";
import { assessmentRouter } from "./routers/assessment";
import { chatRouter } from "./routers/chat";
import { evidenceRouter } from "./routers/evidence";
import { gapsRouter } from "./routers/gaps";
import { healthRouter } from "./routers/health";
import { mentorRouter } from "./routers/mentor";
import { questionsRouter } from "./routers/questions";
import { resourcesRouter } from "./routers/resources";
import { roadmapRouter } from "./routers/roadmap";
import { skillHistoryRouter } from "./routers/skillHistory";
import { skillsRouter } from "./routers/skills";
import { userRouter } from "./routers/user";

/**
 * Root router assembled with os.router() for full contract enforcement.
 * This ensures every implementation satisfies the contract at both
 * compile-time and runtime.
 */
export const router = os.router({
  health: healthRouter,
  assessment: assessmentRouter,
  skills: skillsRouter,
  resources: resourcesRouter,
  questions: questionsRouter,
  evidence: evidenceRouter,
  chat: chatRouter,
  user: userRouter,
  gaps: gapsRouter,
  roadmap: roadmapRouter,
  mentor: mentorRouter,
  skillHistory: skillHistoryRouter,
});

export type Router = typeof router;
