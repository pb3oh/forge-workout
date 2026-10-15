# FORGE: Stats Sharing & Leaderboard (Product Brief)

**Backlog item:** "Determine how users can share stats. Create a leaderboard to track number of workout days in a row (streak) and PRs across the major lifts: bench, squat, deadlift."
**Status:** Proposal, not built · **Owner:** Phillip · **Date:** 2026-10-15

**Recommendation:** Do it in two steps. **M1:** a local Stats tab and a share card sent through the native share sheet. No backend, about 1 day. **M2:** a private friends leaderboard joined with an invite code, running on **Cloudflare Workers + D1**. Members are anonymous (display name plus a device token), only aggregate stats are uploaded, and it's opt-in. About 2–3 days, $0 a month. Skip a public leaderboard.

---

## 1. Goals and user stories

**Goals:** (1) Show streak and big-3 PRs that people can trust, computed from the existing `S.history`. (2) Let people share a result in two taps. (3) Give a small friend group a reason to come back each day, without turning FORGE into an account-based app or putting private training data on a server.

**Non-goals:** social feed, comments, public rankings, syncing full history, body-weight or Wilks/DOTS scoring.

- As a lifter, I see my current and best streak and my bench/squat/deadlift PRs on one screen.
- As a lifter, I get a "New PR" badge on the workout summary when I beat a best.
- As a lifter, I can share a good-looking card of today's workout or a PR to iMessage or Instagram.
- As a lifter, I can create a private group, send friends a code, and see a streak and PR board.
- As a member, I can leave the group and have my data deleted. Nothing gets uploaded unless I opt in.

## 2. Definitions

**Workout day:** a local calendar day (device time zone) with at least one history entry where `setsDone > 0`. Several sessions on one day count once.

**Streak (rest-day friendly):** the program has 6 training days and Sunday off, so a strict "every day" streak would break every week. Rule:
- Each **Mon–Sun week gets 1 free rest day**. A day with no workout uses that week's free day.
- A **second** missed day in the same week ends the streak. Today never counts as missed until it's over.
- The streak value is the **number of workout days** in the run, not calendar days. Also track `bestStreak`.
- Edge case, accepted: a Sunday off followed by a missed Monday uses the free day of two different weeks, so the streak survives.

**PRs:** only sets marked `done` with `w > 0` and `1 ≤ r ≤ 12` count.
- **Top set:** heaviest weight lifted for at least 1 rep.
- **Estimated 1RM (Epley):** `e1RM = w × (1 + r/30)`, with r = 1 giving `w`. Use only sets of 1–10 reps, because Epley drifts at higher reps. **e1RM is the headline PR and the leaderboard metric.**
- **Rep-range PRs:** heaviest weight for at least 1, 3, 5, 8 and 10 reps. Shown on the Stats tab only.

**Lift matching:** normalize names (lowercase, strip punctuation, drop a trailing "s") and apply an allow-list and a block-list. Variants are excluded by default so that numbers can be compared fairly.

| Lift | Counts (examples from the program) | Excluded |
|---|---|---|
| Bench | Bench Press, Flat Bench Press, Flat Bench | Incline, Decline, Dumbbell, Smith, Step-Ups, Cable/Flies, anything "w/ Chest on Bench" |
| Squat | Squats, Squat, Back Squat | Box, Hack, Smith, Squat Jumps, Front |
| Deadlift | Deadlifts, Deadlift, Conventional/Sumo Deadlift | Stiff Leg, Romanian/RDL, Trap Bar |

Matching runs as a pure function, `canonicalLift(name) → 'bench'|'squat'|'deadlift'|null`, and gets unit tests covering every name in the bundled program. Later, users could get a "counts as" override in Settings.

**Units:** every history entry already records `unit` ('lb' or 'kg') for the session. All comparisons convert to **kg** (`lb × 0.45359237`) and are shown in the viewer's unit, rounded to 2.5 kg or 5 lb. Converting avoids mixing values when someone switches the unit toggle partway through their history.

**Data quality and cheating:** the app is client-only, so any number can be faked. The leaderboard is an **honor system for friends** and should say so. Basic guards:
- Reject `w > 1000 lb (454 kg)` and `r > 50`.
- If a new e1RM is more than 20% above the previous best, ask the user to confirm ("Was this right?") before saving it as a PR.
- The server checks ranges again and rate-limits updates.
- The group creator can remove a member.

## 3. Sharing options (ranked by effort)

| # | Option | Effort | Backend | Verdict |
|---|---|---|---|---|
| a | **Share card image:** render a 1080×1350 PNG on `<canvas>` (workout summary, streak, PR) and pass it to `navigator.share({files})`, after a `canShare` check. Fallback: download the PNG or copy text. | S (~0.5–1 day) | None | **M1** |
| b | **Export/import stats or a link:** a JSON backup file, plus a read-only "compare" link with stats encoded as base64url in the URL hash (`#s=…`), which stays out of server logs. | S–M | None | Phase 3. Backup export is useful on its own; the link has no tamper protection |
| c | **Private friend leaderboard:** create or join a group with an invite code; the app uploads aggregates. | M (~2–3 days) | Small | **M2. This is the leaderboard the backlog asks for** |
| d | **Public leaderboard** | L | Bigger | Not recommended: cheating, moderation, abuse, privacy, little value |

## 4. Backend for the leaderboard

| Option | Pros | Cons |
|---|---|---|
| **Cloudflare Workers + D1 (recommended)** | Called with plain `fetch`, so no SDK to add to the single file. SQL storage. Free tier is far more than a friend group needs (100k requests/day). Doesn't pause when idle. CORS can be locked to `pb3oh.github.io`. | About 150 lines of Worker code to write and deploy with `wrangler` |
| Supabase | Postgres, row-level security, built-in anonymous auth | Free projects pause after about a week with no activity. Adds the supabase-js SDK |
| Firebase (Firestore + anonymous auth) | Mature anonymous auth and a free tier | Large SDK, NoSQL rules are harder to reason about, ties the app to Google |

**Auth:** anonymous. Joining creates a random 128-bit device token in the client, stored in localStorage. The server keeps only its SHA-256 hash. The user's identity is a display name plus the group invite code (8 characters, no ambiguous characters). Settings shows a **recovery code** (the token) that can be pasted on a new device. No email and no sign-in. Sign-in could be added later if people lose devices often.

**What gets stored:** display name, current and best streak, date of last workout day (date only), and for each of the 3 lifts the e1RM in kg, top-set weight × reps, and PR date. **Never stored:** body weight, full history, other exercises, times of day, location, device information.

**Privacy and safety:**
- Off by default. Joining is an explicit action with a one-line notice of exactly what gets uploaded.
- "Leave group" deletes the member's row on the server.
- Groups are capped at 50 members, and a code that leaks can be rotated.
- Display names are limited to 24 characters and filtered against a basic blocklist.

**Cost:** $0 on the Cloudflare free tier at friend-group scale. If usage ever grows, Workers Paid starts at $5 a month.

## 5. MVP scope

**M1, local (no backend):** a `stats.js`-style module inside `index.html` that computes streak, PRs, rep-range PRs and new-PR detection from `S.history`; the Stats tab; a PR badge on the summary screen; the share card. **M2:** create or join a group, push stats after each finished workout (and on app open, at most once an hour), the Leaderboard screen, and leave/delete.

**Data model.** Local state (added to `forge.v1`):
```json
{ "social": { "optIn": true, "group": "K7PX2QMD", "name": "Phil", "token": "<base64url 128-bit>" } }
```
Server (D1):
```sql
CREATE TABLE groups (code TEXT PRIMARY KEY, name TEXT, owner_member_id TEXT, created_at INTEGER);
CREATE TABLE members (
  id TEXT PRIMARY KEY, group_code TEXT REFERENCES groups(code), display_name TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL, streak_cur INTEGER DEFAULT 0, streak_best INTEGER DEFAULT 0,
  last_workout_date TEXT,                         -- 'YYYY-MM-DD'
  bench_e1rm_kg REAL, bench_top TEXT, bench_date TEXT,   -- top = '100x5' (kg)
  squat_e1rm_kg REAL, squat_top TEXT, squat_date TEXT,
  dl_e1rm_kg REAL,    dl_top TEXT,    dl_date TEXT,
  updated_at INTEGER);
```
Endpoints: `POST /groups` · `POST /groups/:code/join` · `PUT /me/stats` · `GET /groups/:code/board` · `DELETE /me`. Every request except create and join sends `Authorization: Bearer <token>`.

**UI sketch:**
- **Stats tab** (5th nav item): a hero card with a 🔥 current streak, best streak, and a 7-dot row for this week showing which days were worked, rested (free day) or missed. Below it, three lift cards (Bench / Squat / Deadlift), each with e1RM, top set, PR date, and a small rep-range strip (1/3/5/8/10 RM). Buttons: "Share" and "Leaderboard".
- **Share card:** a preview of the PNG in FORGE's dark and orange style (streak, today's focus, volume, any new PR with "+X lb"), a template toggle (Workout or PRs), and a Share button that opens the native share sheet.
- **Leaderboard:** the group name and code with Copy/Invite, segmented tabs (Streak · Bench · Squat · Deadlift · Total of big 3), and a ranked list showing name, value and last-active date, with the user's own row highlighted. An empty state offers Create or Join, with the opt-in notice. A footer reads "Honor system · last synced 2m ago".

**Acceptance criteria:**
1. The streak follows the rules in section 2. Unit tests cover the Sunday-off pattern, two misses in one week (streak breaks), several sessions on one day, and today not counted until it ends.
2. `canonicalLift` maps every name in `lost-breed-8-week-shred.json` exactly as in the table above (tested).
3. e1RM uses Epley on sets of 1–10 reps. A mixed lb/kg history ranks correctly after conversion to kg.
4. Finishing a workout with a better e1RM shows a "New PR" badge on the summary.
5. On iOS Safari as an installed PWA, Share opens the system share sheet with a PNG. Browsers without file sharing fall back to downloading it.
6. Nothing goes over the network until the user opts in. The upload payload contains only the fields listed in section 4 (verified in DevTools).
7. A second device can join with the code and appears on the board in under 5 seconds. Leave/delete removes the row.
8. The app keeps working offline. Leaderboard failures show a non-blocking message.

**Open questions for Phillip:**
1. Streak rule: is "1 free rest day per Mon–Sun week" right, or should only scheduled program days count?
2. Lift variants: keep Box/Smith squats and Smith/DB bench off the board, or count them as the same lift?
3. Leaderboard ranking: absolute e1RM (simple, favors bigger lifters), or show PR gains over the last 30 days as the default tab?
4. OK to host the Worker and D1 on a Cloudflare account in your name, and should Stats be a 5th nav tab or live inside History?
