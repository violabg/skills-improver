/**
 * Assessment Agent using AI SDK 6's ToolLoopAgent.
 *
 * This agent orchestrates assessment-related workflows using tools that:
 * - Fetch data from the database
 * - Prepare context for analysis
 *
 * The agent decides which tools to use and generates AI analysis
 * based on the context provided by tool results.
 */

import { ToolLoopAgent, stepCountIs } from "ai";
import { skillEvaluationModel } from "../models";
import {
  analyzeGapsTool,
  evaluateSkillTool,
  fetchAssessmentTool,
  fetchSkillsTool,
  generateQuestionsTool,
  generateSkillsTool,
  recommendResourcesTool,
} from "../tools";

export const assessmentAgent = new ToolLoopAgent({
  model: skillEvaluationModel,

  instructions: `You are a senior career assessment advisor with expertise in software engineering career paths.

## Your Capabilities

You have access to the following tools:

### Data Fetching
- **fetchSkills**: Retrieve skills from the database (filter by category/domain)
- **fetchAssessment**: Get assessment results and skill evaluations

### Context Preparation  
- **evaluateSkill**: Prepare context for skill level evaluation
- **generateSkills**: Prepare context for skill suggestions
- **generateQuestions**: Prepare context for assessment questions
- **recommendResources**: Prepare context for learning resources
- **analyzeGaps**: Prepare context for gap analysis

## How to Use Tools

1. When asked about assessments, first use **fetchAssessment** to get current data
2. When analyzing skills, use **fetchSkills** to get the skill database
3. Use context preparation tools to structure your analysis
4. Generate your response based on the tool results

## Response Guidelines

- Be objective and data-driven
- Provide actionable recommendations
- Use the 0-5 skill level scale consistently
- Balance encouragement with honest assessment
- Focus on career growth potential`,

  tools: {
    // Data fetching tools
    fetchSkills: fetchSkillsTool,
    fetchAssessment: fetchAssessmentTool,

    // Context preparation tools
    evaluateSkill: evaluateSkillTool,
    generateSkills: generateSkillsTool,
    generateQuestions: generateQuestionsTool,
    recommendResources: recommendResourcesTool,
    analyzeGaps: analyzeGapsTool,
  },

  // Limit iterations to prevent runaway loops
  stopWhen: stepCountIs(10),
});

export type AssessmentAgent = typeof assessmentAgent;
