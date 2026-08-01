// stories/dao.js
import { v4 as uuid } from "uuid";
import model from "./model.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// keep a sticker tidy
function cleanPoll(poll) {
  if (!poll || typeof poll !== "object") return null;
  const kind = poll.kind === "question" ? "question" : "poll";
  const question = String(poll.question || "").slice(0, 120).trim();
  if (!question) return null;
  const options = Array.isArray(poll.options)
    ? poll.options.map((o) => String(o || "").slice(0, 40).trim()).filter(Boolean).slice(0, 4)
    : [];
  if (kind === "poll" && options.length < 2) return null;
  return { kind, question, options };
}

// new story
export async function createStory({ owner, ownerUsername, ownerName, ownerAvatar, imageUrl, imageKey, caption, poll }) {
  if (!imageUrl) return null;
  return model.create({
    _id: uuid(),
    owner,
    ownerUsername: ownerUsername || "",
    ownerName: ownerName || "",
    ownerAvatar: ownerAvatar || "",
    imageUrl,
    imageKey: imageKey || "",
    caption: (caption || "").slice(0, 200),
    poll: cleanPoll(poll),
    votes: [],
    expiresAt: new Date(Date.now() + DAY_MS),
  });
}

// one vote or one answer per person
export async function vote(storyId, user, option, text = "") {
  const story = await model.findById(storyId);
  if (!story || !story.poll) return null;

  const already = story.votes.some((v) => v.user === user);
  if (already) return { already: true, votes: story.votes };

  const kind = story.poll.kind;
  if (kind === "poll") {
    const i = Number(option);
    if (!Number.isInteger(i) || i < 0 || i >= story.poll.options.length) return null;
    story.votes.push({ option: i, user, text: "" });
  } else {
    const answer = String(text || "").slice(0, 200).trim();
    if (!answer) return null;
    story.votes.push({ option: -1, user, text: answer });
  }
  await story.save();
  return { already: false, votes: story.votes };
}

// live stories for people she follows
export function activeFor(owners) {
  if (!Array.isArray(owners) || owners.length === 0) return [];
  return model
    .find({ owner: { $in: owners }, expiresAt: { $gt: new Date() } })
    .sort({ createdAt: 1 })
    .limit(200);
}
