// sanity checks on the shared category list

import { describe, it, expect } from "vitest";
import { CATEGORIES, CATEGORIES_BY_KIND, categoriesForKind } from "../types";

describe("CATEGORIES", () => {
  it("is a non-empty flat list", () => {
    expect(Array.isArray(CATEGORIES)).toBe(true);
    expect(CATEGORIES.length).toBeGreaterThan(8);
  });

  it("includes the main creative categories", () => {
    expect(CATEGORIES).toContain("Animation");
    expect(CATEGORIES).toContain("Illustration");
    expect(CATEGORIES).toContain("UI/UX");
    expect(CATEGORIES).toContain("Web App");
  });

  it("has no duplicates and ends with Other", () => {
    expect(new Set(CATEGORIES).size).toBe(CATEGORIES.length);
    expect(CATEGORIES[CATEGORIES.length - 1]).toBe("Other");
  });

  it("gives a different set per work type", () => {
    expect(categoriesForKind("code")).toContain("Web App");
    expect(categoriesForKind("daily")).toContain("Vlog");
    expect(categoriesForKind("code")).not.toContain("Vlog");
    expect(Object.keys(CATEGORIES_BY_KIND).length).toBe(8);
  });
});
