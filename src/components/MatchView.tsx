import { useEffect, useMemo, useState } from "react";
import type { MatchSnapshot } from "../domain/match/types";
import { BallSprite } from "./BallSprite";
import { EventTicker } from "./EventTicker";
import { FieldGrid } from "./FieldGrid";
import { PlayerSprite } from "./PlayerSprite";
import { ScoreBar } from "./ScoreBar";

interface MatchViewProps {
  frames: MatchSnapshot[];
  title: string;
  onComplete: () => void;
}

export function MatchView({ frames, title, onComplete }: MatchViewProps) {
  const [index, setIndex] = useState(0);
  const [goalFlashSide, setGoalFlashSide] = useState<"home" | "away" | null>(null);
  const snapshot = frames[Math.min(index, frames.length - 1)];

  useEffect(() => {
    setIndex(0);
    setGoalFlashSide(null);
  }, [frames]);

  useEffect(() => {
    if (frames.length === 0) return undefined;
    if (index >= frames.length - 1) {
      const timeout = window.setTimeout(onComplete, 700);
      return () => window.clearTimeout(timeout);
    }
    const timer = window.setTimeout(() => setIndex((current) => current + 1), 140);
    return () => window.clearTimeout(timer);
  }, [frames, index, onComplete]);

  const label = useMemo(() => `${title} ${Math.round((index / Math.max(frames.length - 1, 1)) * 100)}%`, [frames.length, index, title]);
  const previousSnapshot = index > 0 ? frames[Math.min(index - 1, frames.length - 1)] : null;
  const scoringSide =
    snapshot && previousSnapshot
      ? snapshot.score.home > previousSnapshot.score.home
        ? "home"
        : snapshot.score.away > previousSnapshot.score.away
          ? "away"
          : null
      : null;

  useEffect(() => {
    if (!scoringSide) return undefined;
    setGoalFlashSide(scoringSide);
    const timeout = window.setTimeout(() => setGoalFlashSide(null), 1350);
    return () => window.clearTimeout(timeout);
  }, [scoringSide]);

  if (!snapshot) return null;

  return (
    <section className="match-shell">
      <div className="match-topline">
        <p className="eyebrow">{title}</p>
        <span className="match-progress">{label}</span>
      </div>
      <ScoreBar snapshot={snapshot} />
      <div className="field-surface">
        <FieldGrid />
        <div className="field-glow field-glow-left" />
        <div className="field-glow field-glow-right" />
        {goalFlashSide ? (
          <div className={`goal-flash ${goalFlashSide}`}>
            <span>{goalFlashSide === "home" ? "Coach one score" : "Coach two score"}</span>
          </div>
        ) : null}
        {snapshot.players.map((player) => (
          <PlayerSprite key={player.id} player={player} />
        ))}
        <BallSprite snapshot={snapshot} />
      </div>
      <EventTicker event={snapshot.event} scoringSide={goalFlashSide} />
    </section>
  );
}
