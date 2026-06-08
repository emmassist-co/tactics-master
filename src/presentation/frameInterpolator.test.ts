import { describe, expect, it } from "vitest";
import { interpolateFrames } from "./frameInterpolator";

describe("interpolateFrames", () => {
  it("adds intermediate frames without changing endpoints", () => {
    const frames = interpolateFrames(
      [
        {
          tick: 0,
          half: 1,
          players: [
            {
              id: "home-link",
              side: "home",
              role: "link",
              position: { x: 1, y: 1 },
              target: { x: 1, y: 1 },
              hasBall: true,
            },
          ],
          ball: { x: 1, y: 1 },
          possession: "home",
          score: { home: 0, away: 0 },
        },
        {
          tick: 1,
          half: 1,
          players: [
            {
              id: "home-link",
              side: "home",
              role: "link",
              position: { x: 5, y: 5 },
              target: { x: 5, y: 5 },
              hasBall: true,
            },
          ],
          ball: { x: 5, y: 5 },
          possession: "home",
          score: { home: 0, away: 0 },
        },
      ],
      4,
    );

    expect(frames.length).toBe(5);
    expect(frames[0].ball.x).toBe(1);
    expect(frames[frames.length - 1].ball.x).toBe(5);
  });
});
