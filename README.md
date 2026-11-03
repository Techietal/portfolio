# Silaparasetti Lohith — Portfolio

A fast, single-page portfolio site for Silaparasetti Lohith, AI/ML Engineer — with project pages, published research, and an auto-generated social sharing image. Built with Astro and plain CSS. No frameworks, no databases, no web fonts.

## 1. What this is

This is your personal portfolio website. Everything you see on the page (your bio, jobs, projects, papers, skills, links) comes from small text files in `src/content/` — so you can keep the site up to date without touching any code.

## 2. Requirements

- **Node.js >= 22** (check with `node -v`)
- A terminal, and that's it — everything else is installed by `npm install`

## 3. Run it locally

```bash
npm install     # once, the first time
npm run dev     # start the local server
```

Then open <http://localhost:4321> in your browser. Edit any file and the page updates instantly.

## 4. Commands

| Command | What it does |
|---|---|
| `npm install` | Installs the dependencies (first time only) |
| `npm run dev` | Starts the local dev server at `http://localhost:4321` |
| `npm run build` | Type-checks the site and builds it into `dist/` |
| `npm run preview` | Serves the built `dist/` folder so you can check it before deploying |
| `npm run og` | Regenerates `public/og-image.png` (the preview image shown when you share the site) |

## 5. Change your content

You never need to touch code to update the site — only these files:

| I want to... | Edit this |
|---|---|
| change bio, headline, stats, skills, links | `src/content/profile/profile.yaml` |
| add a job | copy a file in `src/content/experience/`, change it, set `order` (1 = shown at the top) |
| add a project | copy a file in `src/content/projects/`; the filename becomes the page URL (e.g. `my-app.md` → `/projects/my-app`) |
| add a paper | copy a file in `src/content/publications/` |
| replace the resume | overwrite `public/silaparasetti-lohith-resume.pdf` (keep the same filename) |
| change the photo | replace `src/assets/lohith.jpg` (same filename), then run `npm run og` |
| change colours | the 6 lines at the top of `src/styles/theme.css` |

After changing the photo, run `npm run og` once so the social sharing image matches.

## 6. Project structure

```
portfolio/
├─ astro.config.mjs          site config (URL, sitemap)
├─ package.json              dependencies + the commands above
├─ public/
│  ├─ favicon.svg            browser tab icon
│  ├─ og-image.png           social sharing image (generated)
│  └─ silaparasetti-lohith-resume.pdf
├─ scripts/
│  └─ make-og.mjs            generates public/og-image.png
└─ src/
   ├─ assets/lohith.jpg      your photo
   ├─ content/
   │  ├─ profile/profile.yaml    bio, headline, stats, skills, links
   │  ├─ experience/             one markdown file per job
   │  ├─ projects/               one markdown file per project
   │  └─ publications/           one markdown file per paper
   ├─ components/              the visual building blocks
   ├─ layouts/                 the shared page shell
   ├─ lib/                     data loading + SEO helpers
   ├─ pages/                   the routes (home, /projects/..., 404, robots.txt)
   └─ styles/                  theme.css (colours) + global.css
```

## 7. If something breaks

Read the error message — it usually names the exact file and the exact field that's wrong (for example a missing `title` or a link that isn't a valid URL). Fix that field and save; the dev server reloads by itself. If `npm run build` fails, it stops at the first problem and tells you where.

## 8. Publish (deploy to Vercel)

First time only:

1. Push the repo to GitHub as `Techietal/portfolio`.
2. In Vercel, choose **Add New → Project** and import that repo.
3. Vercel should detect the settings automatically — confirm they are:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Add one environment variable: **`SITE_URL`** = your final site URL (e.g. `https://silaparasetti-lohith-portfolio.vercel.app`).
5. Click **Deploy**.

After that, publishing is just:

```bash
git add .
git commit -m "Update content"
git push
```

Vercel deploys automatically on every push to `main`, and every branch gets its own preview link so you can check changes before merging.

## 9. Keep your existing Google ranking

Your current address `silaparasetti-lohith-portfolio.vercel.app` is already indexed by Google — keep it:

1. In Vercel, **remove** the `silaparasetti-lohith-portfolio.vercel.app` domain from the old project and **add** it to this new project (or rename the projects). The old repo stays untouched; the same URL now serves the new site.
2. In [Google Search Console](https://search.google.com/search-console), add/verify the property and submit the sitemap: `https://silaparasetti-lohith-portfolio.vercel.app/sitemap-index.xml`.
3. Use "Request indexing" on the homepage once after the first deploy.

Later (optional): a custom domain like `lohith.dev` — add it in Vercel, update `SITE_URL`, and set the old `*.vercel.app` address to permanently redirect (301) to it.

## 10. SEO checklist

- Keep project `tagline` values at **120 characters or fewer** (the build warns/fails otherwise).
- Always write real, descriptive alt text for images.
- After big content changes, re-submit the sitemap in Google Search Console.
- If you change your name or photo, run `npm run og` so the sharing image stays correct.

## 11. Editing from the browser

For quick text fixes without installing anything: open the GitHub repo and press **`.`** (the period key) — that opens GitHub's web editor. Edit the file in `src/content/`, commit, and Vercel redeploys automatically.
