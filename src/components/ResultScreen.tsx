import type { MatchResult } from "../domain/match/types";

interface ResultScreenProps {
  result: MatchResult;
  onReplay: () => void;
}

export function ResultScreen({ result, onReplay }: ResultScreenProps) {
  const title =
    result.winner === "draw"
      ? "Draw after a tactical scrap"
      : `${result.winner === "home" ? "Coach one" : "Coach two"} wins`;
  const winnerClass =
    result.winner === "draw" ? "is-draw" : result.winner === "home" ? "is-home-win" : "is-away-win";
  const ribbonLabel =
    result.winner === "draw"
      ? "Neither blinked first"
      : result.winner === "home"
        ? "Gold strike takes it"
        : "Red strike takes it";

  return (
    <section className={`panel result-panel ${winnerClass}`}>
      <p className="eyebrow">Full time verdict</p>
      {result.winner !== "draw" ? (
        <div className={`winner-burst ${result.winner}`}>
          <span>{result.winner === "home" ? "Coach one score" : "Coach two score"}</span>
        </div>
      ) : null}
      <h2>{title}</h2>
      <p className="scoreline">
        {result.finalScore.home} - {result.finalScore.away}
      </p>
      <div className={`result-ribbon ${winnerClass}`}>
        <span>{ribbonLabel}</span>
      </div>
      <div className="summary-grid">
        <div>
          <h3>Opening read</h3>
          <p>{result.openingPlans.home.summary}</p>
          <p>{result.openingPlans.away.summary}</p>
        </div>
        <div>
          <h3>Second-half twist</h3>
          <p>{result.halftimePlans.home.summary}</p>
          <p>{result.halftimePlans.away.summary}</p>
        </div>
      </div>
      <button className="primary-button" onClick={onReplay}>
        Run it back
      </button>
    </section>
  );
}
