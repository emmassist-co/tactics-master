import { useEffect, useState } from "react";
import type { TeamSide } from "../domain/tactics/types";

interface PromptEntryScreenProps {
  side: TeamSide;
  prompt: string;
  title: string;
  onSubmit: (prompt: string) => void;
}

export function PromptEntryScreen({
  side,
  prompt,
  title,
  onSubmit,
}: PromptEntryScreenProps) {
  const [value, setValue] = useState(prompt);

  useEffect(() => {
    setValue(prompt);
  }, [prompt, side, title]);

  const ideas =
    side === "home"
      ? ["Compact press", "Quick triangles", "Box crash on turnovers"]
      : ["Protect the lane", "Wide release", "Counter once they overcommit"];

  return (
    <section className="panel prompt-panel">
      <div className="prompt-header">
        <div>
          <p className="eyebrow">{side === "home" ? "Coach one" : "Coach two"}</p>
          <h2>{title}</h2>
        </div>
        <div className="hand-off-chip">Pass and hide</div>
      </div>
      <p className="lede">
        Hand over the device, block the screen, and write the kind of instruction a touchline
        coach would bark in thirty seconds. The team-turn AI will translate it into the next
        tactical phase.
      </p>
      <div className="prompt-ideas">
        {ideas.map((idea) => (
          <span key={idea} className="prompt-idea">
            {idea}
          </span>
        ))}
      </div>
      <textarea
        aria-label={`${side} prompt`}
        className="prompt-input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Stay compact, press early, and combine quickly around the box..."
      />
      <div className="prompt-footer">
        <p className="prompt-note">
          Best prompts describe shape, where to attack, and how brave to be when the ball turns.
        </p>
        <button className="primary-button" onClick={() => onSubmit(value)}>
          Lock tactic
        </button>
      </div>
    </section>
  );
}
