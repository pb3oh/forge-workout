# FORGE Step 2: Volume, Friends Leaderboard, Shared Programs (Plan)

**Status:** Plan, not built · **Owner:** Phillip · **Date:** 2026-10-15 · **Replaces:** `boss-battles-spec.md` (dropped)
**Builds on:** `backlog-sharing-leaderboard.md` (Workers + D1, no sign-in, hashed device token, invite-code group, streak and big-3 PR boards).

**Summary:** Total weight lifted becomes the headline number. Ship it locally first with no backend. Then sync per-workout summaries to the friends group so we can show Today, Week and All-time boards. Then let people publish a program to the group and load a friend's program in one tap.

---

## 1. Volume tracking in the app (no backend)

**Definition:** volume = Σ weight × reps over sets marked `done`. Stored in **kg** and shown in the user's lb/kg setting. Reps = Σ reps over the same sets.
- **Bodyweight sets** (`w = 0`) add 0 to volume, but their reps count.
- **Timed sets** (`u: 's'`) count toward neither. `r` holds seconds on these sets.
- **Sanity:** skip any set with w > 454 kg or r > 100 (the same guards as the PR code).

**Computing it:** pure functions over `S.history`, working the way `liftStats`/`streakInfo` already do.
- `entryTotals(h)` → `{ volKg, reps }`, built from `h.exercises[].sets[]` with `toKg(w, h.unit)`. Do **not** read the stored `h.volume`. That value is rounded, in the session's unit, and includes timed sets. Two existing bugs come from it: `finish()` adds w×seconds, and History's "Lifetime volume" adds lb and kg together. Fix both.
- `volumeTotals(history, now)` → `{ today, week, all }`, each holding `{ volKg, reps }`.
  - **Today:** the device's local calendar day, using the existing `dayIdx`.
  - **Week:** Monday 00:00 to Sunday 23:59, device local time. Same week as the streak dots.
  - **All-time:** every entry.
  - A workout counts on the local day it finished (`h.date`).
- **Edited sets:** today there's no way to edit a set after a workout ends. Back/jump during a workout overwrites `s.res` before `finish()`, so the summary already holds the final values. Totals are always recomputed from the sets, never cached, so a future History edit or delete updates them automatically. Once synced, an edit re-uploads that workout's summary (upsert, §2).

**Where it shows**
- **Home:** a compact strip under the greeting with Today / This week / All-time volume (large) and reps (small, muted). Shown only once history exists. It replaces the "N workouts in the last 7 days" line.
- **Stats tab:** a new "Weight lifted" card at the top, above the streak hero. It has the same three tiles with a reps line under each, plus an 8-week bar row for weekly volume (optional, cheap).
- **Formatting:** `12,340 lb`. Switch to `123.4k` at 100k and `1.23M` at 1M. Converting at display time means the unit toggle never corrupts totals.
- **Workout summary:** the volume tile uses `entryTotals`. Add a line: "This week: 41,200 lb · 612 reps".
- **Share card:** the Workout template's VOLUME tile uses the fixed value, with a "Week: X" sub-line. The Stats template gets a row with week volume and all-time volume. Update `shareText()` to match.

## 2. Friends leaderboard: volume (needs backend)

**Views:** one Volume tab next to Streak/Bench/Squat/Deadlift, with a segmented control: **Today · This week · All-time**. Each row shows rank, name, volume (viewer's unit) and reps (smaller). A "Sort by reps" toggle re-ranks by reps.
- **Ranking:** compare volume rounded to whole kg. Ties share a rank (1, 2, 2, 4). Tied rows are ordered by reps, then name.
- Members at 0 for the period appear at the bottom with "—" and no rank.
- Voided workouts are left out of every sum.

**Time zones:** each member's own local day and Mon–Sun week.
- The client sends `local_date` (YYYY-MM-DD) and `week_start` (local Monday) with every summary, plus its IANA time zone on each sync.
- The Worker uses `Intl` with each member's time zone to work out that member's current "today" and "this week", then sums. That's trivial at ≤50 members.
- Label the board "each member's local day". It's accepted that at 00:30 Monday ET the New York member's week has reset while a Pacific member is still on Sunday.

**Sync:** upload workout summaries, never raw state.
- Payload per workout: `{ sid: h.id, local_date, week_start, volume_kg, reps, sets, duration_s }`.
- Sent after `finish()` and on app open, through an outbox in `forge.v1` (`social.outbox`) that flushes when online. Upsert by `(member, sid)`, so retries and edits are idempotent. Deleting a history entry sends a delete.
- **All-time:** counts from the day the member joins. On join, a checkbox offers "Include my past workouts". It backfills summaries from the last 365 days, in batches of 50.
- Offline, the app works as before. The board shows the last cached response with "last synced Xm ago".

## 3. Shared programs

**Today:** an imported program is saved only in `S.program` on that device. The "Export JSON" button already exists.

**Publish:** Program tab → "Share to group" (optional "Also list publicly").
- The client runs the program through the same normalizer Import uses (`parseJSONProgram` → `finalizeProgram`) and uploads the normalized JSON.
- It strips `source: 'sample'` and `ver`. Otherwise the built-in upgrade check in `load()` would replace the program on the receiving device.

**What's stored:** `id`, `group_code` (null if public only), `is_public`, `name` (≤60 chars), `author_member_id`, `author_name` (display name at publish time), `created_at`, `updated_at`, `version`, `program_json`, `size_bytes`, `sha256`, counts (weeks/days/exercises), `status` (active/hidden/deleted), `report_count`.

**Limits:**
- ≤256 KB of normalized JSON. The built-in 8-week program is about 126 KB, and D1 rows top out at 2 MB.
- ≤52 weeks, ≤14 days per week, ≤40 exercises per day, ≤30 sets per exercise.
- Strings ≤200 chars; notes and guide text ≤2,000 chars.
- Publishing: ≤5 per device per day, ≤50 active per group.

**Validation:**
- The server checks against a strict schema of the normalized shape: known keys only, types, lengths, every day has ≥1 block.
- It also checks size and the duplicate hash within the group, and rejects anything else with a reason.
- The receiving client runs the downloaded JSON through `parseJSONProgram` again and never trusts it as is.
- All rendering already goes through `esc()`.

**One-tap load:**
- The Group → Programs list shows name, author, date, weeks/days and a **Load** button.
- A link `…/forge-workout/#prog=<id>` opens the same confirm sheet.
- Confirm: "Replace current program? Your history stays."
- The program is then saved in full to `localStorage` with `source: 'shared', sharedId, sharedVer`, and works offline from then on. There's no live link.

**Edit/delete:** only the author, matched by device token hash.
- `PUT` replaces the JSON and bumps `version`. Devices that loaded it see "Update available (v3)" on their next online check and tap to apply. It is never applied automatically mid-program.
- `DELETE` removes the program from listings. Copies people already loaded stay on their devices.
- If the author loses their device, their recovery code restores edit rights.

**Moderation basics:**
- One report per member per program, with a reason: spam / offensive / broken.
- In a group, the owner can hide any program.
- Public programs auto-hide at 3 reports until Phillip reviews them, using an admin key stored as a Worker secret.
- Names go through the same blocklist as display names.
- Recommend keeping the public library behind a flag until the group version is proven.

## 4. API and D1 sketch

Existing endpoints: `POST /groups`, `POST /groups/:code/join`, `PUT /me/stats`, `GET /groups/:code/board`, `DELETE /me`. Every call except create and join sends `Authorization: Bearer <token>`.

| New endpoint | Purpose |
|---|---|
| `PUT /me/workouts` | Batch upsert of ≤50 summaries, plus `tz` |
| `DELETE /me/workouts/:sid` | Remove a summary |
| `GET /groups/:code/volume?period=day\|week\|all&sort=volume\|reps` | Ranked rows |
| `POST /groups/:code/workouts/:id/void` / `DELETE …/void` | Owner voids or restores an entry |
| `POST /programs` · `PUT /programs/:id` · `DELETE /programs/:id` | Publish, edit, delete (author only) |
| `GET /groups/:code/programs` · `GET /programs?public=1&cursor=` · `GET /programs/:id` | List and fetch |
| `POST /programs/:id/report` · `POST /programs/:id/hide` | Report; hide (owner or admin) |

```sql
ALTER TABLE members ADD COLUMN tz TEXT;            -- IANA, e.g. 'America/New_York'
CREATE TABLE workouts (
  member_id TEXT NOT NULL REFERENCES members(id), sid TEXT NOT NULL,
  local_date TEXT NOT NULL, week_start TEXT NOT NULL,
  volume_kg REAL NOT NULL, reps INTEGER NOT NULL, sets INTEGER NOT NULL, duration_s INTEGER,
  flagged INTEGER DEFAULT 0, voided_by TEXT, voided_at INTEGER,
  created_at INTEGER, updated_at INTEGER, PRIMARY KEY (member_id, sid));
CREATE INDEX wk_member_date ON workouts(member_id, local_date);
CREATE TABLE programs (
  id TEXT PRIMARY KEY, group_code TEXT, is_public INTEGER DEFAULT 0,
  author_member_id TEXT NOT NULL, author_name TEXT NOT NULL, name TEXT NOT NULL,
  program_json TEXT NOT NULL, size_bytes INTEGER, sha256 TEXT, weeks INTEGER, days INTEGER,
  version INTEGER DEFAULT 1, status TEXT DEFAULT 'active', report_count INTEGER DEFAULT 0,
  created_at INTEGER, updated_at INTEGER);
CREATE TABLE program_reports (program_id TEXT, member_id TEXT, reason TEXT, created_at INTEGER,
  PRIMARY KEY (program_id, member_id));
```

## 5. Anti-cheat and sanity limits

This is an honor system, and the board footer says so.

**Hard limits** (the server rejects the summary):
- A single workout over 50,000 kg volume or 3,000 reps.
- `local_date` more than 1 day in the future, or more than 365 days in the past.
- More than 6 workouts or 100,000 kg in one local day.
- `duration_s` under 15 s × sets.
- More than 200 summary writes per device per day.

**Soft limits** (the workout counts but shows ⚑):
- A workout over 2.5× the member's 4-week median workout volume.
- Anything backfilled.

**Owner controls:**
- The group owner can void any workout. A voided workout drops out of the sums and shows as struck through, with "voided by owner".
- The owner can also remove a member.
- The client keeps the existing per-set caps and the "Was this right?" confirm for big PR jumps.

## 6. Phased rollout

All day counts are **rough estimates** for a single developer.

| Phase | Scope | Backend | Est. dev-days |
|---|---|---|---|
| **P0: ship first** | `entryTotals`/`volumeTotals` with unit tests (bodyweight, timed, mixed lb/kg, week boundary); Home strip; Stats card; summary and share card updates; fix the timed-set and mixed-unit volume bugs. Also "Share program" as a `.json` file through the native share sheet, which a friend imports on the Import tab. | None | ~1.5 (est.) |
| P1 | Existing M2: Worker + D1, create/join group, streak and PR boards, leave/delete | Yes | ~2–3 (est.) |
| P2 | Summary sync with outbox, Volume tab (day/week/all, reps sort), time zone handling, limits and flags, owner void | Yes | ~1.5 (est.) |
| P3 | Group shared programs: publish, list, one-tap load, deep link, edit/delete, update badge, report/hide | Yes | ~2 (est.) |
| P4 (optional) | Public library: browse, search by name, auto-hide on reports, admin review | Yes | ~2 (est.) |

Rough total is ~7–8 days through P3 (estimate). P0 is worthwhile on its own: test it with friends on iPhone Safari before writing any server code.

## 7. Open questions

1. **Primary:** loading a shared program replaces the single `S.program`. Should P3 also keep a small local program list (the last 5) so friends can switch back? That adds about 0.5–1 day (estimate) and a "My programs" screen.
2. Should the public library ship at all, or should programs stay friends-group only for now? The recommendation is group-only until P3 has been used for a few weeks.
3. Raw volume favors heavier lifters. Is that fine for this group, or should the board add a secondary "vs. your 4-week average" percentage?
