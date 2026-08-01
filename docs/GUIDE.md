# PortfolioSpace - quick guide

Short version of the README, for when I just need the commands.

## First run

```bash
npm run install:all
npm run infra:up
npm run seed
npm run dev
```

Client: http://localhost:3000 - Gateway: http://localhost:4000/api/health

Demo login: `vicky / paw12345` (admin), `miloart`, `sunnydraws` (same password).

## With search on

```bash
npm run infra:up:search
npm run dev
```

Check the engine: http://localhost:4000/api/search/health

## Try the main screens

1. **Home** - featured work and For You picks
2. **Reels** - landscape video feed, double-tap to like
3. **Discover** - filter by work type and category, press `?` for keyboard shortcuts
4. **Search** - one box for work, people, tags, and my messages
5. **My Work** - add a project, drag gallery photos to reorder, save it as a draft first
6. **Feed** - stories on top, then posts with inline comments
7. **Profile** - grid, heatmap, experience, endorsements, recommendations
8. **Messages** - photo, voice note, sticker, or a project card
9. **Analytics** - totals and the day-by-day trend line
10. **Admin** - report queue (sign in as vicky)

## When something looks wrong

| Problem | Fix |
| --- | --- |
| Client shows old styles | delete `client/.next`, run `npm run dev` again |
| 502 from the gateway | a service is still booting, wait a few seconds |
| Search says MongoDB fallback | Elasticsearch is off, run `npm run infra:up:search` |
| Uploads fail | check MinIO at http://localhost:9001 |
| Empty database | `npm run infra:reset`, then `infra:up` and `seed` |
