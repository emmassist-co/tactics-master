import type { PlayerState } from "../domain/match/types";

interface PlayerSpriteProps {
  player: PlayerState;
}

export function PlayerSprite({ player }: PlayerSpriteProps) {
  const roleLabel = player.role === "keeper" ? "K" : player.role[0].toUpperCase();
  return (
    <div
      className={`player-sprite ${player.side} role-${player.role}${player.isPressuring ? " is-pressuring" : ""}${player.hasBall ? " has-ball" : ""}`}
      style={{
        left: `${(player.position.x / 12) * 100}%`,
        top: `${(player.position.y / 8) * 100}%`,
      }}
      title={player.id}
    >
      <span>{roleLabel}</span>
      {player.hasBall ? <em className="ball-ring" /> : null}
      {player.isPressuring ? <em className="pressure-ring" /> : null}
    </div>
  );
}
