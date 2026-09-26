# Improvement plan

This plan comes from running `/` and `/world` at desktop (1280×800) and phone (390×844) sizes on 2026-09-26. It has three parts:

1. **What I need from you**: files, content and decisions. All are settled apart from the few content details listed in 1.2.
2. **Task list**: everything to build or fix, in priority order.
3. **Technical notes**: how the SVG art pipeline works and what it can't do.

For how the codebase works today, see `docs/HANDOVER.md`.

---

## Part 1: What I need from you

### 1.1 Files and links

| # | Item | Where it goes | Blocks |
|---|---|---|---|
| F1 | ✅ Your résumé PDF (done 2026-09-26) | `public/resume.pdf` | Every résumé button |
| F2 | ✅ Your LinkedIn profile URL (done 2026-09-26) | `profile.json`, and the JSON-LD block in `index.html` | Contact section, Tower zone, SEO |
| F3 | ✅ Avatar reference (received 2026-09-26, LinkedIn profile photo). See [1.4](#14-avatar-reference) | The written description in 1.4; the photo itself isn't committed | The new pixel character (P1). The character work is scheduled after the other improvements |
| F4 | *(Optional)* 1–3 screenshots for each featured project | `public/projects/<id>/` and each project's `media: []` | Project cards on `/`, blueprint cards in the Workshop |

### 1.2 Content: `NEEDS_INPUT` placeholders

✅ **Done on 2026-09-26.** Every placeholder was filled from the résumé (the 2026-09-24 edition) or GitHub, or removed if neither had the answer. No `NEEDS_INPUT` text is left in `src/` or `index.html`, and none shows on `/`.

**Changes beyond the placeholders:**
- Removed an internal note that was showing publicly under the FOSSEE card ("Résumé says 'Web Lead'… confirm whether…"). The résumé confirms the title is Web Lead.
- Added **Process Mining & Analytics Platform** from the résumé. It's the first card under "More projects".
- Linked Retail Lakehouse to `github.com/sogalabhi/openlake_project`. The repo README confirms they're the same project.
- Hid the PokeWars GitHub link. `github.com/Kushagra1122/PokiWars` returns 404, so the repo is either private or deleted.
- Reworded the SNSDS bullet that said "on the résumé". SNSDS isn't on the current résumé.

**Please check these. They're my best guesses, not facts from you:**

| Item | Value used | Source |
|---|---|---|
| Project dates | Retail Lakehouse 2026-07 · Polar Bridge 2025-12 · SysSight 2025-10 · Polkaflow 2025-06 · ETA Predictor 2026-05 · Slope Stability 2026-02 · Process Mining 2026-09 | Month each GitHub repo was created. For Polkaflow, the month of its first commit |
| Arjun Guruji date | 2021-04 | The SNSDS Trust start date in `experience.json` |
| ETHGlobal New Delhi and PokeWars date | 2025-09 | The event's date. The repo is private, so this couldn't be checked |
| Polkadot Builder House date | 2025-12 | Month the Polar repo was created |
| Retail Lakehouse impact line | "One codebase, two deployments - a local open-source stack and managed Azure" | Résumé and the repo README. Neither gives a number |
| All 6 tour notes | Drafted by me from résumé facts | **Rewrite them in your own voice** (`tour.json`, 160 characters or fewer each) |

None of the dates above are shown on the site today. They only matter for sorting and for future features.

**Still open, but hidden so nothing looks broken:**
- **Impact numbers**: ETA Predictor (accuracy or MAE) and Slope Stability Analyzer (speed-up). These are non-featured cards, so the impact line isn't shown yet anyway.
- **Hackathon roles** (`myRole`): AssetHub/Polkaflow, and ETHGlobal/PokeWars. This field isn't shown anywhere yet.
- **Experience details**: a latency or cache number for the Osdag Redis work, team size at IRIS and Momento, one number for Momento, and what SNSDS maintenance involves now.
- **PokeWars**: a public repo or demo link, if one exists.

**Inconsistencies to settle:**
- The achievements summary says "2 hackathon wins and an international selection, from 3 entries". The résumé says "finalist in all 4 hackathons participated". Pick one story.
- The résumé still says "Shortlisted for the **upcoming** final round of EthGlobal New Delhi", but that event was in 2025.
- The résumé's printed LinkedIn text is missing `/in/`. The clickable link is correct.

### 1.3 Decisions

✅ **All decided on 2026-09-26.** D8 was your choice; for everything else you accepted my recommendation.

| # | Decision | Chosen |
|---|---|---|
| D1 | Art direction | Pixel-art SVG: keep the pixel look and author new art as code |
| D2 | Player character | Custom avatar that looks like you, from the reference in 1.4 |
| D3 | Avatar on the homepage | Yes, replacing the dark monster in the hero and the margin walker |
| D4 | How the map is built | Tiled-format JSON (a script generates it; you can open and edit it in the free Tiled editor) |
| D5 | Map layout | Free to redesign as an organic island with curved paths |
| D6 | Sound | Yes, muted by default with a toggle |
| D7 | Day and night | Yes, based on the visitor's local time |
| D8 | Pet | **A pug** that follows the player |
| D9 | Game font | Departure Mono |
| D10 | Placeholder text | Filled from the résumé where possible. The remaining details stay hidden until you have them (see 1.2) |
| D11 | `world_zone_open` analytics | ✅ Added 2026-09-26 |
| D12 | Roof colours | One colour per building |
| D13 | Order of work | P0 → P1 (without the character) → P2 → P3 and homepage → the character last |

### 1.4 Avatar reference

This is taken from the LinkedIn profile photo. That photo link expires, so this written description is the record to work from.

**Look:**
- Slim build, friendly closed-mouth smile.
- Short black hair: thick and a bit tousled on top, shorter at the sides.
- Medium-brown skin.
- No glasses.
- Thin moustache and light stubble.
- Black polo shirt with white-and-blue striped tipping on the collar and sleeve cuffs, and a small white "iris NITK" logo on the left chest.

**Pixel-art translation (for a sprite around 16×24):**
- 2–3 px of hair volume on top, with the fringe falling a little to one side.
- A small dark moustache line, which reads well even at this size.
- The polo body in deep plum `#2B2438`, not pure black, so it doesn't merge with the dark outline.
- A 1 px white-and-blue stripe on the collar and sleeve ends. This is what makes the sprite read as "that polo".
- A single cream pixel on the chest as a hint of the logo.
- Dark trousers and simple shoes.

**Palette additions needed:** the locked palette in `scripts/assets/palette.mjs` has no skin or hair tones. Add these for characters only:

| Role | Hex |
|---|---|
| Skin highlight | `#D49A66` |
| Skin base | `#B97A4A` |
| Skin shadow | `#8A5533` |
| Hair | `#1C1B19` |
| Collar-stripe blue | `#7A86D8` |

The skin values were sampled from the photo and brightened slightly, because the photo is lit warm and dim.

---

## Part 2: Task list

### P0: fix what's broken ✅ done 2026-09-26

- [x] **Placeholders**: filled from the résumé or hidden. 0 visible on `/`, and the broken repo link is fixed (see 1.2).
- [x] **Résumé**: added `public/resume.pdf` (moved from `assets/`).
- [x] **LinkedIn**: set the URL in `profile.json` and `index.html`.
- [x] **Spawn position**: the player starts in the plaza and the Welcome sign stands beside it.
- [x] **Spawn prompt**: the spawn point is outside every trigger, so there's no E prompt on the first frame.
- [x] **Building collision**: each building has a static box along its drawn base, and its roof stays walk-behind. The player now sorts by its feet, so it draws in front of a building at the door and behind it past the roof. Click/tap moves route around buildings with A* (`src/world/pathfinding.js`).
- [x] **Interaction trigger**: each trigger is a strip in front of the door. Clicking or tapping a building walks to its door and opens it, from any side. Teleports park the player at the door.
- [x] **Whole-number zoom**: `pickZoom` gives 2 on laptops and phones, 3 on 1080p and 4 on 1440p, and re-picks it on resize.
- [x] **Phone void**: the zoom never goes below what it takes to fill the viewport with map.
- [x] **Label overlap**: labels fade out while under any `data-world-hud` control.
- [x] **Label wording**: the label now reads "Welcome". The zone id stays `spawn` for analytics and the terminal.

### P1: art that looks like a real game ✅ done 2026-09-26 (except the character, scheduled last)

- [x] **Art pipeline**: `assets/pixel/*.mjs` grids go to `assets/svg/`, then `public/world/sprites/` (`npm run assets:pixel`). `npm run world:build` rebuilds all art and the map, deterministically.
- [ ] **Player character**: about 16×24 px, 4 directions × 4 walk frames plus an idle frame, drawn from [1.4](#14-avatar-reference). Wire it into `Player.js` with real animations. *Scheduled after the other improvements.*
- [x] **Ground tiles**: a corner-based set (15 edge tiles per overlay) for sand, grass, dirt and stone flagstones, drawn procedurally with rims, a foam line and ledge shadows. It has 4 grass variants and a stone plaza at spawn (`scripts/world/build-terrain.mjs`).
- [x] **Island shape**: a wobbly-ellipse coast with bays, a beach ring, and 3-frame animated water. The shore is the new boundary.
- [x] **Map rebuild**: an 80×56 Tiled-format map (`public/world/map/island.json`) generated from `scripts/world/layout.mjs`, with Catmull-Rom dirt paths from the plaza to each door. It includes wang sets for Tiled's terrain brush.
- [x] **Place the 17 props that are never used** (all solid except the plants):
  - [x] Workshop: workbench, `crates_two`, `crates_three`, `crate_open`, barrel
  - [x] Garden: four `soil_bed`s with `plant_stage1`–`4`, and a fence along the top
  - [x] Shrine: `trophy_pedestal`, and two `stone_lantern`s by the door
  - [x] Tower: `dish`
  - [x] Plaza and paths: 2 benches and 8 `lamp_post`s
- [x] **Shadows**: a crisp pixel ellipse under every standing sprite. The player's shadow follows it.
- [x] **Roof colours**: workshop terracotta, tower slate, shrine teal, archive moss, garden shed straw (`scripts/assets/recolor-roofs.mjs`).
- [x] **Scatter cleanup**: `rock_a`/`b`/`c` redrawn as shaded pixel art (`assets/pixel/rocks.mjs`). Scatter is now generated into the map with clearances around paths, buildings, doors and props. Trees, bushes and rocks are solid at their base.

### P2: life and game feel

- [ ] **Water**: animated shimmer and foam along the shore.
- [ ] **Workshop**: chimney smoke particles and an occasional hammer spark.
- [ ] **Tower**: a blinking antenna light and a slowly turning dish.
- [ ] **Terminal**: a blinking cursor or scrolling code on the desk screen.
- [ ] **Shrine**: fireflies or embers, and a glint on the trophy.
- [ ] **Garden**: crops swaying and butterflies.
- [ ] **Ambient**: birds flying past, drifting cloud shadows, grass tufts swaying as the player walks through.
- [ ] **Player feedback**: dust puffs while walking, and an idle blink or bob.
- [ ] **Pet**: a pug that follows the player. It sits when you stop and trots to catch up when you walk away.
- [ ] **Day and night**: tint the world by local time, and switch the lamp posts on at night.
- [ ] **Transitions**: fade in from the loading screen to the world; when entering a building, the door opens, the screen fades, then the panel opens.
- [ ] **Interaction highlight**: an outline or glow on a building while the player can interact with it.
- [ ] **Camera**: a small zoom-in when interacting, and a dead-zone so the camera doesn't jitter.
- [ ] **Sound**: waves and birds in the background, footsteps that change with the surface, a door chime and UI blips. Muted by default.
- [ ] **Reduced motion**: all of the above respects `prefers-reduced-motion`.

### P3: panels and menus (DOM, where animated SVG works fully)

- [ ] **Panel frames**: pixel-style frames drawn as SVG and applied with CSS `border-image`. They replace the generic dark side panel (`ZonePanel.jsx`, `BottomSheet.jsx`, `Terminal.jsx`).
- [ ] **Game font**: switch it to Departure Mono and drop the Press Start 2P font that's loaded at runtime.
- [ ] **Welcome zone**: an RPG-style dialogue box with text that types itself out and an avatar portrait.
- [ ] **Workshop zone**: projects shown as blueprint or inventory cards, with featured projects first and images if F4 is available.
- [ ] **Archive zone**: show the full experience (bullets and roles). Today it shows only org and period.
- [ ] **Minimap**: an SVG minimap generated from `zones.js`, showing the player dot and visited ticks. Clicking a zone travels there, and it also serves as the phone zone menu.
- [ ] **Exploration progress**: an "N/7 visited" counter. When all 7 are visited, show a call to action to download the résumé or get in touch.
- [x] **Analytics**: added `world_zone_open` (`zone`, and `source`: keyboard, prompt, tap or menu). All 4 paths were checked in a headless browser.
- [ ] **Loading screen**: an animated SVG of the island floating in water with the avatar walking.
- [ ] **Preload**: start downloading the game code when someone hovers or focuses "Explore". It's 1.41 MB (370 kB gzipped) and currently only starts downloading after the click.
- [ ] **Zone labels**: restyle them as small wooden signposts.
- [ ] **Accessibility**: trap focus inside open panels and return focus to where it was when they close.

### Homepage (`/`)

- [ ] **Mascot**: replace the dark monster in the hero and the margin-walking character with the new avatar. This happens with the character work.
- [ ] **Island banner**: turn `IslandDivider` into an animated SVG scene with waves, clouds, the avatar walking and chimney smoke, as a live preview of the game.
- [ ] **Section icons**: small hover animations on each icon, like workshop smoke or the tower dish turning.
- [ ] **404 page**: an animated SVG of the avatar stranded on a tiny island.

### Docs and housekeeping

- [ ] **`README.md`**: replace the default Vite text and link to `docs/HANDOVER.md`.
- [ ] **Asset README**: fix `scripts/assets/README.md` so the atlas step uses `pack-atlas.mjs`, and document the new SVG pipeline.
- [ ] **npm scripts**: add `assets:pack` and `assets:svg`.
- [ ] **Handover doc**: update `docs/HANDOVER.md` as each phase lands.

---

## Part 3: Technical notes

### SVG: what works where

| Where | Animated SVG works? | How to animate |
|---|---|---|
| Inside the Phaser canvas (the world) | **No.** Phaser turns an SVG into a single still texture when it loads | Several frames played as a spritesheet, Phaser tweens (bob, sway, fade), or particles |
| The DOM (homepage, loading screen, panels, labels, prompt, minimap) | **Yes** | CSS keyframes or SMIL. The result stays sharp at any screen density and the files are tiny |

**Why pixel-style SVG:** smooth vector art next to the existing pixel buildings would clash. Every pixel is instead a `<rect>` on a grid, with `shape-rendering="crispEdges"` so edges stay hard. I tested this: `sharp`, which is already a dev dependency, renders these to PNG with no blurred edges at all. They go straight into the existing atlas step.

### Pipeline

```
assets/pixel/<name>.js        text grids of letters, one grid per frame, plus the locked palette
        │   (or hand-written assets/svg/<name>.svg)
        ▼
scripts/assets/svg-to-png.mjs sharp, 1× scale, crispEdges
        ▼
public/world/sprites/<name>.png  or  <name>_0.png … <name>_n.png
        ▼
scripts/assets/pack-atlas.mjs (existing) → public/world/atlas/
```

- **What it removes**: the Gemini generation step, magenta background removal, palette snapping and slicing noise.
- **What it gives you**: art stored as text, so changes show up clearly in git; recolouring is a palette edit; and output is the same on every run.
- **Sharing with the homepage**: the same source files can also be used directly on `/`, inline or through `<img>`.
- **Limit**: art written as code works well for tiles, water, UI frames, icons, particles, small animated props and a small character. It works less well for large detailed buildings, so keep the existing building sprites and build around them.

### Measured facts behind this plan

- **Pixel distortion**: camera zoom is 1.5 on desktop and 1 on phones. The non-whole-number zoom draws each art pixel alternately 1 and 2 screen pixels wide.
- **Map size**: the map is 60×40 tiles (960×640 px). At zoom 1.5 on a 1280×800 screen, about 85% of it is visible at once.
- **Bundle sizes**:

  | Bundle | Raw | Gzipped |
  |---|---|---|
  | `/world` chunk | 1,413 kB | 370 kB |
  | `/` main bundle | 417 kB | 141 kB |

- **Unused props**: 17 prop sprites are in the atlas but never placed. They're listed under P1.
- **Collision**: only the map border blocks the player (`collisionLayer`). Buildings have no collision.
- **Current character**: `char.png` is a single 32×32 front-facing frame (a dark horned creature with a staff) from a battle-sprite pack. It has no walk frames.
