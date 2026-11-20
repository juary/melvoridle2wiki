# Melvor Idle 2 Wiki

An independent, English-language player guide for **Melvor Idle 2: A RuneScape Adventure**. Browse introductory guides, skill and combat references, quest context, and dated Early Access notes.

**Website:** [https://juary.github.io/melvoridle2wiki/](https://juary.github.io/melvoridle2wiki/)

**Community game database:** [https://melvoridle2.top/](https://melvoridle2.top/)

## About the project

Melvor Idle 2 entered Steam Early Access on November 17, 2026. This site organizes public information from the official Steam listing, the official game website, and developer announcements into a browsable static wiki. The game is still being developed, so article review dates and source links are included to make version context clear.

This is an independent fan project, separate from the community-maintained database at melvoridle2.top. The two sites are not official developer properties.

## Site sections

| Section | What it covers |
| --- | --- |
| Guides | Getting started, how game systems connect, Early Access context, and offline progress |
| Skills | Skill progression, launch additions, and Mastery Guilds |
| Combat | Combat preparation, equipment, and loadouts |
| Quests | Story progression and Act 2 context |
| Updates | Source-linked Early Access launch and patch summaries |
| Search | Browser-side search across articles |
| Themes and responsive layout | Dark and light themes for desktop and mobile |

## Run locally

You need **Node.js 22 or later**. There are no third-party npm dependencies, so `npm install` is not required.

```sh
git clone https://github.com/juary/melvoridle2wiki.git
cd melvoridle2wiki
npm run build
npm run dev
```

Open the local preview URL shown in the terminal. The default port is `4173`; the site uses the `/melvoridle2wiki/` project path locally as well.

The static site is generated into `dist/`. Build-time checks catch invalid categories, duplicate or malformed article slugs, invalid section IDs, and missing related-article links. The generated output includes standalone HTML pages, a search index, a sitemap, and `robots.txt`.

## Project structure

```text
melvoridle2wiki/
├── .github/workflows/deploy.yml  # Build and publish to GitHub Pages
├── docs/
│   ├── DEPLOYMENT.md             # Pages setup and troubleshooting
│   └── SOURCES.md                # Source policy and editorial scope
├── public/assets/                # Game artwork and favicon
├── scripts/
│   ├── build.mjs                 # Static page generator
│   └── serve.mjs                 # Local preview server
├── src/
│   ├── data/
│   │   ├── content.json          # Categories, articles, and source links
│   │   └── site.json             # Site identity and interface text
│   ├── scripts/app.js            # Search, theme, and navigation behavior
│   └── styles/style.css          # Responsive site styles
└── package.json
```

## Content maintenance

1. Edit categories and articles in `src/data/content.json`. Articles contain a unique slug, category, title, description, review date, structured sections, source links, and related article slugs.
2. Keep site identity and interface text in `src/data/site.json`.
3. Prefer the official Steam listing, the official Melvor Idle 2 website, and developer announcements. Identify the version and distinguish Early Access information from demo content.
4. Keep article review dates current only when the material has been checked. A source publication date and a wiki review date describe different events.
5. Run `npm run build` before submitting content changes. The GitHub Actions workflow builds and publishes the generated site after changes are pushed to `main`.

## Automatic deployment to GitHub Pages

The workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and publishes the site when changes are pushed to `main` or when the workflow is started manually. For first-time setup, choose **Settings → Pages → Build and deployment → Source → GitHub Actions** in the repository.

The Pages project site uses the `/melvoridle2wiki/` path. No custom domain or `CNAME` file is needed. See [the deployment guide](docs/DEPLOYMENT.md) for setup and troubleshooting.

## Copyright and disclaimer

This is an independent fan project and is not affiliated with or endorsed by Games by Malcs or Jagex. Melvor Idle, RuneScape, game names, screenshots, and other third-party materials remain the property of their respective rights holders.
