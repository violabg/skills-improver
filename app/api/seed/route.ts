import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Clear existing skills
    await db.skill.deleteMany({});

    // Create all 15 skills
    const skills = await db.skill.createMany({
      data: [
        // Hard Skills (6)
        {
          name: "React",
          category: "HARD",
          domain: "Frontend Framework",
          difficulty: 7,
          marketRelevance: 9.2,
          assessable: true,
          transferable: true,
        },
        {
          name: "TypeScript",
          category: "HARD",
          domain: "Programming Language",
          difficulty: 6,
          marketRelevance: 8.8,
          assessable: true,
          transferable: true,
        },
        {
          name: "Testing",
          category: "HARD",
          domain: "QA & Testing",
          difficulty: 6,
          marketRelevance: 7.5,
          assessable: true,
          transferable: true,
        },
        {
          name: "API Design",
          category: "HARD",
          domain: "System Design",
          difficulty: 7,
          marketRelevance: 8.3,
          assessable: true,
          transferable: true,
        },
        {
          name: "Database Design",
          category: "HARD",
          domain: "Database",
          difficulty: 7,
          marketRelevance: 8.1,
          assessable: true,
          transferable: true,
        },
        {
          name: "System Architecture",
          category: "HARD",
          domain: "Software Architecture",
          difficulty: 8,
          marketRelevance: 8.9,
          assessable: true,
          transferable: true,
        },
        // Soft Skills (5)
        {
          name: "Communication",
          category: "SOFT",
          domain: "Interpersonal Skills",
          difficulty: 5,
          marketRelevance: 8.7,
          assessable: true,
          transferable: true,
        },
        {
          name: "Collaboration",
          category: "SOFT",
          domain: "Team Skills",
          difficulty: 5,
          marketRelevance: 8.5,
          assessable: true,
          transferable: true,
        },
        {
          name: "Problem Solving",
          category: "SOFT",
          domain: "Analytical Skills",
          difficulty: 6,
          marketRelevance: 8.9,
          assessable: true,
          transferable: true,
        },
        {
          name: "Mentoring",
          category: "SOFT",
          domain: "Leadership",
          difficulty: 6,
          marketRelevance: 7.8,
          assessable: true,
          transferable: true,
        },
        {
          name: "Feedback",
          category: "SOFT",
          domain: "Leadership",
          difficulty: 5,
          marketRelevance: 7.4,
          assessable: true,
          transferable: true,
        },
        // Meta Skills (4)
        {
          name: "Learning Agility",
          category: "META",
          domain: "Personal Development",
          difficulty: 5,
          marketRelevance: 8.6,
          assessable: true,
          transferable: true,
        },
        {
          name: "Prioritization",
          category: "META",
          domain: "Time Management",
          difficulty: 5,
          marketRelevance: 8.2,
          assessable: true,
          transferable: true,
        },
        {
          name: "Adaptability",
          category: "META",
          domain: "Personal Development",
          difficulty: 5,
          marketRelevance: 8.3,
          assessable: true,
          transferable: true,
        },
        {
          name: "Ownership",
          category: "META",
          domain: "Work Ethic",
          difficulty: 5,
          marketRelevance: 8.4,
          assessable: true,
          transferable: true,
        },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        message: `✅ Seeded ${skills.count} skills`,
        count: skills.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
