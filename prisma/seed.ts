import "dotenv/config";

import { SkillCategory } from "@/lib/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  // Ensure DB connection
  try {
    await db.$connect();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Failed to connect to DB:", msg);
    process.exit(1);
  }

  // Idempotent upsert seeds for skills
  const skillsToSeed = [
    {
      name: "React/Frontend Frameworks",
      payload: {
        category: SkillCategory.HARD,
        domain: "Frontend",
        difficulty: 3,
        marketRelevance: 0.95,
        assessable: true,
      },
    },
    {
      name: "TypeScript",
      payload: {
        category: SkillCategory.HARD,
        domain: "Frontend",
        difficulty: 3,
        marketRelevance: 0.9,
        assessable: true,
      },
    },
    {
      name: "Testing & Quality Assurance",
      payload: {
        category: SkillCategory.HARD,
        domain: "Frontend",
        difficulty: 3,
        marketRelevance: 0.85,
        assessable: true,
      },
    },
    {
      name: "API Design & Integration",
      payload: {
        category: SkillCategory.HARD,
        domain: "Backend",
        difficulty: 4,
        marketRelevance: 0.9,
        assessable: true,
      },
    },
    {
      name: "Database Design",
      payload: {
        category: SkillCategory.HARD,
        domain: "Backend",
        difficulty: 4,
        marketRelevance: 0.85,
        assessable: true,
      },
    },
    {
      name: "System Architecture",
      payload: {
        category: SkillCategory.HARD,
        domain: "Backend",
        difficulty: 5,
        marketRelevance: 0.8,
        assessable: true,
      },
    },

    {
      name: "Technical Communication",
      payload: {
        category: SkillCategory.SOFT,
        domain: "Communication",
        difficulty: 3,
        marketRelevance: 0.9,
        assessable: true,
      },
    },
    {
      name: "Team Collaboration",
      payload: {
        category: SkillCategory.SOFT,
        domain: "Teamwork",
        difficulty: 2,
        marketRelevance: 0.95,
        assessable: true,
      },
    },
    {
      name: "Problem Solving",
      payload: {
        category: SkillCategory.SOFT,
        domain: "Thinking",
        difficulty: 3,
        marketRelevance: 0.95,
        assessable: true,
      },
    },
    {
      name: "Mentoring Others",
      payload: {
        category: SkillCategory.SOFT,
        domain: "Leadership",
        difficulty: 4,
        marketRelevance: 0.8,
        assessable: true,
      },
    },
    {
      name: "Giving/Receiving Feedback",
      payload: {
        category: SkillCategory.SOFT,
        domain: "Communication",
        difficulty: 2,
        marketRelevance: 0.85,
        assessable: true,
      },
    },

    {
      name: "Learning New Technologies",
      payload: {
        category: SkillCategory.META,
        domain: "Growth",
        difficulty: 3,
        marketRelevance: 0.95,
        assessable: true,
      },
    },
    {
      name: "Work Prioritization",
      payload: {
        category: SkillCategory.META,
        domain: "Productivity",
        difficulty: 2,
        marketRelevance: 0.9,
        assessable: true,
      },
    },
    {
      name: "Adapting to Change",
      payload: {
        category: SkillCategory.META,
        domain: "Resilience",
        difficulty: 3,
        marketRelevance: 0.85,
        assessable: true,
      },
    },
    {
      name: "Taking Ownership",
      payload: {
        category: SkillCategory.META,
        domain: "Responsibility",
        difficulty: 3,
        marketRelevance: 0.9,
        assessable: true,
      },
    },
  ];

  const upserted: Array<{ id: string; name: string }> = [];
  for (const s of skillsToSeed) {
    const res = await db.skill.upsert({
      where: { name: s.name },
      update: s.payload,
      create: { name: s.name, ...s.payload },
    });
    upserted.push({ id: res.id, name: res.name });
  }

  console.log(`✅ Seeded/updated ${upserted.length} skills`);

  // Relations to create (prerequisites)
  const relations = [
    { from: "TypeScript", to: "React/Frontend Frameworks", strength: 0.9 },
    {
      from: "React/Frontend Frameworks",
      to: "Testing & Quality Assurance",
      strength: 0.7,
    },
    {
      from: "API Design & Integration",
      to: "System Architecture",
      strength: 0.8,
    },
    { from: "Database Design", to: "System Architecture", strength: 0.8 },
    { from: "Problem Solving", to: "System Architecture", strength: 0.6 },
    { from: "Technical Communication", to: "Mentoring Others", strength: 0.6 },
    { from: "Learning New Technologies", to: "TypeScript", strength: 0.5 },
    { from: "Work Prioritization", to: "Taking Ownership", strength: 0.6 },
  ];

  let createdRelations = 0;
  for (const r of relations) {
    const from = upserted.find((u) => u.name === r.from)?.id;
    const to = upserted.find((u) => u.name === r.to)?.id;
    if (!from || !to) continue;

    const exists = await db.skillRelation.findFirst({
      where: { fromSkillId: from, toSkillId: to },
    });
    if (exists) continue;

    await db.skillRelation.create({
      data: { fromSkillId: from, toSkillId: to, strength: r.strength },
    });
    createdRelations++;
  }

  console.log(`✅ Seeded ${createdRelations} new skill relations`);

  // --- Seed Resources (idempotent) ---
  const resourcesToSeed = [
    {
      provider: "freeCodeCamp",
      url: "https://www.freecodecamp.org/learn/front-end-libraries/",
      title: "freeCodeCamp Front End Libraries",
      cost: "free",
      estimatedTime: 40,
    },
    {
      provider: "MDN",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/",
      title: "MDN JavaScript Guide",
      cost: "free",
      estimatedTime: 20,
    },
    {
      provider: "Egghead",
      url: "https://egghead.io/courses/learn-typescript",
      title: "Learn TypeScript",
      cost: "paid",
      estimatedTime: 15,
    },
    {
      provider: "Udemy",
      url: "https://www.udemy.com/course/testing-javascript/",
      title: "Testing JavaScript",
      cost: "paid",
      estimatedTime: 20,
    },
    {
      provider: "Coursera",
      url: "https://www.coursera.org/specializations/database-systems",
      title: "Database Systems Specialization",
      cost: "paid",
      estimatedTime: 60,
    },
    {
      provider: "Pluralsight",
      url: "https://www.pluralsight.com/courses/software-architecture-fundamentals",
      title: "Software Architecture Fundamentals",
      cost: "paid",
      estimatedTime: 25,
    },
  ];

  const upsertedResources: Array<{ id: string; url: string }> = [];
  for (const r of resourcesToSeed) {
    const existing = await db.resource.findFirst({ where: { url: r.url } });
    if (existing) {
      const updated = await db.resource.update({
        where: { id: existing.id },
        data: {
          provider: r.provider,
          title: r.title,
          cost: r.cost,
          estimatedTime: r.estimatedTime,
        },
      });
      upsertedResources.push({ id: updated.id, url: updated.url });
      continue;
    }

    const created = await db.resource.create({ data: r });
    upsertedResources.push({ id: created.id, url: created.url });
  }

  console.log(`✅ Seeded/updated ${upsertedResources.length} resources`);

  // --- Link Resources to Skills (ResourceSkill) ---
  let createdLinks = 0;
  const allSkills = await db.skill.findMany();
  for (const res of upsertedResources) {
    const resourceRow = await db.resource.findUnique({ where: { id: res.id } });
    if (!resourceRow) continue;

    const text = `${resourceRow.title || ""} ${resourceRow.url}`.toLowerCase();
    for (const s of allSkills) {
      const name = s.name.toLowerCase();
      if (
        text.includes(name) ||
        (s.domain && text.includes(s.domain.toLowerCase()))
      ) {
        const exists = await db.resourceSkill.findFirst({
          where: { resourceId: resourceRow.id, skillId: s.id },
        });
        if (exists) continue;

        await db.resourceSkill.create({
          data: { resourceId: resourceRow.id, skillId: s.id },
        });
        createdLinks++;
      }
    }
  }

  console.log(`✅ Created ${createdLinks} resource->skill links`);

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
