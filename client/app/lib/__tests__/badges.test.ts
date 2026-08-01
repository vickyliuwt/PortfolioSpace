// badge rules

import { describe, it, expect } from "vitest";
import { badgesFor } from "../badges";
import type { Creator, Project } from "../types";

const creator = (extra: Partial<Creator> = {}): Creator =>
  ({
    _id: "u1",
    username: "vicky",
    displayName: "Vicky",
    headline: "maker",
    bio: "",
    location: "",
    website: "",
    avatarUrl: "",
    skills: [],
    socials: { github: "", linkedin: "", dribbble: "", instagram: "" },
    plan: "FREE",
    ...extra,
  }) as Creator;

const project = (extra: Partial<Project> = {}): Project =>
  ({
    _id: Math.random().toString(36).slice(2),
    owner: "u1",
    ownerUsername: "vicky",
    ownerName: "Vicky",
    title: "piece",
    summary: "",
    description: "",
    category: "Illustration",
    tags: [],
    tools: [],
    coverUrl: "",
    coverKey: "",
    media: [],
    externalUrl: "",
    visibility: "PUBLIC",
    kind: "art",
    likes: 0,
    likedBy: [],
    views: 0,
    featured: false,
    ...extra,
  }) as Project;

describe("badgesFor", () => {
  it("gives nothing to a brand new account", () => {
    expect(badgesFor(creator(), [], 0)).toHaveLength(0);
  });

  it("hands out a starter badge at three posts", () => {
    const keys = badgesFor(creator(), [project(), project(), project()], 0).map((b) => b.key);
    expect(keys).toContain("started");
    expect(keys).not.toContain("prolific");
  });

  it("upgrades to prolific at ten posts", () => {
    const list = Array.from({ length: 10 }, () => project());
    const keys = badgesFor(creator(), list, 0).map((b) => b.key);
    expect(keys).toContain("prolific");
    expect(keys).not.toContain("started");
  });

  it("counts likes across posts", () => {
    const keys = badgesFor(creator(), [project({ likes: 60 }), project({ likes: 50 })], 0).map((b) => b.key);
    expect(keys).toContain("loved");
  });

  it("notices a spread of work types", () => {
    const list = [project({ kind: "art" }), project({ kind: "code" }), project({ kind: "film" })];
    expect(badgesFor(creator(), list, 0).map((b) => b.key)).toContain("range");
  });

  it("notices shared code", () => {
    expect(badgesFor(creator(), [project({ repoUrl: "https://github.com/a/b" })], 0).map((b) => b.key)).toContain("builder");
  });

  it("shows popular once followers add up", () => {
    expect(badgesFor(creator(), [], 30).map((b) => b.key)).toContain("popular");
  });

  it("shows open to work when the flag is on", () => {
    expect(badgesFor(creator({ openToWork: true }), [], 0).map((b) => b.key)).toContain("hiring");
  });

  it("every badge has the fields the ui needs", () => {
    for (const b of badgesFor(creator({ openToWork: true }), [project({ likes: 200 })], 40)) {
      expect(b.key).toBeTruthy();
      expect(b.emoji).toBeTruthy();
      expect(b.label).toBeTruthy();
      expect(b.note).toBeTruthy();
    }
  });
});
