# CV Style Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the visual layout of `cv/cv.tex` (header, section styling, list alignment, margins) per the approved design doc, without changing any CV content.

**Architecture:** Single-file LaTeX edit. `cv/cv.tex` is compiled with `pdflatex` (no build system, no test framework) — the verification cycle for every task is "compile with `pdflatex`, confirm no new errors/warnings, render the affected page(s) to PNG, visually inspect." This replaces the usual automated-test step throughout this plan.

**Tech Stack:** LaTeX (`pdflatex`), packages already in use (`ebgaramond`, `enumitem`, `xcolor`, `hyperref`) plus one new package (`titlesec`), all confirmed present in the local TeX Live 2026 install via `kpsewhich`.

## Global Constraints

- Do not change any CV content: wording, entries, ordering, dates, names. This is a style-only pass (per `docs/superpowers/specs/2026-07-21-cv-style-redesign-design.md`).
- Stay strictly black/white — no color accents.
- Keep EB Garamond as the typeface; do not introduce a new font family.
- Every task must end with a clean `pdflatex` compile (exit code reflects success, no new `Overfull \hbox` / `Underfull \hbox` warnings — baseline is 0, confirmed via `grep -c "Overfull\|Underfull" cv/cv.log` on the current file).
- Conference Presentation entries use the two-line structured format (bold venue/year line, indented italic title line) — confirmed with the user via mockup comparison, not the single-paragraph alternative.
- Working directory for all `pdflatex` runs is `cv/` (relative paths for aux/log/pdf outputs already land there).

---

### Task 1: Preamble cleanup, section/subsection styling, and shared list style

**Files:**
- Modify: `cv/cv.tex` (preamble, lines 1–43 in the current file; also the two raw `\section*{Publication}` / `\section*{Working Paper}` calls at lines 156 and 173)

**Interfaces:**
- Produces: `\cvsection{...}` macro (now renders as bold all-caps + thin rule beneath, via `titlesec`), `\cvsubsection{...}` macro (unchanged behavior, tightened spacing only), and a new `cvlist` environment (`enumitem`-based, `leftmargin=2em, topsep=2pt, itemsep=3pt, label={}`) that every later task uses for entry lists. All later tasks depend on `cvlist` existing.

- [ ] **Step 1: Confirm `titlesec` is installed**

Run: `kpsewhich titlesec.sty`
Expected: prints a path (e.g. `/usr/local/texlive/2026/texmf-dist/tex/latex/titlesec/titlesec.sty`). If empty, stop and report — the rest of this task depends on it.

- [ ] **Step 2: Edit the preamble**

In `cv/cv.tex`, replace:

```latex
\usepackage[utf8]{inputenc}
\usepackage[full]{textcomp}
\usepackage{CJKutf8}
\usepackage[lf]{ebgaramond}
% \usepackage[scaled,swashQ]{garamondx}
\usepackage[T1]{fontenc}

\usepackage{enumitem}
\usepackage[a4paper,left=.9in, right=.9in, top=1.5in, bottom=1.5in]{geometry}
\usepackage{url}
\usepackage[dvipsnames]{xcolor}
\usepackage{amsmath}
```

with:

```latex
\usepackage[utf8]{inputenc}
\usepackage[full]{textcomp}
\usepackage[lf]{ebgaramond}
% \usepackage[scaled,swashQ]{garamondx}
\usepackage[T1]{fontenc}

\usepackage{enumitem}
\usepackage[a4paper,left=.9in, right=.9in, top=.85in, bottom=.85in]{geometry}
\usepackage{url}
\usepackage[dvipsnames]{xcolor}
\usepackage{amsmath}
\usepackage{titlesec}
```

(`CJKutf8` is removed — it was loaded but never used anywhere in the document; `titlesec` is added for the section-rule styling below.)

- [ ] **Step 3: Replace the section-definition block**

Replace:

```latex
\setlength\parindent{2em}

\thispagestyle{empty}

% define cv section
\newcommand{\cvsection}[1]{\section*{\rmfamily#1}}
\newcommand{\cvsubsection}[1]{\subsection*{\rmfamily\hspace{1.6em}#1}}

% begin
\begin{document}
```

with:

```latex
\setlength\parindent{2em}
\setlength{\parskip}{2pt}

\thispagestyle{empty}

% section headings: bold caps + thin rule beneath, tightened spacing
\titleformat{\section}{\rmfamily\bfseries\large}{}{0pt}{}[{\titlerule[0.4pt]}]
\titlespacing{\section}{0pt}{10pt}{6pt}
\titlespacing{\subsection}{0pt}{8pt}{4pt}

\newcommand{\cvsection}[1]{\section*{\MakeUppercase{#1}}}
\newcommand{\cvsubsection}[1]{\subsection*{\rmfamily\hspace{1.6em}#1}}

% shared hanging-indent list style used by every entry list in this CV
\newlist{cvlist}{itemize}{1}
\setlist[cvlist]{leftmargin=2em, topsep=2pt, itemsep=3pt, label={}}

% begin
\begin{document}
```

- [ ] **Step 4: Uppercase the two raw `\section*` calls**

Replace:

```latex
% publication
\section*{Publication}
```

with:

```latex
% publication
\section*{\MakeUppercase{Publication}}
```

Replace:

```latex
\section*{Working Paper}
```

with:

```latex
\section*{\MakeUppercase{Working Paper}}
```

(These two headings don't go through the `\cvsection` macro, so they need the same `\MakeUppercase` wrapping applied directly, otherwise they'd be the only sections left in title case.)

- [ ] **Step 5: Compile and check for errors**

Run (from the `cv/` directory): `pdflatex -interaction=nonstopmode cv.tex > /tmp/cv_task1.log 2>&1; echo "exit: $?"; grep -c "Overfull\|Underfull" cv.log; grep "! " cv.log`

Expected: `exit: 0`, the Overfull/Underfull count is `0`, and the `grep "! "` command prints nothing (no LaTeX errors). The document body hasn't changed yet, so this confirms the preamble/macro changes alone don't break the build.

- [ ] **Step 6: Commit**

```bash
git add cv/cv.tex
git commit -m "CV style: tighten margins, remove unused CJKutf8, add ruled section headings"
```

---

### Task 2: Header redesign

**Files:**
- Modify: `cv/cv.tex` (the `\begin{document}` header block through the old contact-information lines, originally lines ~44–68)

**Interfaces:**
- Consumes: nothing new from Task 1 besides the already-tightened `\parskip`.
- Produces: no new macros; this is a self-contained visual block. Later tasks are unaffected by this task's internals.

- [ ] **Step 1: Replace the header block**

Replace:

```latex
% begin
\begin{document}

% name
\begin{center}
    \Huge{
    \rmfamily
    \textbf{Shih-Yang Lin}}
\end{center}
\vspace{20pt}


\setlength{\parskip}{1pt}
\renewcommand{\arraystretch}{1.25}

% Contact Information

\noindent Department of Economics \hfill +886-3-890-5537

\noindent National Dong Hwa University (NDHU)\hfill \href{mailto:linsy@gms.ndhu.edu.tw}{\texttt{linsy@gms.ndhu.edu.tw}}

\noindent No.1, Sec. 2, Da Hsueh Rd., Shoufeng, Hualien 974301, Taiwan \hfill \href{https://orcid.org/0000-0003-0864-0187}{\texttt{ORCID: 0000-0003-0864-0187}}


\setlength{\parskip}{3pt}
```

with:

```latex
% begin
\begin{document}

% name and header
\begin{center}
    {\LARGE\rmfamily\bfseries Shih-Yang Lin}\\[4pt]
    {\normalsize\rmfamily\itshape Assistant Professor, Department of Economics, National Dong Hwa University}\\[8pt]
    {\small\rmfamily No.\,1, Sec.\,2, Da Hsueh Rd., Shoufeng, Hualien 974301, Taiwan}\\[2pt]
    {\small\rmfamily +886-3-890-5537 \quad$\cdot$\quad \href{mailto:linsy@gms.ndhu.edu.tw}{\texttt{linsy@gms.ndhu.edu.tw}} \quad$\cdot$\quad \href{https://orcid.org/0000-0003-0864-0187}{\texttt{ORCID: 0000-0003-0864-0187}}}
\end{center}
\vspace{6pt}
\noindent\rule{\linewidth}{0.8pt}
\vspace{4pt}

\renewcommand{\arraystretch}{1.25}
```

- [ ] **Step 2: Compile and render page 1**

Run (from `cv/`): `pdflatex -interaction=nonstopmode cv.tex > /tmp/cv_task2.log 2>&1; echo "exit: $?"; grep -c "Overfull\|Underfull" cv.log; pdftoppm -png -r 130 -f 1 -l 1 cv.pdf /tmp/cv_task2_page`

Expected: `exit: 0`, warning count `0`, and `/tmp/cv_task2_page-1.png` is produced.

- [ ] **Step 3: Visually inspect the rendered page**

Open `/tmp/cv_task2_page-1.png` (e.g. via the Read tool) and confirm: name centered and bold, subtitle line centered beneath it, address/phone/email/ORCID centered below that separated by "·", a bold horizontal rule spans the text width beneath the contact block, and the `mailto:`/ORCID links are still present (hyperref wraps them — a visual check can't confirm link targets, just that the text renders; link integrity is confirmed in Task 8).

- [ ] **Step 4: Commit**

```bash
git add cv/cv.tex
git commit -m "CV style: redesign header as centered name/subtitle/contact block with rule"
```

---

### Task 3: Education and Academic Employment — hanging-indent lists

**Files:**
- Modify: `cv/cv.tex` (Education section, originally lines ~81–92; Academic Employment section, originally lines ~114–123)

**Interfaces:**
- Consumes: `cvlist` environment from Task 1.

- [ ] **Step 1: Replace the Education section**

Replace:

```latex
% Education
\cvsection{Education}
\indent 

\textbf{National Taiwan University (NTU)}, Taipei, Taiwan

\hspace{2em}Ph.D., Economics, 2018 - 2025

\hspace{2em}M.A., Economics, 2016

\textbf{National Sun Yat-Sen University (NSYSU)}, Kaohsiung, Taiwan

\hspace{2em}B.A., Political Economy, 2008
```

with:

```latex
% Education
\cvsection{Education}
\indent
\textbf{National Taiwan University (NTU)}, Taipei, Taiwan
\begin{cvlist}
    \item Ph.D., Economics, 2018--2025
    \item M.A., Economics, 2016
\end{cvlist}

\textbf{National Sun Yat-Sen University (NSYSU)}, Kaohsiung, Taiwan
\begin{cvlist}
    \item B.A., Political Economy, 2008
\end{cvlist}
```

- [ ] **Step 2: Replace the Academic Employment section**

Replace:

```latex
% academic employment
\cvsection{Academic Employment}
\indent

\textbf{National Dong Hwa University}, Hualien, Taiwan

\hspace{2em}Assistant Professor, Department of Economics, 2025 - present

\textbf{Academia Sinica}, Taipei, Taiwan

\hspace{2em}Research Assistant, 2016 - 2018
```

with:

```latex
% academic employment
\cvsection{Academic Employment}
\indent
\textbf{National Dong Hwa University}, Hualien, Taiwan
\begin{cvlist}
    \item Assistant Professor, Department of Economics, 2025--present
\end{cvlist}

\textbf{Academia Sinica}, Taipei, Taiwan
\begin{cvlist}
    \item Research Assistant, 2016--2018
\end{cvlist}
```

- [ ] **Step 3: Compile and render page 1**

Run (from `cv/`): `pdflatex -interaction=nonstopmode cv.tex > /tmp/cv_task3.log 2>&1; echo "exit: $?"; grep -c "Overfull\|Underfull" cv.log; pdftoppm -png -r 130 -f 1 -l 1 cv.pdf /tmp/cv_task3_page`

Expected: `exit: 0`, warning count `0`.

- [ ] **Step 4: Visually inspect**

Open `/tmp/cv_task3_page-1.png` and confirm the degree lines under each institution are indented consistently under the institution name (2em), matching the indentation depth of the institution line itself.

- [ ] **Step 5: Commit**

```bash
git add cv/cv.tex
git commit -m "CV style: convert Education/Academic Employment entries to hanging-indent lists"
```

---

### Task 4: Grants and Awards — fix orphaned wrapped line

**Files:**
- Modify: `cv/cv.tex` (Grants and Awards section, originally lines ~140–153)

**Interfaces:**
- Consumes: `cvlist` environment from Task 1.

- [ ] **Step 1: Replace the section**

Replace:

```latex
% distinction, award, honor, and fellowship
\cvsection{Grants and Awards}
\indent

Best Doctoral Dissertation Award (Sho-Chieh Tsiang Theoretical Economics), Taiwan Economic Association, 2025

Doctoral Dissertation Fellowship of the Humanities and Social Sciences, National Science and Technology Council, 2023

Asia Bank Scholarship, National Taiwan University, 2022

Liu Ta-Chung Scholarship, National Taiwan University, 2020

Harold H.C. Han Scholarship, National Taiwan University, 2019

Chu, Cyrus C. Y. and Chen, Tain-Jy Scholarship, National Taiwan University, 2018
```

with:

```latex
% distinction, award, honor, and fellowship
\cvsection{Grants and Awards}

\begin{cvlist}
    \item Best Doctoral Dissertation Award (Sho-Chieh Tsiang Theoretical Economics), Taiwan Economic Association, 2025
    \item Doctoral Dissertation Fellowship of the Humanities and Social Sciences, National Science and Technology Council, 2023
    \item Asia Bank Scholarship, National Taiwan University, 2022
    \item Liu Ta-Chung Scholarship, National Taiwan University, 2020
    \item Harold H.C. Han Scholarship, National Taiwan University, 2019
    \item Chu, Cyrus C. Y. and Chen, Tain-Jy Scholarship, National Taiwan University, 2018
\end{cvlist}
```

- [ ] **Step 2: Compile and render page 1**

Run (from `cv/`): `pdflatex -interaction=nonstopmode cv.tex > /tmp/cv_task4.log 2>&1; echo "exit: $?"; grep -c "Overfull\|Underfull" cv.log; pdftoppm -png -r 130 -f 1 -l 1 cv.pdf /tmp/cv_task4_page`

Expected: `exit: 0`, warning count `0`.

- [ ] **Step 3: Visually confirm the orphan-line bug is fixed**

Open `/tmp/cv_task4_page-1.png`. In the original PDF, the "Doctoral Dissertation Fellowship..." entry wraps and leaves a lone "2023" on its own line at the left margin. Confirm that entry now wraps with the second line indented under the first (no orphaned "2023" sitting alone at the page margin).

- [ ] **Step 4: Commit**

```bash
git add cv/cv.tex
git commit -m "CV style: fix orphaned wrapped line in Grants and Awards via hanging-indent list"
```

---

### Task 5: Conference Presentation — two-line structured entries

**Files:**
- Modify: `cv/cv.tex` (Conference Presentation and Discussant sections, originally lines ~201–217)

**Interfaces:**
- Consumes: `cvlist` environment from Task 1.

- [ ] **Step 1: Replace the section**

Replace:

```latex
% talks
\cvsection{Conference Presentation}
\indent 

National Taipei University Interschool Academic Conference -- 2026, Taipei, Taiwan, January 19, 2026. “A Two-Stage Pseudo-Maximum Likelihood Method for Poisson Models with Two Binary Endogenous Explanatory Variables: An Application to Trade and Investment Agreements.”

Taiwan Economic Association Annual Conference -- 2025, Taipei, Taiwan, November 29, 2025. “Asymptotic Distribution of OLS Estimator for Interrupted Time Series Model.”

Macroeconometric Modelling Workshop -- 2024, Taipei, Taiwan, December 11-12, 2024. “The Labor Supply of Married Women and Spousal Tax Deductions in Japan.”

Macroeconometric Modelling Workshop -- 2023, Taipei, Taiwan, November 27-28, 2023. “Financial Frictions and Uncertainty Shocks.”

Taiwan Economic Association Conference -- 2016. “Estimating the Willingness to Pay for the Civic Value When Absentee Voting Is Not Allowed.”

\cvsubsection{Discussant}
\indent

Discussant, “Overnight Momentum and Intraday Reversal: Evidence from Taiwan Listed Companies,” National Taipei University Interschool Academic Conference, 2026.
```

with:

```latex
% talks
\cvsection{Conference Presentation}

\begin{cvlist}
    \item \textbf{National Taipei University Interschool Academic Conference --- 2026}, Taipei, Taiwan, January 19, 2026. \\
    \hspace*{1.2em}\textit{“A Two-Stage Pseudo-Maximum Likelihood Method for Poisson Models with Two Binary Endogenous Explanatory Variables: An Application to Trade and Investment Agreements.”}
    \item \textbf{Taiwan Economic Association Annual Conference --- 2025}, Taipei, Taiwan, November 29, 2025. \\
    \hspace*{1.2em}\textit{“Asymptotic Distribution of OLS Estimator for Interrupted Time Series Model.”}
    \item \textbf{Macroeconometric Modelling Workshop --- 2024}, Taipei, Taiwan, December 11--12, 2024. \\
    \hspace*{1.2em}\textit{“The Labor Supply of Married Women and Spousal Tax Deductions in Japan.”}
    \item \textbf{Macroeconometric Modelling Workshop --- 2023}, Taipei, Taiwan, November 27--28, 2023. \\
    \hspace*{1.2em}\textit{“Financial Frictions and Uncertainty Shocks.”}
    \item \textbf{Taiwan Economic Association Conference --- 2016}. \\
    \hspace*{1.2em}\textit{“Estimating the Willingness to Pay for the Civic Value When Absentee Voting Is Not Allowed.”}
\end{cvlist}

\cvsubsection{Discussant}

\begin{cvlist}
    \item Discussant, “Overnight Momentum and Intraday Reversal: Evidence from Taiwan Listed Companies,” National Taipei University Interschool Academic Conference, 2026.
\end{cvlist}
```

- [ ] **Step 2: Compile and render the affected page**

Run (from `cv/`): `pdflatex -interaction=nonstopmode cv.tex > /tmp/cv_task5.log 2>&1; echo "exit: $?"; grep -c "Overfull\|Underfull" cv.log; pdftoppm -png -r 130 cv.pdf /tmp/cv_task5_page`

Expected: `exit: 0`, warning count `0`. Check the generated page images to find which page now holds Conference Presentation (page count may have shifted from earlier tasks).

- [ ] **Step 3: Visually confirm the two-line structure**

Open the relevant `/tmp/cv_task5_page-N.png`. Confirm each entry shows: a bold "Conference — Year" first line with venue/date, followed by an indented italic title on its own line, and that the indented title line is indented *further* than the first line (per the approved Option B mockup).

- [ ] **Step 4: Commit**

```bash
git add cv/cv.tex
git commit -m "CV style: restructure Conference Presentation as two-line entries"
```

---

### Task 6: Teaching Experience — hanging-indent safety net

**Files:**
- Modify: `cv/cv.tex` (Teaching Experience section, originally lines ~221–256)

**Interfaces:**
- Consumes: `cvlist` environment from Task 1, with a local `leftmargin=0pt` override to preserve the current flush-left position of course rows.

- [ ] **Step 1: Replace the section**

Replace:

```latex
% teaching experience
\cvsection{Teaching Experience}
\indent

\cvsubsection{National Dong Hwa University -- Instructor}
\indent

\textbf{Macrofinance}\hfill Fall 2026

\textbf{Macroeconomics (I)}\hfill Fall 2026

\textbf{Econometric Analysis (II)}\hfill Spring 2026

\textbf{Introduction to Big Data Analytics}\hfill Fall 2025

\textbf{Development Economics}\hfill Fall 2025

\textbf{Financial Markets}\hfill Spring 2025--2026

\textbf{Financial Economics (I)}\hfill Spring 2025

\cvsubsection{National Taiwan University -- Teaching Assistant}
\indent

\textbf{Macroeconomic Theory (I)}\hfill Fall 2019--2022

\textbf{Macroeconomic Theory (II)}\hfill Spring 2020--2021, 2024

\textbf{Theory of Income and Employment (III)}\hfill Fall 2022

\textbf{Economics: Empirical Study and Forecasting (I \& II)}\hfill 2019--2022

\textbf{Basic Macroeconomics}\hfill Summer 2022

\textbf{Basic Quantitative Method}\hfill Summer 2020--2022

\textbf{Principle of Economics (I \& II)}\hfill 2019--2020
```

with:

```latex
% teaching experience
\cvsection{Teaching Experience}

\cvsubsection{National Dong Hwa University -- Instructor}

\begin{cvlist}[leftmargin=0pt]
    \item \textbf{Macrofinance}\hfill Fall 2026
    \item \textbf{Macroeconomics (I)}\hfill Fall 2026
    \item \textbf{Econometric Analysis (II)}\hfill Spring 2026
    \item \textbf{Introduction to Big Data Analytics}\hfill Fall 2025
    \item \textbf{Development Economics}\hfill Fall 2025
    \item \textbf{Financial Markets}\hfill Spring 2025--2026
    \item \textbf{Financial Economics (I)}\hfill Spring 2025
\end{cvlist}

\cvsubsection{National Taiwan University -- Teaching Assistant}

\begin{cvlist}[leftmargin=0pt]
    \item \textbf{Macroeconomic Theory (I)}\hfill Fall 2019--2022
    \item \textbf{Macroeconomic Theory (II)}\hfill Spring 2020--2021, 2024
    \item \textbf{Theory of Income and Employment (III)}\hfill Fall 2022
    \item \textbf{Economics: Empirical Study and Forecasting (I \& II)}\hfill 2019--2022
    \item \textbf{Basic Macroeconomics}\hfill Summer 2022
    \item \textbf{Basic Quantitative Method}\hfill Summer 2020--2022
    \item \textbf{Principle of Economics (I \& II)}\hfill 2019--2020
\end{cvlist}
```

- [ ] **Step 2: Compile and render the affected page**

Run (from `cv/`): `pdflatex -interaction=nonstopmode cv.tex > /tmp/cv_task6.log 2>&1; echo "exit: $?"; grep -c "Overfull\|Underfull" cv.log; pdftoppm -png -r 130 cv.pdf /tmp/cv_task6_page`

Expected: `exit: 0`, warning count `0`.

- [ ] **Step 3: Visually confirm no position shift**

Open the relevant `/tmp/cv_task6_page-N.png`. Confirm course rows are still flush against the same left position they were at before this task (the `leftmargin=0pt` override should make this a no-op visually — only a structural change).

- [ ] **Step 4: Commit**

```bash
git add cv/cv.tex
git commit -m "CV style: wrap Teaching Experience rows in hanging-indent list for consistency"
```

---

### Task 7: Full-document QA pass

**Files:**
- None modified — verification only. May produce a fix-up commit to `cv/cv.tex` if this step surfaces a problem.

**Interfaces:**
- Consumes: the fully redesigned `cv/cv.tex` from Tasks 1–6.

- [ ] **Step 1: Clean rebuild**

Run (from `cv/`): `rm -f cv.aux cv.log cv.out; pdflatex -interaction=nonstopmode cv.tex > /tmp/cv_final_1.log 2>&1; pdflatex -interaction=nonstopmode cv.tex > /tmp/cv_final_2.log 2>&1; echo "exit: $?"`

Expected: `exit: 0` on the second pass (two passes so cross-references/page numbers settle, matching how the original was built).

- [ ] **Step 2: Check for warnings and errors**

Run: `grep -c "Overfull\|Underfull" cv.log; grep "! " cv.log; pdfinfo cv.pdf | grep Pages`

Expected: warning count `0`, no `! ` error lines, and note the final page count for comparison against the original 4 pages (content wasn't cut, so a small increase from tighter conference-entry formatting is acceptable — the goal was less *wasted* space, not a hard page cap).

- [ ] **Step 3: Render every page and inspect**

Run: `pdftoppm -png -r 130 cv.pdf /tmp/cv_final_page`

Then open each `/tmp/cv_final_page-N.png` (via the Read tool) and confirm for the whole document:
- Header renders as designed (Task 2).
- Every section heading is bold, all-caps, with a thin rule beneath.
- No orphaned wrapped lines anywhere (Education, Academic Employment, Grants and Awards, Conference Presentation, Discussant, Teaching Experience).
- Conference Presentation entries show the two-line bold/italic structure.
- No page has drastically more empty trailing space than content requires (i.e., the margin/spacing tightening actually reduced the dead space seen on the original page 4).

- [ ] **Step 4: Confirm hyperlinks survived**

Run: `pdftotext cv.pdf - | grep -i "linsy@gms.ndhu.edu.tw\|orcid.org\|doi.org"`

Expected: the email address, ORCID URL text, and DOI links' visible text all still appear in the extracted text (confirms `\href` content wasn't accidentally dropped during the edits).

- [ ] **Step 5: If any check fails, fix and re-run from Step 1**

Do not proceed until Steps 2–4 all pass clean.

- [ ] **Step 6: Final commit (only if Step 5 required fixes; otherwise skip — Tasks 1–6 already committed the substantive changes)**

```bash
git add cv/cv.tex cv/cv.pdf
git commit -m "CV style: fix QA issues found in full-document review"
```

- [ ] **Step 7: Commit the compiled PDF**

The design's deliverable is a recompiled `cv/cv.pdf`. Stage and commit it so the redesigned CV is what's live on the site:

```bash
git add cv/cv.pdf
git commit -m "Recompile CV with redesigned style"
```

---

## Self-Review Notes

- **Spec coverage:** header redesign → Task 2; section heading rule/caps → Task 1; hanging-indent fix for flat lists → Tasks 3, 4, 6; Conference Presentation two-line format → Task 5; margin/spacing tightening → Task 1 (geometry + parskip + titlespacing); CJKutf8 removal → Task 1; color/font constraints → enforced as Global Constraints, nothing in any task introduces color or a font change; Reference section spacing → inherits automatically from the global `\parskip`/section-rule changes in Task 1, no dedicated task needed since the design doc scoped it to "beyond spacing/font consistency" only.
- **Placeholder scan:** none — every task step has literal LaTeX to paste in, not descriptions.
- **Type/name consistency:** `cvlist` is defined once in Task 1 and used identically (same name, same default options, with one local `[leftmargin=0pt]` override in Task 6) in every later task — no naming drift.
