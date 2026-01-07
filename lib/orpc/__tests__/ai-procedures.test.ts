import { beforeEach, describe, expect, test, vi } from "vitest";
import { router } from "../router"; // Adjust path if necessary

// Mock the AI generation functions
vi.mock("@/lib/ai/generateSkills", () => ({
  generateSkills: vi.fn().mockResolvedValue({
    selectedSkillIds: [],
    newSkills: [
      {
        name: "New Skill A",
        category: "HARD",
        domain: "Web",
        reasoning: "Because.",
      },
    ],
    reasoning: "AI reasoning.",
  }),
}));

vi.mock("@/lib/ai/generateQuestions", () => ({
  generateQuestions: vi.fn().mockResolvedValue({
    questions: [
      {
        skillId: "mock-skill-id",
        type: "code",
        question: "Mock Question?",
        evaluationCriteria: "Criteria",
      },
    ],
  }),
}));

describe("AI Assessment Logic", () => {
  // We need a mock context with DB
  // Simple mock setup
  const mockDb = {
    assessment: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    skill: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  };

  const mockContext = {
    user: { id: "user-123" },
    db: mockDb,
  };

  // We are testing the handlers directly or via caller if we set that up
  // For simplicity, let's just invoke the handler logic if exported, or use the caller.
  // Since we are inside the same project, we can just assume standard caller pattern or test internal functions if separated.
  // But here we are testing the router.

  // Re-create caller for each test
  const caller = (router as any).createCaller(mockContext);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("skills.generateForProfile should call AI and create new skills", async () => {
    // Setup mocks
    mockDb.assessment.findUnique.mockResolvedValue({
      id: "assess-1",
      userId: "user-123",
      targetRole: "Developer",
      currentRole: "Student",
    });

    mockDb.skill.findMany.mockResolvedValue([
      { id: "exist-1", name: "React", category: "HARD" },
    ]);

    // Mock finding existing skill (returns null -> create new)
    mockDb.skill.findFirst.mockResolvedValue(null);

    mockDb.skill.create.mockResolvedValue({
      id: "new-skill-1",
      name: "New Skill A",
      category: "HARD",
    });

    // Execute
    const result = await caller.skills.generateForProfile({
      assessmentId: "assess-1",
    });

    // Assert
    expect(result.reasoning).toBe("AI reasoning.");
    expect(mockDb.skill.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "New Skill A" }),
      })
    );
  });

  test("questions.generateForSkills should return questions from AI", async () => {
    // Setup mocks
    mockDb.assessment.findUnique.mockResolvedValue({
      id: "assess-1",
      userId: "user-123",
      targetRole: "Developer",
    });

    mockDb.skill.findMany.mockResolvedValue([
      { id: "mock-skill-id", name: "React", category: "HARD" },
    ]);

    // Execute
    const result = await caller.questions.generateForSkills({
      assessmentId: "assess-1",
      skillIds: ["mock-skill-id"],
    });

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].question).toBe("Mock Question?");
    expect(result[0].category).toBe("hard");
  });
});
