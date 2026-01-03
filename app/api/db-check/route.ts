import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stats = {
      skills: await db.skill.count(),
      assessments: await db.assessment.count(),
      assessmentResults: await db.assessmentResult.count(),
      users: await db.user.count(),
      skillsList: await db.skill.findMany({
        select: { id: true, name: true, category: true },
        orderBy: { category: "asc" },
      }),
    };

    // Sample: show most recent assessment if exists
    const latestAssessment = await db.assessment.findFirst({
      orderBy: { startedAt: "desc" },
      include: {
        results: {
          include: { skill: { select: { name: true, category: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats,
      latestAssessment: latestAssessment
        ? {
            id: latestAssessment.id,
            status: latestAssessment.status,
            resultCount: latestAssessment.results.length,
            results: latestAssessment.results.map((r) => ({
              skill: r.skill.name,
              category: r.skill.category,
              level: r.level,
              confidence: r.confidence,
            })),
          }
        : null,
    });
  } catch (error) {
    console.error("Database check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
