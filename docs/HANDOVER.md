# Portfolio handover

This covers the whole repo: the scrolling portfolio at `/` and the explorable pixel island at `/world`. Read it before changing anything. `prompt.md` has the original build spec. Where this doc and the spec disagree, the code has moved on and this doc describes the code as it is now.

- **Live:** https://sogalabhi.vercel.app (Vercel)
- **Owner:** Abhijith Sogal V (`sogalabhi`)
- **Status:** `/` and `/world` both ship. The home page is a drawing set (see `docs/LANDING-PLAN.md`): the hero is a site plan of the island that builds itself, every section is a numbered sheet, the featured projects (a set per role, SDE or AI Engineer) are animated line-drawing plates, and the avatar walks a road drawn down the left margin. `/world` uses the same avatar, with a real walk cycle.

---

## 1. Quick start

```bash
npm install
npm run dev        # Vite dev server
npm run build      # production build → dist/
npm run preview    # serve the built dist/
npm run lint       # oxlint
```

You need Node 20+. Vite 8 and sharp both need a recent Node. There are no tests and no CI. `vercel.json` rewrites every path to `index.html` so client-side routing works.

## 2. Stack

| Concern | Choice | Notes |
|---|---|---|
| UI | React 19 + Vite 8 | No TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | Design tokens are in the `@theme` block of `src/index.css`. There is no `tailwind.config.js` |
| Motion | GSAP 3 + ScrollTrigger + ScrollToPlugin | Registered once in `src/lib/gsap.js` |
| Game | Phaser 4 (Arcade physics) | Lazy-loaded, so only `/world` downloads it |
| Routing | react-router-dom v7 | Routes: `/`, `/world`, `*` (404) |
| Icons | lucide-react | Brand icons are in `components/misc/BrandIcons.jsx` |
| Analytics | `@vercel/analytics` | Custom events are listed in §6 |
| Asset tooling | sharp + free-tex-packer-core | Dev-only, under `scripts/assets/` |

The spec named React 18, Tailwind 3, Phaser 3 and Bricolage/JetBrains Mono. The code now uses React 19, Tailwind 4, Phaser 4, **Newsreader** (display), **Inter** (body) and **Departure Mono** (mono, self-hosted in `public/fonts/`). Go by the code.

## 3. Repo layout

```
index.html              SEO/OG/JSON-LD meta, font links, scrollRestoration=manual
prompt.md               original build spec (historical)
vercel.json             SPA rewrite
src/
  main.jsx, App.jsx     router + the Home page composition
  index.css             Tailwind @theme tokens, fonts, base styles
  content/*.json        ALL displayed copy (the single source of truth)
  components/           `/` page components (layout, hero, work, skills, exp, misc)
  components/work/figures/  the animated project drawings (one per figure type)
  hooks/                useGsapReveal, useReducedMotion, useGithubContributions
  lib/gsap.js           GSAP plugin registration + reduced-motion defaults
  lib/fill.js           fills "{name}" slots in JSON copy
  world/                everything for /world (Phaser + React overlay)
  world/data/plan.json  the island as a site plan, for the hero (generated, §5.8)
scripts/assets/         sprite pipeline (see §5.8)
scripts/world/          terrain tileset + island map generators (see §7.4)
assets/cut/             intermediate sliced sprites + manifests (pipeline output)
assets/pixel/           art authored in code: text-grid sprites (rocks, the avatar)
assets/svg/             those grids as SVGs (build output, also usable on `/`)
public/
  world/sprites/*.png   individual sprites (also reused by `/` for decoration)
  world/atlas/          packed atlas.png + atlas.json that Phaser loads
  world/map/island.json the island, Tiled format (generated; editable in Tiled)
  world/tiles/          terrain.png ground tileset + water.png animation strip
  world/sprites/avatar.png, avatar_portrait.png   the avatar (kept out of the atlas)
  world/island.webp     the island rendered flat, for the hero's site plan
  projects/             the Work plates' "Built" images (WebP)
  fonts/                Departure Mono + license
  og-image.png, favicons, robots.txt, sitemap.xml, site.webmanifest
```

## 4. Main rule: content lives in JSON

Every visible string comes from `src/content/*.json`. Components don't hardcode copy. Both `/` and `/world` read the same files, so if you edit one JSON file, both surfaces update.

| File | Feeds |
|---|---|
| `profile.json` | Name, tagline, availability pill, email, links (GitHub/LinkedIn/résumé), and the 4-stat title block |
| `site-plan.json` | The hero's site plan: the hint, the build button, the key, the title block, and the six lettered labels (zone, tag, name, section, link) |
| `projects.json` | Projects. which ones are plates, and in what order, is set per track in `sections.json` → `work.tracks`; `roles` drives the index filter. Featured ones carry a `figure` (`type`, `caption`, `labels`: every word the drawing shows) and may carry a `screenshot` (`src`, `alt`, `width`, `height`, `fit`, `caption`) for the "Built" view. Links: `github`, `live`, `demo`, `playStore`. See `docs/project-selection.md` |
| `about.json` | The About sheet: portrait figure, the bio paragraphs, the numbered general notes |
| `experience.json` | `tier1` (timeline cards) and `tier2` (compact role list) |
| `education.json` | Education block, plus the Archive zone in the game |
| `skills-summary.json` | Four curated skill rows on `/` |
| `skills.json` | Complete skills list for the Garden zone; `skillsForRole` accepts string and role-tagged entries |
| `achievements.json` | `summary` and `hackathons[]` for `/` Achievements and the Shrine zone |
| `sections.json` | Each section's sheet header (`heading`, `sheet`, `tag`, `zone` sprite, `zoneName`, `note`), the Work card and index copy, the role labels, the heatmap and contact strings, and the 404 page copy |
| `nav.json` | Nav items, button labels, the corner "Explore my world" pill |

**Watch out for what gets rendered.** `experience.json` `tier1[].note` shows publicly under the card (`TimelineCard.jsx`) and `tier2[].note` under the role in the expanded list (`CompactRoleList.jsx`), so never put a note-to-self in either. Hackathon `links.github` and `links.demo` render on `/`. Fields that are *not* rendered anywhere today: project `date` and `myRole`, and hackathon `date`, `myRole` and `links.devpost`. An empty string hides optional fields like `impact` and `links.*`.

Unfinished copy used to be marked with the literal `NEEDS_INPUT`, and none is left. `Achievements.jsx` and `CompactRoleList.jsx` still guard against it, so it's safe to use again as a marker, but most components would render it as-is.

---

## 5. The landing page (`/`)

### 5.1 Composition

The page is a drawing set: each section is a sheet, and the pixel island is the thing the drawings describe. Line drawing explains; pixel art is the built thing. `docs/LANDING-PLAN.md` has the full brief.

`App.jsx → Home` renders these in order:

1. Skip link, then `Nav` (sticky, turns solid on scroll, mobile overlay menu, Résumé and Explore buttons)
2. `MarginAlignment` (xl only): a road alignment drawn down the left margin (clay centreline, chainage every 500 px, a lettered station at each section) with `MarginCharacter`, the avatar, walking it as the page scrolls; the stretch he has walked is drawn solid. Plan-style planting symbols down the right margin.
3. `Hero` (sheet 01, `#hero`, with `#world-banner` on the sheet itself): the intro on the left, `SitePlan` on the right, and `StatStrip` as the title block. `SitePlan` draws the island as a site plan (`src/world/data/plan.json`) and builds it, tile by tile, from `public/world/island.webp` around the avatar as he walks the paths and under the visitor's pointer or tap. Its six lettered labels (A–F) link to the sections and `/world`; below `sm` they shrink to their letters and a key lists them under the drawing.
4. Every section after it opens with `SectionHeader`: `SHEET 02 · A: WORKSHOP`, the building sprite, the heading, an optional note, a rule. The letters match the site plan's.
5. `#work` (sheet 02): the role switch and its featured figure plates, then the index (§5.9)
6. `#experience` (03): `TimelineCard` (at most two bullets per organisation), `CompactRoleList` (tier 2, with notes), `EducationBlock`
7. `#skills` (04): `SkillsSummary` with four `SkillGroup` rows, then `GithubHeatmap` (the streak shows only from 3 days)
8. `#about` (05, "General notes"): `About`, the pixel portrait as a figure plate (blinking every few seconds), the bio and numbered notes
9. `#achievements` (06, D): hackathons with their code and demo links
10. `#contact` (06, E)
11. `Footer` and `WorldMiniBanner`

`ScrollProgressBar`, `KeyboardShortcuts` and `<Analytics/>` sit outside the routes, so they appear on every page.

### 5.2 Design tokens

These live in the `src/index.css` `@theme` block and are used as Tailwind classes (`bg-paper`, `text-clay`, and so on). Dark is the default theme: `index.html` sets `data-theme` before paint, `ThemeToggle` flips and stores it, and the `:root[data-theme="dark"]` block overrides the variables. Print is always light.

| Token | Light | Dark |
|---|---|---|
| `ink` | `#10262B` | `#E7F1F2` |
| `paper` | `#FFFFFF` | `#0C171A` |
| `clay` (the accent, island water) | `#5EA9B3` | `#6FC0CB` |
| accent text | `#2B737E` | `#83CDD7` |

Fonts are Bricolage Grotesque (display) and Figtree (everything else).

### 5.3 Motion

- `useGsapReveal({ stagger, y, selector='[data-reveal]' })` returns a ref. Children marked `data-reveal` fade and slide up once, at `top 85%`. It checks whether an element is already past the trigger line on a hard refresh, so nothing gets stuck invisible.
- `lib/gsap.js` sets every GSAP duration to 0 under `prefers-reduced-motion`. `index.css` also removes CSS transitions in that case.
- `index.html` forces `history.scrollRestoration = 'manual'` so reveals behave the same on every load. `App.jsx` calls `ScrollTrigger.refresh()` after fonts and `load` finish.
- The project figures and the site plan are CSS/canvas, not GSAP. Each figure loop is written so its first and last frames are the finished drawing; under reduced motion the global rule in `index.css` collapses it to that last frame. The site plan shows its opening patch with the avatar standing; the margin walker is not rendered at all.

### 5.4 Guided tour removal

The guided tour, its content, context, controller, and `T` shortcut have been
removed. The hero's secondary action links directly to `/world`.

### 5.5 Keyboard shortcuts (`/`)

| Key | Action |
|---|---|
| `R` | Download the résumé |
| `?` | Show or hide the shortcuts dialog |
| `Esc` | Close the dialog |

Shortcuts are ignored while you're typing in a field or holding a modifier key.

### 5.6 GitHub heatmap

`useGithubContributions` gets the GitHub username from `profile.links.github` and fetches `https://github-contributions-api.jogruber.de/v4/<user>?y=last`. That's a third-party, unauthenticated API. The hook caches the result in localStorage for 24 h and computes weeks, total and streak. If the API fails, the heatmap hides itself (status `hidden`; the Garden zone shows "The field is resting.") and the rest of the page still works. Both the Skills section and the Garden zone use this hook.

### 5.7 SEO and meta

`index.html` holds the title, description, canonical URL, OG/Twitter cards (`/og-image.png`, 1200×630) and Person JSON-LD. `/world` injects `noindex, follow` plus a canonical tag pointing back to `/`, so search engines don't see duplicate content.

### 5.8 Asset pipeline

This is shared with `/world`. For the full walkthrough see `scripts/assets/README.md`.

**Where the art comes from:**
- **Generated art** (buildings, props, trees): sheets are made outside this repo (Gemini), then processed with `process`, `slice`, renaming by hand, and `downscale`/`batch-downscale` (target sizes are in `sizes.mjs`).
- **Art authored as code**: text grids in `assets/pixel/*.mjs` become SVGs in `assets/svg/` and then PNGs (`npm run assets:pixel`). A hand-written SVG in `assets/svg/` works too (`npm run assets:svg`). The avatar is one of these: `assets/pixel/avatar.mjs`, drawn from the owner's photo, writes `avatar.png` (16 frames of 16×24: down, left, right, up, four each) and `avatar_portrait.png` (2 frames of 32×48: eyes open, blink). Both are kept out of the atlas (`pack-atlas.mjs`); its extra colours are `EXTRA_HEX` in `palette.mjs`.

**Rebuilding:** `npm run world:build` rebuilds everything downstream of the sprite PNGs, in order:
1. the code-authored sprites
2. the roof colours (`assets:roofs`)
3. the atlas (`assets:pack`)
4. the ground tileset and water (`world:terrain`)
5. the island map (`world:map`)
6. the flat render of the island for the hero, `public/world/island.webp` (`world:preview`, `scripts/world/build-preview.mjs`; draws what `WorldScene` draws, in the same order)
7. the site plan data, `src/world/data/plan.json` (`world:plan`, `scripts/world/build-plan.mjs`; coast, contours, paths, footprints and planting in world px, so the linework sits exactly over the render)

`scripts/world/shape.mjs` holds the geometry the map, the preview and the plan share, so they can't drift apart. It's deterministic: two runs give identical files (`sha256sum public/world/map/island.json` is in `docs/LANDING-PLAN.md` §2).

**The Work images** in `public/projects/` are WebP conversions of real screenshots, arranged but never retouched: Osdag Web's Connections page from a local build, three screens from the Arjun Guruji Play Store listing side by side, and the Polkaflow canvas.

**Gotcha:** `batch-downscale` regenerates `public/world/sprites/` from the Gemini cut-outs. That overwrites the per-building roof colours and the redrawn rocks, so run `npm run world:build` after it.

### 5.9 Work: figure plates and the index

- **Plates** (`ProjectCard.jsx`): each featured project shows a figure plate (16:10) with `FIG. n` over it, its caption and role tags under it, then title, result, tagline, the first six stack entries and links. The plate shows the project's drawing (`figure.type` → `components/work/figures/index.js`); a project that also has a `screenshot` gets a **Drawing | Built** switch on the plate's top edge, cross-fading to the real image, which opens full size on click.
- **Figures** are inline SVG on a shared `Drawing` sheet (480×300, survey grid, hatch, hairlines that don't scale), animated in CSS (`figures.css`) on an 8 s loop that runs only while the plate is on screen and in the Drawing view. Dimensions are symbols (`p`, `e`, `P`), never numbers. Phone (Arjun Guruji), base plate (Osdag Web), pipeline (OpenLake, names from its README) review (BriefForge) process (Process Mining), monitor (SysSight) and retrieval (RAG assistant). The pipeline (OpenLake) and flow (Polkaflow) drawings are kept for projects that are not featured now.
- **The index** (`ProjectExplorer.jsx`): every non-featured project behind a toggle, as a register of compact rows (two columns from `md`), filterable by role with counts. Filtering refreshes ScrollTrigger.

---

## 6. Analytics events

These are sent with `track()` from `@vercel/analytics`:

| Event | Props | Fired from |
|---|---|---|
| `world_explore_click` | `source`: `hero`, `nav`, `nav_mobile`, `site_plan`, `mini_banner` | Every link to `/world` (`site_plan` is the Terminal label and its key entry) |
| `resume_download` | `source`: `nav`, `nav_mobile`, `hero`, `contact`, `keyboard_shortcut`, `world_terminal` | Every résumé link |
| `project_link_click` | `project`, `type`: `github`/`live`/`screenshot` | `ProjectCard` (`screenshot` is a click on a plate's Built image) |
| `more_projects_toggle` | `expanded`: boolean | Opening or closing the project index |
| `track_switch` | `track`: `sde`/`ai` | The Work section's role switch (also set by `?role=`) |
| `theme_switch` | `theme`: `light`/`dark` | `ThemeToggle` in the nav |
| `project_filter` | `role`: `all`/`sde`/`civil` | The index's role filter |
| `site_plan_toggle` | `built`: boolean | The hero's "Build it all" / "Back to the drawing" button |
| `contact_email_click` | `method`: `copy`/`mailto` | `Contact` |
| `world_zone_open` | `zone`: zone id; `source`: `keyboard`, `prompt`, `click`, `tap`, `menu` | `WorldOverlay` (the single handler for every zone open in `/world`) |

When you add a new entry point to an existing action, give it a new `source` value rather than a new event name.

---

## 7. The game (`/world`)

### 7.1 Concept

A small top-down pixel island. You walk up to a building and interact with it to open a panel that shows the same portfolio content. The game is optional: `/` never depends on it, and the game offers a way back to `/` at every stage (loading screen, nav, edge-case notice).

### 7.2 Architecture

```
WorldPage.jsx  (React, lazy route)
 ├─ creates Phaser.Game(makeConfig)  ── scenes: BootScene → WorldScene
 ├─ <WorldOverlay/>  React UI layered over the canvas
 └─ bus.js  ◄──── the ONLY channel between Phaser and React ────►
```

Phaser owns the world: map, player, collisions, camera and zones. React owns every piece of UI: panels, prompts, labels, menus and the terminal. The two sides only talk through events on `bus` (a `Phaser.Events.EventEmitter`):

| Event | Direction | Payload | Meaning |
|---|---|---|---|
| `boot:progress` | Phaser → React | `0..1` | Loading bar |
| `world:ready` | Phaser → React | none | Hide the loader and mount the overlay |
| `zone:enter` / `zone:exit` | Phaser → React | `{id}` | Player walked into or out of a zone |
| `world:promptPos` | Phaser → React | `{id,x,y}` | Screen position for the "E" prompt (throttled to ~15 Hz) |
| `world:zoneLabels` | Phaser → React | `[{id,title,x,y}]` | Screen positions for all 7 labels (throttled to ~15 Hz) |
| `zone:interact` | either way | `{id, source}` | Open that zone's panel. `source` says how it was opened and feeds the `world_zone_open` analytics event |
| `world:pauseInput` | React → Phaser | `bool` | Freeze the player and release captured keys while a panel is open |
| `world:teleport` | React → Phaser | `{id}` | Jump the player to a zone (terminal `cd`, touch menu) |
| `world:sheetFull` | React → Phaser | `bool` | The bottom sheet covers the canvas, so sleep the game loop |

In dev builds, `window.__worldBus` and `window.__worldScene` are exposed for poking at from the console.

### 7.3 Boot and assets (`BootScene.js`)

- BootScene loads:
  - the island map (`world/map/island.json`, key `island`)
  - the ground tileset (`world/tiles/terrain.png`) and the water strip (`world/tiles/water.png`, 3 frames of 32 px)
  - the sprite atlas (`world/atlas/atlas.{png,json}`, key `objects`) and the avatar, `world/sprites/avatar.png`, as the `char` spritesheet (16×24 frames)
- The loading bar follows the loader's real progress.
- BootScene also draws **placeholder textures at runtime**: a coloured-box player with a 4×4 walk cycle, and a coloured rectangle for each building. If the atlas or the avatar 404s, the game falls back to those. `resolvePropTexture()` in `WorldScene` and `Player`'s `usingCharArt` check pick whichever texture is available. The map and tiles have no fallback.

- The island is a **Tiled-format map**, `public/world/map/island.json`: 80×56 tiles at 16 px, so 1280×896 world px.
  - `scripts/world/build-map.mjs` generates it from the design in `scripts/world/layout.mjs`: the island shape, plaza, building positions, path waypoints, props and scatter settings.
  - You can also open it in the free Tiled editor and edit it by hand. Regenerating overwrites hand edits, so pick one way per change.
- **Terrain is corner-based.** Each grid vertex is one of: water, sand, grass, path, stone.
  - Every level above water is its own overlay tile layer (`sand`, `grass`, `path`, `stone`), drawn bottom to top over animated water. The tileset has 15 edge tiles per overlay, plus variants.
  - The tileset is drawn procedurally by `scripts/world/build-terrain.mjs`. Its layout lives in `terrain-spec.mjs`.
  - It also carries Tiled "wang sets", so Tiled's terrain brush paints the right edges.
  - A hidden `collision` layer blocks every tile that touches water.
- **Object layers**:

  | Layer | Contents |
  |---|---|
  | `zones` | One point per zone id, at the building's base-centre |
  | `props` | The placed props (point name = atlas frame) |
  | `scatter` | Trees, bushes, rocks and flowers, seeded, so the same island every build |
  | `markers` | `spawn` |

- `zones.js` holds per-building data the map can't express:
  - `frame`: the atlas frame
  - `depth`: how far back from the base the building is solid
  - `solidW`: optional collision width
  - `doorDx`: the door's offset from the map point

  `WorldScene.resolveZone()` measures the drawn art at runtime and derives everything else. Atlas frames are trimmed, so the drawn box can be smaller than the frame. For a new zone, also update `PROP_BY_ZONE` in `WorldScene.js` and the UI (`ZONE_TITLES` and `CONTENT_BY_ZONE` in `ZonePanel.jsx`, and `DESTINATIONS` in `ZoneMenu.jsx`).

| Zone | Building sprite | Shows | Content source |
|---|---|---|---|
| `spawn` | signpost | Welcome: tagline, stats, résumé | `profile.json` |
| `workshop` | workshop | Projects (all, sorted) | `projects.json` |
| `garden` | shed | Skills and the GitHub "crop field" heatmap | `skills.json`, heatmap hook |
| `archive` | archive | Experience (tier 1) and education | `experience.json`, `education.json` |
| `shrine` | shrine | Hackathons | `achievements.json` |
| `tower` | tower | Contact | `profile.json` |
| `terminal` | terminal_desk | Fake shell (see 7.7) | `Terminal.jsx` |

### 7.5 Player and zones

- `Player.js`: moves at 130 px/s. You can steer with WASD or the arrow keys (diagonal movement is normalised), or click/tap to walk somewhere.
  - Click/tap moves follow a route of waypoints (`moveAlong`) from the pathfinder, described below.
  - The player gives up if it's stuck for 300 ms, and in that case `onArrive` does **not** fire.
  - The avatar has a walk cycle per direction (`walk-<dir>`, its four frames at 8 fps) and an idle on each direction's first frame. Its body is the feet: 10×6 at offset (3, 18). The placeholder texture uses the same animation keys.
- **Draw order** (the `DEPTH` constants in `WorldScene.js`), bottom to top:
  1. water
  2. the ground overlays
  3. flat props (soil beds)
  4. footprints
  5. shadows
  6. everything standing, sorted by where it meets the ground

  The player's depth is its feet (`body.bottom`); buildings, props and scatter use their drawn base. So the player draws in front of a building at its door and behind it when walking past its roof.
- **Shadows**: every standing sprite gets a flat pixel-ellipse shadow at its base. They're drawn on a canvas (`shadowTexture`) and cached per size, so they stay crisp. The player's shadow follows it.
- **Collision** has three sources:
  - the `collision` tile layer at the water's edge
  - a static box along each building's base (`resolveZone().solid`); the roof above it stays walk-behind
  - a box at the trunk or feet of each prop and scatter item (`SOLID_BY_FRAME`); flowers are walk-through
- **Footprints** only appear on sand and dirt (`surfaceAt()` finds the topmost ground overlay under a point).
- **Triggers**: each zone's trigger is a strip in front of its **door**, not the building itself.
  - `Zone.js` (ZoneManager) checks the player's position against those strips once per render frame.
  - It deliberately doesn't use Arcade overlap callbacks. Phaser 4's fixed-step physics can fire those 0 or 2+ times per frame, which made the prompt flicker.
- **Click/tap routing** (`pathfinding.js`): A* on the 16 px tile grid.
  - It avoids the collision tiles and the same boxes the colliders use, grown by the player's body size plus 3 px of clearance, then string-pulled into a few straight segments.
  - Clicking or tapping a building (its drawn art or the strip in front of its door) walks to the door and opens the zone on arrival, from any side.
  - Teleports (terminal `cd`, the touch menu) also park the player at the door (`walkTo`), never inside the walls.

### 7.6 Input and device modes

`useDeviceMode()` returns `'touch'` only when the device has a coarse pointer **and** the viewport is ≤ 900 px wide. Everything else, including touch laptops and landscape iPads, counts as `'pointer'`. The mode is read **once** at boot and stored in the Phaser registry, so rotating the device doesn't change the input style.

**Zoom is always a whole number**, and it's re-picked on every resize (`pickZoom` in `WorldScene.js`). A zoom like 1.5 draws art pixels unevenly. The zoom is the larger of these two:
- about 320 world px visible vertically
- the smallest zoom at which the map still covers the whole viewport, so there's never empty space past the map edge

Some examples:

| Viewport | Zoom |
|---|---|
| 1280×800 laptop | 2 |
| Phone | 2 |
| 1080p screen | 3 |
| 1440p screen | 4 |

| | Pointer (desktop) | Touch (phone) |
|---|---|---|
| Camera zoom / lerp | Whole-number zoom (see above) / 0.1 | Same zoom / 0.15, follow offset +40 px |
| Move | WASD / arrows / click | Tap |
| Open zone | Walk to the door, then `E` / `Space` / `Enter` (floating prompt), or click the building | Tap the building. The player walks to its door and it opens on arrival (hit area padded by 20 px) |
| Panel | `ZonePanel`: right-side dialog, `Esc` closes | `BottomSheet`: draggable, snaps at 45/85/96%, flick or drag below 20% to dismiss |
| Jump anywhere | Terminal `cd <zone>` | `ZoneMenu` (☰): teleports, then opens the zone after 400 ms |
| Hint | "WASD or click to move · E to interact" | Tap-to-move copy. Any tap dismisses it |

The first-visit hint stores `world-hint-seen` in localStorage.

**Key-capture gotcha:** Phaser calls `preventDefault` on the keys it registers (WASD, arrows, E, Space, Enter) for the whole page. That would stop you typing into the terminal. `WorldScene` therefore removes the capture whenever `pauseInput` is true and adds it back afterwards. Any new text input rendered over the canvas has to emit `PAUSE_INPUT` for the same reason.

**HUD gotcha:** give any new fixed control over the canvas a `data-world-hud` attribute. `ZoneLabels` fades out any label that would sit under a HUD element, so without the attribute, labels slide underneath the control.

### 7.7 Terminal zone

`ui/Terminal.jsx` is a fake shell. It supports:

- **Commands:** `help`, `whoami`, `ls` (lists zones), `cd <zone>` (teleports), `cat resume` (downloads the résumé and tracks it), `contact`, `clear`, and `sudo hire-me` (an easter egg with confetti)
- **Editing:** Tab completion that knows each command's arguments, and command history
- **Touch:** tappable command chips, because typing on a phone is a pain

### 7.8 Performance and robustness

- The game loop **sleeps** while the tab is hidden or the bottom sheet is at ≥ 90%, and wakes once neither is true.
- Resizing uses `Scale.NONE` with a debounced (150 ms) manual `scale.resize()` based on `visualViewport`. This avoids jank while the iOS Safari toolbar animates. Don't switch it to `Scale.RESIZE`.
- `EdgeCaseNotice` appears when the viewport is under 340 px or the frame rate stays below 30 fps for 5 s or more. It offers a way back to the portfolio but never redirects on its own.
- `RotatePrompt` asks phone users in landscape (height under 500 px) to rotate to portrait. It can be dismissed.
- Reduced motion turns off camera lerp (the camera snaps), footprints and the water animation.
- The scene has about 650 display objects: the tile layers, roughly 230 scatter sprites, shadows and physics blocks. In a CPU-only headless browser it ran at about 32 fps, which is enough to trip the low-fps notice now and then. Real GPUs aren't expected to notice, but check a low-end phone.
- The world loads the Press Start 2P font on demand and removes it on unmount.

---

## 8. Common tasks

| Task | Where |
|---|---|
| Change any copy | `src/content/*.json` only |
| Add a project | Append to `projects.json` with a unique `id`, then set `order`, and add it to a track to feature it |
| Edit the home page's skill shortlist | `src/content/skills-summary.json`; keep four groups |
| Change colours or fonts | The `@theme` block in `src/index.css`, and the font links in `index.html` |
| Move a building | `BUILDINGS` (and its path's waypoints in `PATHS`) in `scripts/world/layout.mjs`, then `npm run world:map`. Collision, triggers, labels and routing follow automatically |
| Add or move a prop | `PROPS` in `layout.mjs`, then `npm run world:map`. The generator warns if a prop lands on a path, a building or the water. Give it collision in `SOLID_BY_FRAME` (`WorldScene.js`) |
| Change the island's shape or scatter | `ISLAND` and `SCATTER` in `layout.mjs`, then `npm run world:map` |
| Change ground or water colours | `EXTRA_HEX` in `scripts/assets/palette.mjs`, then `npm run world:terrain` |
| Add a new zone | `zones.js`, plus `layout.mjs` (`BUILDINGS`, `PATHS`), `PROP_BY_ZONE` in `WorldScene.js`, `ZONE_TITLES`/`CONTENT_BY_ZONE` in `ZonePanel.jsx` and `DESTINATIONS` in `ZoneMenu.jsx` |
| Draw a sprite in code | Add a grid module in `assets/pixel/` (see `rocks.mjs`), then `npm run world:build` |
| Replace or add sprites | Follow the §5.8 pipeline, then `npm run world:build` |
| Change the avatar | `assets/pixel/avatar.mjs`, then `npm run world:build`. `Player.js`, the hero and the margin walker all read the same strip |
| Add a project figure | A component in `src/components/work/figures/` built on `Drawing`, keyframes in `figures.css` (first and last frame = the finished drawing), an entry in `figures/index.js`, and a `figure` in `projects.json` |
| Add a terminal command | Update `COMMANDS`, `HELP_LINES`, the `switch` and, optionally, `CHIP_COMMANDS` in `Terminal.jsx` |

---

## 9. Open items

- **The résumé** lives at `public/resume.pdf`. Every résumé link (nav, hero, contact, `R`, terminal `cat resume`) points there, so replace that file to update it. It's a LaTeX export, and the printed LinkedIn text on it is missing `/in/` (the clickable link is correct).
- **Content details still open**: two impact numbers, hackathon roles, a few experience numbers and guessed dates. The full list is in `docs/IMPROVEMENTS.md` §1.2.
- **The bio** in `about.json` is a draft in the owner's facts but not his voice; he means to rewrite it.
- **The Work images** can be swapped for better ones (same paths, or new `screenshot` entries in `projects.json`).
- **Figure labels on a phone** are about 8 px tall: legible on a high-density screen, small on a low one.
- **The Archive zone** shows only org and period for each role. `/` shows much more detail there.
- **`README.md`** is still the default Vite template. Replace it or point it at this doc.
- **No tests or CI.** Before you push, run `npm run build` and `npm run lint`, then check `/` and `/world` at phone width by hand.
