import type { MatchState } from "./types";
import type { GridPosition, PlayerRole, PlayerState } from "../match/types";
import type { TeamSide } from "../tactics/types";

const HOME_POSITIONS: GridPosition[] = [
  { x: 1, y: 4 },
  { x: 3, y: 2 },
  { x: 4, y: 4 },
  { x: 3.5, y: 6 },
  { x: 5.5, y: 4 },
];

const AWAY_POSITIONS: GridPosition[] = [
  { x: 11, y: 4 },
  { x: 9, y: 2 },
  { x: 8, y: 4 },
  { x: 8.5, y: 6 },
  { x: 6.5, y: 4 },
];

const ROLES: PlayerRole[] = ["keeper", "anchor", "link", "runner", "forward"];

function createTeam(side: TeamSide): PlayerState[] {
  const positions = side === "home" ? HOME_POSITIONS : AWAY_POSITIONS;
  return positions.map((position, index) => ({
    id: `${side}-${ROLES[index]}`,
    side,
    role: ROLES[index],
    position: { ...position },
    target: { ...position },
    hasBall: side === "home" && ROLES[index] === "link",
    isPressuring: false,
    pressureLevel: 0,
  }));
}

export function createInitialState(): MatchState {
  const players = [...createTeam("home"), ...createTeam("away")];
  return {
    tick: 0,
    half: 1,
    players,
    ball: { x: 4, y: 4 },
    ballState: {
      type: "controlled",
      playerId: "home-link",
      side: "home",
    },
    carrierId: "home-link",
    possession: "home",
    pressure: [],
    score: { home: 0, away: 0 },
    event: "Kick-off worked to the home link",
    eventType: "build-up",
  };
}

