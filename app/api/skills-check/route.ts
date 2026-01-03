import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const skills = await db.skill.findMany({
      select: {
        id: true,
        name: true,
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: skills.length,
      skills: skills.map((s) => `${s.name} (${s.category})`),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
