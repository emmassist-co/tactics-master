import { useMemo, useState } from "react";
import { HalftimeScreen } from "./components/HalftimeScreen";
import { MatchView } from "./components/MatchView";
import { PromptEntryScreen } from "./components/PromptEntryScreen";
import { ResultScreen } from "./components/ResultScreen";
import { StartScreen } from "./components/StartScreen";
import {
  createInitialSession,
  setPrompt,
  startMatch,
  startSecondHalf,
  type GameSession,
} from "./state/gameFlow";

function App() {
  const [session, setSession] = useState<GameSession>(createInitialSession());
  const [halftimeDrafts, setHalftimeDrafts] = useState({ home: "", away: "" });

  const content = useMemo(() => {
    switch (session.phase) {
      case "start":
        return (
          <StartScreen
            onStart={() => setSession((current) => ({ ...current, phase: "prompt-home" }))}
          />
        );
      case "prompt-home":
        return (
          <PromptEntryScreen
            side="home"
            prompt={session.prompts.home}
            title="Coach one opening tactic"
            onSubmit={(prompt) =>
              setSession((current) => ({
                ...setPrompt(current, "home", prompt),
                phase: "prompt-away",
              }))
            }
          />
        );
      case "prompt-away":
        return (
          <PromptEntryScreen
            side="away"
            prompt={session.prompts.away}
            title="Coach two opening tactic"
            onSubmit={async (prompt) => {
              const next = { ...setPrompt(session, "away", prompt), phase: "loading-first-half" as const };
              setSession(next);
              setSession(await startMatch(next));
            }}
          />
        );
      case "loading-first-half":
        return (
          <section className="panel hero">
            <p className="eyebrow">Reasoning live</p>
            <h2>Teams are thinking through the first-half plan</h2>
            <p className="lede">The match engine is collecting bounded tactical decisions before playback.</p>
          </section>
        );
      case "first-half":
        return (
          <MatchView
            title="First half"
            frames={session.frames}
            onComplete={() => setSession((current) => ({ ...current, phase: "halftime" }))}
          />
        );
      case "halftime":
        return (
          <HalftimeScreen
            side={halftimeDrafts.home ? "away" : "home"}
            prompt={halftimeDrafts.home ? halftimeDrafts.away : halftimeDrafts.home}
            onSubmit={async (prompt) => {
              if (!halftimeDrafts.home) {
                setHalftimeDrafts({ ...halftimeDrafts, home: prompt });
                return;
              }
              const halftimePrompts = {
                home: halftimeDrafts.home,
                away: prompt,
              };
              setHalftimeDrafts(halftimePrompts);
              setSession((current) => ({ ...current, phase: "loading-second-half" }));
              setSession(await startSecondHalf(session, halftimePrompts));
            }}
          />
        );
      case "loading-second-half":
        return (
          <section className="panel hero">
            <p className="eyebrow">Reasoning live</p>
            <h2>Teams are adjusting for the second half</h2>
            <p className="lede">The next tactical phase is being assembled from the halftime prompts.</p>
          </section>
        );
      case "second-half":
        return (
          <MatchView
            title="Second half"
            frames={session.frames}
            onComplete={() => setSession((current) => ({ ...current, phase: "result" }))}
          />
        );
      case "result":
        return session.finalResult ? (
          <ResultScreen
            result={session.finalResult}
            onReplay={() => {
              setHalftimeDrafts({ home: "", away: "" });
              setSession(createInitialSession());
            }}
          />
        ) : null;
      default:
        return null;
    }
  }, [halftimeDrafts, session]);

  return <main className="app-shell">{content}</main>;
}

export default App;
