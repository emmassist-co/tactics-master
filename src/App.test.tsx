import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App", () => {
  it("starts the shared-device prompt flow", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /start match/i }));
    expect(screen.getByRole("heading", { name: /coach one opening tactic/i })).toBeInTheDocument();
  });
});
