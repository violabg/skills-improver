import { db } from "@/lib/db";
import { router } from "@/lib/orpc/router";
import type { User } from "@prisma/client";
import { describe, expect, it } from "vitest";

// Mock user for testing
const mockUser: User = {
  id: "test-user-id",
  githubId: "123456",
  email: "test@example.com",
  name: "Test User",
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("oRPC Health Procedures", () => {
  it("should respond to health.ping", async () => {
    const result = await router.health.ping({
      ctx: {
        db,
        headers: new Headers(),
      },
      input: undefined,
    });

    expect(result).toHaveProperty("ok", true);
    expect(result).toHaveProperty("timestamp");
  });
});

describe("oRPC Skills Procedures (Public)", () => {
  it("should list all skills", async () => {
    const result = await router.skills.list({
      ctx: {
        db,
        headers: new Headers(),
      },
      input: undefined,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should filter skills by category", async () => {
    const result = await router.skills.list({
      ctx: {
        db,
        headers: new Headers(),
      },
      input: { category: "HARD" },
    });

    expect(Array.isArray(result)).toBe(true);
    result.forEach((skill) => {
      expect(skill.category).toBe("HARD");
    });
  });
});

describe("oRPC Protected Procedures", () => {
  it("should require authentication for assessment.start", async () => {
    // Test without user in context (should fail)
    await expect(
      router.assessment.start({
        ctx: {
          db,
          headers: new Headers(),
        },
        input: { targetRole: "Senior Frontend Developer" },
      })
    ).rejects.toThrow();
  });

  it("should create assessment when authenticated", async () => {
    // Test with user in context (should succeed)
    const result = await router.assessment.start({
      ctx: {
        db,
        headers: new Headers(),
        user: mockUser,
      },
      input: { targetRole: "Senior Frontend Developer" },
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("targetRole", "Senior Frontend Developer");
    expect(result).toHaveProperty("userId", mockUser.id);
    expect(result).toHaveProperty("status", "IN_PROGRESS");
  });
});

describe("AI Evaluation Schema Validation", () => {
  it("should validate skill evaluation output", async () => {
    const { SkillEvaluationSchema } = await import(
      "@/lib/ai/schemas/skillEvaluation.schema"
    );

    const validOutput = {
      skillId: "test-skill-id",
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
