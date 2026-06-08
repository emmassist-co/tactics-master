import type { MatchSnapshot } from "../domain/match/types";

export function interpolateFrames(source: MatchSnapshot[], stepsPerFrame = 4): MatchSnapshot[] {
  if (source.length < 2) return source;
  const output: MatchSnapshot[] = [];

  for (let index = 0; index < source.length - 1; index += 1) {
    const current = source[index];
    const next = source[index + 1];
    output.push(current);

    for (let step = 1; step < stepsPerFrame; step += 1) {
      const progress = step / stepsPerFrame;
      output.push({
        ...current,
        players: current.players.map((player, playerIndex) => ({
          ...player,
          position: {
            x:
              player.position.x +
              (next.players[playerIndex].position.x - player.position.x) * progress,
            y:
              player.position.y +
              (next.players[playerIndex].position.y - player.position.y) * progress,
          },
        })),
        ball: {
          x: current.ball.x + (next.ball.x - current.ball.x) * progress,
          y: current.ball.y + (next.ball.y - current.ball.y) * progress,
        },
      });
    }
  }

  output.push(source[source.length - 1]);
  return output;
}
