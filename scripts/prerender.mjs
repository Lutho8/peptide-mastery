// Build-time prerendering for the web build (BrowserRouter).
//
// After `vite build`, we SSR-render every SEO route to static HTML (content +
// meta + JSON-LD) so crawlers get real pages without executing JS. The native
// (Capacitor) build uses `build:native` and does NOT run this — it keeps
// HashRouter and its single index.html.
//
// Routes mirror scripts/generate-sitemap.ts. Admin, auth, and app-only screens
// (bloodwork, cycles, inventory, analytics, reminders) are intentionally
// excluded — gated/interactive, no SEO value.
import { build } from "vite";
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { pathToFileURL } from "url";

const DIST = resolve("dist");
const TMP = resolve(".ssr-tmp");

const staticRoutes = [
  // NOTE: "/" (the app home) is intentionally NOT prerendered — it is a
  // client-gated app entry that renders an auth-dependent redirect/spinner,
  // not marketing content. It stays as the default SPA shell (index.html).
  "/free-course", "/live-qna", "/coa-verification", "/blog", "/faq",
  "/privacy", "/terms", "/disclaimer",
  "/weight-loss-peptides-south-africa", "/healing-peptides-south-africa",
  "/anti-aging-peptides-south-africa", "/cognitive-peptides-south-africa",
  "/growth-hormone-peptides-south-africa", "/libido-peptides-south-africa",
  "/bpc-157-vs-tb-500", "/peptides-for-women-south-africa",
  "/peptides-diabetes-fatty-liver", "/peptide-storage-reconstitution-guide",
  "/bpc-157-dosage-guide-south-africa",
];

const peptides = [
  "bpc-157","tb-500","retatrutide","tirzepatide","ipamorelin","cjc-1295",
  "ghk-cu","epitalon","ss-31","semax","selank","thymosin-alpha-1",
  "pt-141","dsip","semaglutide",
];
const categories = [
  "healing","weight-loss","longevity","cognitive","immune",
  "growth-hormone","skin-hair","hormonal","metabolic",
];
const guides = ["reconstitution","injection","bloodwork"];

function blogSlugs() {
  try {
    const src = readFileSync(resolve("src/data/blogPosts.ts"), "utf8");
    return [...new Set([...src.matchAll(/["']?slug["']?\s*:\s*["']([^"']+)["']/g)].map((m) => m[1]))];
  } catch { return []; }
}

async function main() {
  const routes = [
    ...staticRoutes,
    ...peptides.map((s) => `/peptides/${s}`),
    ...categories.map((s) => `/categories/${s}`),
    ...guides.map((s) => `/guides/${s}`),
    ...blogSlugs().map((s) => `/blog/${s}`),
  ];
  console.log(`Prerendering ${routes.length} routes…`);

  await build({
    logLevel: "error",
    build: {
      ssr: resolve("src/entry-server.tsx"),
      outDir: TMP,
      emptyOutDir: true,
      ssrEmitAssets: false,
      rollupOptions: { output: { entryFileNames: "entry-server.mjs" } },
    },
  });

  const { render } = await import(pathToFileURL(resolve(TMP, "entry-server.mjs")).href);
  const template = readFileSync(resolve(DIST, "index.html"), "utf8");
  let ok = 0;
  const failures = [];

  for (const route of routes) {
    try {
      const { html, head } = render(route);
      let page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
      const headTags = [head.title, head.meta, head.link, head.script].filter(Boolean).join("\n    ");
      if (headTags) {
        // Remove the static template <title> and the static (non-Helmet)
        // canonical/og:url/description so the per-route Helmet tags are the
        // only ones present. Without this, every page also carries the
        // homepage canonical/og:url, and crawlers may honour that first tag.
        page = page.replace(/<title>.*?<\/title>/s, "");
        page = page.replace(/\n?\s*<link rel="canonical"[^>]*>/i, "");
        page = page.replace(/\n?\s*<meta property="og:url"[^>]*>/i, "");
        page = page.replace(/\n?\s*<meta name="description"[^>]*>/i, "");
        page = page.replace("</head>", `    ${headTags}\n  </head>`);
      }
      const outPath = route === "/"
        ? resolve(DIST, "index.html")
        : resolve(DIST, route.replace(/^\//, ""), "index.html");
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, page);
      ok++;
    } catch (err) {
      failures.push({ route, error: err?.message ?? String(err) });
    }
  }

  if (!process.env.KEEP_SSR_TMP) rmSync(TMP, { recursive: true, force: true });
  console.log(`✓ Prerendered ${ok}/${routes.length} routes.`);
  if (failures.length) {
    console.error(`✗ ${failures.length} route(s) failed:`);
    for (const f of failures) console.error(`  ${f.route}: ${f.error}`);
    if (ok === 0) process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
