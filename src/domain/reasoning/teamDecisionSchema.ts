import type { TeamDecision, TeamDecisionWindow } from "./types";
import type { TeamSide } from "../tactics/types";

const OBJECTIVES = new Set<TeamDecision["objective"]>([
  "retain",
  "progress",
  "probe",
  "counter",
  "press",
  "protect",
  "finish",
]);
const ZONES = new Set<TeamDecision["targetZone"]>(["left", "center", "right"]);
const SUPPORT = new Set<TeamDecision["supportStyle"]>([
  "hold-shape",
  "offer-short",
  "overlap",
  "attack-box",
  "collapse",
]);
const BALL = new Set<TeamDecision["ballAction"]>(["pass", "carry", "switch", "clear", "shoot"]);
const PRESS = new Set<TeamDecision["pressing"]>(["low", "medium", "high"]);
const RISK = new Set<TeamDecision["riskLevel"]>(["low", "medium", "high"]);
const ACTOR_ROLES = new Set<NonNullable<TeamDecision["likelyActorRole"]>>([
  "keeper",
  "anchor",
  "link",
  "runner",
  "forward",
]);
const RECEIVER_ROLES = new Set<NonNullable<TeamDecision["preferredReceiverRole"]>>([
  "anchor",
  "link",
  "runner",
  "forward",
]);

export function normalizeTeamDecision(
  raw: Partial<TeamDecision> | null | undefined,
  side: TeamSide,
  window: TeamDecisionWindow,
): TeamDecision {
  const objective = OBJECTIVES.has(raw?.objective as TeamDecision["objective"])
    ? (raw?.objective as TeamDecision["objective"])
    : window === "final-third"
      ? "finish"
      : window === "transition"
        ? "counter"
        : "progress";
  return {
    side,
    window,
    objective,
    targetZone: ZONES.has(raw?.targetZone as TeamDecision["targetZone"])
      ? (raw?.targetZone as TeamDecision["targetZone"])
      : "center",
    supportStyle: SUPPORT.has(raw?.supportStyle as TeamDecision["supportStyle"])
      ? (raw?.supportStyle as TeamDecision["supportStyle"])
      : "offer-short",
    ballAction: BALL.has(raw?.ballAction as TeamDecision["ballAction"])
      ? (raw?.ballAction as TeamDecision["ballAction"])
      : objective === "finish"
        ? "shoot"
        : "pass",
    pressing: PRESS.has(raw?.pressing as TeamDecision["pressing"])
      ? (raw?.pressing as TeamDecision["pressing"])
      : "medium",
    riskLevel: RISK.has(raw?.riskLevel as TeamDecision["riskLevel"])
      ? (raw?.riskLevel as TeamDecision["riskLevel"])
      : "medium",
    likelyActorRole: ACTOR_ROLES.has(raw?.likelyActorRole as NonNullable<TeamDecision["likelyActorRole"]>)
      ? (raw?.likelyActorRole as NonNullable<TeamDecision["likelyActorRole"]>)
      : objective === "finish"
        ? "forward"
        : objective === "protect"
          ? "anchor"
          : "link",
    preferredReceiverRole: RECEIVER_ROLES.has(
      raw?.preferredReceiverRole as NonNullable<TeamDecision["preferredReceiverRole"]>,
    )
      ? (raw?.preferredReceiverRole as NonNullable<TeamDecision["preferredReceiverRole"]>)
      : objective === "counter"
        ? "runner"
        : objective === "retain"
          ? "anchor"
          : "forward",
    eventLabel: typeof raw?.eventLabel === "string" && raw.eventLabel.length > 0 ? raw.eventLabel : "Team turn shifts",
    explanation:
      typeof raw?.explanation === "string" && raw.explanation.length > 0
        ? raw.explanation
        : "A bounded tactical team choice steers the next phase of play.",
  };
}
