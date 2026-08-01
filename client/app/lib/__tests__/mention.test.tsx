// mention text rendering

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MentionText from "../../components/MentionText";

describe("MentionText", () => {
  it("keeps plain words as they are", () => {
    render(<MentionText text="just a normal note" />);
    expect(screen.getByText(/just a normal note/)).toBeTruthy();
  });

  it("turns a handle into a link", () => {
    render(<MentionText text="thanks @vicky for this" />);
    const link = screen.getByText("@vicky").closest("a");
    expect(link).toBeTruthy();
    expect(link?.getAttribute("href")).toBe("/Creators/vicky");
  });

  it("handles several handles", () => {
    render(<MentionText text="@amy and @ben both helped" />);
    expect(screen.getByText("@amy").closest("a")?.getAttribute("href")).toBe("/Creators/amy");
    expect(screen.getByText("@ben").closest("a")?.getAttribute("href")).toBe("/Creators/ben");
  });

  it("leaves an email alone", () => {
    render(<MentionText text="mail me at hi@site.com" />);
    expect(screen.queryByText("@site")).toBeNull();
  });

  it("still links a real handle sitting next to an email", () => {
    render(<MentionText text="a@b.com and @real" />);
    expect(screen.queryByText("@b")).toBeNull();
    expect(screen.getByText("@real").closest("a")?.getAttribute("href")).toBe("/Creators/real");
  });

  it("leaves other email shapes alone", () => {
    render(<MentionText text="first.last@corp.co.uk and user_name@mail.org" />);
    expect(screen.queryByText("@corp")).toBeNull();
    expect(screen.queryByText("@mail")).toBeNull();
  });

  it("links a handle in brackets", () => {
    render(<MentionText text="(@amy) said so" />);
    expect(screen.getByText("@amy").closest("a")?.getAttribute("href")).toBe("/Creators/amy");
  });

  it("links a handle at the very start", () => {
    render(<MentionText text="@amy started it" />);
    expect(screen.getByText("@amy").closest("a")?.getAttribute("href")).toBe("/Creators/amy");
  });
});
