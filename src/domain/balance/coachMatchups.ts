import { simulateMatchAsync } from "../match/simulateMatch";
import { createMatchTrace } from "../match-v2/trace";
import { createRealismReport } from "../realism/report";
import type { RealismCategory, RealismReport } from "../realism/types";
import { fallbackTeamTurnProvider } from "../reasoning/providers";
import type { TeamTurnProvider } from "../reasoning/types";
import { keywordPlanProvider } from "../tactics/providers/keywordPlanProvider";
import type { TeamSide } from "../tactics/types";

export interface CoachProfile {
  id: string;
  label: string;
  inspiration: string;
  openingPrompt: string;
  halftimePrompt: string;
}

export interface CoachMatchup {
  id: string;
  homeCoach: keyof typeof COACH_PROFILES;
  awayCoach: keyof typeof COACH_PROFILES;
  note: string;
}

export interface CoachMatchupResult {
  matchup: CoachMatchup;
  homeCoach: CoachProfile;
  awayCoach: CoachProfile;
  report: RealismReport;
  winner: "home" | "away" | "draw";
  finalScore: { home: number; away: number };
  shotLikeEvents: number;
  shotsOnGoalEvents: number;
  pressureFrames: number;
  turnoverEvents: number;
  uniqueCarriers: number;
}

export interface CoachMatchupSuiteResult {
  results: CoachMatchupResult[];
  averageOverall: number;
  readyCount: number;
  categoryAverages: Record<RealismCategory, number>;
}

export const COACH_PROFILES = {
  guardiolaInspired: {
    id: "guardiola-inspired",
    label: "Positional control",
    inspiration: "Inspired by Guardiola",
    openingPrompt:
      "Keep the ball, stay patient, build triangles around the link, and move the block until a runner can arrive free at the back post.",
    halftimePrompt:
      "Pin the opponent deeper, keep the anchor circulating possession, and attack the box only after a clean third-man run opens.",
  },
  kloppInspired: {
    id: "klopp-inspired",
    label: "Heavy-metal press",
    inspiration: "Inspired by Klopp",
    openingPrompt:
      "Hunt bad touches, press in packs, win it high, and drive forward before the other side can reset its shape.",
    halftimePrompt:
      "Keep the press aggressive, push the runner beyond the last line, and attack loose balls before they can recover.",
  },
  jorgeJesusInspired: {
    id: "jorge-jesus-inspired",
    label: "Vertical overloads",
    inspiration: "Inspired by Jorge Jesus",
    openingPrompt:
      "Play forward early, create overloads on one side, then fire the next pass into the striker and flood the second ball.",
    halftimePrompt:
      "Speed the tempo up, send the link close to the forward, and keep looking for quick combinations into the danger zone.",
  },
  mourinhoInspired: {
    id: "mourinho-inspired",
    label: "Compact trap",
    inspiration: "Inspired by Mourinho",
    openingPrompt:
      "Stay compact, protect the middle, tempt them wide, then break the moment the ball is exposed or the runner can sprint into space.",
    halftimePrompt:
      "Defend the box first, keep the anchor screening, and counter directly into the channels when the pass is on.",
  },
  simeoneInspired: {
    id: "simeone-inspired",
    label: "Aggressive block",
    inspiration: "Inspired by Simeone",
    openingPrompt:
      "Keep short distances, snap into duels, close the lane into the forward, and make every carry feel crowded.",
    halftimePrompt:
      "Stay fierce without losing shape, win the second ball, and launch the runner the second their shape stretches.",
  },
} satisfies Record<string, CoachProfile>;

export const COACH_MATCHUPS: CoachMatchup[] = [
  {
    id: "guardiola-vs-klopp",
    homeCoach: "guardiolaInspired",
    awayCoach: "kloppInspired",
    note: "Control against pressure should force clear possession and turnover tradeoffs.",
  },
  {
    id: "guardiola-vs-jorge-jesus",
    homeCoach: "guardiolaInspired",
    awayCoach: "jorgeJesusInspired",
    note: "Patient circulation should clash with vertical overloads and quick box entries.",
  },
  {
    id: "klopp-vs-mourinho",
    homeCoach: "kloppInspired",
    awayCoach: "mourinhoInspired",
    note: "High press versus compact block should create readable pressure and release moments.",
  },
  {
    id: "jorge-jesus-vs-simeone",
    homeCoach: "jorgeJesusInspired",
    awayCoach: "simeoneInspired",
    note: "Direct attacks should be stress-tested against short-distance defending.",
  },
  {
    id: "mourinho-vs-guardiola",
    homeCoach: "mourinhoInspired",
    awayCoach: "guardiolaInspired",
    note: "The compact trap should be forced to resist longer control phases from the away side.",
  },
];

function createCoachPlanSet(coach: CoachProfile, side: TeamSide) {
  return {
    opening: keywordPlanProvider(side, coach.openingPrompt),
    halftime: keywordPlanProvider(side, coach.halftimePrompt),
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

export async function runCoachMatchup(
  matchup: CoachMatchup,
  provider: TeamTurnProvider = fallbackTeamTurnProvider,
): Promise<CoachMatchupResult> {
  const homeCoach = COACH_PROFILES[matchup.homeCoach];
  const awayCoach = COACH_PROFILES[matchup.awayCoach];
  const homePlans = createCoachPlanSet(homeCoach, "home");
  const awayPlans = createCoachPlanSet(awayCoach, "away");

  const result = await simulateMatchAsync({
    openingPlans: {
      home: homePlans.opening,
      away: awayPlans.opening,
    },
    halftimePlans: {
      home: homePlans.halftime,
      away: awayPlans.halftime,
    },
    provider,
  });

  const trace = createMatchTrace(result);
  const report = createRealismReport(trace);
  const shotLikeEvents = trace.events.filter(
    (event) => event.eventType === "shot" || event.eventType === "block" || event.eventType === "save" || event.eventType === "goal",
  ).length;
  const shotsOnGoalEvents = trace.events.filter((event) => event.eventType === "save" || event.eventType === "goal").length;
  const pressureFrames = trace.events.filter((event) => event.pressureCount > 0).length;
  const turnoverEvents = trace.events.filter(
    (event) => event.eventType === "turnover" || event.eventType === "recovery",
  ).length;
  const uniqueCarriers = new Set(trace.events.map((event) => event.carrierId).filter(Boolean)).size;

  return {
    matchup,
    homeCoach,
    awayCoach,
    report,
    winner: result.winner,
    finalScore: result.finalScore,
    shotLikeEvents,
    shotsOnGoalEvents,
    pressureFrames,
    turnoverEvents,
    uniqueCarriers,
  };
}

export async function runCoachMatchupSuite(
  matchups: CoachMatchup[] = COACH_MATCHUPS,
  provider: TeamTurnProvider = fallbackTeamTurnProvider,
): Promise<CoachMatchupSuiteResult> {
  const results = await Promise.all(matchups.map((matchup) => runCoachMatchup(matchup, provider)));

  return {
    results,
    averageOverall: average(results.map((result) => result.report.overall)),
    readyCount: results.filter((result) => result.report.ready).length,
    categoryAverages: {
      offBallShape: average(results.map((result) => result.report.traceScore.categories.offBallShape.score)),
      ballInteractions: average(results.map((result) => result.report.traceScore.categories.ballInteractions.score)),
      defending: average(results.map((result) => result.report.traceScore.categories.defending.score)),
      chanceCreation: average(results.map((result) => result.report.traceScore.categories.chanceCreation.score)),
    },
  };
}
