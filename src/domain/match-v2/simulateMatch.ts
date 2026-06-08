import { createInitialState } from "./initialState";
import { simulateTick } from "./simulateTick";
import type { MatchState } from "./types";
import { classifyDecisionWindow } from "../reasoning/decisionWindows";
import { createTeamTurnContext } from "../reasoning/teamTurnContext";
import { aiTeamTurnProvider } from "../reasoning/providers";
import type { MatchResult } from "../match/types";
import type { TacticalPlan, TeamSide } from "../tactics/types";
import type { TeamDecision, TeamTurnProvider } from "../reasoning/types";

const TICKS_PER_HALF = 18;

export async function simulateMatchV2Async(input: {
  openingPlans: Record<TeamSide, TacticalPlan>;
  halftimePlans: Record<TeamSide, TacticalPlan>;
  provider?: TeamTurnProvider;
}): Promise<MatchResult> {
  const provider = input.provider ?? aiTeamTurnProvider;
  let state: MatchState = createInitialState();
  const frames = [state];
  let lastPossession: TeamSide | undefined;

  const runHalf = async (plans: Record<TeamSide, TacticalPlan>, half: 1 | 2) => {
    for (let tick = 0; tick < TICKS_PER_HALF; tick += 1) {
      const homeWindow = classifyDecisionWindow(state, "home", lastPossession);
      const awayWindow = classifyDecisionWindow(state, "away", lastPossession);
      const [homeDecision, awayDecision]: [TeamDecision, TeamDecision] = await Promise.all([
        provider.decide(createTeamTurnContext(state, "home", plans.home, homeWindow)),
        provider.decide(createTeamTurnContext(state, "away", plans.away, awayWindow)),
      ]);
      lastPossession = state.possession;
      state = simulateTick(state, { home: homeDecision, away: awayDecision });
      state = {
        ...state,
        half,
        decisionWindow: state.possession === "home" ? homeWindow : awayWindow,
      };
      frames.push(state);
    }
  };

  await runHalf(input.openingPlans, 1);

  frames.push({
    ...state,
    tick: state.tick + 1,
    event: "Halftime whistle",
  });

  state = {
    ...state,
    tick: state.tick + 2,
    half: 2,
    event: "Second half starts",
  };
  frames.push(state);

  await runHalf(input.halftimePlans, 2);

  const winner: TeamSide | "draw" =
    state.score.home === state.score.away ? "draw" : state.score.home > state.score.away ? "home" : "away";

  return {
    frames,
    winner,
    finalScore: state.score,
    openingPlans: input.openingPlans,
    halftimePlans: input.halftimePlans,
  };
}

