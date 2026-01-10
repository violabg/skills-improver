export interface GapItem {
  skillId: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  gapSize: number;
  impact: string;
  explanation: string;
  recommendedActions: string[];
  estimatedTimeWeeks: number;
  priority: number;
  resources?: Array<{
    id: string;
    provider: string;
    url: string;
    title?: string | null;
    cost?: string | null;
    estimatedTime?: number | null;
  }>;
  evidence?: Array<{
    id: string;
    provider?: string | null;
    referenceUrl?: string | null;
    signals?: unknown;
    createdAt?: string;
  }>;
}

export interface GapsData {
  assessmentId: string;
  assessmentGapsId: string;
  targetRole?: string | null;
  readinessScore: number;
  gaps: GapItem[];
  strengths: string[];
  overallRecommendation: string | null;
}
