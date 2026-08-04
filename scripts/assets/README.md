# `/world` asset pipeline

Node/`sharp` reimplementation of the asset generation guide's post-processing
pipeline (steps 5.1–5.4). No ImageMagick, Python, or system installs needed —
everything runs through the project's existing npm toolchain.

Steps 1–4 (the actual Gemini generation) still happen externally — this repo
has no image-generation tool. Generate the anchor + 3 sheets yourself, save
them to `assets/raw/`, then run the pipeline below.

## Flow

```text
Gemini (external)              This pipeline (Node/sharp)
─────────────────              ───────────────────────────
1. style anchor        ─┐
2. buildings sheet       ├─→  assets/raw/*.png
3. props sheet           │
4. scatter/plants sheet ─┘
                              npm run assets:process  → assets/cut/<sheet>-clean.png
                              npm run assets:slice    → assets/cut/<sheet>/obj_00.png ...
                              (rename obj_NN.png by eye, per the inventory table below)
                              npm run assets:downscale → public/world/sprites/<name>.png
                              npx free-tex-packer-cli  → public/world/atlas/{atlas.png,atlas.json}
```

## Commands

```bash
# 1. key out magenta, despill, snap to the locked palette
npm run assets:process -- assets/raw/buildings.png assets/cut/buildings-clean.png

# 2. slice into individual sprites + manifest.json
npm run assets:slice -- assets/cut/buildings-clean.png assets/cut/buildings

# rename assets/cut/buildings/obj_00.png -> workshop.png etc. by eye —
# faster than trying to make the slicer smart about naming

# 3. downscale each named sprite to its target in-game size (re-snaps palette after resize)
npm run assets:downscale -- assets/cut/buildings/workshop.png public/world/sprites/workshop.png 96 80
```

Then pack `public/world/sprites/*.png` into an atlas:

```bash
npx free-tex-packer-cli --project atlas.ftpp --output public/world/atlas
```

`BootScene.js` already attempts to load `world/atlas/atlas.png` +
`world/atlas/atlas.json` and falls back to the current placeholder rectangles
if those files 404 — so none of this is load-bearing until you actually drop
files in. See `src/world/scenes/BootScene.js` and the `useAtlasFrame` helper
in `src/world/scenes/WorldScene.js`.

## Target sizes (buildings — Tier B)

| name | size |
|---|---|
| `workshop.png` | 96×80 |
| `tower.png` | 64×112 |
| `shrine.png` | 80×72 |
| `garden-shed.png` | 80×64 |
| `archive.png` | 112×72 |
| `terminal-desk.png` | 48×48 |
| `signpost.png` | 32×48 |

## Target sizes (large props — Tier C)

| name | size |
|---|---|
| `workbench.png` | 48×32 |
| `crates-stacked.png` | 32×32 |
| `crate-open.png` | 32×24 |
| `trophy-pedestal.png` | 32×40 |
| `stone-lantern.png` | 24×40 |
| `planting-bed.png` | 48×32 |
| `water-barrel.png` | 24×28 |
| `antenna-dish.png` | 32×32 |
| `crates-small.png` | 24×24 |
| `bench.png` | 40×20 |

## Target sizes (scatter + plant growth — Tier D)

| name | size | notes |
|---|---|---|
| `tree-large-a.png` / `-b.png` | 48×64 | 2 variants |
| `tree-small-a.png` / `-b.png` | 32×40 | 2 variants |
| `bush-a.png` / `-b.png` / `-c.png` | 24×20 | 3 variants |
| `rock-a.png` / `-b.png` / `-c.png` | 20×16 | 3 variants |
| `flowers-a.png` / `-b.png` / `-c.png` | 16×16 | 3 variants |
| `plant-sprout.png` | 16×20 | Garden skill level 1 |
| `plant-growing.png` | 20×28 | Garden skill level 2 |
| `plant-mature.png` | 28×36 | Garden skill level 3 |
| `plant-tree.png` | 40×56 | Garden skill level 4 |
| `fence-segment.png` / `fence-post.png` | 16×20 | |
| `lamp-post.png` | 16×40 | |

## Character (Tier E — do not generate)

Download a CC0 4-direction walk-cycle pack (LimeZu or Kenney — match its
outline treatment to whatever the generated buildings end up with). Save the
spritesheet to `public/world/char.png`. Frame layout varies pack to pack, so
wiring it into `Player.js`'s animation frames is a manual step once you've
picked one — see the comment block at the top of `Player.js`.

## Verification checklist

Copied from the guide — check before wiring into the game:

- [ ] No magenta fringe on any sprite edge (zoom to 800%)
- [ ] Every sprite uses only palette colors
- [ ] All buildings share one lighting direction
- [ ] Character outline treatment matches the buildings
- [ ] Every object readable at final in-game size (zoom 3)
- [ ] Atlas loads with no missing-frame warnings in the console
- [ ] `/world` chunk size increase is acceptable (target: atlas under 300KB)
- [ ] `public/world/CREDITS.txt` lists the character pack license
