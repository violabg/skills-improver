import db from "@/lib/db";

export async function processEvidence({
  provider,
  referenceUrl,
}: {
  provider?: string;
  referenceUrl?: string;
}): Promise<{ signals: Record<string, unknown>; rawStored: boolean }> {
  // Basic evidence processing:
  // - If GitHub URL, call GitHub API to fetch repo metadata (stars, forks, description)
  // - Attempt simple keyword matching against Skill names to produce skill signals

  const signals: Record<string, unknown> = {
    provider: provider ?? null,
    referenceUrl: referenceUrl ?? null,
    extractedAt: new Date().toISOString(),
  };

  if (referenceUrl) {
    try {
      const parsed = new URL(referenceUrl);
      if (parsed.hostname.includes("github.com")) {
        const parts = parsed.pathname.split("/").filter(Boolean);
        const owner = parts[0];
        const repo = parts[1];
        if (owner && repo) {
          const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
          const res = await fetch(apiUrl, {
            headers: { Accept: "application/vnd.github.v3+json" },
          });
          if (res.ok) {
            const data = await res.json();
            signals.github = {
              full_name: data.full_name,
              description: data.description,
              stargazers_count: data.stargazers_count,
              forks_count: data.forks_count,
              language: data.language,
            };

            // Simple skill matching: check skill names and domains contain keywords
            const skills = await db.skill.findMany();
            const matched: Array<{ id: string; name: string }> = [];
            const text = `${data.full_name} ${data.description || ""} ${
              data.language || ""
            }`.toLowerCase();
            for (const s of skills) {
              const name = s.name.toLowerCase();
              if (
                text.includes(name) ||
                (s.domain && text.includes(s.domain.toLowerCase()))
              ) {
                matched.push({ id: s.id, name: s.name });
              }
            }

            signals.matchedSkills = matched;
          } else {
            signals.github = { error: `GitHub API returned ${res.status}` };
          }
        }
      }
    } catch (err) {
      signals.github = { error: String(err) };
    }
  }

  // No raw storage yet; just return signals
  return { signals, rawStored: false };
}
