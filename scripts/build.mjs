import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "dist");
const site = JSON.parse(
  await readFile(resolve(root, "src/data/site.json"), "utf8"),
);
const { categories, articles } = JSON.parse(
  await readFile(resolve(root, "src/data/content.json"), "utf8"),
);
const siteURL = new URL(process.env.SITE_URL || site.url);
if (!["http:", "https:"].includes(siteURL.protocol))
  throw new Error("SITE_URL must use http or https");
const base = siteURL.pathname.replace(/\/$/, "") + "/";
siteURL.pathname = base;
const href = (path = "") => base + path.replace(/^\//, "");
const absolute = (path = "") => new URL(href(path), siteURL.origin).href;
const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
      char
    ],
  );
const articlePath = (article) => `${article.category}/${article.slug}/`;
const bySlug = (slug) => articles.find((article) => article.slug === slug);
const categoryOf = (id) => categories.find((category) => category.id === id);
const date = (value) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
const readingTime = (article) =>
  typeof article.readTime === "number"
    ? `${article.readTime} min read`
    : article.readTime || "4 min read";

const icons = {
  guides:
    '<path d="M4 3h6a3 3 0 0 1 3 3v15a4 4 0 0 0-4-3H4V3ZM20 3h-4a3 3 0 0 0-3 3v15a4 4 0 0 1 4-3h3V3Z"/>',
  skills:
    '<path d="m14 6 4-4 4 4-4 4"/><path d="m16 8-8 8"/><path d="M4 20a4 4 0 0 1 0-6l2-2 6 6-2 2a4 4 0 0 1-6 0Z"/>',
  combat:
    '<path d="m14 6 4-4 4 4-4 4"/><path d="m16 8-8 8"/><path d="m5 3 16 16M3 5l4-2 14 14-2 4-4-2L3 5Z"/>',
  quests:
    '<path d="M12 3 14.8 9.2 21 12l-6.2 2.8L12 21l-2.8-6.2L3 12l6.2-2.8L12 3Z"/>',
  updates: '<path d="M4 7h13l-4-4M20 17H7l4 4M20 7v5M4 17v-5"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  external: '<path d="M14 3h7v7m0-7L10 14"/><path d="M10 3H4v17h17v-6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  leaf: '<path d="M20 3C5 2 1 12 6 17s15 1 14-14ZM6 18l9-9"/>',
};
const icon = (name, cls = "") =>
  `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.leaf}</svg>`;
const external = (url, label, cls = "") =>
  `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}${icon("external")}</a>`;

const seen = new Set();
for (const article of articles) {
  if (!categoryOf(article.category))
    throw new Error(`Unknown category for ${article.slug}`);
  if (!/^[a-z0-9-]+$/.test(article.slug) || seen.has(article.slug))
    throw new Error(`Invalid or duplicate slug: ${article.slug}`);
  seen.add(article.slug);
  const sectionIds = new Set([
    "main",
    "article-sources",
    "search-dialog",
    "search-title",
    "search-input",
    "search-status",
    "search-results",
  ]);
  for (const section of article.sections) {
    if (!/^[a-z0-9-]+$/.test(section.id) || sectionIds.has(section.id))
      throw new Error(`Invalid section: ${article.slug}/${section.id}`);
    sectionIds.add(section.id);
  }
  for (const slug of article.related || [])
    if (!articles.some((item) => item.slug === slug))
      throw new Error(`Missing related article: ${article.slug} -> ${slug}`);
}

const logo = `<span class="logo-mark" aria-hidden="true">M2</span><span class="wordmark">${esc(site.shortName)}<span>WIKI &amp; FIELD GUIDE</span></span>`;
const navLinks = (active) =>
  `<a href="${href()}" ${active === "" ? 'aria-current="page"' : ""}>${site.ui.home}</a>${categories.map((category) => `<a href="${href(category.id + "/")}" ${active === category.id ? 'aria-current="page"' : ""}>${esc(category.title)}</a>`).join("")}<a href="${href("about/")}" ${active === "about" ? 'aria-current="page"' : ""}>${site.ui.about}</a>`;
const header = (active) =>
  `<a href="#main" class="skip-link">${site.ui.skip}</a><header class="site-header"><div class="container header-inner"><a class="logo" href="${href()}" aria-label="${esc(site.name)} home">${logo}</a><nav class="desktop-nav" aria-label="Main navigation">${navLinks(active)}</nav><div class="header-tools"><button class="search-trigger icon-button" data-open-search aria-label="${site.ui.search}">${icon("search")}<span>Search</span><kbd>/</kbd></button><button class="icon-button theme-toggle" aria-label="${site.ui.theme}" title="${site.ui.theme}">${icon("sun")}</button><details class="mobile-menu"><summary aria-label="Open navigation">${site.ui.menu}</summary><nav aria-label="Mobile navigation">${navLinks(active)}</nav></details></div></div></header>`;
const footer =
  `<footer class="site-footer"><div class="container footer-grid"><div><a class="logo" href="${href()}">${logo}</a><p>A practical guide to a world<br>that keeps moving.</p></div><div><h2>Explore the wiki</h2>${categories.map((category) => `<a href="${href(category.id + "/")}">${esc(category.title)}</a>`).join("")}</div><div><h2>Official links</h2>${external(site.steam, "Melvor Idle 2 on Steam")}${external(site.officialSite, "Official game website")}${external(site.repository, "Source on GitHub")}<a href="${href("about/")}">About this project</a></div><div class="footer-related"><h2>More game data</h2><p>Browse the community-maintained reference wiki.</p>${external(site.communityWiki, "melvoridle2.top", "text-link")}</div></div><div class="container footer-bottom"><p>${site.ui.footerNotice}</p><span>© ${new Date(`${site.reviewed}T00:00:00Z`).getUTCFullYear()} Juary · Independent fan guide</span></div></footer>`;
const dialog =
  `<dialog id="search-dialog" class="search-dialog" aria-labelledby="search-title"><div class="search-heading"><h2 id="search-title">${site.ui.search}</h2><button class="icon-button" data-close-search aria-label="${site.ui.close}">${icon("close")}</button></div><label class="search-field">${icon("search")}<span class="sr-only">${site.ui.search}</span><input id="search-input" type="search" autocomplete="off" placeholder="${esc(site.ui.searchPlaceholder)}"></label><p id="search-status" aria-live="polite">${site.ui.searchHint}</p><div id="search-results"></div></dialog>`;
const themeInit = `try{const t=localStorage.getItem('melvor-idle-2-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch{}`;

function page({
  title,
  description = site.description,
  path = "",
  active = "",
  body,
  type = "WebPage",
  article,
  noindex = false,
}) {
  const jsonld = {
    "@context": "https://schema.org",
    "@type": type,
    name: title,
    description,
    url: absolute(path),
    inLanguage: "en",
    ...(article
      ? {
          headline: title,
          dateModified: article.updated,
          author: { "@type": "Person", name: "Juary" },
        }
      : {}),
  };
  return `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}${path ? ` | ${esc(site.shortName)} Wiki` : ""}</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="${site.themeColor}"><meta name="color-scheme" content="dark light">${noindex ? '<meta name="robots" content="noindex, follow">' : ""}<link rel="canonical" href="${absolute(path)}"><link rel="icon" type="image/svg+xml" href="${href("assets/favicon.svg")}"><meta property="og:type" content="${article ? "article" : "website"}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${absolute(path)}"><meta property="og:site_name" content="${esc(site.name)}"><meta property="og:image" content="${absolute("assets/hero.jpg")}"><meta property="og:image:width" content="1920"><meta property="og:image:height" content="1080"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${absolute("assets/hero.jpg")}"><script>${themeInit}</script><link rel="stylesheet" href="${href("assets/style.css")}"><script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script><script type="module" src="${href("assets/app.js")}"></script></head><body data-base="${base}">${header(active)}${body}${footer}${dialog}</body></html>`;
}

const breadcrumb = (title, category) =>
  `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${href()}">Home</a>${icon("chevron")}${category ? `<a href="${href(category.id + "/")}">${esc(category.title)}</a>${icon("chevron")}` : ""}<span aria-current="page">${esc(title)}</span></nav>`;
function card(article, index = 0) {
  return `<a class="article-card" href="${href(articlePath(article))}"><div class="card-top"><span class="eyebrow">${esc(categoryOf(article.category).title)}</span><span class="card-index">${String(index + 1).padStart(2, "0")}</span></div><h3>${esc(article.title)}</h3><p>${esc(article.description)}</p><span class="card-bottom">${esc(readingTime(article))}${icon("arrow")}</span></a>`;
}
const sectionTitle = (small, title, url, label = "Explore all") =>
  `<div class="section-heading"><div><span class="eyebrow">${small}</span><h2>${title}</h2></div>${url ? `<a class="text-link" href="${url}">${label}${icon("arrow")}</a>` : ""}</div>`;

function home() {
  const beginner = bySlug("getting-started") || articles[0];
  const starters = ["skills-overview", "combat-basics", "quests-and-acts"]
    .map(bySlug)
    .filter(Boolean);
  const latest = articles
    .filter((article) => article.category === "updates")
    .slice(0, 2);
  const quickLinks = [
    "new-skills",
    "mastery-guilds",
    "offline-progression",
    "early-access-patch-notes",
  ]
    .map(bySlug)
    .filter(Boolean);
  const body = `<main id="main"><section class="hero"><div class="hero-art"><img src="${href("assets/hero.jpg")}" alt="Melvor Idle 2 promotional game artwork" width="1920" height="1080" fetchpriority="high"></div><div class="container hero-inner"><div class="hero-copy"><span class="eyebrow hero-eyebrow"><span class="live-dot"></span> THE MELVOR IDLE 2 FIELD GUIDE</span><h1>Progress that<br><em>never sleeps.</em></h1><p>Find your next goal in Melvor Idle 2. Explore its skills, combat, quests, and the systems that connect them in this independent player guide.</p><div class="hero-actions"><a class="button primary" href="${href(articlePath(beginner))}">Start here${icon("arrow")}</a><a class="button secondary" href="#explore">Explore the wiki</a></div><div class="hero-note">${icon("check")}Independent fan wiki · Early Access guide</div></div><div class="art-caption"><span>ADVENTURER'S GUIDE</span>Make every action count.</div></div></section><div class="facts-strip"><div class="container"><span>${icon("check")} Source-led articles</span><span>${icon("skills")} ${articles.length} pages to explore</span><span>${icon("guides")} English edition</span>${external(site.steam, "Play on Steam")}</div></div><div class="container home-layout"><div class="home-main"><section class="getting-started">${sectionTitle("YOUR FIRST STEPS", "A new adventure, one skill at a time.", href("guides/"), "All guides")}<div class="start-grid"><a class="featured-guide" href="${href(articlePath(beginner))}"><img src="${href("assets/hero.jpg")}" alt="Melvor Idle 2 game artwork" width="1920" height="1080" loading="lazy"><div class="featured-copy"><span class="eyebrow">START HERE</span><h3>A guide to<br>your first steps</h3><p>Learn what connects skills, combat, and quests in Melvor Idle 2.</p><span class="text-link">Read the guide${icon("arrow")}</span></div></a><div class="starter-list">${starters.map((article) => `<a href="${href(articlePath(article))}"><span class="mini-icon">${icon(article.category)}</span><div><span class="eyebrow">${esc(categoryOf(article.category).title)}</span><h3>${esc(article.title)}</h3><p>${esc(article.description)}</p></div>${icon("arrow")}</a>`).join("")}</div></div></section><section id="explore" class="explore-section">${sectionTitle("FOLLOW YOUR CURIOSITY", "Explore the game.")}<div class="category-grid">${categories.map((category, index) => `<a class="category-card" href="${href(category.id + "/")}"><span class="category-icon">${icon(category.icon)}</span><span class="category-number">0${index + 1}</span><h3>${esc(category.title)}</h3><p>${esc(category.description)}</p><span class="text-link">${articles.filter((article) => article.category === category.id).length} articles${icon("arrow")}</span></a>`).join("")}</div></section><section class="latest-section">${sectionTitle("FROM THE DEVELOPER", "Early Access notes.", href("updates/"), "All updates")}<div class="article-grid two">${latest.map(card).join("")}</div></section></div><aside class="home-aside"><section class="dossier"><div class="dossier-title">${icon("combat")}<span>THE GAME AT A GLANCE</span></div><h2>Melvor Idle 2</h2><p>A single-player idle RPG set in the world of Melvor, with skills, quests, combat, and offline progression.</p><dl><div><dt>Developer</dt><dd>Games by Malcs</dd></div><div><dt>Publisher</dt><dd>Jagex</dd></div><div><dt>Platform</dt><dd>Steam</dd></div><div><dt>Released</dt><dd>Nov 17, 2026</dd></div><div><dt>Status</dt><dd>Early Access</dd></div></dl>${external(site.steam, "View on Steam", "button secondary full")}${external(site.officialSite, "Official game website", "subtle-link")}</section><section class="quick-links"><h2>Good places to continue</h2>${quickLinks.map((article) => `<a href="${href(articlePath(article))}">${esc(article.title)}${icon("chevron")}</a>`).join("")}</section><section class="companion"><span class="eyebrow">THE COMMUNITY WIKI</span><h2>Looking for game data?</h2><p>Browse the community-maintained Melvor Idle 2 wiki for detailed references and data.</p>${external(site.communityWiki, "melvoridle2.top", "text-link")}</section><p class="editorial-note">Articles cite the official store, game website, and developer news. Source review: ${date(site.reviewed)}.</p></aside></div><section class="bottom-banner"><div class="container"><div><span class="eyebrow">A GUIDE THAT GROWS WITH THE GAME</span><h2>Good knowledge starts here.</h2><p>Found an error or a detail that changed? Share a source and help improve the guide.</p></div>${external(site.repository + "/issues", "Suggest a correction", "button secondary")}</div></section></main>`;
  return page({
    title: "Melvor Idle 2 Wiki — A Field Guide to Your Adventure",
    body,
  });
}

function categoryPage(category) {
  const entries = articles.filter((article) => article.category === category.id);
  return page({
    title: `${category.title} — ${site.shortName} Field Guide`,
    description: category.description,
    path: `${category.id}/`,
    active: category.id,
    body: `<main id="main" class="container page-main">${breadcrumb(category.title)}<header class="page-heading"><span class="eyebrow">${icon(category.icon)} THE FIELD GUIDE / ${entries.length} PAGES</span><h1>${esc(category.title)}</h1><p>${esc(category.description)}</p></header><div class="article-grid">${entries.map(card).join("")}</div><div class="category-bottom"><p>New to Melvor Idle 2?</p><a class="text-link" href="${href("guides/getting-started/")}">Start with the getting started guide${icon("arrow")}</a></div></main>`,
  });
}

function articlePage(article) {
  const category = categoryOf(article.category);
  const toc = article.sections
    .map((section) => `<a href="#${esc(section.id)}">${esc(section.title)}</a>`)
    .join("");
  const content = article.sections
    .map(
      (section) =>
        `<section id="${esc(section.id)}"><h2>${esc(section.title)}</h2>${(section.paragraphs || []).map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}${section.bullets ? `<ul>${section.bullets.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : ""}${section.table ? `<div class="table-scroll"><table><thead><tr>${section.table.headers.map((heading) => `<th scope="col">${esc(heading)}</th>`).join("")}</tr></thead><tbody>${section.table.rows.map((row) => `<tr>${row.map((item) => `<td>${esc(item)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}</section>`,
    )
    .join("");
  const related = (article.related || [])
    .map(bySlug)
    .filter(Boolean)
    .slice(0, 2);
  const body = `<main id="main" class="container page-main article-page">${breadcrumb(article.title, category)}<div class="article-layout"><article><header class="article-heading"><a class="eyebrow" href="${href(category.id + "/")}">${esc(category.title)} / FIELD GUIDE</a><h1>${esc(article.title)}</h1><p class="article-intro">${esc(article.description)}</p><div class="article-meta"><span>By Juary</span><span>Reviewed ${date(article.updated)}</span><span>${esc(readingTime(article))}</span></div></header><figure class="article-visual"><img src="${href("assets/hero.jpg")}" alt="Melvor Idle 2 promotional game artwork" width="1920" height="1080"><figcaption>Melvor Idle 2 game artwork · Source: official Steam listing</figcaption></figure><details class="mobile-toc"><summary>${site.ui.onThisPage}</summary><nav aria-label="Article sections">${toc}</nav></details><div class="prose">${content}<section id="article-sources" class="source-section"><span class="eyebrow">SOURCE NOTES</span><h2>${site.ui.sources}</h2><ul>${article.sources.map((source) => `<li>${external(source.url, source.title)}</li>`).join("")}</ul><p class="source-disclaimer">This independent guide summarizes published sources. Game details may change during Early Access; check the current in-game information for live values and requirements.</p></section></div>${related.length ? `<section class="related-section">${sectionTitle("KEEP EXPLORING", site.ui.related)}<div class="article-grid two">${related.map(card).join("")}</div></section>` : ""}</article><aside class="article-aside"><div class="toc"><span class="eyebrow">${site.ui.onThisPage}</span><nav aria-label="Table of contents">${toc}<a href="#article-sources">Sources & further reading</a></nav><a class="back-top" href="#main">↑ ${site.ui.backToTop}</a></div><section class="companion"><span class="eyebrow">MORE GAME DATA</span><h2>Keep exploring.</h2><p>Visit the community-maintained wiki for detailed item and skill references.</p>${external(site.communityWiki, "melvoridle2.top", "text-link")}</section></aside></div></main>`;
  return page({
    title: article.title,
    description: article.description,
    path: articlePath(article),
    active: article.category,
    body,
    type: "Article",
    article,
  });
}

function aboutPage() {
  return page({
    title: "About this project",
    description:
      "About the independent Melvor Idle 2 player guide by Juary, its sources, scope, and GitHub Pages hosting.",
    path: "about/",
    active: "about",
    body: `<main id="main" class="container page-main">${breadcrumb("About")}<header class="page-heading"><span class="eyebrow">A NOTE FROM THE ADVENTURER'S GUILD</span><h1>A field guide,<br>built for players.</h1><p>Melvor Idle 2 Wiki is an independent guide to the systems and updates in Melvor Idle 2: A RuneScape Adventure.</p></header><div class="about-layout"><div class="prose"><section><h2>What this site covers</h2><p>This project gathers getting-started advice, skill and combat explanations, quest context, and dated Early Access notes. It complements the community-maintained game database at melvoridle2.top; it is not a replacement for detailed item tables or the in-game interface.</p><p>The game entered Steam Early Access on November 17, 2026. Its features and balance can change, so each article includes its review date and links to the sources used.</p></section><section><h2>How information is checked</h2><p>Articles prioritize the official Steam listing, the official Melvor Idle 2 website, and developer announcements. We distinguish dated patch information from general game descriptions, and avoid presenting guesses as confirmed mechanics.</p><p>This wiki is an editorial reference, not a record of hands-on testing. Item values, unlock requirements, balance, and content availability should be checked in the current game version.</p></section><section><h2>Other places to explore</h2><div class="about-link-card"><span class="eyebrow">OFFICIAL GAME WEBSITE</span>${external(site.officialSite, "melvoridle2.runescape.com", "text-link")}<p>Official overview, features, and developer news.</p></div><div class="about-link-card accent"><span class="eyebrow">COMMUNITY GAME DATABASE</span>${external(site.communityWiki, "melvoridle2.top", "text-link")}<p>Community-maintained game data and detailed guides.</p></div></section><section><h2>Credits and corrections</h2><p>The game name, screenshot, and other game materials belong to their respective rights holders. This fan project is not affiliated with or endorsed by Games by Malcs or Jagex.</p><p>Found a mistake? Open an issue with the page URL, game version, and a supporting source. Third-party game assets remain the property of their rights holders.</p>${external(site.repository, "Browse the project on GitHub", "button secondary")}</section></div><aside class="about-aside"><section class="dossier"><div class="dossier-title">${icon("guides")}<span>PROJECT DETAILS</span></div><dl><div><dt>Project</dt><dd>melvoridle2wiki</dd></div><div><dt>Maintainer</dt><dd>Juary</dd></div><div><dt>Language</dt><dd>English</dd></div><div><dt>Hosting</dt><dd>GitHub Pages</dd></div></dl>${external(site.repository, "Source on GitHub", "text-link")}</section></aside></div></main>`,
  });
}

if (output !== resolve(root, "dist"))
  throw new Error("Unexpected output directory");
await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "assets"), { recursive: true });
await cp(resolve(root, "public/assets"), resolve(output, "assets"), {
  recursive: true,
});
await cp(
  resolve(root, "src/styles/style.css"),
  resolve(output, "assets/style.css"),
);
await cp(resolve(root, "src/scripts/app.js"), resolve(output, "assets/app.js"));
const writePage = async (path, html) => {
  const file = resolve(output, path, "index.html");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
};
await writePage("", home());
for (const category of categories)
  await writePage(category.id, categoryPage(category));
for (const article of articles)
  await writePage(articlePath(article), articlePage(article));
await writePage("about", aboutPage());
await writeFile(
  resolve(output, "404.html"),
  page({
    title: "Page not found",
    path: "404.html",
    noindex: true,
    body: `<main id="main" class="container not-found"><span class="eyebrow">FIELD GUIDE / 404</span><h1>Quest location unknown.</h1><p>This page may have moved. There are still plenty of skills and stories to explore.</p><a class="button primary" href="${href()}">Back to the wiki${icon("arrow")}</a></main>`,
  }),
);
await writeFile(
  resolve(output, "search-index.json"),
  JSON.stringify({
    ui: site.ui,
    articles: articles.map((article) => ({
      title: article.title,
      description: article.description,
      category: categoryOf(article.category).title,
      url: href(articlePath(article)),
      text: article.sections
        .flatMap((section) => [
          section.title,
          ...(section.paragraphs || []),
          ...(section.bullets || []),
          ...(section.table?.rows.flat() || []),
        ])
        .join(" "),
    })),
  }),
);
const paths = [
  "",
  "about/",
  ...categories.map((category) => `${category.id}/`),
  ...articles.map(articlePath),
];
await writeFile(
  resolve(output, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${esc(absolute(path))}</loc></url>`).join("")}</urlset>`,
);
await writeFile(
  resolve(output, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${absolute("sitemap.xml")}\n`,
);
await writeFile(resolve(output, ".nojekyll"), "");
console.log(`Built ${paths.length} pages + 404 at ${siteURL.href}`);
