# BETA FIT — Workout Tracker

> Renamed from FORGE (2026-10-15). Internal identifiers deliberately keep the old name so existing installs and links keep working: the repo/URL `forge-workout`, the API worker `forge-api`, and the localStorage keys `forge.v1` / `forge.sync.v1` (renaming them would orphan every user's data). Exported program files are now named `beta-fit-program-*.json` (same JSON format; the importer reads any filename).

A single-file, offline-friendly workout tracker web app (`index.html`). Includes the Lost Breed 8-week shred program (`programs/lost-breed-8-week-shred.json`).

Live: https://pb3oh.github.io/forge-workout/

On iPhone: open in Safari → Share → Add to Home Screen for a full-screen app.

Data is stored locally in your browser (localStorage); nothing is sent to a server unless you opt in to groups (Settings → Groups, backend in `forge-backend`). The Import screen accepts txt/csv/json by tap or drag-and-drop; PDFs/photos aren't readable yet (the app offers a ready-made ChatGPT/Claude prompt instead).

**Feedback:** Settings → Send feedback (also linked from Import). There is no backend: entries are saved locally (Settings → Your feedback) and can open a prefilled issue at https://github.com/pb3oh/forge-workout/issues/new (labels `bug`, `enhancement`, `feedback` — create them in the repo so they apply), or be copied/shared.

**Deploying:** (current build `2026.10.15-16`) bump the `BUILD` constant near the top of the script in `index.html` **and** `VERSION` in `sw.js` (keep them identical) on every release. Deploy both files; `sw.js` caches the app shell for offline start (network-first for the page, so updates still arrive). Open copies compare it with the live file and show a "New version available — tap to reload" banner.

**Reset my stats (build 2026.10.15-15):** Settings → *Reset my stats* (above Erase) clears only this device's workout history and the totals derived from it, and removes this user's shared workouts on the server (`POST /v1/workouts/reset`, authenticated by the device token) so group totals drop. Programs, library, settings, groups and the group sign-in are kept, and nothing old is re-sent afterwards. If the server can't be reached nothing is changed. Also in this build: the Home *Your contribution* card is a 2×2 grid that fits 320–430 px phones, and the bottom nav uses thin-stroke SVG line icons instead of emoji.

**Stepper layout fix (build 2026.10.15-16):** on the active workout screen the *Weight* and *Reps done* steppers are now two equal-width, full-width rows `[ − ]  label + value  [ + ]` (48 px buttons, a flexible middle that always has room for 6-7 characters such as `1000.5` / `999`), so a value like `20` can no longer be cut off to `2(` on an iPhone. Anything even longer auto-shrinks (never below 14 px) instead of clipping. The same pass fixed text that was clipped or overflowing at 320/360 px on Home (Yesterday/last-week tiles, group pill, leaderboard names), Start (music row, exercise list), Program (program name, ab-circuit lists), Stats (volume tiles), History (day header) and the 320 px workout action bar. A permanent regression check, `_verify_layout.py`, now scans every main screen and sheet at 320/360/390/430 px with realistic and worst-case values and fails on any element whose `scrollWidth > clientWidth` or any input whose value is wider than its box.
