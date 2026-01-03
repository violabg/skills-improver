import db from "@/lib/db";

async function main() {
  // Clear existing skills
  await db.skill.deleteMany({});

  // Create hard skills
  const hardSkills = await db.skill.createMany({
    data: [
      {
        name: "React/Frontend Frameworks",
        category: "HARD",
        domain: "Frontend",
        difficulty: 3,
        marketRelevance: 0.95,
        assessable: true,
      },
      {
        name: "TypeScript",
        category: "HARD",
        domain: "Frontend",
        difficulty: 3,
        marketRelevance: 0.9,
        assessable: true,
      },
      {
        name: "Testing & Quality Assurance",
        category: "HARD",
        domain: "Frontend",
        difficulty: 3,
        marketRelevance: 0.85,
        assessable: true,
      },
      {
        name: "API Design & Integration",
        category: "HARD",
        domain: "Backend",
        difficulty: 4,
        marketRelevance: 0.9,
        assessable: true,
      },
      {
        name: "Database Design",
        category: "HARD",
        domain: "Backend",
        difficulty: 4,
        marketRelevance: 0.85,
        assessable: true,
      },
      {
        name: "System Architecture",
        category: "HARD",
        domain: "Backend",
        difficulty: 5,
        marketRelevance: 0.8,
        assessable: true,
      },
    ],
  });

  // Create soft skills
  const softSkills = await db.skill.createMany({
    data: [
      {
        name: "Technical Communication",
        category: "SOFT",
        domain: "Communication",
        difficulty: 3,
        marketRelevance: 0.9,
        assessable: true,
      },
      {
        name: "Team Collaboration",
        category: "SOFT",
        domain: "Teamwork",
        difficulty: 2,
        marketRelevance: 0.95,
        assessable: true,
      },
      {
        name: "Problem Solving",
        category: "SOFT",
        domain: "Thinking",
        difficulty: 3,
        marketRelevance: 0.95,
        assessable: true,
      },
      {
        name: "Mentoring Others",
        category: "SOFT",
        domain: "Leadership",
        difficulty: 4,
        marketRelevance: 0.8,
        assessable: true,
      },
      {
        name: "Giving/Receiving Feedback",
        category: "SOFT",
        domain: "Communication",
        difficulty: 2,
        marketRelevance: 0.85,
        assessable: true,
      },
    ],
  });

  // Create meta skills
  const metaSkills = await db.skill.createMany({
    data: [
      {
        name: "Learning New Technologies",
        category: "META",
        domain: "Growth",
        difficulty: 3,
        marketRelevance: 0.95,
        assessable: true,
      },
      {
        name: "Work Prioritization",
        category: "META",
        domain: "Productivity",
        difficulty: 2,
        marketRelevance: 0.9,
        assessable: true,
      },
      {
        name: "Adapting to Change",
        category: "META",
        domain: "Resilience",
        difficulty: 3,
        marketRelevance: 0.85,
        assessable: true,
      },
      {
        name: "Taking Ownership",
        category: "META",
        domain: "Responsibility",
        difficulty: 3,
        marketRelevance: 0.9,
        assessable: true,
      },
    ],
  });

  console.log(
    `✅ Seeded ${hardSkills.count + softSkills.count + metaSkills.count} skills`
  );
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
