import { router } from "@/lib/orpc/router";
import { createRouterClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../../prisma/client";

// Mock auth library
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";

// Mock user for testing
const mockUser: User = {
  id: "test-user-id",
  githubId: "123456",
  email: "test@example.com",
  name: "Test User",
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  emailVerified: true,
  image: null,
  cvUrl: null,
  useCvForAnalysis: false,
};

// Mock DB
const mockDb = {
  user: {
    findUnique: vi.fn(),
  },
  assessment: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  skill: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  assessmentResult: {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
};

// Helper to create caller
const createCaller = () => {
  return createRouterClient(router, {
    context: async () => ({
      db: mockDb as any,
      headers: new Headers(),
    }),
  });
};

describe("oRPC Health Procedures", () => {
  it("should respond to health.ping", async () => {
    const caller = createCaller();
    const result = await caller.health.ping();

    expect(result).toHaveProperty("ok", true);
    expect(result).toHaveProperty("timestamp");
  });
});

describe("oRPC Skills Procedures (Public)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list all skills", async () => {
    // Auth setup
    (auth.api.getSession as any).mockResolvedValue({
      user: { id: mockUser.id },
    });
    mockDb.user.findUnique.mockResolvedValue(mockUser);

    mockDb.skill.findMany.mockResolvedValue([
      { id: "1", name: "React", category: "HARD" },
    ]);
    const caller = createCaller();
    const result = await caller.skills.list();

    expect(Array.isArray(result)).toBe(true);
    expect(mockDb.skill.findMany).toHaveBeenCalled();
  });

  it("should filter skills by category", async () => {
    // Auth setup
    (auth.api.getSession as any).mockResolvedValue({
      user: { id: mockUser.id },
    });
    mockDb.user.findUnique.mockResolvedValue(mockUser);

    mockDb.skill.findMany.mockResolvedValue([
      { id: "1", name: "React", category: "HARD" },
    ]);
    const caller = createCaller();
    const result = await caller.skills.list({ category: "HARD" });

    expect(Array.isArray(result)).toBe(true);
    expect(mockDb.skill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: "HARD" }),
      })
    );
  });
});

describe("oRPC Protected Procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require authentication for assessment.start", async () => {
    // Mock getSession to return null
    (auth.api.getSession as any).mockResolvedValue(null);

    const caller = createCaller();

    await expect(
      caller.assessment.start({
        currentRole: "Student",
        targetRole: "Senior Frontend Developer",
      })
    ).rejects.toThrow();
  });

  it("should create assessment when authenticated", async () => {
    // Mock authenticated session
    (auth.api.getSession as any).mockResolvedValue({
      user: { id: mockUser.id },
    });
    // Mock DB finding user
    mockDb.user.findUnique.mockResolvedValue(mockUser);

    // Mock assessment creation
    mockDb.assessment.create.mockResolvedValue({
      id: "new-id",
      targetRole: "Senior Frontend Developer",
      userId: mockUser.id,
      status: "IN_PROGRESS",
    });

    const caller = createCaller();

    // Note: 'targetRole' is not in the input schema for assessment.start anymore?
    // Let's check router.ts: start input has { currentRole, yearsExperience... } NOT targetRole!
    // targetRole is set via updateGoal.
    // The original test assumed targetRole input for start. I should check router definition.
    // Line 22: currentRole: z.string()...
    // It does NOT have targetRole in input definition of 'start' in the file execution I saw.
    // It has create: { ... status: "IN_PROGRESS" ... } and input keys: currentRole, yearsExperience, industry, careerIntent.

    // ADJUSTING INPUT TO MATCH SCHEMA
    const result = await caller.assessment.start({
      currentRole: "Frontend Dev",
      industry: "Tech",
      careerIntent: "GROWTH",
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("status", "IN_PROGRESS");
    expect(mockDb.assessment.create).toHaveBeenCalled();
  });
});

describe("AI Evaluation Schema Validation", () => {
  it("should validate skill evaluation output", async () => {
    const { SkillEvaluationSchema } = await import(
      "@/lib/ai/schemas/skillEvaluation.schema"
    );

    const validOutput = {
      skillId: "123e4567-e89b-12d3-a456-426614174000",
      level: 3,
      confidence: 0.8,
      notes: "Good understanding demonstrated",
      strengths: ["Clear explanation", "Practical examples"],
      weaknesses: ["Could improve depth"],
    };

    const result = SkillEvaluationSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  it("should reject invalid skill evaluation output", async () => {
    const { SkillEvaluationSchema } = await import(
      "@/lib/ai/schemas/skillEvaluation.schema"
    );

    const invalidOutput = {
      skillId: "test-skill-id",
      level: 10, // Invalid: max is 5
      confidence: 1.5, // Invalid: max is 1
      notes: "Test",
    };

    const result = SkillEvaluationSchema.safeParse(invalidOutput);
    expect(result.success).toBe(false);
  });
});
