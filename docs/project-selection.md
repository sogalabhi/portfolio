# Project collection

Work shows four featured projects with a title, one result line, a short
description, and links. The remaining 21 projects are compact text rows behind
the "Show 21 more" toggle. The count follows the collection automatically.
The featured layout has two columns on desktop and one on mobile.

Featured order:

1. Arjun Guruji: 2,000+ downloads and a 4.9-star Google Play rating.
2. Osdag Web: a four-person team and production deployment at IIT Bombay.
3. OpenLake: 77% churn accuracy on a 5,042-customer dataset.
4. Polkaflow: third of 190+ at the AssetHub Hackathon.

Adoption, team, and hackathon figures come from the existing experience and
achievements content. OpenLake's benchmark is recorded in its repository README;
it is a held-out test result, not a production business metric.

## Plates: figure and media

Each featured card is a figure plate. By default it shows a line drawing,
animated, made for that project (`figure`); a project with a real image also
gets a **Drawing | Built** switch that shows it (`screenshot`). The images in
`public/projects/` are real, arranged but never retouched:

- `osdag-web.webp`: the Connections page of Osdag Web, from the owner's local
  build in guest mode.
- `arjun-guruji.webp`: three images from the app's public Play Store listing
  side by side: the raw Books screenshot, then the Astottara and Audio listing
  graphics.
- `polkaflow.webp`: the project's own `frontend/public/screenshot.png`
  (`polkaflow.png` is the original).
- OpenLake has no UI, so it has a drawing and no Built view.

Any of these can be swapped for a better image of the real product; nothing
made up goes on a plate.

## Adding or editing a project

Edit `src/content/projects.json`. Each entry has:

- `id`: a unique, stable identifier, also used by link analytics.
- `title` and `tagline`: the display name and a short description.
- `featured`: keep exactly four entries marked true.
- `featuredOrder`: the order of those four cards.
- `result`: one short, supported outcome for each featured project.
- `figure`: for featured projects, `{ "type", "caption", "labels" }`. `type`
  picks the drawing (`phone`, `base-plate`, `pipeline`, `flow`; see
  `src/components/work/figures/index.js`), `caption` sits under the plate, and
  `labels` holds every word the drawing shows. Draw only what the project
  really has; dimensions are symbols, never invented numbers.
- `screenshot`: optional `src`, descriptive `alt`, intrinsic `width` and
  `height`, `fit` (`cover` for a landscape screenshot, shown from the top;
  `contain` for a strip of phone screens), and `caption` (shown under the plate
  in the Built view).
- `roles`: `sde`, `data` and `civil`. Shown as tags on the plates and used by
  the index's filter (labels in `sections.json` → `work.roles`).
- `order`: the order of the index and the interactive world's list; also the
  register number shown in the index.
- `links`: `github`, `live`, `demo`, and `playStore`; leave unavailable links empty.
- `stack`: technologies; the first six show on a plate, the first four in an
  index row, all of them in the interactive world's project panel.

The home page shows four curated skill rows from `src/content/skills-summary.json`
after Experience, followed by the GitHub heatmap. The complete
`src/content/skills.json` list feeds the interactive world's Garden panel through
`skillsForRole`, which supports both legacy strings and role-tagged objects.
Keep both skill lists backed by the reviewed projects or existing work experience.

## Selection and ordering

Reviewed only the 27 repositories named in the user's final list. Available
READMEs were checked against representative source files. Priority is based on
real usage, personal contribution, technical depth, and relevance to software
and data roles, rather than the most recent repository update.

Arjun Guruji, Osdag Web, OpenLake, and Polkaflow are the featured selection.
Domain-specific tools, research, focused proofs of concept, and smaller builds
remain accessible through the additional-projects disclosure.

Two selected repositories are excluded as standalone entries:

- `minor-project`: the README includes a failed beam-deflection validation;
  Mechanics Sight is the stronger beam-analysis project.
- `osdag-staging-server`: source implements a staging deployment and service
  console. It supports the Osdag work rather than a separate flagship project.

Descriptions reflect the implemented scope:

- BriefForge (`esko`) checks packaging artwork; its older design-brief code is
  not described as the current product.
- IsoFold's Python geometry and sensitivity tooling are present. The README's
  planned desktop, C++, mobile, and Fourier capabilities are not claimed.
- Agentic Workflow Builder has an execution backend beyond its older README's
  editor-only description. Telegram and human approval are mocked, so the card
  does not claim those integrations.
- Verdict Chain is a prototype with a local EVM ledger, not the planned Paladin
  privacy network or a production chargeback service.
- Vehicle Detection & PCU Prototype aggregates frame detections; it does not
  claim unique vehicle tracking or validated traffic counts.
- GenkiSportz is the app-link companion site, not the sports app itself.
- PokeWars has no README or public project link. Its description was checked
  against game and contract source. The public page labels it Private project
  instead of linking visitors to a private GitHub repository.

Existing user-provided app adoption and hackathon information is retained.
