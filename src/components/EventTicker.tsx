interface EventTickerProps {
  event: string | undefined;
  scoringSide?: "home" | "away" | null;
}

export function EventTicker({ event, scoringSide }: EventTickerProps) {
  return (
    <div className={`event-ticker${scoringSide ? ` is-goal ${scoringSide}` : ""}`}>
      {scoringSide ? `${scoringSide === "home" ? "Coach one" : "Coach two"} score` : event ?? "Feeling out the shape"}
    </div>
  );
}
