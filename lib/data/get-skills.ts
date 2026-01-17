"use cache";

import db from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";

/**
 * Fetch skill graph with relationships.
 * Cached for ~1 day since skills rarely change.
 */
export async function getSkillGraph() {
  cacheLife("days");
  cacheTag("skills");

  return db.skill.findMany({
    include: {
      fromRelations: {
        include: {
          toSkill: true,
        },
      },
    },
  });
}

/**
 * Fetch all skills without relationships.
 * Cached for ~1 day since skills rarely change.
 */
export async function getAllSkills() {
  cacheLife("days");
  cacheTag("skills");

  return db.skill.findMany();
}
