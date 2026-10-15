# FORGE — Workout Tracker

A single-file, offline-friendly workout tracker web app (`index.html`). Includes the Lost Breed 8-week shred program (`programs/lost-breed-8-week-shred.json`).

Live: https://pb3oh.github.io/forge-workout/

On iPhone: open in Safari → Share → Add to Home Screen for a full-screen app.

Data is stored locally in your browser (localStorage); nothing is sent to a server. The Import screen accepts txt/csv/json by tap or drag-and-drop; PDFs/photos aren't readable yet (the app offers a ready-made ChatGPT/Claude prompt instead).

**Feedback:** Settings → Send feedback (also linked from Import). There is no backend: entries are saved locally (Settings → Your feedback) and can open a prefilled issue at https://github.com/pb3oh/forge-workout/issues/new (labels `bug`, `enhancement`, `feedback` — create them in the repo so they apply), or be copied/shared.

**Deploying:** (current build `2026.10.15-3`) bump the `BUILD` constant near the top of the script in `index.html` on every release. Open copies compare it with the live file and show a "New version available — tap to reload" banner.
