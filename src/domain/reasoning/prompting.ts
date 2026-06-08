import type { TeamTurnContext } from "./types";

function relativeX(side: "home" | "away", x: number) {
  return side === "home" ? x : 12 - x;
}

function describeTeamShape(context: TeamTurnContext, side: "home" | "away") {
  const players = context.snapshot.players
    .filter((player) => player.side === side)
    .sort((left, right) => relativeX(side, left.position.x) - relativeX(side, right.position.x))
    .map((player) => {
      const rx = relativeX(side, player.position.x).toFixed(1);
      const y = player.position.y.toFixed(1);
      return `${player.role}@(${rx},${y})${player.id === context.snapshot.carrierId ? "*" : ""}`;
    });
  return players.join(", ");
}

function describeNearbyPressure(context: TeamTurnContext) {
  const carrier = context.snapshot.carrierId
    ? context.snapshot.players.find((player) => player.id === context.snapshot.carrierId)
    : undefined;
  if (!carrier) return "No controlled carrier";
  const opponents = context.snapshot.players
    .filter((player) => player.side !== carrier.side)
    .map((player) => ({
      role: player.role,
      distance: Math.hypot(player.position.x - carrier.position.x, player.position.y - carrier.position.y),
    }))
    .sort((left, right) => left.distance - right.distance)
    .slice(0, 3)
    .map((entry) => `${entry.role}:${entry.distance.toFixed(1)}`);
  return opponents.join(", ");
}

export function buildTeamTurnPrompt(context: TeamTurnContext): string {
  return [
    "You are the tactical brain for a five-player football team in a tiny, fast game.",
    "Return only JSON for the next bounded team decision.",
    `Window: ${context.window}`,
    `Team side: ${context.side}`,
    `Half: ${context.half}`,
    `Ball zone: ${context.ballZone}`,
    `Current event: ${context.event}`,
    `Visible tactical summary: ${context.visibleSummary}`,
    `Risk posture: ${context.plan.riskTolerance}`,
    `Priorities: ${context.plan.priorities.join(", ")}`,
    `Ball position: (${context.snapshot.ball.x.toFixed(1)}, ${context.snapshot.ball.y.toFixed(1)})`,
    `Score: home ${context.snapshot.score.home} away ${context.snapshot.score.away}`,
    `Our shape: ${describeTeamShape(context, context.side)}`,
    `Opponent shape: ${describeTeamShape(context, context.side === "home" ? "away" : "home")}`,
    `Nearest pressure around carrier: ${describeNearbyPressure(context)}`,
    "Optimize for sane shape, progressive support, finding open teammates, and moving closer to goal before shooting unless a long shot is clearly justified.",
    "Allowed objective values: retain, progress, probe, counter, press, protect, finish",
    "Allowed targetZone values: left, center, right",
    "Allowed supportStyle values: hold-shape, offer-short, overlap, attack-box, collapse",
    "Allowed ballAction values: pass, carry, switch, clear, shoot",
    "Allowed pressing values: low, medium, high",
    "Allowed riskLevel values: low, medium, high",
    "Output JSON keys only: objective, targetZone, supportStyle, ballAction, pressing, riskLevel, eventLabel, explanation",
  ].join("\n");
}
