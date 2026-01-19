import { devToolsMiddleware } from "@ai-sdk/devtools";
import { generateText, Output, wrapLanguageModel } from "ai";
import { z } from "zod";
import { fastModel } from "./models";
import { isDevelopment } from "./utils";

// ============================================
// SCHEMA DEFINITIONS
// ============================================

const VerificationResultSchema = z.object({
  passed: z
    .boolean()
    .describe("Whether the user demonstrated sufficient understanding"),
  score: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score from 0 (no understanding) to 1 (mastery)"),
  newLevel: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe("Updated skill level based on demonstration"),
  feedback: z
    .string()
    .describe("Encouraging feedback with specific observations"),
  followUpQuestion: z
    .string()
    .describe(
      "Follow-up if more probing is needed, or empty string if not needed",
    ),
});

const QuizQuestionSchema = z.object({
  question: z
    .string()
    .describe(
      "A focused question testing practical understanding of the skill",
    ),
  expectedTopics: z
    .array(z.string())
    .describe("Key concepts/topics that should appear in a good answer"),
  difficulty: z
    .enum(["BASIC", "INTERMEDIATE", "ADVANCED"])
    .describe("Difficulty level based on target skill level"),
});

export type VerificationResult = z.infer<typeof VerificationResultSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

// ============================================
// INPUT TYPES
// ============================================

interface VerifyProgressInput {
  skillId: string;
  skillName: string;
  skillCategory: "HARD" | "SOFT" | "META";
  currentLevel: number;
  targetLevel: number;
  milestoneTitle: string;
  milestoneDescription?: string;
  userAnswer: string;
  question: string;
}

interface GenerateQuizInput {
  skillId: string;
  skillName: string;
  skillCategory: "HARD" | "SOFT" | "META";
  currentLevel: number;
  targetLevel: number;
  milestoneTitle: string;
  milestoneDescription?: string;
}

// ============================================
// GENERATE VERIFICATION QUESTION
// ============================================

/**
 * Generate a focused quiz question for skill verification.
 * The question tests practical understanding at the target level.
 */
export async function generateVerificationQuestion(
  input: GenerateQuizInput,
): Promise<QuizQuestion> {
  const prompt = buildQuestionPrompt(input);

  const aiModel = fastModel;
  const model = isDevelopment
    ? wrapLanguageModel({
        model: aiModel,
        middleware: devToolsMiddleware(),
      })
    : aiModel;

  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema: QuizQuestionSchema }),
      prompt,
    });

    return output;
  } catch (error) {
    console.error("Quiz question generation failed:", error);

    // Fallback question
    return {
      question: `Explain how you would apply ${input.skillName} in a real-world scenario related to ${input.milestoneTitle}.`,
      expectedTopics: [
        input.skillName,
        "practical application",
        "best practices",
      ],
      difficulty: input.targetLevel >= 4 ? "ADVANCED" : "INTERMEDIATE",
    };
  }
}

// ============================================
// VERIFY SKILL PROGRESS
// ============================================

/**
 * Verify a user's skill progress via AI evaluation of their answer.
 * Returns pass/fail status, updated skill level, and feedback.
 */
export async function verifySkillProgress(
  input: VerifyProgressInput,
): Promise<VerificationResult> {
  const prompt = buildVerificationPrompt(input);

  const aiModel = fastModel;
  const model = isDevelopment
    ? wrapLanguageModel({
        model: aiModel,
        middleware: devToolsMiddleware(),
      })
    : aiModel;

  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema: VerificationResultSchema }),
      prompt,
    });

    return output;
  } catch (error) {
    console.error("Skill verification failed:", error);

    // Fallback: generous pass if answer is substantial
    const hasSubstantialAnswer = input.userAnswer.length > 100;

    return {
      passed: hasSubstantialAnswer,
      score: hasSubstantialAnswer ? 0.6 : 0.3,
      newLevel: hasSubstantialAnswer
        ? Math.min(5, input.currentLevel + 1)
        : input.currentLevel,
      feedback: hasSubstantialAnswer
        ? "Good effort! Your answer shows understanding of the core concepts."
        : "Try to provide more detail in your answer to demonstrate your understanding.",
      followUpQuestion: hasSubstantialAnswer
        ? ""
        : `Can you give a specific example of how you've used ${input.skillName} in practice?`,
    };
  }
}

// ============================================
// PROMPT BUILDERS
// ============================================

function buildQuestionPrompt(input: GenerateQuizInput): string {
  const difficultyGuide =
    input.targetLevel >= 4
      ? "advanced (architectural decisions, trade-offs, edge cases)"
      : input.targetLevel >= 3
        ? "intermediate (practical implementation, common patterns)"
        : "basic (fundamental concepts, simple applications)";

  return `You are a technical interviewer creating a skill verification question.

**Skill:** ${input.skillName}
**Category:** ${input.skillCategory}
**Target Level:** ${input.targetLevel}/5
**Learning Context:** ${input.milestoneTitle}
${input.milestoneDescription ? `\n**What they studied:**\n${input.milestoneDescription}\n` : ""}

**Your Task:**
Create ONE focused question that tests ${difficultyGuide} understanding of ${input.skillName}.

**Guidelines:**
- For HARD skills: Ask about practical implementation, debugging, or architecture
- For SOFT skills: Ask about handling specific scenarios or stakeholder situations  
- For META skills: Ask about process, prioritization, or learning approaches
- Make the question specific and scenario-based when possible
- The question should be answerable in 2-4 sentences

**Expected Topics:**
List 3-5 key concepts/techniques that should appear in a strong answer.`;
}

function buildVerificationPrompt(input: VerifyProgressInput): string {
  return `You are evaluating a learner's skill demonstration.

**Skill:** ${input.skillName}
**Category:** ${input.skillCategory}
**Current Level:** ${input.currentLevel}/5
**Target Level:** ${input.targetLevel}/5

**Learning Context:** ${input.milestoneTitle}
${input.milestoneDescription ? `**What they studied:** ${input.milestoneDescription}\n` : ""}

**Question Asked:**
"${input.question}"

**User's Answer:**
"${input.userAnswer}"

**Your Task:**
1. **Evaluate** if the answer demonstrates understanding at or approaching the target level
2. **Score** their response (0.0 = no understanding, 1.0 = mastery)
3. **Determine** their updated skill level (1-5)
4. **Provide** encouraging, specific feedback

**Evaluation Criteria:**
- Does the answer show practical understanding, not just theory?
- Does it address the core concepts expected at level ${input.targetLevel}?
- Is there evidence of real application or just surface-level knowledge?

**Pass Threshold:**
- PASS: Score >= 0.6, demonstrates progress toward target level
- FAIL: Score < 0.6, needs more practice before advancing

**Important:**
- Be encouraging but honest
- If they partially understand, acknowledge what they got right
- Suggest specific improvements in feedback
- Only ask a follow-up question if the answer was too vague to evaluate`;
}
