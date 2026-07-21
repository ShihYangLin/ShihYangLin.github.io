# CV LaTeX Style Redesign

## Goal

Refine the visual layout of `cv/cv.tex` while keeping the conservative
academic-CV tone expected in economics job-market documents. Content
(entries, wording, ordering of sections) does not change — this is a
typography/layout pass only.

## Problems in the current template

- Header uses `\hfill` to align a long mailing address against short
  phone/email lines, producing uneven line breaks.
- Section headings (`\cvsection`) are bold text with no visual separator,
  giving the page little hierarchy.
- Several list-like sections (Grants and Awards, Conference Presentation,
  Education/Employment sub-entries) are built from plain paragraphs with
  manual `\hspace` indentation. When an entry wraps to a second line, the
  wrapped line falls back to the left margin instead of staying indented
  under the first line — e.g., the 2023 award entry on page 1 leaves a
  lone "2023" on its own line. The Conference Presentation section (page
  3) shows this most visibly, with every wrapped line breaking alignment.
- Margins are `top=1.5in, bottom=1.5in`, which is unusually large and
  pushes the document to 4 pages with a mostly empty page 4.
- `CJKutf8` is imported but never used (no `\begin{CJK}` anywhere in the
  document) — dead package load.

## Design

### Header
- Name centered, reduced from `\Huge` to `\LARGE`, bold.
- One centered subtitle line beneath the name: title + department +
  institution (e.g. "Assistant Professor, Department of Economics,
  National Dong Hwa University").
- Contact block centered below that: address on its own line; a second
  line with phone, email, and ORCID separated by "·" instead of the
  current `\hfill`-based two-column layout.
- A bold horizontal rule (`0.8pt`) below the contact block closes out the
  header.

### Section headings
- `\cvsection` renders as bold, all-caps text followed by a thin
  horizontal rule (`0.4pt`) directly beneath it.
- `\cvsubsection` keeps its current indentation convention but gains the
  same treatment at a smaller scale (no rule, to avoid visual noise at
  the subsection level).
- Vertical space before/after each section is tightened relative to the
  current template.

### Lists and hanging indents
- Flat paragraph-based lists (Grants and Awards, Discussant, Education
  and Academic Employment sub-entries, Teaching Experience course lists)
  convert to `itemize` with `leftmargin` set and no bullet, so wrapped
  lines stay indented under the first line instead of falling back to the
  page margin.
- **Conference Presentation** entries use a two-line structured format
  (confirmed with user via mockup comparison):
  - Line 1: **Conference name — year** (bold), venue, date.
  - Line 2: indented, italicized paper title.
  This is more vertical space than a single-paragraph entry, but reads
  much less cluttered given each entry already carries four sub-fields
  (name, location, date, title).

### Margins and spacing
- `top`/`bottom` reduced from `1.5in` to `~0.85in`; `left`/`right` stay
  at `0.9in`.
- `\parskip` and itemize `itemsep` tightened throughout to reduce dead
  vertical space, without shrinking font size.
- Expected effect: fewer wasted pages (current page 4 is mostly blank),
  though exact final page count depends on how content reflows — no
  content will be cut or abbreviated to force a page count.

### Font and color
- Keep EB Garamond as the body/heading typeface (no font family change).
- Remove the unused `CJKutf8` package.
- Stay strictly black/white — no color accents, consistent with the
  "conservative academic" direction the user chose over the
  website-branded-color option.

## Out of scope

- No changes to CV content, section order, or wording.
- No changes to the Reference section's three-column `tabular`/`minipage`
  layout beyond spacing/font consistency with the rest of the redesign.
- No changes to `index.html` or the website's CV download link.

## Verification

- Recompile `cv/cv.tex` to `cv/cv.pdf` with `pdflatex` and confirm no new
  `Overfull \hbox` warnings introduced by the redesign.
- Visually check each page (render to PNG) for: no orphaned wrapped
  lines, consistent hanging indents, headings/rules rendering as
  described.
- Confirm hyperlinks (`mailto:`, DOI links, `href`) still resolve
  correctly in the recompiled PDF.
