import { normalizeTeamDecision } from "../teamDecisionSchema";
import type { TeamDecision } from "../types";
import type { TeamTurnProvider } from "../types";

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function direction(side: "home" | "away") {
  return side === "home" ? 1 : -1;
}

function relativeX(side: "home" | "away", x: number) {
  return side === "home" ? x : 12 - x;
}

function zoneY(zone: "left" | "center" | "right") {
  if (zone === "left") return 2.2;
  if (zone === "right") return 5.8;
  return 4;
}

function targetZoneForContext(context: Parameters<TeamTurnProvider["decide"]>[0]) {
  const ownPlayers = context.snapshot.players.filter((player) => player.side === context.side);
  const opponents = context.snapshot.players.filter((player) => player.side !== context.side);
  const laneScores = (["left", "center", "right"] as const).map((zone) => {
    const targetPoint = {
      x: Math.max(
        0.8,
        Math.min(11.2, context.snapshot.ball.x + direction(context.side) * (context.ballZone === "attacking-third" ? 1.1 : 1.8)),
      ),
      y: zoneY(zone),
    };
    const nearestOpponent = opponents.reduce((lowest, player) => {
      return Math.min(lowest, distance(player.position, targetPoint));
    }, Number.POSITIVE_INFINITY);
    const teammateSupport = ownPlayers.reduce((best, player) => {
      return Math.max(best, 3 - distance(player.position, targetPoint));
    }, 0);
    const currentBallBias =
      zone === "center"
        ? 0.1
        : (zone === "left" && context.snapshot.ball.y < 3.6) || (zone === "right" && context.snapshot.ball.y > 4.4)
          ? 0.35
          : 0;
    const widthBias =
      context.plan.shapeFocus === "wide" && zone !== "center"
        ? 0.45
        : context.plan.shapeFocus === "compact" && zone === "center"
          ? 0.35
          : 0;

    return { zone, score: nearestOpponent * 0.7 + teammateSupport + currentBallBias + widthBias };
  });

  return laneScores.sort((left, right) => right.score - left.score)[0]?.zone ?? "center";
}

function supportStyleForContext(
  context: Parameters<TeamTurnProvider["decide"]>[0],
  objective: TeamDecision["objective"],
  targetZone: TeamDecision["targetZone"],
) {
  if (objective === "protect") return "hold-shape";
  if (objective === "retain") return "offer-short";
  if (context.ballZone === "attacking-third") return "attack-box";
  if (objective === "probe") {
    return targetZone === "center" ? "offer-short" : "overlap";
  }
  if (context.plan.shapeFocus === "wide" || objective === "counter") return "overlap";
  if (context.plan.transitionStyle === "press" && context.ballZone === "middle-third") return "collapse";
  return "offer-short";
}

function ballActionForContext(
  context: Parameters<TeamTurnProvider["decide"]>[0],
  objective: TeamDecision["objective"],
  supportStyle: TeamDecision["supportStyle"],
  targetZone: TeamDecision["targetZone"],
  lanePressure: number,
  goalDistance: number,
  forwardOutletOpen: boolean,
) {
  if (objective === "finish") {
    if (context.ballZone === "attacking-third") return "shoot";
    if (
      (context.ballZone === "middle-third" && context.half === 2 && context.scoreDelta === 0 && context.plan.riskTolerance !== "low") ||
      goalDistance < 4.8
    ) {
      return "shoot";
    }
    return "pass";
  }

  if (objective === "protect") {
    return context.ballZone === "defensive-third" && context.window === "under-pressure" ? "clear" : "pass";
  }

  if (objective === "counter") {
    return forwardOutletOpen ? "pass" : lanePressure > 2.1 ? "carry" : "pass";
  }

  if (objective === "probe") {
    if (targetZone !== "center" && context.ballZone !== "attacking-third") return "switch";
    if (!forwardOutletOpen && lanePressure > 2.2 && goalDistance > 3.8) return "carry";
    return "pass";
  }

  if (objective === "retain") return "pass";
  if (supportStyle === "attack-box" && context.plan.riskTolerance === "high") return "carry";
  if (context.ballZone === "defensive-third") return "pass";
  if (!forwardOutletOpen && lanePressure > 2.3 && goalDistance > 4.2) return "carry";
  return "pass";
}

export const fallbackTeamTurnProvider: TeamTurnProvider = {
  async decide(context) {
    const ownPlayers = context.snapshot.players.filter((player) => player.side === context.side);
    const opponents = context.snapshot.players.filter((player) => player.side !== context.side);
    const carrier = context.snapshot.carrierId
      ? ownPlayers.find((player) => player.id === context.snapshot.carrierId)
      : undefined;
    const ball = context.snapshot.ball;
    const goalDistance = relativeX(context.side, 12) - relativeX(context.side, carrier?.position.x ?? ball.x);
    const nearestOpponentToCarrier = carrier
      ? opponents.reduce((lowest, player) => Math.min(lowest, distance(player.position, carrier.position)), Number.POSITIVE_INFINITY)
      : Number.POSITIVE_INFINITY;
    const progressiveOptions = ownPlayers
      .filter((player) => !carrier || player.id !== carrier.id)
      .map((player) => {
        const openness = opponents.reduce((lowest, opponent) => {
          return Math.min(lowest, distance(opponent.position, player.position));
        }, Number.POSITIVE_INFINITY);
        const progress = relativeX(context.side, player.position.x) - relativeX(context.side, carrier?.position.x ?? ball.x);
        return { player, openness, progress };
      })
      .sort((left, right) => right.progress + right.openness * 0.35 - (left.progress + left.openness * 0.35));
    const bestProgressiveOption = progressiveOptions[0];
    const forwardOutletOpen = Boolean(bestProgressiveOption && bestProgressiveOption.progress > 0.5 && bestProgressiveOption.openness > 1.35);
    const targetZone = targetZoneForContext(context);
    const laneTarget = { x: Math.max(0.8, Math.min(11.2, ball.x + direction(context.side) * 1.5)), y: zoneY(targetZone) };
    const lanePressure = opponents.reduce((lowest, player) => Math.min(lowest, distance(player.position, laneTarget)), Number.POSITIVE_INFINITY);

    let objective: TeamDecision["objective"] =
      context.window === "final-third" || goalDistance < 2.9
        ? "finish"
        : context.window === "under-pressure" && nearestOpponentToCarrier < 1.2 && !forwardOutletOpen
          ? "protect"
          : context.plan.transitionStyle === "counter" && forwardOutletOpen
            ? "counter"
            : context.plan.mentality === "control" && context.ballZone === "defensive-third"
              ? "retain"
              : context.plan.mentality === "control"
                ? "probe"
                : forwardOutletOpen || context.ballZone !== "defensive-third"
                  ? "progress"
                  : "retain";
    if (context.ballZone === "middle-third" && forwardOutletOpen && objective === "retain") {
      objective = "probe";
    }
    if (context.half === 2 && context.scoreDelta < 0 && objective === "retain") {
      objective = "progress";
    }
    if (context.half === 2 && context.scoreDelta === 0 && objective !== "protect") {
      if (context.ballZone === "attacking-third" || goalDistance < 4.1) {
        objective = "finish";
      } else if (
        context.ballZone === "middle-third" &&
        (context.plan.mentality === "direct" || context.plan.riskTolerance === "high" || forwardOutletOpen)
      ) {
        objective = "probe";
      }
    }
    const supportStyle = supportStyleForContext(context, objective, targetZone);
    const ballAction = ballActionForContext(
      context,
      objective,
      supportStyle,
      targetZone,
      lanePressure,
      goalDistance,
      forwardOutletOpen,
    );
    const likelyActorRole =
      objective === "finish"
        ? goalDistance < 2.6 || context.ballZone === "attacking-third"
          ? "forward"
          : bestProgressiveOption?.player.role === "runner"
            ? "runner"
            : "link"
        : objective === "protect"
          ? context.ballZone === "defensive-third"
            ? "anchor"
            : "link"
          : ballAction === "carry"
            ? "runner"
            : context.plan.transitionStyle === "counter"
              ? "runner"
              : context.ballZone === "attacking-third"
                ? "runner"
                : "link";
    const preferredReceiverRole =
      objective === "counter" || objective === "probe"
        ? "runner"
        : bestProgressiveOption?.progress && bestProgressiveOption.progress > 0.7
          ? bestProgressiveOption.player.role === "keeper"
            ? "link"
            : bestProgressiveOption.player.role
        : objective === "retain" || objective === "protect"
          ? context.ballZone === "defensive-third"
            ? "anchor"
            : "link"
          : context.ballZone === "attacking-third"
            ? "forward"
            : "runner";

    return normalizeTeamDecision(
      {
        side: context.side,
        window: context.window,
        objective,
        targetZone,
        supportStyle,
        ballAction,
        pressing:
          context.plan.transitionStyle === "press"
            ? "high"
            : context.plan.riskTolerance === "low"
              ? "low"
              : "medium",
        riskLevel: context.plan.riskTolerance,
        likelyActorRole,
        preferredReceiverRole,
        eventLabel: `${context.side === "home" ? "Home" : "Away"} ${objective}`,
        explanation:
          forwardOutletOpen && bestProgressiveOption
            ? `Use the ${bestProgressiveOption.player.role} in space and move the block forward.`
            : context.plan.priorities[0] ?? "Fallback tactical preference",
      },
      context.side,
      context.window,
    );
  },
};
