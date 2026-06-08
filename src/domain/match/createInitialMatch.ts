import type { TeamSide } from "../tactics/types";
import type { PlayerState } from "./types";

const HOME_POSITIONS = [
  { x: 1, y: 4 },
  { x: 3, y: 2 },
  { x: 4, y: 4 },
  { x: 3, y: 6 },
  { x: 6, y: 4 },
];

const AWAY_POSITIONS = [
  { x: 11, y: 4 },
  { x: 9, y: 2 },
  { x: 8, y: 4 },
  { x: 9, y: 6 },
  { x: 6, y: 4 },
];

const ROLES: PlayerState["role"][] = ["keeper", "anchor", "link", "runner", "forward"];

export function createTeam(side: TeamSide): PlayerState[] {
  const positions = side === "home" ? HOME_POSITIONS : AWAY_POSITIONS;
  return positions.map((position, index) => ({
    id: `${side}-${ROLES[index]}`,
    side,
    role: ROLES[index],
    position: { ...position },
    target: { ...position },
    hasBall: side === "home" && index === 2,
  }));
}
