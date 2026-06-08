import { applyHalftimePrompts } from "../domain/match/halftime";
import { simulateMatchAsync } from "../domain/match/simulateMatch";
import { keywordPlanProvider } from "../domain/tactics/providers/keywordPlanProvider";
import { interpolateFrames } from "../presentation/frameInterpolator";
import type { MatchResult } from "../domain/match/types";
import type { TeamSide } from "../domain/tactics/types";

export type AppPhase =
  | "start"
  | "prompt-home"
  | "prompt-away"
  | "loading-first-half"
  | "first-half"
  | "halftime"
  | "loading-second-half"
  | "second-half"
  | "result";

export interface GameSession {
  phase: AppPhase;
  prompts: Record<TeamSide, string>;
  openingResult: MatchResult | null;
  finalResult: MatchResult | null;
  frames: MatchResult["frames"];
}

export function createInitialSession(): GameSession {
  return {
    phase: "start",
    prompts: { home: "", away: "" },
    openingResult: null,
    finalResult: null,
    frames: [],
  };
}

export function setPrompt(session: GameSession, side: TeamSide, prompt: string): GameSession {
  return {
    ...session,
    prompts: {
      ...session.prompts,
      [side]: prompt,
    },
  };
}

export async function startMatch(session: GameSession): Promise<GameSession> {
  const openingPlans = {
    home: keywordPlanProvider("home", session.prompts.home),
    away: keywordPlanProvider("away", session.prompts.away),
  };
  const openingResult = await simulateMatchAsync({
    openingPlans,
    halftimePlans: openingPlans,
  });
  const firstHalfFrames = interpolateFrames(
    openingResult.frames.filter((frame) => frame.half === 1),
  );
  return {
    ...session,
    phase: "first-half",
    openingResult,
    frames: firstHalfFrames,
  };
}

export async function startSecondHalf(
  session: GameSession,
  halftimePrompts: Record<TeamSide, string>,
): Promise<GameSession> {
  const halftimePlans = applyHalftimePrompts(halftimePrompts);
  const openingPlans = {
    home: keywordPlanProvider("home", session.prompts.home),
    away: keywordPlanProvider("away", session.prompts.away),
  };
  const finalResult = await simulateMatchAsync({
    openingPlans,
    halftimePlans,
  });
  const secondHalfFrames = interpolateFrames(
    finalResult.frames.filter((frame) => frame.half === 2),
  );

  return {
    ...session,
    phase: "second-half",
    finalResult,
    frames: secondHalfFrames,
  };
}
