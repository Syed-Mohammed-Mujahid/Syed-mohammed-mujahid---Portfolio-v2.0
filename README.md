# Syed-mohammed-mujahid---Portfolio-v2.0
# Syed Mohammed Mujahid | Portfolio v2.0

A personal portfolio website with **two modes in one site**: **Data Science / AI** and **Python & Java Full Stack Developer**. Switch between them with one button and the whole site changes: headline, skills, charts, projects and more.

Built with plain **HTML, CSS and JavaScript**. There is no framework, no build step and no dependencies to install.

> **Live site:**(https://mohammedmujahid.vercel.app/)

---

## Features

**Two portfolios in one**
- A switch in the hero changes the site between *Data Science* and *Full Stack*, with a circular reveal animation.
- Your choice is remembered the next time you visit.

**Design**
- Warm **Cream** colour palette by default, plus 12 more palettes in a dropdown (Indigo, Ocean, Emerald, Graphite, Plum, Sunset, Rose, Forest, Midnight, Arctic, Amber, Coral).
- "Liquid glass" buttons, menus and cards with soft blur, highlights and shadows.
- Smooth animations: scroll reveals, count-up numbers, animated underlines and pop-in skill chips.
- Respects the "reduce motion" setting on a visitor's device.

**Sections**
- **Home:** big title, typing effect for job roles, resume download, profile photo (click to enlarge) and a live model-training chart.
- **About:** short bio and key numbers.
- **Education and certifications:** timeline (B.E., final-year project, VTU internship at Prinston Smart Engineers, ongoing DataMites AI Engineer program) and certificates.
- **Skills:** grouped skill chips for each mode.
- **Charts:** skill bars, a radar chart and a project-mix donut chart, all drawn with SVG and no chart library.
- **Projects:** filter buttons by category and project cards with GitHub (and live) links.
- **Contact:** email, LinkedIn and GitHub.
- **Data Dino Run:** a small endless-runner game that plays itself. Click it or press Space to take over.

**Certificates**
- Hover a certificate to see a small preview that follows the cursor.
- The eye button opens the original certificate in a new tab.

**Custom cursors (desktop only)**
- A 3-dot menu in the header switches between 14 cursor styles: ring, dot, comet trail, spotlight, crosshair, sparkles, orbit, radar pulse, neon, snap frame, binary rain, confetti, rocket and more.

**Mobile friendly**
- The header is a single line: name, colour palette button and a menu button.
- The page links open in a panel under the header, and the colour palettes show in one row you swipe sideways.
- Layouts stack into one column, and cursor effects are turned off on touch screens.

---

## Tech stack

| Part | Used |
| --- | --- |
| Structure | HTML5 |
| Styling | CSS3 (custom properties, grid, flexbox, `color-mix`, `backdrop-filter`) |
| Behaviour | Vanilla JavaScript (no libraries) |
| Icons | [Font Awesome](https://fontawesome.com/) (CDN) |
| Fonts | Sora and IBM Plex Sans (Google Fonts) |

---

## Project structure

```
.
├── index.html        # All page content (both modes live here)
├── style.css         # All styles
├── script.js         # All behaviour (commented in numbered blocks)
├── README.md
└── assests/          # Images and files (folder name is spelled "assests" in the code)
    ├── file_0000000021508211991dca2ebb3ee8be.png    # profile photo
    ├── Syed_Mohammed_Mujahid_Resume.pdf             # resume download
    └── certificates/                                # certificate preview images
```

---

## Run it locally

No install is needed. Download or clone the repository, then either:

- double-click `index.html`, or
- run a small local server from the project folder:

```bash
# Python
python -m http.server 8000

# or Node.js
npx serve
```

Then open `http://localhost:8000`.

---

## Customise it

| To change | Where |
| --- | --- |
| Text, projects, links, certificates | `index.html` (elements marked `data-role-only="ds"` show only in Data Science mode, `data-role-only="fs"` only in Full Stack mode) |
| Skill bar and radar percentages | `script.js`, in the `BARS` and `AXES` objects |
| Typing-effect job titles | `script.js`, in the `META` object (block 7) |
| Colours and palettes | `style.css`, the `:root` variables and the `:root[data-palette="..."]` rules |
| Default palette | `data-palette="cream"` on the `<html>` tag in `index.html` |
| Certificate preview images | Files in `assests/certificates/`, referenced by `data-preview` in `index.html` |
| Cursor styles | `script.js`, the `MODES` list (block 5), with matching CSS for each style |

The skill percentages are self-assessed, so edit them to match your real level.

---

## Deploy

**Vercel**
1. Push the project to a GitHub repository.
2. On [vercel.com](https://vercel.com), choose **Add New → Project** and import the repository.
3. Set **Framework Preset** to *Other* and leave the build and output settings empty.
4. Click **Deploy**.

**GitHub Pages**
1. In the repository, open **Settings → Pages**.
2. Choose **Deploy from a branch**, then **main** and **/(root)**.
3. Save, and the site goes live in a minute or two.

Keep the file names and upper/lower case exactly as written in the code, because hosting servers treat `Resume.pdf` and `resume.pdf` as different files.

---

## Contact

- **Email:** mujahidrebel2004@gmail.com
- **LinkedIn:** [linkedin.com/in/mohammed-mujahid-56b63331a](https://www.linkedin.com/in/mohammed-mujahid-56b63331a)
- **GitHub:** [github.com/Syed-Mohammed-Mujahid](https://github.com/Syed-Mohammed-Mujahid)

---

© 2025 Syed Mohammed Mujahid. All rights reserved. The code is shared for viewing and learning; please do not copy the personal content, photos or certificates.
