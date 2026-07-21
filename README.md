# Shih-Yang Lin — Quarto personal website

A Quarto rebuild of the personal site, styled to match the HTML version
(Libre Franklin + IBM Plex Mono, Newsreader for abstracts, slate-blue accent).

## Files

- `_quarto.yml` — site config + navbar (Home / Research / Teaching / CV)
- `custom.scss` — all styling (matches the HTML design)
- `_include.html` — Google Fonts
- `index.qmd`, `research.qmd`, `teaching.qmd`, `cv.qmd` — the four pages

## Preview locally

Install Quarto (https://quarto.org/docs/get-started/), then from this folder:

```bash
quarto preview      # live-reloading local preview
quarto render       # build static site into ./_site
```

## Publish to GitHub Pages

### Automatic (recommended — no local Quarto needed)

`.github/workflows/publish.yml` is included. Once set up, you just edit a
`.qmd`, push to `main`, and GitHub renders + publishes for you.

One-time setup:

1. Put these files at the **root** of your `ShihYangLin.github.io` repo
   (so `.github/workflows/publish.yml` sits at the repo root) and push to `main`.
2. The Action runs and creates a `gh-pages` branch.
3. Repo **Settings → Pages → Source = gh-pages branch** → Save.

From then on: **edit → push → auto-published**. You never render locally.

### Manual (alternative)

Install Quarto locally and run:

```bash
quarto publish gh-pages
```

## To finish

- Drop a `cv.pdf` in this folder — the CV page's "Download PDF" button links to it.
- Add publications to a `.bib` file if you'd like automatic citation formatting later.
