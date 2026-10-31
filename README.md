# Cinema Atlas

**An interactive TMDB analytics portfolio — from raw movie metadata to a five-page web dashboard.**

[Open the dashboard](https://LHGiaPhuc.github.io/tmdb-cinema-atlas/) · [Explore the data source](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata) · [My GitHub](https://github.com/LHGiaPhuc)

![Dashboard validation](https://github.com/LHGiaPhuc/tmdb-cinema-atlas/actions/workflows/ci.yml/badge.svg)

## Why this project

Built as a Computer Science student portfolio project focused on Data Analytics and Business Intelligence. The project demonstrates data ingestion, explicit metric definitions, missing-value handling, exploratory visualization, and delivery of an accessible static application.

The questions: what does this collection contain, how do genres differ, how does audience attention relate to ratings, and what can reported financial records tell us?

## Explore five pages

| Page | Analytical focus |
| --- | --- |
| Welcome | Navigation and context for the historical collection |
| Overview | Release-year distribution, original languages, ratings, data coverage |
| Movies & genres | Overlapping genre counts and mean ratings, searchable film explorer |
| Ratings & popularity | All-film scatter plot and a leaderboard with a 100-vote minimum |
| Financials | Complete-pair budgets/revenues, coverage and median revenue-to-budget multiple |

All analysis pages share year, genre, minimum-vote and title filters. The explorer supports sorting, incremental rows, direct TMDB links, and CSV export of **all matching records**, including records missing the selected sort value. Filters persist while navigating within the session; a reload resets them.

## Run locally

Requires Node.js 20+; no frontend dependencies, API keys, or installation step.

```sh
git clone https://github.com/LHGiaPhuc/tmdb-cinema-atlas.git
cd tmdb-cinema-atlas
npm start
```

Open `http://127.0.0.1:4173`. Use an HTTP server; opening `index.html` directly does not support the data fetch.

```sh
npm test
```

## Technical design

- **Python standard library:** parse CSV and nested genre JSON; validate IDs, dates and ratings; publish a compact, deterministic JSON snapshot with a source SHA-256.
- **JavaScript ES modules:** pure metric/filter functions separated from rendering and event handlers. Each executable script has a `main` entry point.
- **HTML/CSS/SVG:** responsive layout, hash navigation, keyboard focus, semantic tables, interactive chart tooltips and a native data-information dialog.
- **GitHub Pages:** serves the `docs/` directory directly; hash routes work without a custom server or rewrite rules.
- **GitHub Actions:** validates data invariants and analytical edge cases with Node's built-in test runner.

Google Fonts is the only optional external visual dependency. System fonts are used if unavailable. Movie data and TMDB logo are served locally. No analytics, tracking, backend, or runtime API access.

```text
tmdb-cinema-atlas/
├── .github/workflows/ci.yml
├── docs/
│   ├── index.html
│   ├── assets/                 # Application, metric functions, styles and logos
│   └── data/movies.json        # Validated public snapshot + provenance
├── scripts/
│   ├── prepare_data.py         # Reproducible CSV transformation
│   └── serve.mjs               # Local preview server
├── tests/metrics.test.mjs
├── DATA_DICTIONARY.md
├── DATA_SOURCES.md
├── LICENSE
└── package.json
```

## Data and measurement decisions

**4,803 unique films · release years 1916–2017 · Kaggle source last updated September 28, 2017.** Retrieved October 31, 2026; retrieval does not make the observations current.

- One row per TMDB movie ID. All source records are retained; one has no release date.
- Zero budget, revenue and runtime are treated as unknown, not actual zero values.
- Films without votes have a missing rating. Mean rating is an **unweighted mean across rated films**, not a pooled user rating.
- Genres are multi-label: genre totals overlap and must not be interpreted as market share.
- Financial analysis uses **3,229 films** with both budget and revenue greater than zero. There are 1,037 missing budgets and 1,427 missing revenues.
- Revenue / budget is a descriptive multiple, **not ROI or profit**. Marketing, distribution, revenue shares and inflation are excluded.
- Amounts are treated as nominal USD; the original publisher explicitly flags uncertainty about consistent currency and worldwide revenue coverage.
- Popularity is a score from the historical snapshot, not current demand, a percentage, or a count of viewers.
- This is a selected historical collection, not a census or random sample. Genre differences and rating/popularity associations are descriptive, not causal.

See [data dictionary](DATA_DICTIONARY.md) and [source and rights notes](DATA_SOURCES.md).

## Rebuild the data

Requires Python 3.10+. Download the original archive from the [Kaggle dataset page](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata) and extract `tmdb_5000_movies.csv` into `data/raw/`. Raw files and archives are ignored by Git. The credits file is not used.

```sh
python scripts/prepare_data.py
npm test
```

The script validates and deterministically rebuilds `docs/data/movies.json`. The recorded retrieval date describes this committed acquisition; update it when intentionally acquiring a different snapshot. The tests deliberately pin this dataset's counts to detect an unexpected source change.

## Deploy on GitHub Pages

In **Settings → Pages**, choose **Deploy from a branch → main → /docs → Save**. No build secrets are needed. Forks use the same relative paths; update the owner-specific README, source and profile links if publishing under another account.

## Attribution and license

This product uses the TMDB API but is not endorsed or certified by TMDB.

The dashboard consumes a public historical export of TMDB data, not a live API integration. The source dataset was published under “Other (specified in description)” with TMDB terms. **It is not CC0.** This is a non-commercial educational portfolio. TMDB data and branding are excluded from the MIT code license; consult [TMDB terms](https://www.themoviedb.org/api-terms-of-use) before other uses.
