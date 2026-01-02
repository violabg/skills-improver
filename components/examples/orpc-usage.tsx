"use client";

import { useSession } from "@/lib/auth-client";
import { client } from "@/lib/orpc/client";
import { Skill } from "@/lib/prisma/client";
import { useEffect, useState } from "react";

export function SkillsList() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSkills() {
      try {
        setLoading(true);
        const data = await client.skills.list();
        setSkills(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load skills");
      } finally {
        setLoading(false);
      }
    }

    fetchSkills();
  }, []);

  if (loading) return <div>Loading skills...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-2xl">Available Skills</h2>
      <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="shadow-sm hover:shadow-md p-4 border rounded-lg transition-shadow"
          >
            <h3 className="font-semibold">{skill.name}</h3>
            <p className="text-muted-foreground text-sm">
              {skill.category} • {skill.domain || "General"}
            </p>
            {skill.difficulty && (
              <p className="mt-2 text-xs">Difficulty: {skill.difficulty}/5</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function UserProfile() {
  const { data: session, isPending } = useSession();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!session?.user) return;

      try {
        const data = await client.user.me();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    }

    fetchProfile();
  }, [session]);

  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Not authenticated</div>;

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-2xl">Your Profile</h2>
      <div className="p-4 border rounded-lg">
        <p className="font-medium">{profile?.name || "Anonymous"}</p>
        <p className="text-muted-foreground text-sm">{profile?.email}</p>
      </div>
    </div>
  );
}
