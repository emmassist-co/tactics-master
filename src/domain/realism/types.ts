export type RealismCategory =
  | "offBallShape"
  | "ballInteractions"
  | "defending"
  | "chanceCreation";

export interface TraceEvent {
  tick: number;
  half: 1 | 2;
  event: string;
  eventType: string;
  possession: "home" | "away";
  carrierId?: string;
  ballStateType: "controlled" | "in-transit" | "loose" | "unknown";
  pressureCount: number;
  ball: { x: number; y: number };
  score: { home: number; away: number };
  averageTeamSpacing: Record<"home" | "away", number>;
}

export interface MatchTrace {
  events: TraceEvent[];
  totalFrames: number;
  finalScore: { home: number; away: number };
}

export interface CategoryScore {
  category: RealismCategory;
  score: number;
  summary: string;
  metrics: Record<string, number>;
}

export interface TraceScorecard {
  categories: Record<RealismCategory, CategoryScore>;
  overall: number;
  ready: boolean;
  failedCategories: RealismCategory[];
}

export interface BrowserArtifactManifest {
  started: boolean;
  reachedLiveField: boolean;
  reachedHalftime: boolean;
  reachedResult: boolean;
  screenshots: string[];
  recordingPath?: string;
  notes: string[];
}

export interface BrowserReviewSummary {
  score: number;
  summary: string;
  notes: string[];
  artifacts: BrowserArtifactManifest;
}

export interface ReadinessThresholds {
  categoryFloors: Record<RealismCategory, number>;
  overallFloor: number;
}

export interface RealismReport {
  trace: MatchTrace;
  traceScore: TraceScorecard;
  browserReview?: BrowserReviewSummary;
  ready: boolean;
  overall: number;
}

