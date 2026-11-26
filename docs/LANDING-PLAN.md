# Landing page rebuild: plan

Written 2026-11-17. This is the working plan for finishing the `/` redesign.
Read `docs/HANDOVER.md` first for how the repo works; this doc only covers
what is changing. Tick items off here as they land.

## 1. The idea

Abhijith is a civil engineering student who builds software. The page is a
**drawing set**: each section is a sheet, and the pixel island from `/world`
is the thing the drawings describe.

Two visual languages, used deliberately and never mixed inside one element:

| Language | Means | Looks like |
|---|---|---|
| Line drawing | The plan: structure, annotation, anything explanatory | Ink hairlines on paper, mono labels, clay for centrelines and marks |
| Pixel art | The built thing | The island, its buildings, the avatar |

The hero already shows this: a site plan of the island that gets built, tile
by tile, as the avatar walks it and as the visitor moves across it.

References the owner asked to match in ambition (one concept carried through
the whole page, figure plates with captions, small mono annotations, a mascot
that travels with the scroll): `mylatestwork.dev`, `anzalabidi.dev`,
`sakthi-portfolio-mauve.vercel.app`. Match the ambition, not the look.

## 2. Rules

- **Copy lives in `src/content/*.json`.** No visible string in a component.
- **Colours are the existing tokens** in `src/index.css` (`ink`, `slate`,
  `faint`, `paper`, `card`, `line`, `clay`, `moss`, `sand`). Clay stays rare.
- **Fonts stay**: Newsreader (display), Inter (body), Departure Mono (labels).
- **No new npm dependencies.**
- **Nothing invented.** No made-up metrics, screenshots, testimonials or
  biography facts. Facts come from `src/content/`, `public/resume.pdf`, and
  the project repos under `~/coding/`.
- **Reduced motion**: every animation needs a still fallback
  (`useReducedMotion`).
- **The world build stays deterministic.** After `npm run world:build`,
  `git status` must show no change to `public/world/map`, `atlas` or `tiles`.
  `sha256sum public/world/map/island.json` is
  `ed8fb83e305865914bac82c2aa5db5decd7ada0f6f3b236d5b9da266cb08214b`.
- **Do not commit or push.** The owner reviews the working tree first.
- Match the surrounding code: comment density, naming, no TypeScript.

## 3. Already done

- [x] **Avatar art**: `assets/pixel/avatar.mjs`, drawn from the owner's photo.
  - `public/world/sprites/avatar.png`: 16 frames of 16×24. Order is down,
    left, right, up; four frames each (stand, step, stand, step).
  - `public/world/sprites/avatar_portrait.png`: 2 frames of 32×48 (eyes
    open, blink).
  - Both are kept out of the atlas (`scripts/assets/pack-atlas.mjs`).
  - New colours are in `EXTRA_HEX` in `scripts/assets/palette.mjs`.
- [x] **Island render**: `scripts/world/build-preview.mjs` writes
  `public/world/island.webp` (1280×896, lossless, about 107 kB). It draws what
  `WorldScene` draws, in the same order.
- [x] **Shared geometry**: `scripts/world/shape.mjs`. `build-map.mjs` now
  imports from it; the map output is byte-identical.
- [x] **Plan data**: `scripts/world/build-plan.mjs` writes
  `src/world/data/plan.json`.
- [x] **npm scripts**: `world:preview`, `world:plan`, both chained into
  `world:build`.
- [x] **Hero**: `src/components/hero/Hero.jsx`, `SitePlan.jsx`,
  `StatStrip.jsx` (now the title block), copy in
  `src/content/site-plan.json`, styles at the end of `src/index.css`.
  Checked at 1440×900 with no console errors.
- [x] **Old banner off the page**: `IslandDivider` is no longer rendered.
  `#world-banner` is now the hero sheet, so `WorldMiniBanner` still works.

## 4. To do, in this order

Sections H and I were added later the same day at the owner's request:
custom animated figures for the featured projects (H, which changes D) and a
revamp of the margins (I, which changes B). Do H together with D and I
together with B's margin walker.

### A. Hero: phone and loose ends

At 390 px wide the plan is about 340 px across, and three things break.

- [x] **Labels are clipped** at the left and right edges ("ORKSHOP", "ARDEN",
  "ARCHI"). Below `sm`, show only the lettered circle at each label position,
  and add a legend under the plan: a two-column list of links, "A Workshop:
  Work" and so on, from the same `labels` array.
- [x] **The build button covers the Archive label.** Below `sm`, move it out
  of the drawing, under the legend.
- [x] **North point and scale text are unreadable** at that size. Hide the
  text (keep the marks) below `sm`.
- [x] **Linework reads heavy** on the phone because hairlines don't scale.
  Drop the coast and building outlines to 1 px below `sm`.
- [x] Check 768, 1280×720 and 1920×1080 too. The sheet caps at 1400 px.
- [x] `site-plan.json` has an unused `titleBlock.byLabel`. Use it or delete it.
- [x] Preload the island: `<link rel="preload" as="image"
  href="/world/island.webp">` in `index.html`.
- [x] `plan.json` is 48 kB raw in the main bundle. Sample the sea contours
  every 3° instead of 2° if the coast still looks smooth, and report the
  gzipped size of the main bundle before and after this whole plan.

### B. The avatar everywhere

- [x] **Margin walker**: `src/components/hero/MarginCharacter.jsx`. Use the
  `.avatar-sprite` class at 32×48. Walk the "down" frames while the page
  scrolls down and the "up" frames while it scrolls up; settle on the
  standing "down" frame about 150 ms after scrolling stops. Remove the
  `scaleX` flip. Frame `i` of the strip is `background-position-x:
  ${(i / 15) * 100}%`. It stays `xl`-only and returns `null` under reduced
  motion.
- [x] **The game**:
  - `BootScene.js`: load `world/sprites/avatar.png` as the `char`
    spritesheet, `frameWidth: 16, frameHeight: 24`.
  - `Player.js`: real animations for the art path (`walk-<dir>` over that
    direction's four frames at 8 fps, idle on its first frame). Body
    `setSize(10, 6)`, `setOffset(3, 18)`. Remove the `flipX` logic and the
    stale header comment about the battler sprite. Keep the placeholder
    fallback.
  - `WorldScene.js`: player shadow `shadowTexture(12, 4)`.
  - Verify in a browser: WASD walks with the right facing, click-to-walk
    still routes around buildings, clicking a building opens its panel, the
    player draws in front of a door and behind a roof.
- [x] Once nothing references it, delete `public/world/char.png` and
  `src/components/layout/IslandDivider.jsx`. Leave `src/assets/` alone.

### C. Sheets: one header for every section

- [x] New `src/components/layout/SectionHeader.jsx`: a mono eyebrow
  (`SHEET 02 · A: WORKSHOP`), then the existing building sprite and `<h2>`,
  an optional right-aligned mono note, and a hairline. The letter is the
  same tag the hero plan uses, so the plan really is the page's index.
- [x] Add `sheet`, `tag` and `zone` to each entry in `sections.json`.

  | Sheet | Section | Tag | Sprite |
  |---|---|---|---|
  | 01 | Hero | - | - |
  | 02 | Work | A | workshop |
  | 03 | Experience | B | archive |
  | 04 | Skills | C | shed |
  | 05 | About ("General notes") | - | signpost |
  | 06 | Achievements, then Contact | D, E | shrine, tower |

- [x] Tighten `Section`: `py-16 md:py-24` instead of `py-24 md:py-32`. There
  are roughly 300 px blank gaps between sections today.

### D. Work

Featured cards become **figure plates**: a real image or diagram on top, a
caption row, then the text.

- [x] **Images**, converted to WebP into `public/projects/`. The sources are
  already collected (paths are in the scratchpad directory given in the
  agent brief):
  - *Osdag Web*: `osdag-conn.png`, the Connections page of the real
    frontend, served from the owner's local build in guest mode. About
    1440 px wide is enough.
  - *Arjun Guruji*: `play/s1.webp`…`s6.webp` (PNG data despite the
    extension) from the app's public Play Store listing. `s6` is a raw
    screenshot of the Books screen; `s4` and `s5` are listing graphics of
    the Astottara and Audio screens. Look at them and lay three side by
    side into one strip. Arrange only; do not redraw or retouch.
  - *Polkaflow*: `public/projects/polkaflow.png` exists.
- [x] **OpenLake has no UI**, so it gets a drawn pipeline instead. New
  `src/components/work/PipelineFigure.jsx` in the plan's line style, driven
  by a `figure` field in `projects.json`. Take the stages from the Mermaid
  diagram in `~/coding/openlake_project/Readme.md` (section 2), roughly:
  sources → ingest (batch copy, Redpanda) → process (PySpark, Structured
  Streaming) → store (Delta silver, dbt gold) → serve (Superset, churn
  model, reverse ETL to CRM, FastAPI). Read the README and use its names.
  It must stay legible at a 440 px card and on a phone.
- [x] **`ProjectCard.jsx`, featured variant**:
  1. Plate: 16:10, hairline border, `object-cover object-top` for landscape
     screenshots, `object-contain` for the phone strip. Clicking opens the
     full image, tracked as today (`project_link_click`, `type:
     'screenshot'`).
  2. Caption row: `FIG. 1` on the left, role tags on the right
     (`sde` → Software, `data` → Data, `civil` → Civil; labels in JSON).
  3. Title, result line, tagline.
  4. Stack chips: the first five or six entries of `stack`, small and mono.
  5. Links, as now.
- [x] **The other 21**: `ProjectExplorer.jsx`. Today "Show 21 more" opens a
  3,470 px single column. Make it an index: filter chips (All / Software /
  Data / Civil, with counts) from the `roles` field every project already
  has, and two columns of compact rows from `md` up. Move the hardcoded
  button copy into `sections.json`. Keep `more_projects_toggle`; call
  `ScrollTrigger.refresh()` after a filter change too.

### E. About (new)

Nav's "About" currently lands on Achievements. Make it a real section,
between Skills and Achievements. Achievements and Contact become their own
`Section`s after it.

- [x] `src/content/about.json` and `src/components/misc/About.jsx`.
- [x] **Left**: the portrait as a figure plate. `avatar_portrait.png` at 5×
  (160×240), `image-rendering: pixelated`, blinking every few seconds with a
  two-step CSS animation (still under reduced motion). Caption in mono.
- [x] **Right**: the bio, then numbered "general notes", the way a drawing
  lists them.
- [x] **Bio draft.** Tune the wording if it reads stiffly, but add no facts.
  The owner will rewrite it in his own voice, so say so in the final report.

  > I'm a civil engineering student at NITK Surathkal who has been shipping
  > software since 2021. It started with Arjun Guruji, a Flutter app I still
  > maintain that has passed 2,000 downloads. Today I lead the four-person
  > web team building Osdag, an open-source steel design tool at FOSSEE, IIT
  > Bombay.
  >
  > Civil engineering teaches you to check the load path before you trust
  > the drawing, and I work on software the same way. Before Osdag's web
  > version went to production I load-tested it at 200+ concurrent requests
  > with 20+ contributors, then wrote up the server configuration the
  > results supported.
  >
  > Lately I've been pulled toward data systems: OpenLake, a Spark and Delta
  > Lake platform that runs locally or on Azure from one codebase, and a
  > process-mining backend in Spring Boot.

  Notes:
  1. B.Tech in Civil Engineering with a minor in Electronics &
     Communication, NITK Surathkal, 2023 to present.
  2. Based in Mysuru, Karnataka.
  3. Two third-place hackathon finishes and an ETHGlobal selection.
  4. Looking for SDE roles for 2027.

### F. Small fixes while in there

- [x] **Achievements**: render the `links.github` and `links.demo` each
  hackathon already has in `achievements.json`.
- [x] **Heatmap caption**: it currently reads "0-day streak". Drop the
  streak when it is under 3 days.
- [x] **Tier-2 roles**: `CompactRoleList.jsx` never renders the `note` two
  of the roles carry. Show it under the role.

### G. Docs

- [x] `docs/HANDOVER.md`: repo layout, the content table (`site-plan.json`,
  `about.json`), the `/` composition in 5.1, the pipeline in 5.8 (avatar,
  `world:preview`, `world:plan`), analytics in 6 (`site_plan_toggle`; the
  `site_plan` source on `world_explore_click`; anything added for the
  filter), the player in 7.5, and the open items in 9.
- [x] `docs/IMPROVEMENTS.md`: tick the player character and the homepage
  mascot and banner items, and fix the top note.
- [x] `docs/project-selection.md`: the new media and figure fields.

### H. A drawn, animated figure for each featured project

Section D put a screenshot on each featured card. Change that: the plate
shows a **drawing** by default, and the screenshot becomes the "built" view.
This is the hero's idea again, at card size: the plan first, then the thing.

#### H.1 The plate

- [x] Each featured project gets a `figure` in `projects.json`:
  `{ "type": "...", "caption": "...", "labels": { ... } }`. Every word the
  drawing shows comes from `labels`.
- [x] `src/components/work/figures/`: one component per type and an
  `index.js` mapping `type` to component.
- [x] If the project also has a `screenshot`, the plate gets a small mono
  two-way switch in a corner, **Drawing | Built** (labels in JSON),
  cross-fading between the figure and the screenshot. In the Built view,
  clicking the image opens it full size, tracked as before. OpenLake has no
  screenshot, so it has no switch.
- [x] The caption row under the plate stays as planned: `FIG. 1` and the
  figure's caption on the left, role tags on the right.

#### H.2 Shared drawing rules

- **Inline SVG with CSS animation, not GIF.** A GIF would be heavy, blurry
  on high-density screens, and couldn't use the page's fonts and colours or
  stop for reduced motion.
- `viewBox="0 0 480 300"` (16:10). Paper background, with the hero's survey
  grid: a small cross every 60 units, faint.
- Hairlines with `vector-effect: non-scaling-stroke`. The rule at the end of
  `index.css` is scoped to `.site-plan [data-hair] *`; widen it to
  `[data-hair] *` and reuse it.
- Ink (`currentColor`) for structure, at three weights: about 0.85 for the
  object, 0.5 for secondary parts, 0.25 for construction lines. **Clay for
  the one thing that moves** and for centrelines (dash `9 4 2 4`, as on the
  plan). Moss only for a finished state. Cut material uses the same 45°
  hatch as the plan's buildings.
- Labels in Departure Mono, about 9–10 units, with leader lines ending in a
  dot, as on the hero.
- **Dimensions use symbols, not numbers** (`p`, `e`, `V`), so nothing reads
  as measured data that was made up.
- Animation: one loop of about 8 s per figure. Run it only while the plate
  is on screen (toggle `animation-play-state` from an
  `IntersectionObserver`). Write keyframes so the **last frame is the
  complete drawing**, with `animation-fill-mode: both`: the global
  reduced-motion rule then lands on a finished still. Avoid
  `stroke-dashoffset` draw-in on paths that have non-scaling strokes; it is
  unreliable there. Stage things with opacity, transforms and clip
  rectangles instead.
- Each figure must read at a 440 px card and at phone width. Check both.

#### H.3 The four figures

Compositions below are a starting point. Keep the facts and the labels;
improve the layout if a screenshot shows it needs it.

- [x] **Fig. 1, Arjun Guruji: `phone`. "Front elevation: what runs on the
  phone."**
  - A phone drawn in elevation at left-centre: rounded outline, inset
    screen, speaker slot.
  - On the screen, three bands of line art: a 2×2 shelf of book covers; four
    short lyric lines; an audio scrubber with a row of waveform bars.
  - Three leaders out to the right, one per band. Label text (facts from the
    card's tagline and stack): "Books stored on the device", "Lyrics in step
    with the audio", "Event notifications". A small bell sits by the third.
  - Motion: the playhead (clay) travels the scrubber once per loop; the
    lyric highlight (clay) steps down one line each quarter, in step with
    it; the waveform bars pulse, staggered; the bell rings once near the
    end.

- [x] **Fig. 2, Osdag Web: `base-plate`. "Column base plate, elevation and
  plan."** The résumé names Base Plate Connection as one of the modules he
  led, so draw that one, not a generic joint.
  - Elevation, left two-thirds: an I-section column standing on a base
    plate, on a hatched concrete pedestal, with anchor bolts running down
    into it. A weld mark where column meets plate. A clay centreline up the
    column axis. A load arrow labelled `P` bearing down on the column.
  - Plan, right third: the plate as a rectangle, the I-section in outline at
    its centre, four bolt holes at the corners, clay centrelines crossing.
  - Symbols only on the dimension lines: pitch `p`, edge distance `e`.
  - A three-step status strip in a corner, "queued · running · done": the
    card's tagline says calculations run asynchronously with live job
    updates.
  - Motion: the status strip advances; as it reaches "running" the four
    anchor bolts drop in one at a time (in both views together); at "done"
    the step turns moss and the dimension symbols appear. The `P` arrow
    presses down a few units and returns.

- [x] **Fig. 3, OpenLake: `pipeline`. "Batch and streaming paths, from the
  README."** This is the `PipelineFigure` already in section D; build it
  here, to these rules.
  - Left to right: two sources (a file, a live order stream) → ingest →
    process → the store drawn as three stacked layers (bronze, silver,
    gold) → three outputs (dashboards, churn model, CRM).
  - The batch path and the streaming path are two visibly separate lines
    that meet at the silver layer.
  - Take every node name from the Mermaid diagram in
    `~/coding/openlake_project/Readme.md`, section 2.
  - Motion: clay packets travel the batch line in slow, spaced groups and
    the stream line as a fast, continuous run; the three layers fill in
    turn.

- [x] **Fig. 4, Polkaflow: `flow`. "A flowchart on the left, a contract on
  the right."**
  - Left 60%: a canvas with four nodes labelled Trigger, Logic, Wallet and
    Contract (the node types in the existing screenshot), each a rounded box
    with port dots, joined by connectors.
  - Right 40%: a page of code drawn as bars of different lengths (no fake
    code text), under a label reading "Solidity → Rust · PolkaVM" (from
    `achievements.json` and the project's stack).
  - A "generate" arrow between the two.
  - Motion: a cursor glyph drags the last node into place; connectors appear
    in order; the arrow pulses (clay); the code bars fill in line by line.

### I. The margins: stones, trees and the creature

Today the margins hold pixel rocks, bushes and trees
(`src/components/layout/PageScatter.jsx`) and the old dark creature
(`MarginCharacter.jsx`). Both go. Under the page's own rule, pixel art is
for the built thing, so the only pixel art left in the margin is the avatar,
walking a **drawn road alignment**.

- [x] **Left margin: the alignment.** Replace the scatter with one tall SVG
  (document height, sized by the existing `ResizeObserver`):
  - A clay dashed centreline (`9 4 2 4`) running the full height at
    x = 48 px, which is the middle of the avatar.
  - A short tick across it every 100 px, and a mono chainage label every
    500 px in the usual form (`0+500`, `1+000`, …), faint.
  - A station marker where each section starts: the same lettered circle the
    hero plan uses (A–E), sitting on the line.
  - **As built**: the part of the line the avatar has already walked is
    solid ink, not dashed clay. Drive its length from the same
    `ScrollTrigger` update that moves the avatar (a CSS variable is enough).
- [x] **Right margin: planting.** Keep the seeded placement code, but draw
  the plan's symbols instead of sprites: a circle with a small cross for a
  tree, a dashed circle for a bush. Sparse, ink at low opacity. No rocks.
- [x] **The avatar** (this is section B's margin walker): as specified
  there. Make sure it sits exactly on the centreline.
- [x] Still `xl`-only, `aria-hidden`, `pointer-events: none`, hidden in
  print. Update the long comment in `PageScatter.jsx`; most of it is about
  sprite lanes that will no longer exist. Rename the file if the old name
  no longer fits, and update `App.jsx` and the docs.
- [x] **Find every remaining creature.** `grep -rn "char.png"` must come
  back empty outside `docs/`. Then look at `public/og-image.png`,
  `public/favicon.svg` and the icon PNGs. If the social image shows the
  creature or the old layout, regenerate it: a 1200×630 capture of the hero
  with the island fully built. Report what you found either way.

## 5. Checking the work

Run all of these before reporting.

1. `npm run lint`: no errors, no new warnings (there are 4 today).
2. `npm run build`: passes. Note the main bundle's gzipped size.
3. `npm run world:build`, then `git status`: map, atlas and tiles unchanged.
4. **Look at it.** Screenshot `/` top to bottom at 1440×900, 1280×720 and
   390×844, and open every screenshot. Then `/world`: spawn, walking in each
   direction, and one open panel on desktop and phone. Fix what looks wrong,
   and re-shoot.
5. Reduced motion (`reducedMotion: 'reduce'` in the browser context): the
   hero shows its opening patch with the avatar standing still; nothing is
   stuck invisible.
6. No console errors. A 404 for `/_vercel/insights/script.js` is expected
   locally.

7. **Figures and margin** (H, I):
   - Each figure: screenshots at the start, middle and end of its loop, at
     desktop card width and at 390 px.
   - The same figures under reduced motion: each shows a complete drawing.
   - The margin at 1280 and 1440 wide, at three scroll positions: the avatar is
     on the line, the solid part ends at his feet, nothing touches the content
     column.

Out of scope: the `/world` panels, sound, day and night, the 404 page.
