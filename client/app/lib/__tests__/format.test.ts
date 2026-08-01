// helper tests

import { describe, it, expect } from "vitest";
import { truncate, catTile } from "../format";

describe("truncate", () => {
  it("leaves short text alone", () => {
    expect(truncate("hi there", 20)).toBe("hi there");
  });

  it("cuts long text and adds an ellipsis", () => {
    const out = truncate("abcdefghij", 4);
    expect(out).toBe("abcd…");
  });

  it("handles empty input", () => {
    expect(truncate("", 10)).toBe("");
  });
});

describe("catTile", () => {
  it("maps known categories to a color class", () => {
    expect(catTile("Animation")).toBe("c-pink");
    expect(catTile("3D")).toBe("c-mint");
    expect(catTile("UI/UX")).toBe("c-sky");
  });

  it("falls back to peach for anything unknown", () => {
    expect(catTile("Nonsense")).toBe("c-peach");
  });
});
