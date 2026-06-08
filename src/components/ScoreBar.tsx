import type { MatchSnapshot } from "../domain/match/types";

interface ScoreBarProps {
  snapshot: MatchSnapshot;
}

export function ScoreBar({ snapshot }: ScoreBarProps) {
  const possessionLabel =
    snapshot.ballState?.type === "loose"
      ? "Loose ball"
      : snapshot.ballState?.type === "in-transit"
        ? "Ball in flight"
        : snapshot.possession === "home"
          ? "Home on the ball"
          : "Away on the ball";
  const homeLeading = snapshot.score.home > snapshot.score.away;
  const awayLeading = snapshot.score.away > snapshot.score.home;

  return (
    <header className="score-bar">
      <div className={`score-team home${homeLeading ? " is-leading" : ""}`}>
        <strong>Coach one</strong>
        <small>Gold</small>
        <span className="score-value">{snapshot.score.home}</span>
      </div>
      <div className="score-meta">
        <span>Half {snapshot.half}</span>
        <span>{possessionLabel}</span>
      </div>
      <div className={`score-team away${awayLeading ? " is-leading" : ""}`}>
        <strong>Coach two</strong>
        <small>Red</small>
        <span className="score-value">{snapshot.score.away}</span>
      </div>
    </header>
  );
}
