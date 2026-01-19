import { createRouterClient } from "@orpc/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PrismaClient, User } from "../../prisma/client";
import { router } from "../router";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";

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
        skillId: "123e4567-e89b-12d3-a456-426614174003",
        type: "code",
        question: "Mock Question?",
        evaluationCriteria: "Criteria",
      },
    ],
    questionsBySkill: {
      "123e4567-e89b-12d3-a456-426614174003": [
        {
          question: "Mock Question?",
          category: "hard",
        },
      ],
    },
  }),
}));

describe("AI Assessment Logic", () => {
  // Mock DB with user support for auth middleware
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
    user: {
      findUnique: vi.fn(),
    },
  };

  const mockUser: User = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    githubId: "123456",
    emailVerified: true,
    image: null,
    cvUrl: null,
    useCvForAnalysis: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Helper to create client
  const createClient = () =>
    createRouterClient(router, {
      context: async () => ({
        db: mockDb as unknown as PrismaClient,
        headers: new Headers(),
      }),
    });

  const caller = createClient();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default auth mocks
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: mockUser as unknown as {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        emailVerified: boolean;
        name: string;
        image?: string | null;
      },
      session: {
        id: "test-session-id",
        userId: mockUser.id,
        token: "test-token",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    mockDb.user.findUnique.mockResolvedValue(mockUser);
  });

  test("skills.generateForProfile should call AI and create new skills", async () => {
    // Setup mocks
    mockDb.assessment.findUnique.mockResolvedValue({
      id: "123e4567-e89b-12d3-a456-426614174000",
      userId: "user-123",
      targetRole: "Developer",
      currentRole: "Student",
    });

    mockDb.skill.findMany.mockResolvedValue([
      {
        id: "123e4567-e89b-12d3-a456-426614174001",
        name: "React",
        category: "HARD",
      },
    ]);

    // Mock finding existing skill (returns null -> create new)
    mockDb.skill.findFirst.mockResolvedValue(null);

    mockDb.skill.create.mockResolvedValue({
      id: "123e4567-e89b-12d3-a456-426614174002",
      name: "New Skill A",
      category: "HARD",
    });

    // Execute
    const result = await caller.skills.generateForProfile({
      assessmentId: "123e4567-e89b-12d3-a456-426614174000",
    });

    // Assert
    expect(result.reasoning).toBe("AI reasoning.");
    expect(mockDb.skill.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "New Skill A" }),
      }),
    );
  });

  test("questions.generateForSkills should return questions from AI", async () => {
    // Setup mocks
    mockDb.assessment.findUnique.mockResolvedValue({
      id: "123e4567-e89b-12d3-a456-426614174000",
      userId: "user-123",
      targetRole: "Developer",
    });

    mockDb.skill.findMany.mockResolvedValue([
      {
        id: "123e4567-e89b-12d3-a456-426614174003",
        name: "React",
        category: "HARD",
      },
    ]);

    // Execute
    const result = await caller.questions.generateForSkills({
      assessmentId: "123e4567-e89b-12d3-a456-426614174000",
      skillIds: ["123e4567-e89b-12d3-a456-426614174003"],
    });

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].question).toBe("Mock Question?");
    // expect(result[0].category).toBe("hard"); // Based on mock questionsBySkill structure, checking output
  });
});
