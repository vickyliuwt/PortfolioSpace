// seed/seed.js
// demo data
// local covers

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { connectDb } from "../src/shared/db.js";
import projectModel from "../src/projects/model.js";

// users live in same db, owned by auth-service
const userColl = () => mongoose.connection.collection("users");

const DEMO_PASS = "paw12345";

const creators = [
  { username: "vicky", displayName: "Vicky Liu", headline: "Animator-turned-Engineer",
    bio: "BFA Animation @ SCAD, MS CS @ Northeastern. I make things move and things run.",
    location: "Boston, MA", skills: ["Animation", "React", "After Effects", "Blender"],
    avatarUrl: "/mascot/avatar-vicky.svg" },
  { username: "miloart", displayName: "Milo Park", headline: "3D & Motion Designer",
    bio: "Loud colors, soft shadows.", location: "Seattle, WA",
    skills: ["3D", "Cinema4D", "Motion"], avatarUrl: "/mascot/avatar-milo.svg" },
  { username: "sunnydraws", displayName: "Sunny Diaz", headline: "Illustrator & UI designer",
    bio: "Cozy scenes and clean interfaces.", location: "Austin, TX",
    skills: ["Illustration", "UI/UX", "Figma", "Procreate"], avatarUrl: "/mascot/avatar-sunny.svg" },
];

const projectsByUser = {
  vicky: [
    // drawing
    { title: "Still Life Study", summary: "Graphite still life, 18x24in (2024).",
      category: "Illustration", tags: ["graphite", "drawing", "still-life", "traditional"], tools: ["Graphite", "Paper"],
      coverUrl: "/artworks/7.jpg", featured: true },
    { title: "Portrait", summary: "Graphite portrait study, 18x24in (2025).",
      category: "Illustration", tags: ["graphite", "portrait", "drawing"], tools: ["Graphite", "Paper"],
      coverUrl: "/artworks/8.jpg" },
    { title: "Scratchboard Study", summary: "Scratchboard piece, 18x24in (2024).",
      category: "Illustration", tags: ["scratchboard", "ink", "drawing"], tools: ["Scratchboard"],
      coverUrl: "/artworks/1.jpg" },
    { title: "Charcoal Figure", summary: "Charcoal figure drawing, 18x24in (2023).",
      category: "Illustration", tags: ["charcoal", "figure", "drawing"], tools: ["Charcoal"],
      coverUrl: "/artworks/4.jpg" },
    // ---- painting ----
    { title: "Wilderness", summary: "Digital landscape painting (2025).",
      category: "Illustration", tags: ["digital-paint", "landscape", "painting"], tools: ["Photoshop"],
      coverUrl: "/artworks/6.jpg", featured: true },
    { title: "Nature", summary: "Oil painting, 16x20in (2025).",
      category: "Illustration", tags: ["oil", "painting", "nature"], tools: ["Oil Paint", "Canvas"],
      coverUrl: "/artworks/13.jpg" },
    { title: "Blossom", summary: "Oil painting, 18x24in (2023).",
      category: "Illustration", tags: ["oil", "floral", "painting"], tools: ["Oil Paint", "Canvas"],
      coverUrl: "/artworks/10.jpg" },
    { title: "Dusk", summary: "Acrylic painting, 16x20in (2024).",
      category: "Illustration", tags: ["acrylic", "landscape", "painting"], tools: ["Acrylic"],
      coverUrl: "/artworks/20.jpg" },
    { title: "Jellyfish", summary: "Color pencil study, 18x24in (2019).",
      category: "Illustration", tags: ["color-pencil", "ocean", "painting"], tools: ["Color Pencil"],
      coverUrl: "/artworks/14.jpg" },
    { title: "Melody", summary: "Watercolor painting, 18x24in (2019).",
      category: "Illustration", tags: ["watercolor", "painting"], tools: ["Watercolor"],
      coverUrl: "/artworks/3.jpg" },
    { title: "Spring", summary: "Watercolor from a four-seasons series (2018).",
      category: "Illustration", tags: ["watercolor", "series", "painting"], tools: ["Watercolor"],
      coverUrl: "/artworks/12.jpg" },
    // animation
    { title: "The Sample", summary: "3D animated short, 1080p (2024).",
      category: "Animation", tags: ["3d", "animation", "short-film"], tools: ["Maya", "After Effects"],
      coverUrl: "/covers/reel-aurora.svg", featured: true,
      externalUrl: "https://drive.google.com/file/d/1tSUY90laDGNBropuuu_uXDkOTlPESEU9/view" },
    { title: "Rainbow", summary: "3D animation piece, 1080p (2024).",
      category: "Animation", tags: ["3d", "animation", "loop"], tools: ["Maya"],
      coverUrl: "/covers/motion-bounce.svg",
      externalUrl: "https://drive.google.com/file/d/1j1XcL4VDcR7ril33akNGV4qF03HBVaX7/view" },
    { title: "Shadow Glow", summary: "2D animation piece, 1080p (2024).",
      category: "Animation", tags: ["2d", "animation"], tools: ["After Effects", "TVPaint"],
      coverUrl: "/covers/motion-logo.svg",
      externalUrl: "https://drive.google.com/file/d/17o8FGhDpsa3HyqavJ9aNKcIMwFmJS2Ud/view" },
  ],
  miloart: [
    { title: "Gummy Planets", summary: "Squishy 3D planet loop with subsurface scatter.",
      category: "3D", tags: ["c4d", "loop", "render"], tools: ["Cinema4D", "Redshift"],
      coverUrl: "/covers/3d-gummy.svg", featured: true },
    { title: "Logo Sting Pack", summary: "Five snappy logo reveals.",
      category: "Motion", tags: ["logo", "sting", "brand"], tools: ["After Effects"],
      coverUrl: "/covers/motion-logo.svg" },
  ],
  sunnydraws: [
    { title: "Cafe Corner", summary: "A cozy illustrated cafe scene, painted in Procreate.",
      category: "Illustration", tags: ["cozy", "scene", "procreate"], tools: ["Procreate"],
      coverUrl: "/covers/illo-cafe.svg", featured: true },
    { title: "Plant Shop App", summary: "Mobile app UI for a neighborhood plant shop.",
      category: "UI/UX", tags: ["mobile", "shop", "green"], tools: ["Figma"],
      coverUrl: "/covers/ui-plant.svg" },
    { title: "Sticker Sheet", summary: "A pack of huggable animal stickers.",
      category: "Branding", tags: ["stickers", "cute", "vector"], tools: ["Illustrator"],
      coverUrl: "/covers/brand-stickers.svg" },
  ],
};

// category to type
const kindForCategory = (cat) =>
  ({
    Illustration: "art",
    "UI/UX": "art",
    Branding: "art",
    "3D": "art",
    Animation: "film",
    Motion: "film",
    Photography: "photo",
    "Web App": "code",
    "Mobile App": "code",
    "Backend/API": "code",
    "Machine Learning": "code",
    "Data Viz": "code",
    Game: "code",
    "Open Source": "code",
    DevTool: "code",
  }[cat] || "other");

export async function runSeed() {
  const count = await projectModel.estimatedDocumentCount();
  if (count > 0) {
    // keep her work, just fill in whatever is new
    console.log("[seed] projects already here, filling in new fields only");
  } else {
    await addDemoData();
  }

  await backfillKind();
  await backfillOwnerAvatar();
  await seedCredits();
  console.log("[seed] done. demo login -> vicky / paw12345");
}

// projects keep a copy of the owner avatar, so refresh any that drifted
async function backfillOwnerAvatar() {
  const rows = await projectModel.find({}).select("_id owner ownerAvatar");
  if (rows.length === 0) return;

  const owners = [...new Set(rows.map((p) => p.owner))];
  const users = await userColl()
    .find({ _id: { $in: owners } }, { projection: { avatarUrl: 1 } })
    .toArray();
  const avatarOf = new Map(users.map((u) => [u._id, u.avatarUrl || ""]));

  let done = 0;
  for (const doc of rows) {
    const url = avatarOf.get(doc.owner);
    if (!url || url === doc.ownerAvatar) continue;
    await projectModel.updateOne({ _id: doc._id }, { $set: { ownerAvatar: url } });
    done += 1;
  }
  if (done) console.log(`[seed] refreshed the owner avatar on ${done} projects`);
}

// first run only
async function addDemoData() {
  console.log("[seed] adding demo creators + projects");
  const hash = await bcrypt.hash(DEMO_PASS, 10);
  const idByUsername = {};

  for (const c of creators) {
    const _id = uuid();
    idByUsername[c.username] = _id;
    await userColl().updateOne(
      { username: c.username },
      { $setOnInsert: {
          _id, username: c.username, password: hash,
          email: `${c.username}@portfoliospace.dev`,
          displayName: c.displayName, headline: c.headline, bio: c.bio,
          location: c.location, website: "", avatarKey: "", avatarUrl: c.avatarUrl,
          skills: c.skills, socials: { github: "", linkedin: "", dribbble: "", instagram: "" },
          role: c.username === "vicky" ? "ADMIN" : "CREATOR", plan: c.username === "vicky" ? "PRO" : "FREE",
          lastLogin: new Date().toISOString(), createdAt: new Date(), updatedAt: new Date(),
      } },
      { upsert: true }
    );
  }

  // demo admin
  await userColl().updateOne({ username: "vicky" }, { $set: { role: "ADMIN" } });

  for (const [username, list] of Object.entries(projectsByUser)) {
    const owner = idByUsername[username];
    const creator = creators.find((c) => c.username === username);
    for (const p of list) {
      await projectModel.create({
        _id: uuid(), owner, ownerUsername: username, ownerName: creator.displayName,
        ownerAvatar: creator.avatarUrl || "",
        title: p.title, summary: p.summary,
        description: p.description || p.summary,
        category: p.category, tags: p.tags, tools: p.tools,
        kind: p.kind || kindForCategory(p.category),
        coverUrl: p.coverUrl, coverKey: "", media: [], externalUrl: p.externalUrl || "",
        visibility: "PUBLIC", featured: !!p.featured,
        likes: Math.floor(Math.random() * 40), views: Math.floor(Math.random() * 300),
      });
    }
  }
}

// older rows may predate a field
async function backfillKind() {
  const missing = await projectModel.find({ kind: { $exists: false } }).select("_id category");
  for (const doc of missing) {
    await projectModel.updateOne({ _id: doc._id }, { $set: { kind: kindForCategory(doc.category) } });
  }
  if (missing.length) console.log(`[seed] set a work type on ${missing.length} older projects`);
}

// demo credits
async function seedCredits() {
  // real ids back
  const rows = await userColl()
    .find({ username: { $in: ["vicky", "miloart", "sunnydraws"] } }, { projection: { username: 1 } })
    .toArray();
  const id = {};
  for (const r of rows) id[r.username] = r._id;
  if (!id.vicky || !id.miloart || !id.sunnydraws) return;

  const credits = [
    { title: "Wilderness", team: [{ username: "miloart", role: "Color and lighting" }] },
    { title: "Sticker Sheet", team: [{ username: "vicky", role: "Character art" }] },
    { title: "Still Life Study", team: [{ username: "sunnydraws", role: "Studio setup" }] },
  ];

  let done = 0;
  for (const c of credits) {
    const proj = await projectModel.findOne({ title: c.title }).select("_id owner");
    if (!proj) continue;
    const team = c.team
      .filter((t) => id[t.username] && id[t.username] !== proj.owner)
      .map((t) => ({
        user: id[t.username],
        username: t.username,
        name: creators.find((x) => x.username === t.username)?.displayName || t.username,
        avatar: creators.find((x) => x.username === t.username)?.avatarUrl || "",
        role: t.role,
      }));
    if (team.length) {
      await projectModel.updateOne({ _id: proj._id }, { $set: { collaborators: team } });
      done += 1;
    }
  }
  if (done) console.log(`[seed] added team credits on ${done} projects`);
}

const isDirect = process.argv[1] && process.argv[1].endsWith("seed.js");
if (isDirect) {
  connectDb(process.env.MONGO_URL, "seed")
    .then(runSeed)
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch((e) => { console.error(e); process.exit(1); });
}
