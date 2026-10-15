# FORGE: AI PDF/photo program import, options memo (2026-10-15)

**Context:** single-file vanilla JS PWA on GitHub Pages, no backend, one user (iPhone Safari). Goal: PDF/photo → existing program JSON (weeks/days/blocks/exercises/sets, supersets, `kind:"cardio"` circuits). Note: I haven't seen *BECOME COLOSSAL FINAL.pdf* (it isn't on my box), so reliability notes are based on the Lost Breed PDF and general table-PDF behavior.

## A. Manual: Phillip sends me the PDF, I return program JSON
- **Effort:** none to build. Works today via the existing JSON file/paste import. Optional ~30-line add-on: a "Copy AI prompt" button (schema + rules) so he could also use any chatbot.
- **Cost:** $0 extra. Turnaround is minutes, but it needs me in the loop.
- **Privacy:** the PDF goes only to me/my model provider, nothing new.
- **Reliability:** best of the three. I read the layout visually, so supersets, `10+10`, `20→8` and circuits map properly (the Lost Breed JSON was done this way). Review is still advisable.
- **Keys:** none.

## B. Cloudflare Worker + vision/LLM API + review screen
- **Effort:** about 1–2 days. Worker (~100 lines), a JSON-schema/structured-output prompt, upload UI, a review/edit screen, and validation through the existing `parseJSONProgram`. Large 8-week programs need chunking or streaming, because output can be 15–25k tokens.
- **Cost:** Workers free tier is plenty. LLM cost is my estimate, not a quote: roughly **$0.02–0.15/import** on a cheap model (Gemini Flash/Haiku class) and **$0.20–1** on a frontier model, for a 20–60 page PDF. Check current pricing. Likely a few dollars a year for one user.
- **Privacy:** the PDF goes to Cloudflare and the model vendor. It's fine for workout plans, but state it in the UI. Choose an API tier that doesn't train on inputs.
- **Reliability:** high on tables, but not perfect. Expect occasional wrong set counts or merged supersets, hence the mandatory review step.
- **Keys:** store the key with `wrangler secret put`, never in the repo or client. Restrict CORS to `https://pb3oh.github.io`, add a long random access token (entered once, kept in localStorage; it's a gate, not a secret), rate-limit, and set a provider spend cap.

## C. Fully client-side (pdf.js + heuristics, optional Tesseract.js OCR)
- **Effort:** 3–5+ days and open-ended. Lazy-load pdf.js (~0.5 MB) and rebuild rows from text coordinates. Tesseract is ~10 MB of wasm plus language data.
- **Cost:** $0. **Privacy:** best, nothing leaves the device.
- **Reliability:** weak on exactly these PDFs. It can extract text from digital PDFs and roughly rebuild rows. It can't reliably infer supersets (A/B/C pairing), circuits, `10+10` / `→` meaning, notes, or repeated-week shorthand. Photos via OCR are slow on iPhone, memory-heavy and error-prone. You'd end up hand-fixing everything, with per-PDF tuning that doesn't generalize.
- **Keys:** none.

## Recommendation
- **Now: A.** It's free, works today, and gives the best accuracy. Add the "Copy AI prompt" button if he wants self-serve.
- **Later: B,** if imports become frequent, because it removes me from the loop. Skip C except as a small convenience: a lazy-loaded pdf.js "extract text → paste box" helper.

## Can the pasted-text importer handle this PDF's text today?
I ran `parseText` on simulated pastes. Probably not for raw table copy-paste.
- **Table cells one per line** (typical PDF copy): header words ("Exercise/Sets/Reps") and every number become exercises, defaulting to 3×10.
- **`Flat Bench Press 4 10-12`** (space-separated columns, no `x`): not recognised.
- **`Pull Ups 4 x Failure`** and **`Bench Press – 5 sets of 8`:** the name regex needs a digit after `x` and doesn't handle "sets of N", so these default to 3×10 or give blank sets.
- **`10→10→10`, `10+10`, `20s`** inside a line: the scheme parser doesn't take them (only the JSON path does).
- **Works:** `Day N - Focus`, `Week N`, `NxM`, `10,8,6`, `A superset B : x / y`, `Note:`.

**Small upgrades, in rough value order:**
1. Treat `N sets of M`, `N x failure/AMRAP`, `N M` (sets then reps columns) as schemes.
2. Accept `+`, `→` and `s` suffix reps (`10+10`, `20→8`, `30s`).
3. Skip header-row words (exercise/sets/reps/rest/notes).
4. Merge a column-per-line layout (name, then sets, then reps lines) into one exercise.
5. Treat `A1./A2.` or `A)/B)` prefixes as superset grouping.
6. Warn visibly when a default 3×10 was applied.

Even with these, circuits and notes would still need B or A.
