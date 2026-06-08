import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PromptEntryScreen } from "./PromptEntryScreen";

describe("PromptEntryScreen", () => {
  it("resets the draft when the prompt props switch to another coach", () => {
    const { rerender } = render(
      <PromptEntryScreen
        side="home"
        prompt="Home plan"
        title="Coach one opening tactic"
        onSubmit={() => undefined}
      />,
    );

    expect(screen.getByLabelText("home prompt")).toHaveValue("Home plan");

    rerender(
      <PromptEntryScreen
        side="away"
        prompt=""
        title="Coach two opening tactic"
        onSubmit={() => undefined}
      />,
    );

    expect(screen.getByLabelText("away prompt")).toHaveValue("");
  });
});

