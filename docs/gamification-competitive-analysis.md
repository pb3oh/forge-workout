# FORGE: Gamification & Friends Competition, Competitive Analysis + Ideas

**Date:** 2026-10-15 · **Owner:** Phillip · **Context:** a small friend group (3–15 people) comes first. Step 2 is a private leaderboard joined with an invite code (Cloudflare Workers + D1, no sign-in). See `backlog-sharing-leaderboard.md`.

**Bottom line:** At 3–15 people, global-scale mechanics like leagues and segments won't work well. What does work is a **weekly reset** (everyone starts at zero on Monday), **cooperative group goals**, **forgiving streaks**, and **one-tap reactions to PRs**. The best controlled evidence I found shows that **competition** among friends beats support and collaboration for sustained activity ([STEP UP trial, JAMA IM 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6735420/)). Rankings do demoralize people at the bottom, though, and grouping people with others at a similar level helps ([Labour Economics 2024](https://doi.org/10.1016/j.labeco.2024.102602); [Topcoder study](https://doi.org/10.1145/3555649)).

---

## 1. Competitors & analogs

| App | Key mechanics (sourced) | What seems to drive retention | Lesson for FORGE |
|---|---|---|---|
| **Strava** | Kudos, clubs, segment leaderboards (filterable by followers or clubs, age and weight), private **Group Challenges** with a goal and a timeframe for up to 199 invitees. Group Challenges are now subscriber-only ([help](https://support.strava.com/en-us/articles/15401736-group-challenges), [features](https://support.strava.com/en-us/articles/15402044-strava-subscription-features)). In 2025 users gave 14B kudos (+20%). Group activities get 2× the kudos, and activities with photos get more than 3× ([Year in Sport 2025](https://press.strava.com/articles/strava-releases-12th-annual-year-in-sport-trend-report-2025)). | Cheap social approval (kudos), plus clubs and private challenges with real friends. | Make reactions one tap, and let a short note or photo ride along with a workout. |
| **Hevy** | Following feed with likes and comments. A **leaderboard among people you follow**, ranked by heaviest weight on a set of big lifts. Head-to-head "Compare" over 30 days, 3 months, 1 year or all time (count, time, volume, muscle split). A **weekly streak** (at least one workout per week) that can be restored by back-dating a log ([social](https://help.hevyapp.com/hc/en-us/articles/35688036014231-Hevy-App-Social-Guide-Connect-Follow-and-Share-Your-Workouts), [leaderboard](https://www.hevyapp.com/features/gym-leaderboard/), [streak](https://help.hevyapp.com/hc/en-us/articles/35380117933207-Track-Your-Workout-Consistency-with-the-Calendar-and-Streak-Features)). | Seeing friends' real sessions, and PRs as social objects. | This is the closest analog. Ship a PR feed and a friend-scoped lift board. Hevy's absolute-weight board leaves beginners at the bottom, which FORGE can fix. |
| **Strong** | No feed, no following. You share workouts and templates through links only ([Strong help](https://help.strongapp.io/article/255-share-links)). Some users like it that way ([r/strongapp](https://www.reddit.com/r/strongapp/comments/1gh0ywe/im_glad_strong_doesnt_have_any_social_features/)). | A fast, clean logger. Retention comes from utility, not social features. | Keep social features optional. Logging speed still comes first. |
| **Fitbod** | Strength score, e1RM, a recovery heat map, records ([help](https://fitbod.zendesk.com/hc/en-us/articles/12732749777047-Fitbod-Metrics-Records)). ⚠️ The search summary also mentioned weekly-goal streaks and gym leaderboards, but I **couldn't confirm** those on an official page. | Personal progress numbers and an AI plan. | Show a personal progress number (e1RM change) next to the rankings. |
| **JEFIT** | "Iron Points" for workouts and social activity, badges, monthly or quarterly solo and group contests with daily leaderboard updates ([FAQ](https://www.jefit.com/support/faq), [group challenges](https://www.jefit.com/blog/how-to-join-group-challenges)). | Time-boxed contests with team rankings. | Run challenges in time boxes, with a clear start and end. |
| **Peloton** | A "Here Now" live leaderboard with **high fives**, filters by age, gender and tag ([help](https://support.onepeloton.com/s/article/16084878507540-Peloton-Leaderboard)). **Weekly** streak badges from 3 weeks up to 208 weeks, and milestone badges at 1/10/25/50/100 classes ([Club Peloton](https://www.onepeloton.com/club-peloton), [milestones](https://www.onepeloton.com/blog/milestones)). | Milestone shout-outs, weekly rather than daily streaks, a trophy case. | Use weekly streaks and milestone badges. Daily streaks don't fit lifting. |
| **Duolingo** (best in class) | Streaks. **Streak freezes:** 2 beat 1, and 3 were no better than 2. "Earn back" a lost streak. The first 7 days matter most ([Lenny's / Duolingo PM](https://www.lennysnewsletter.com/p/behind-the-product-duolingo-streaks)). Weekly leagues of about 30 people with promotion and relegation ([Trophy case study](https://trophy.so/blog/duolingo-gamification-case-study)). **Friend Streak** with up to 5 friends ([blog](https://blog.duolingo.com/friend-streak/)). **Friends Quests:** a weekly co-op goal for two people ([blog](https://blog.duolingo.com/friends-quests/)). | Loss aversion once a streak exists, softened by forgiveness. Co-op social obligation. | Cap freezes at 2, offer a way to earn a streak back, and add a shared crew streak. |
| **Apple Fitness** | Activity sharing, notifications when friends finish a workout, **7-day 1-on-1 competitions**. Points are capped (600 a day, 4,200 a week) and based on **percent of your own goal**. Win and participation awards ([Apple](https://support.apple.com/guide/watch/share-your-activity-apd68a69f5c7/watchos), [Android Police](https://www.androidpolice.com/how-to-use-apple-watch-competitions/)). | Scoring against your own goal makes people of different fitness levels comparable. Daily caps limit overdoing it. | Score against personal targets and cap points per day. |
| **WHOOP** | Teams with Strain, Recovery and Sleep leaderboards, team chat. The creator picks which metrics are shown ([WHOOP](https://www.whoop.com/us/en/thelocker/join-create-teams-on-whoop/)). | Accountability inside a small group. | Let the group creator choose which boards to show. |
| **Nike Run Club** | Custom challenges (distance or time, dates, invite friends), achievements for PRs, totals and streaks. A friend leaderboard that needs consent on both sides ([Nike](https://www.nike.com/nrc-app)). ⚠️ The challenge details come from a secondary source ([Bliss Tulle](https://blisstulle.com/can-you-challenge-friends-on-nike-run-club/)) and I didn't verify them in the app. | Friend challenges and trophies. | Only show someone on a board if they opted in. |
| **Gymshark Training** | **Gymshark66:** a 66-day habit challenge with a tracker ([Gymshark](https://www.gymshark.com/blog/article/what-is-the-gymshark-66-challenge)). Loyalty XP for logged workouts, capped at 5 a week ([support](https://www.support.gymshark.com/en-US/article/gymshark-loyalty)). | Named seasonal challenges. A weekly cap on rewarded workouts. | Package the 8-week program as a named season. |
| **Beeminder / stickK** | Beeminder: you pledge money and pay when you "derail" below your line. Changes take effect after a 1-week delay ([help](https://help.beeminder.com/article/17-what-happens-when-i-derail)). stickK: a contract with a stake, a **referee**, and an optional anti-charity ([stickK](https://stickk.zendesk.com/hc/en-us/articles/206833157-How-it-Works)). | Real money on the line, plus a human who verifies. | A friend as referee works. Real money adds legal and trust burden, so keep stakes off-app. |
| **GymRats** (friend group) | Admin-created challenges scored by active days, check-ins, a metric, or custom "Hustle Points". Photo check-ins ([help](https://help.gymrats.app/en/articles/10542294-scoring-modes)). | Built for exactly a group chat of friends. | Score by **active days** by default. It's the fairest simple metric. |
| **WayBetter / StepBet** (group stakes) | Everyone pays in; people who hit the goal split the pot, and the house may take a cut. **Personalized** step goals ([WayBetter](https://support.waybetter.app/hc/en-us/articles/12298730134419-What-are-Financial-Commitments-and-how-do-they-work), [StepBet](https://stepbet.com/faq)). | Money pressure, with goals tailored per person so it stays fair. | If there are stakes, every winner shares the pot and the goal is personal. |

---

## 2. Ideas for FORGE, ranked by impact ÷ effort

Effort is for the existing Worker/D1 plan: S is under half a day, M is 1–2 days, L is 3 days or more.

| # | Idea | Impact | Effort | Notes |
|---|---|---|---|---|
| 1 | **Weekly board, resets Monday:** ranks workout days this week, with all-time tabs for streak and e1RM | High | S | Everyone starts even each week. Ties are fine. |
| 2 | **PR auto-posts + group feed** ("Sam: Squat e1RM 140 kg, +5") | High | S–M | New-PR detection already exists. Add an `events` table. |
| 3 | **One-tap reactions** (🔥💪👏) on feed items | High | S | Strava's kudos model. No comments in the beta, so nothing to moderate. |
| 4 | **Crew goal:** a weekly group target (e.g. 30 workout days in total) and a **crew streak** (weeks the goal was hit) | High | S–M | Co-op softens the effect of rankings on people at the bottom (Duolingo Friends Quest model). |
| 5 | **% gain board** (30-day e1RM % change) as the default lift tab | High | S | The 30-day gain is already computed. Beginners can win it. |
| 6 | **Streak shields:** keep the 1 free rest day each week, add earned shields (1 for every 2 full weeks, max 2) and a 48h "earn back" | Med–High | S | Duolingo found 2 freezes beat 1, and 3 added nothing. |
| 7 | **Nudge button:** "Ping Alex" opens the share sheet with a prefilled text | Med | S | No push infrastructure needed. Real Web Push works for Home Screen PWAs on iOS 16.4+ ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)) and can come later. |
| 8 | **Season challenge:** "8-Week Shred" leaderboard ranked by % of scheduled sessions completed | High | M | Fits the bundled program. Peloton/Gymshark66-style season badge at the end. |
| 9 | **Badges/milestones:** 10/25/50/100 workouts, 3/5/10-week streaks, plate clubs (1/2/3 plates) | Med | S–M | Local-only at first. Show them on the board as icons. |
| 10 | **Weekly recap card** (personal + group) on Monday | Med | S | Reuses the share-card canvas. Brings people back after the reset. |
| 11 | **Head-to-head week:** auto-paired 1-on-1 on % of your own weekly target, capped per day | Med | M | Apple's competition model. Pair people of similar level. |
| 12 | **Bodyweight-relative strength (DOTS)**, opt-in | Med | M | Needs bodyweight and sex, which raises privacy questions, so store it locally and upload only the score. DOTS and IPF GL use different scales, so pick one ([IPF](https://www.powerlifting.sport/rules/codes/info/ipf-formula)). |
| 13 | **Pacts / light stakes:** "loser buys coffee" recorded in the app, money settled off-app, friend as referee | Low–Med | S | No payments in the app. Everyone who hits the goal wins. |
| 14 | **Leagues with promotion and relegation** | Low (at this size) | L | Only worth it with 20+ users or several groups. |
| 15 | **Total-volume challenge** | Low–Med | S | Volume favors bigger lifters and encourages junk volume. Use it only as a crew total. |

---

## 3. Risks & mitigations

- **Lower performers lose motivation.** Default to effort metrics (days, % of plan, % gain) rather than absolute weight. Keep absolute e1RM as a secondary tab. Add crew goals and reactions. Never send a "you're last" message.
- **Overtraining or unhealthy competition.** Count a workout day at most once per day and cap the weekly score at the program's planned days (Gymshark caps at 5 a week, Apple caps per day). Rest days don't break streaks. No streak for 7 days a week.
- **Cheating.** It's an honor system among friends. Keep the existing guards (range checks, a "Was this right?" prompt above +20%, server rate limits, the creator can remove members). Prefer metrics that are hard to fake meaningfully, like days and % of plan.
- **Privacy.** Opt-in only. Upload only aggregates. Keep bodyweight local. Leaving deletes your data. The invite code can be rotated. Let members hide individual boards.
- **Streak anxiety.** Shields, earn-back, and weekly streaks reduce the guilt of breaking a streak. Don't send nagging notifications.
- **Pressure from stakes.** Keep them off-app and opt-in per pact.

---

## 4. Recommended "friends beta" package (Step 2)

**Week 1 (core loop):** create or join a group with an invite code · **weekly board** (workout days, resets Monday) with tabs for streak, 30-day e1RM % gain, and absolute e1RM · **PR and workout-finished feed** · **one-tap reactions** · honor-system guards · leave/delete.

**Week 2–3 (retention):** **crew weekly goal + crew streak** · **streak shields + earn-back** · **nudge** through the share sheet · **8-Week Shred season board** · badges · Monday recap card.

**Later (if the group sticks):** head-to-head weeks · opt-in DOTS · Web Push reminders · off-app pacts · leagues, only if there are several groups or 20+ people.

---

## 5. Open questions for Phillip

1. **Default ranking:** should the main board rank effort (days or % of plan), with absolute e1RM as a secondary tab? Or does your group want the weight board up front?
2. **Season framing:** is everyone running the same 8-Week Shred program, so a shared season board makes sense, or does everyone run different programs?
3. **Stakes and bodyweight:** is your group up for an optional "loser buys coffee" pact, and would they enter their bodyweight for a DOTS board, or skip both?

---

### Unverified or caveated
- The Fitbod streak and leaderboard claims, and the Nike Run Club custom-challenge details, came from search summaries or secondary sources. I didn't confirm them in the apps.
- Duolingo's leagues of about 30 people and the "freezes make streaks 4.5× longer" figure come from Trophy, a gamification vendor, not from Duolingo. The 2-vs-3 freeze result comes directly from Duolingo's PM.
- STEP UP studied overweight and obese adults counting steps, not lifters. Treat it as directional only.
- Strava Group Challenges being subscriber-only is from Strava's help center as of 2025 and could change.
