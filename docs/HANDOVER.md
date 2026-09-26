# Portfolio handover

This covers the whole repo: the scrolling portfolio at `/` and the explorable pixel island at `/world`. Read it before changing anything. `prompt.md` has the original build spec. Where this doc and the spec disagree, the code has moved on and this doc describes the code as it is now.

- **Live:** https://sogalabhi.vercel.app (Vercel)
- **Owner:** Abhijith Sogal V (`sogalabhi`)
- **Status:** `/` and `/world` both ship. The content is filled in from the résumé; a few details are still open (see `docs/IMPROVEMENTS.md` §1.2). The planned game improvements are in the same doc.

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
  hooks/                useGsapReveal, useTour + TourContext, useReducedMotion, useGithubContributions
  lib/gsap.js           GSAP plugin registration + reduced-motion defaults
  world/                everything for /world (Phaser + React overlay)
scripts/assets/         sprite pipeline (see §5.8)
assets/cut/             intermediate sliced sprites + manifests (pipeline output)
public/
  world/sprites/*.png   individual sprites (also reused by `/` for decoration)
  world/atlas/          packed atlas.png + atlas.json that Phaser loads
  world/char.png        player sprite
  fonts/                Departure Mono + license
  og-image.png, favicons, robots.txt, sitemap.xml, site.webmanifest
```

## 4. Main rule: content lives in JSON

Every visible string comes from `src/content/*.json`. Components don't hardcode copy. Both `/` and `/world` read the same files, so if you edit one JSON file, both surfaces update.

| File | Feeds |
|---|---|
| `profile.json` | Name, tagline, availability pill, email, links (GitHub/LinkedIn/résumé), and the 4-stat strip |
| `projects.json` | Projects. `featured: true` puts one in the big cards and `order` sorts them. Links: `github`, `live`, `demo`, `playStore` |
| `experience.json` | `tier1` (timeline cards) and `tier2` (compact role list) |
| `education.json` | Education block, plus the Archive zone in the game |
| `skills.json` | `[{ group, skills[] }]` for `/` Skills and the Garden zone |
| `achievements.json` | `summary` and `hackathons[]` for `/` Achievements and the Shrine zone |
| `sections.json` | Section headings and the 404 page copy |
| `nav.json` | Nav items and button labels |
| `tour.json` | Guided-tour stops (`target` is a CSS selector on the page) |

**Watch out for what gets rendered.** `experience.json` `tier1[].note` shows publicly under the card (`TimelineCard.jsx`), so never put a note-to-self there. Fields that are *not* rendered anywhere today: project `date` and `myRole`, and hackathon `date`, `myRole` and `links`. An empty string hides optional fields like `impact` and `links.*`.

Unfinished copy used to be marked with the literal `NEEDS_INPUT`, and none is left. `Achievements.jsx` and `CompactRoleList.jsx` still guard against it, so it's safe to use again as a marker, but most components would render it as-is.

---

## 5. The landing page (`/`)

### 5.1 Composition

`App.jsx → Home` renders these in order:

1. Skip link, then `Nav` (sticky, turns solid on scroll, mobile overlay menu, Résumé and Explore buttons)
2. `PageScatter`: pixel trees, rocks and flowers placed deterministically down both margins
3. `MarginCharacter`: a `position: fixed` sprite that walks down the left margin as the page scrolls (scrubbed by ScrollTrigger; disabled under reduced motion)
4. `Hero`: availability pill, name, tagline, CTAs, the tour launcher (`data-tour-start`) and `StatStrip`
5. `IslandDivider`: a large pixel-art banner that links to `/world` (`#world-banner`)
6. `#work`: `FeaturedCard` × featured projects, then `ProjectGrid` for the rest
7. `#skills`: `SkillGroup` per group, then `GithubHeatmap`
8. `#experience`: `TimelineCard` (tier 1), `CompactRoleList` (tier 2), `EducationBlock`
9. `#about`: `#achievements` then `#contact`
10. `Footer`, `WorldMiniBanner` and `TourController`

`ScrollProgressBar`, `KeyboardShortcuts` and `<Analytics/>` sit outside the routes, so they appear on every page.

Each section heading uses a `/world` building sprite as its icon (`SectionIcon`): workshop for Work, shed for Skills, archive for Experience and shrine for Achievements. This ties the two surfaces together visually.

### 5.2 Design tokens

These live in the `src/index.css` `@theme` block and are used as Tailwind classes (`bg-paper`, `text-clay`, and so on):

`ink #1C1B19` · `slate #5A574F` · `faint #8B8780` · `paper #FAF7F0` · `card #FFF` · `line #E4DFD4` · **`clay #C4552E` (the one accent)** · `moss #4A7C4E` · `sand #E8DCC4`

Two game colours are also available as rare accents: `panel #2B2438` (the footer) and `teal #87C5C2`. Cards use borders instead of shadows, and a shadow appears only on hover. Keep clay under about 5% of any screen.

### 5.3 Motion

- `useGsapReveal({ stagger, y, selector='[data-reveal]' })` returns a ref. Children marked `data-reveal` fade and slide up once, at `top 85%`. It checks whether an element is already past the trigger line on a hard refresh, so nothing gets stuck invisible.
- `lib/gsap.js` sets every GSAP duration to 0 under `prefers-reduced-motion`. `index.css` also removes CSS transitions in that case.
- `index.html` forces `history.scrollRestoration = 'manual'` so reveals behave the same on every load. `App.jsx` calls `ScrollTrigger.refresh()` after fonts and `load` finish.

### 5.4 Guided tour

- `useTour` (state `idle | running | paused`) walks through `tour.json` stops. It GSAP-scrolls to each `target`, waits 5 s, then advances.
- If you scroll by hand more than 40 px during the tour, it exits.
- `TourContext` shares the tour state between `Hero` (the launcher) and `TourController` (the floating card with play/pause/prev/next/close). Clicking outside the card exits the tour.
- The tour `note` strings were drafted from résumé facts on 2026-09-26. They're meant to be rewritten in the owner's own voice.

### 5.5 Keyboard shortcuts (`/`)

| Key | Action |
|---|---|
| `T` | Start the tour (clicks `[data-tour-start]`) |
| `R` | Download the résumé |
| `?` | Show or hide the shortcuts dialog |
| `Esc` | Close the dialog |

Shortcuts are ignored while you're typing in a field or holding a modifier key.

### 5.6 GitHub heatmap

`useGithubContributions` gets the GitHub username from `profile.links.github` and fetches `https://github-contributions-api.jogruber.de/v4/<user>?y=last`. That's a third-party, unauthenticated API. The hook caches the result in localStorage for 24 h and computes weeks, total and streak. If the API fails, the heatmap hides itself (status `hidden`; the Garden zone shows "The field is resting.") and the rest of the page still works. Both the Skills section and the Garden zone use this hook.

### 5.7 SEO and meta

`index.html` holds the title, description, canonical URL, OG/Twitter cards (`/og-image.png`, 1200×630) and Person JSON-LD. `/world` injects `noindex, follow` plus a canonical tag pointing back to `/`, so search engines don't see duplicate content.

### 5.8 Asset pipeline

This is shared with `/world`. For the full walkthrough see `scripts/assets/README.md`. In short: generate sprite sheets outside this repo (Gemini), then run `process` (magenta key and palette snap), `slice`, rename the files by hand, `downscale`/`batch-downscale` (target sizes are in `sizes.mjs`), and finally `node scripts/assets/pack-atlas.mjs` to write `public/world/atlas/`.

- The README's step 4 still mentions `free-tex-packer-cli`. The script that actually works is `pack-atlas.mjs`, which uses `free-tex-packer-core`.
- `pack-atlas` has no npm script, so run it with `node`.

---

## 6. Analytics events

These are sent with `track()` from `@vercel/analytics`:

| Event | Props | Fired from |
|---|---|---|
| `world_explore_click` | `source`: `nav`, `nav_mobile`, `island_divider`, `mini_banner` | Every link to `/world` |
| `resume_download` | `source`: `nav`, `nav_mobile`, `hero`, `contact`, `keyboard_shortcut`, `world_terminal` | Every résumé link |
| `project_link_click` | `project`, `type`: `github`/`live` | `FeaturedCard`, `ProjectCard` |
| `contact_email_click` | `method`: `copy`/`mailto` | `Contact` |
| `tour_started` | none | `Hero` |
| `world_zone_open` | `zone`: zone id; `source`: `keyboard`, `prompt`, `tap`, `menu` | `WorldOverlay` (the single handler for every zone open in `/world`) |

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

- BootScene draws **placeholder textures at runtime**: a 4-tile tileset (grass, path, sand, block), a coloured-box player with a 4×4 walk cycle, and a coloured rectangle for each prop.
- It then tries to load the real art: `world/atlas/atlas.{png,json}` (key `objects`) and `world/char.png` (key `char`).
- If either file 404s, the game quietly falls back to the placeholders. `resolvePropTexture()` in `WorldScene` and `Player`'s `usingCharArt` check pick whichever texture is available.
- **Current state:** both the real atlas and `char.png` are committed. The ground tiles are still the flat-colour placeholders because there's no tileset art yet.

### 7.4 Map (`data/mapLayout.js`, `data/zones.js`)

- The map is 60×40 tiles at 16 px, so 960×640 world pixels. `buildMap()` generates it in code rather than loading a Tiled file:
  - an all-grass base
  - blocking tiles around the border
  - a sand clearing under spawn and under each zone
  - 3-wide L-shaped paths from spawn to every zone
- `zones.js` lists the zones: centre point, size and title. It's the single place to move or add a zone. After a change there, update the per-zone maps in `WorldScene.js` (`BUILDING_HEIGHT_BY_ZONE`, `PROP_BY_ZONE`, `ATLAS_FRAME_BY_ZONE`) and in the UI (`ZONE_TITLES` and `CONTENT_BY_ZONE` in `ZonePanel.jsx`, and `DESTINATIONS` in `ZoneMenu.jsx`).
- Scatter (trees, bushes, rocks, flowers) is placed on grass tiles with a seeded `tileHash`. The island looks the same on every load. Scatter only appears when the real atlas has loaded.

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

- `Player.js`: moves at 130 px/s. You can steer with WASD or the arrow keys (diagonal movement is normalised), or click/tap a point to walk there.
  - When walking to a point, the player gives up if it's stuck for 300 ms, and in that case `onArrive` does **not** fire.
  - `char.png` is a single front-facing 32×32 frame with no walk cycle, so the sprite just flips horizontally for left and right.
  - Depth is set to `y` so the player sorts correctly against props.
- `Zone.js` (ZoneManager): checks the player's position against every zone once per render frame.
  - It deliberately doesn't use Arcade overlap callbacks. Phaser 4's fixed-step physics can fire those 0 or 2+ times per frame, which made the prompt flicker.

### 7.6 Input and device modes

`useDeviceMode()` returns `'touch'` only when the device has a coarse pointer **and** the viewport is ≤ 900 px wide. Everything else, including touch laptops and landscape iPads, counts as `'pointer'`. The mode is read **once** at boot and stored in the Phaser registry, so rotating the device doesn't reconfigure the camera.

| | Pointer (desktop) | Touch (phone) |
|---|---|---|
| Camera zoom / lerp | 1.5 / 0.1 | 1 / 0.15, follow offset +40 px |
| Move | WASD / arrows / click | Tap |
| Open zone | Walk in, then `E` / `Space` / `Enter` (floating prompt) | Tap the building. The player walks there and it opens on arrival (hit area padded by 20 px) |
| Panel | `ZonePanel`: right-side dialog, `Esc` closes | `BottomSheet`: draggable, snaps at 45/85/96%, flick or drag below 20% to dismiss |
| Jump anywhere | Terminal `cd <zone>` | `ZoneMenu` (☰): teleports, then opens the zone after 400 ms |
| Hint | "WASD or click to move · E to interact" | Tap-to-move copy. Any tap dismisses it |

The first-visit hint stores `world-hint-seen` in localStorage.

**Key-capture gotcha:** Phaser calls `preventDefault` on the keys it registers (WASD, arrows, E, Space, Enter) for the whole page. That would stop you typing into the terminal. `WorldScene` therefore removes the capture whenever `pauseInput` is true and adds it back afterwards. Any new text input rendered over the canvas has to emit `PAUSE_INPUT` for the same reason.

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
- Reduced motion turns off camera lerp (the camera snaps) and footprints.
- The world loads the Press Start 2P font on demand and removes it on unmount.

---

## 8. Common tasks

| Task | Where |
|---|---|
| Change any copy | `src/content/*.json` only |
| Add a project | Append to `projects.json` with a unique `id`, then set `featured` and `order` |
| Add or edit a tour stop | `tour.json`. The `target` must match an element id on `/` |
| Change colours or fonts | The `@theme` block in `src/index.css`, and the font links in `index.html` |
| Move a zone or building | `src/world/data/zones.js`. Paths and clearings regenerate automatically |
| Add a new zone | `zones.js`, then the three maps in `WorldScene.js`, then `ZONE_TITLES`/`CONTENT_BY_ZONE` in `ZonePanel.jsx` and `DESTINATIONS` in `ZoneMenu.jsx` |
| Replace or add sprites | Follow the §5.8 pipeline, then rerun `pack-atlas.mjs`. Frame names must match the `ATLAS_FRAME_BY_ZONE` and `SCATTER_DEFS` entries |
| Add a real walk cycle | Add a spritesheet at `public/world/char.png` and add anims in `Player.js` (the placeholder code shows the pattern) |
| Add a terminal command | Update `COMMANDS`, `HELP_LINES`, the `switch` and, optionally, `CHIP_COMMANDS` in `Terminal.jsx` |

---

## 9. Open items

- **The résumé** lives at `public/resume.pdf`. Every résumé link (nav, hero, contact, `R`, terminal `cat resume`) points there, so replace that file to update it. It's a LaTeX export, and the printed LinkedIn text on it is missing `/in/` (the clickable link is correct).
- **Content details still open**: two impact numbers, hackathon roles, a few experience numbers and guessed dates. The full list is in `docs/IMPROVEMENTS.md` §1.2.
- **Ground tiles** are still the flat colours generated in BootScene. Real tile art (or a Tiled map export) is the next big visual upgrade.
- **The player sprite** is a single static frame with no walk animation.
- **The Archive zone** shows only org and period for each role. `/` shows much more detail there.
- **`README.md`** is still the default Vite template. Replace it or point it at this doc.
- **`scripts/assets/README.md`** atlas step still refers to the CLI instead of `pack-atlas.mjs`.
- **No tests or CI.** Before you push, run `npm run build` and `npm run lint`, then check `/` and `/world` at phone width by hand.
