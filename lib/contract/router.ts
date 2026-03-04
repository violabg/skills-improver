import { assessmentContract } from "./assessment";
import { chatContract } from "./chat";
import { evidenceContract } from "./evidence";
import { gapsContract } from "./gaps";
import { healthContract } from "./health";
import { mentorContract } from "./mentor";
import { questionsContract } from "./questions";
import { resourcesContract } from "./resources";
import { roadmapContract } from "./roadmap";
import { skillHistoryContract } from "./skillHistory";
import { skillsContract } from "./skills";
import { userContract } from "./user";

export const contract = {
  health: healthContract,
  assessment: assessmentContract,
  skills: skillsContract,
  resources: resourcesContract,
  questions: questionsContract,
  evidence: evidenceContract,
  chat: chatContract,
  user: userContract,
  gaps: gapsContract,
  roadmap: roadmapContract,
  mentor: mentorContract,
  skillHistory: skillHistoryContract,
};

export type AppContract = typeof contract;
