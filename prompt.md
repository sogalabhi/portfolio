# Portfolio Build Spec — Abhijith Sogal V

A complete brief for building a personal portfolio site. Hand this to Claude Code as the project spec.

---

## 0. Read this first

This project has **two surfaces sharing one content source**:

| Route | What it is | Priority |
|---|---|---|
| `/` | Normal scrolling portfolio. Everything visible. | **Build first. Must be complete and deployed before anything else starts.** |
| `/world` | Playable 2D pixel island (Phaser). Same content, explorable. | Build second. Optional. Never blocks `/`. |

The game is a *flex you discover*, not a gate. No splash screen asking "explore or read?" — that taxes 100% of visitors to serve 20%. Default is the normal site; a persistent button offers the game.

**Non-negotiable:** if the game is unfinished, `/` still works perfectly and the button is hidden.

---

## 1. Stack

```
React 18 + Vite
Tailwind CSS v3
GSAP 3 (+ ScrollTrigger, ScrollTo)
Phaser 3          → /world only, lazy-loaded
lucide-react      → icons (never emoji as icons)
react-router-dom  → just two routes
```

**Deployment:** Vercel or Netlify. Custom domain if available.

**Do not add:** a CMS, a component library (shadcn/MUI), framer-motion (GSAP handles motion), or any state manager. This is a static content site — `useState` and props are enough.

**Bundle rule:** Phaser must be code-split. `/` must never download the game engine.
```js
const World = lazy(() => import('./world/World'));
```

---

## 2. Architecture

```
src/
  content/
    profile.json        identity, contact, availability, stats
    projects.json       all projects
    experience.json     all roles, grouped by org
    education.json
    skills.json
    achievements.json
  components/
    layout/    Nav, Footer, Section
    hero/      Hero, StatStrip, AvailabilityBadge
    work/      FeaturedCard, ProjectGrid, ProjectCard
    skills/    SkillGroup, GithubHeatmap
    exp/       TimelineCard, CompactRoleList, EducationBlock
    misc/      Achievements, Contact, TourController
  world/       Phaser scene + React overlay (lazy)
  hooks/       useGsapReveal, useTour, useReducedMotion
  App.jsx
```

**The rule that matters:** every piece of displayed text comes from `content/*.json`. Zero hardcoded copy in components. This is what lets the game reuse everything and lets Abhijith update content without touching React.

---

## 3. Visual direction

### Mood
Warm, confident, slightly playful — **not** the default dev-portfolio look (pure black background, neon accent, monospace everything, "> Hello World_" typing effect). Avoid all of that.

Think: a well-designed technical magazine. Light background, warm paper tones, one strong accent, generous whitespace, real hierarchy.

### Color tokens (Tailwind config)

```js
colors: {
  ink:    '#1C1B19',  // primary text — warm near-black, never #000
  slate:  '#5A574F',  // secondary text
  faint:  '#8B8780',  // meta text, dates, captions
  paper:  '#FAF7F0',  // page background — warm off-white
  card:   '#FFFFFF',  // raised surfaces
  line:   '#E4DFD4',  // hairline borders
  clay:   '#C4552E',  // PRIMARY ACCENT — links, CTAs, active states
  moss:   '#4A7C4E',  // secondary accent — "available", success, heatmap
  sand:   '#E8DCC4',  // tag/pill backgrounds
}
```

Dark mode: optional, ship it later if at all. A great light site beats a mediocre pair.

**Accent discipline:** `clay` appears on CTAs, links, and active nav only. If more than ~5% of a screen is clay, remove some.

### Typography

```
Display / headings : Bricolage Grotesque  (600) — distinctive, slightly quirky, not Inter
Body               : Inter                (400/500)
Code / data        : JetBrains Mono       (400) — stack tags, metrics, heatmap labels only
```

Load via Google Fonts with `display=swap`. Preload the display weight.

**Scale (desktop → mobile):**
```
h1  clamp(2.75rem, 6vw, 4.5rem)   line-height 1.05  letter-spacing -0.02em
h2  clamp(2rem, 4vw, 2.75rem)     line-height 1.15
h3  1.375rem                       line-height 1.3
body 1.0625rem (17px)              line-height 1.7
meta 0.875rem                      line-height 1.5
```

Body text max width: `65ch`. Never full-width paragraphs.

### Spacing & layout

```
Container      max-w-5xl (1024px), px-6 md:px-10
Section rhythm py-24 md:py-32
Card padding   p-6 md:p-8
Grid gap       gap-6
Radius         cards 16px · buttons 10px · pills 999px
Border         1px solid line — no drop shadows on cards, borders only
Shadow         only on hover, and only shadow-sm → shadow-md
```

### Motion (GSAP)

```
Reveal       opacity 0→1, y 24→0, duration 0.6, ease "power2.out"
Stagger      0.08 between siblings
ScrollTrigger start: "top 85%", once: true
Hover        150–200ms, color/border/shadow only
```

**Forbidden:** scale transforms on hover that shift layout, parallax on text, scroll-jacking, entrance animations longer than 800ms, anything that delays reading.

**Required:** wrap every animation in a `prefers-reduced-motion` check. If reduced motion is on, elements appear at final state instantly.

---

## 4. Page structure (`/`)

Single scrolling page. No sub-routes. Order is deliberate — strongest evidence first.

### 4.1 Nav (sticky)
```
┌──────────────────────────────────────────────────────────┐
│ Abhijith Sogal    work  skills  experience  about        │
│                              [Résumé ↓]  [Explore ↗]     │
└──────────────────────────────────────────────────────────┘
```
- Transparent at scroll 0 → `paper` bg + `line` bottom border after 80px
- Active section highlighted via ScrollTrigger
- Mobile: name + hamburger → full-screen overlay menu
- `[Résumé ↓]` = solid clay button. `[Explore ↗]` = ghost button, hidden until `/world` ships.

### 4.2 Hero
```
  Available for SDE / Data Engineering roles · 2027   ← moss pill, small
  
  Abhijith Sogal                                      ← h1
  
  Civil engineering student at NITK who builds        ← 20px, slate, max 30ch
  production systems. Distributed data pipelines,
  Flutter apps with 2,000+ users, and real-time
  web infrastructure.
  
  [Download résumé]  [GitHub]  [LinkedIn]             ← 1 solid + 2 ghost
  
  ──────────────────────────────────────────────────
  2,000+        4.9★         3rd/190+      5 yrs
  app users     Play Store   AssetHub      shipping   ← stat strip
```

**The stat strip is the single most important element on the site.** It makes a generalist read as capable rather than scattered. Numbers in Bricolage 600, labels in Inter faint 14px. Horizontal on desktop, 2×2 grid on mobile.

Left-aligned, not centered. Centered heroes feel like templates.

### 4.3 Featured work — 3 large cards
Full-width stacked cards, alternating image side on desktop.

```
┌────────────────────────────────────────────────────┐
│  [ screenshot / diagram ]  │  01 · Data Engineering │
│                            │  Retail Lakehouse      │
│                            │                        │
│                            │  One-line hook.        │
│                            │  • bullet              │
│                            │  • bullet              │
│                            │  • bullet              │
│                            │                        │
│                            │  Spark  Airflow  Kafka │
│                            │  Delta Lake  Terraform │
│                            │                        │
│                            │  [GitHub] [Live ↗]     │
└────────────────────────────────────────────────────┘
```
Order: **Retail Lakehouse → Arjun Guruji → SysSight** (data, mobile, infra — range on display).

Arjun Guruji card must show the Play Store badge, download count, and rating prominently.

### 4.4 More projects — compact grid
`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`. Title, one-liner, 3 stack tags, links. Hackathon projects get a small clay `🏆 3rd place` style pill (as an icon + text, not emoji).

### 4.5 Skills
Four labelled groups matching the résumé categories, rendered as pill rows:
```
Data Engineering   [Spark] [Airflow] [Delta Lake] [dbt] [Kafka] [MinIO] ...
Cloud & Infra      [Azure] [Terraform] [Docker] [K8s] [GitHub Actions] [Linux]
Full Stack         [FastAPI] [Django] [Flutter] [React] [Next.js] [Node] ...
Tools              [Git] [Postman] [Figma] [TimescaleDB]
```
Pills: `sand` bg, `ink` text, JetBrains Mono 13px, no icons. No proficiency bars — they're meaningless and everyone rates themselves 90%.

**Below: GitHub contribution heatmap.** Fetch via `github-contributions-api` or render from a cached JSON. Use the `moss` ramp. Caption: total contributions + current streak.

### 4.6 Experience — tiered timeline

Vertical line on the left, cards to the right.

**Tier 1 — four full cards** (org header + nested roles + bullets):
1. FOSSEE, IIT Bombay
2. IRIS, NITK
3. Momento (Humora Technologies)
4. SNSDS Trust

Nested-role rendering matters — it shows promotion, not job-hopping:
```
● FOSSEE, IIT Bombay                        May 2025 – Present
│  React · Django · Redis · WebSockets
│
│  ├ Web Lead              Nov 2025 – Present
│  ├ Autumn Intern         Aug – Nov 2025
│  └ Summer Intern         May – Aug 2025
│
│  • Led a team of 4...
│  • Architected Redis caching and WebSocket infra...
│  • Load testing scripts + live dashboard (CPU/RAM/cores)...
```

**Tier 2 — compact list**, one line each, no bullets:
E-Cell NITK · PACE NITK · Kannada Vedike NITK · Advista.live · SriSadguru Hypertechnologies (×2) · Datta Web Designers

Collapsed behind a `Show 7 more roles ↓` toggle. Everything present, nothing competing.

### 4.7 Education
```
National Institute of Technology Karnataka, Surathkal      2023 – Present
B.Tech, Civil Engineering — CGPA 7.92
Minor, Electronics & Communication — CGPA 7.25
```

### 4.8 Achievements
Small cards or a clean list:
- EthGlobal New Delhi — finalist round
- AssetHub Hackathon, Goa 2025 — 3rd of 190+
- Builder House Bengaluru — 3rd, INR ↔ Polkadot bridge
- Finalist in all 4 hackathons entered

### 4.9 Contact
```
Let's build something.

abhijithsogal@gmail.com                    ← large, clay, mailto, click-to-copy
GitHub · LinkedIn · Résumé (PDF)
Mysuru, Karnataka, India
```
**No phone number anywhere on the site.** It stays on the PDF only — a scraped number means permanent spam.

Optional form only if a backend exists (Formspree/Resend). A broken form is worse than none.

### 4.10 Tour mode
Floating button, bottom-right: `▶ Take the tour`.

On click: GSAP ScrollTo walks section to section, pausing ~4s each, with a small annotation card in the corner showing Abhijith's own one-line take on that section. Esc, manual scroll, or `×` exits. Progress dots show position.

This is narration, not a gimmick — it's the "let me walk you through it" that a portfolio normally can't do.

---

## 5. `/world` — the game (phase 3)

Six zones around a central spawn. Small enough that nothing is more than ~5 seconds away.

```
    Workshop          Tower           Shrine
    (projects)       (contact)      (hackathons)
         \              |              /
          \             |             /
              ┌──── SPAWN ────┐
              │  intro, resume │
              └───────┬───────┘
          /           |            \
     Garden       Terminal PC      Archive
  (skills +      (easter egg)    (experience +
   heatmap)                       education)
```

**Division of responsibility — get this right or the build gets painful:**

| Layer | Owns |
|---|---|
| Phaser | Canvas only. Tilemap, sprite movement, collision, proximity detection. |
| React | All UI. Dialogue panels, project cards, contact form, nav. |
| Event bus | Phaser emits `playerNearZone: 'workshop'` → React renders. One thin channel. |
| GSAP | UI motion (panels, transitions). Phaser handles world motion. |

**Phaser must never render portfolio content.** It renders a world; React renders information.

**Palette (game only, hardcoded, does not follow site tokens):**
```
sky   #87C5C2   ground #E8D5A8   foliage #5FA65A / #3E7A44
panel #2B2438   text   #F4EDE2   prompt #F2A65A   link #E86A6A
```

**Typography:** pixel font (Silkscreen / Press Start 2P) for UI chrome and labels **only**. All body copy in Inter 16px+. Pixel fonts at paragraph length are unreadable and will cost interviews.

**Controls:** WASD/arrows **plus click-to-move** — a large share of visitors won't try the keyboard. Interact prompt = a bobbing clay `[E]` above interactables, which teaches the mechanic with zero tutorial text.

**Mobile:** don't build a joystick. Detect touch → redirect to `/` with a small toast: "The world is best on desktop." Pixel worlds on a 380px screen are a bad experience.

**Zone metaphors** (these earn their place, they aren't labelled rooms):
- **Workshop** — projects as objects on workbenches
- **Garden** — skills as plants at growth stages; **GitHub heatmap as a tilled crop field**, each contribution square a plot
- **Archive** — experience as dated crates, chronological left → right
- **Shrine** — hackathon trophies
- **Tower** — contact, styled as sending a signal
- **Terminal PC** — `whoami`, `ls`, `cd garden`, `sudo hire-me` (→ confetti + copies email)

**Assets:** use Kenney.nl (CC0) or a single cohesive itch.io top-down pack. **Stay inside one pack** — mixing packs is what makes pixel sites look amateur.

---

## 6. Content you (Abhijith) still need to supply

Fill these into `content/*.json`. Everything not listed here is already in the résumé and can be lifted directly.

### 6.1 For every project — required fields

```json
{
  "id": "retail-lakehouse",
  "title": "",
  "tagline": "",              // one line, ≤ 90 chars, what it does for whom
  "domain": "",               // Data Engineering | Mobile | Infra | Web | Blockchain
  "problem": "",              // 1–2 sentences: what was broken/missing
  "whatIBuilt": ["", "", ""], // 3–4 bullets, each starting with a verb
  "impact": "",               // NUMBERS. users, latency, rows/sec, %, rank
  "stack": ["", ""],
  "links": { "github": "", "live": "", "demo": "", "playStore": "" },
  "media": ["screenshot.png"],// screenshot, architecture diagram, or GIF
  "featured": true,
  "date": "2026-03"
}
```

**Send me / write down for each project:**
1. Repo link (public? if private, say so — it changes the card)
2. Live URL or demo video
3. **At least one number.** Rows processed, latency, users, uptime, % improvement, leaderboard rank. A project without a number reads as a tutorial follow-along.
4. One screenshot or architecture diagram (this matters more than the copy)
5. Was it solo or team? If team — what was *your* part specifically?
6. What was the hardest technical problem, and how did you solve it? (One sentence. This is what gets asked in interviews and it's what makes a card memorable.)

**Already have enough for:** Retail Lakehouse, SysSight, Arjun Guruji.
**Still needed:** every other personal project + all hackathon builds.

### 6.2 For every hackathon — required

```json
{
  "event": "",        // AssetHub Hackathon, Goa
  "date": "",
  "result": "",       // 3rd of 190+ · Finalist · etc.
  "project": "",      // what you built
  "oneLiner": "",
  "myRole": "",       // team size + your specific contribution
  "stack": [],
  "links": { "github": "", "devpost": "", "demo": "" }
}
```

You mentioned 5–6 hackathons, 2 wins. Send details for all — even non-placing ones, if the build was interesting.

Known so far: EthGlobal New Delhi (finalist round), AssetHub Goa 2025 (3rd/190+), Builder House Bengaluru (3rd, INR↔Polkadot bridge). **Three more missing.**

### 6.3 Experience — needed per Tier-1 role

Résumé bullets are a starting point but are compressed. For each of FOSSEE, IRIS, Momento, SNSDS, supply:
- Team size and your position in it
- 1 metric per role (users served, load handled, processes digitized, response time)
- One thing you're actually proud of that isn't on the résumé

### 6.4 Assets & links needed
- [ ] Résumé PDF, final version → `public/resume.pdf`
- [ ] A photo (optional but recommended — a real face outperforms an avatar)
- [ ] Play Store link for Arjun Guruji + 2–3 app screenshots
- [ ] Favicon
- [ ] OG image, 1200×630 — name + tagline. Controls how the link looks when shared. Do not skip.
- [ ] Any live project URLs

### 6.5 Copy you need to write yourself
- [ ] **Hero tagline** — one sentence. Draft: *"Civil engineering student at NITK who builds production systems — distributed data pipelines, Flutter apps with 2,000+ users, and real-time web infrastructure."*
- [ ] **Availability line** — exact role types + grad year
- [ ] **Tour annotations** — one line per section, in your own voice

---

## 7. Data to fix before building

These are real inconsistencies between the résumé and LinkedIn. Pick one source of truth — recruiters cross-check.

| Item | Résumé | LinkedIn | Action |
|---|---|---|---|
| Momento / Humora dates | Nov 2025 – Feb 2026 | Oct 2025 – Jan 2026 | Resolve |
| Osdag "Web Lead" start | May 2025 | Nov 2025 (Web Mentor) | Resolve |
| Osdag role title | Web Lead | Web mentor | Pick one |
| LinkedIn Autumn Intern blurb | — | "Will work on UI revamp" | Rewrite in past tense — the role is finished |

---

## 8. Quality gates

Do not consider a phase done until all of these pass.

**Accessibility**
- [ ] All text ≥ 4.5:1 contrast against its background
- [ ] Visible focus ring on every interactive element (clay, 2px offset)
- [ ] Every image has meaningful alt text
- [ ] Tab order matches visual order
- [ ] `prefers-reduced-motion` respected — animations become instant, not slower
- [ ] Icon-only buttons have `aria-label`

**Interaction**
- [ ] `cursor-pointer` on everything clickable
- [ ] Hover states are visible and do not shift layout
- [ ] Transitions 150–300ms
- [ ] Touch targets ≥ 44×44px

**Responsive**
- [ ] No horizontal scroll at 375px
- [ ] Verified at 375 / 768 / 1024 / 1440
- [ ] Body text ≥ 16px on mobile
- [ ] No content hidden behind the sticky nav

**Performance**
- [ ] Lighthouse ≥ 95 on `/`
- [ ] Images WebP, lazy-loaded, explicit width/height (no layout shift)
- [ ] Phaser not in the `/` bundle
- [ ] Fonts preloaded, `display: swap`

**Content**
- [ ] Zero hardcoded copy in components
- [ ] No emoji used as icons
- [ ] No phone number anywhere on the site
- [ ] Every external link `target="_blank" rel="noopener noreferrer"`
- [ ] Custom 404

**SEO**
- [ ] `<title>`, meta description, OG + Twitter card tags
- [ ] Semantic HTML (`<main>`, `<section>`, `<article>`, one `<h1>`)
- [ ] `sitemap.xml`, `robots.txt`

---

## 9. Build phases

**Phase 1 — the real portfolio.** Content JSON → layout → all sections → responsive → a11y → deploy. *Ship this before starting anything else. A live, complete, plain portfolio beats an unfinished clever one every single time.*

**Phase 2 — polish.** GSAP reveals, tour mode, GitHub heatmap, OG image, 404, analytics.

**Phase 3 — `/world`.** Read-mode-complete is a hard prerequisite. Build: Phaser scene + movement + collision → event bus → Workshop zone fully wired → remaining zones (mostly repetition) → terminal easter egg → footprints and polish.

---

## 10. Things to deliberately avoid

- Splash screen or "choose your experience" gate
- Typing/terminal effect in the hero
- Pure black background with neon green accent
- Skill proficiency bars or percentages
- "Passionate developer" / "I turn coffee into code" / "Let's create something amazing"
- Full-page scroll-jacking
- Lorem ipsum shipped to production
- Emoji as UI icons
- A contact form with no backend
- Mixing multiple pixel-art asset packs
- Building the game before the site is live