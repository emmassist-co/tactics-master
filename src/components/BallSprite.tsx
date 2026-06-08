import type { MatchSnapshot } from "../domain/match/types";

interface BallSpriteProps {
  snapshot: MatchSnapshot;
}

export function BallSprite({ snapshot }: BallSpriteProps) {
  return (
    <div
      className={`ball-sprite ${snapshot.ballState?.type ?? "controlled"}`}
      style={{
        left: `${(snapshot.ball.x / 12) * 100}%`,
        top: `${(snapshot.ball.y / 8) * 100}%`,
      }}
    />
  );
}
