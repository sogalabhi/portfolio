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

Polkaflow's existing `frontend/public/screenshot.png` is copied to
`public/projects/polkaflow.png` and displayed as a thumbnail that opens the full
image. Other featured cards have no screenshot placeholder.

## Adding or editing a project

Edit `src/content/projects.json`. Each entry has:

- `id`: a unique, stable identifier, also used by link analytics.
- `title` and `tagline`: the display name and a short description.
- `featured`: keep exactly four entries marked true.
- `featuredOrder`: the order of those four cards.
- `result`: one short, supported outcome for each featured project.
- `screenshot`: optional `src`, descriptive `alt`, intrinsic `width`, and `height`.
- `roles`: retained classification metadata (`sde`, `data`, and `civil`).
- `order`: the order of the additional projects and the interactive world's list.
- `links`: `github`, `live`, `demo`, and `playStore`; leave unavailable links empty.
- `stack`: technologies shown in the interactive world's project panel.

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
