import db from "@/lib/db";

export async function getDashboardData(userId: string) {
  try {
    const [user, draftAssessment, recentAssessments, activeRoadmap] =
      await Promise.all([
        db.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            cvUrl: true,
            useCvForAnalysis: true,
          },
        }),

        db.assessment.findFirst({
          where: {
            userId,
            status: "IN_PROGRESS",
          },
          select: {
            id: true,
            targetRole: true,
            startedAt: true,
            lastStepCompleted: true,
          },
          orderBy: {
            startedAt: "desc",
          },
        }),

        db.assessment.findMany({
          where: {
            userId,
            status: "COMPLETED",
          },
          select: {
            id: true,
            targetRole: true,
            status: true,
            startedAt: true,
            completedAt: true,
            _count: {
              select: {
                results: true,
              },
            },
          },
          orderBy: {
            completedAt: "desc",
          },
          take: 5,
        }),

        db.roadmap.findFirst({
          where: {
            userId,
            completedAt: null,
          },
          select: {
            id: true,
            title: true,
            totalWeeks: true,
            startedAt: true,
            completedAt: true,
            milestones: {
              select: {
                id: true,
                title: true,
                description: true,
                weekNumber: true,
                status: true,
                skillId: true,
                resources: true,
                progress: {
                  select: {
                    id: true,
                    verificationMethod: true,
                    aiVerificationScore: true,
                    selfReportedAt: true,
                    aiVerifiedAt: true,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                  take: 1,
                },
              },
              orderBy: {
                weekNumber: "asc",
              },
            },
          },
          orderBy: {
            startedAt: "desc",
          },
        }),
      ]);

    return {
      user,
      draftAssessment,
      recentAssessments: recentAssessments.map((assessment) => ({
        id: assessment.id,
        targetRole: assessment.targetRole,
        status: assessment.status,
        startedAt: assessment.startedAt,
        completedAt: assessment.completedAt,
        resultsCount: assessment._count.results,
      })),
      activeRoadmap,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);

    return {
      user: null,
      draftAssessment: null,
      recentAssessments: [],
      activeRoadmap: null,
    };
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
