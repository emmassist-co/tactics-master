import { PromptEntryScreen } from "./PromptEntryScreen";
import type { TeamSide } from "../domain/tactics/types";

interface HalftimeScreenProps {
  side: TeamSide;
  prompt: string;
  onSubmit: (prompt: string) => void;
}

export function HalftimeScreen({ side, prompt, onSubmit }: HalftimeScreenProps) {
  return (
    <PromptEntryScreen
      side={side}
      prompt={prompt}
      title="Halftime reset"
      onSubmit={onSubmit}
    />
  );
}
