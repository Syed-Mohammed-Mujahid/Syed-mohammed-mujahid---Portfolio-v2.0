/* =====================================================================
   script.js - all behaviour for the portfolio page
   ---------------------------------------------------------------------
   The file is split into independent blocks, each wrapped in its own
   function so variables don't clash. In order:

     1. Typing effect, profile photo pop-up, "Read more" buttons
     2. Palettes dropdown + charts (hero chart, bars, radar, donut, live)
     3. Project filter buttons
     4. Scroll and cursor effects (progress bar, reveal, custom cursor)
     5. Cursor style menu (the 3-dot menu and all cursor styles)
     6. Data Dino Run game (canvas)
     7. Mode switch: Data Science <-> Full Stack (+ the Full Stack code card)
     8. Seamless scrolling (inertia scroll, orbs, hero fade, chip pop)
     9. Certificate hover preview (small preview that follows the cursor)

   Mode (Data Science / Full Stack) is stored on <html data-role="ds|fs">.
   Anything that differs by mode reads that attribute.
   ===================================================================== */

// Typing effect
// Job titles the typing effect cycles through. The mode switch (block 7) replaces
// the contents of this array when you switch between Data Science and Full Stack.
const roles = ["Data Analyst", "Data Scientist", "AI Engineer", "Machine Learning Engineer", "Prompt Engineer"];
// roleIndex = which title is showing, charIndex = how many letters of it are typed,
// roleEl = the <span> the letters are typed into (set later on page load).
let roleIndex = 0, charIndex = 0, roleEl;

// Types the current title one letter at a time (90ms per letter).
// When the whole title is typed it waits 1.5s and starts erasing.
function typeRole() {
  if (charIndex < roles[roleIndex].length) {
    roleEl.textContent += roles[roleIndex].charAt(charIndex++);
    setTimeout(typeRole, 90);
  } else {
    setTimeout(eraseRole, 1500);
  }
}

// Erases the title letter by letter (faster, 45ms), then moves on to the next title.
function eraseRole() {
  if (charIndex > 0) {
    roleEl.textContent = roles[roleIndex].substring(0, --charIndex);
    setTimeout(eraseRole, 45);
  } else {
    roleIndex = (roleIndex + 1) % roles.length;
    setTimeout(typeRole, 300);
  }
}

// Fullscreen profile image
// Profile photo: click the small photo to open it full screen.
// Close it with the X button, by clicking outside the photo, or with Escape.
function initializeFullscreenImage() {
  const profileImage = document.getElementById('profileImage');
  const modal = document.getElementById('fullscreenModal');
  const closeBtn = document.getElementById('closeBtn');

  // Show the overlay and stop the page behind it from scrolling.
  const open = () => { modal.classList.add('active'); document.body.style.overflow = 'hidden'; };
  // Hide the overlay and let the page scroll again.
  const close = () => { modal.classList.remove('active'); document.body.style.overflow = ''; };

  profileImage.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  // Clicking the dark area around the photo also closes it.
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  // Pressing Escape closes the full-screen photo.
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('active')) close();
  });
}

// Runs once the HTML has loaded: starts the typing effect, photo pop-up
// and the "Read more" buttons.
document.addEventListener("DOMContentLoaded", () => {
  // Find the element for the typing effect and start typing.
  roleEl = document.getElementById("dynamicRoles");
  if (roleEl) typeRole();

  initializeFullscreenImage();

  // Read more / read less
  // Project cards: "Read more" shows the long description, "Read less" hides it.
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const more = btn.closest('.project-desc').querySelector('.more-text');
      const expanded = more.hidden;
      more.hidden = !expanded;
      btn.textContent = expanded ? 'Read less' : 'Read more';
      btn.setAttribute('aria-expanded', expanded);
    });
  });

  // Highlight the nav link of the section in view
  const links = document.querySelectorAll('#nav a');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('main section').forEach(s => observer.observe(s));
});

// BLOCK 2: color palette dropdown and every chart on the page.
/* ---------- Palettes and live charts ---------- */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  // Current mode: 'ds' (Data Science) or 'fs' (Full Stack). Read fresh each time it is needed.
  const role = () => document.documentElement.dataset.role || 'ds';
  const $ = s => document.querySelector(s);
  // Helper: create an SVG element, set its attributes, and optionally add it to a parent.
  const mk = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  // Helper: run a function when an element scrolls into view
  // (only once, or every time it enters/leaves if repeat is true).
  const whenVisible = (node, cb, repeat) => {
    // Skill chips pop in one after another when their group scrolls into view.
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { cb(true); if (!repeat) io.unobserve(node); }
      else if (repeat) cb(false);
    }), { threshold: 0.3 });
    io.observe(node);
  };

  /* Palette dropdown */
  // Each palette is [id, display name, main color, second color].
  // The colors shown here are only for the swatches; the real values are the
  // :root[data-palette="..."] rules in style.css.
  const PALETTES = [
    ['cream', 'Cream', '#5b4636', '#a8692a'], ['indigo', 'Indigo', '#4f46e5', '#0d9488'],
    ['ocean', 'Ocean', '#0b5fa5', '#0891b2'],
    ['emerald', 'Emerald', '#047857', '#0e7490'], ['graphite', 'Graphite', '#334155', '#b45309'],
    ['plum', 'Plum', '#7e22ce', '#db2777'], ['sunset', 'Sunset', '#c2410c', '#be185d'],
    ['rose', 'Rose', '#be123c', '#7c3aed'], ['forest', 'Forest', '#166534', '#a16207'],
    ['midnight', 'Midnight', '#1e3a8a', '#7c3aed'], ['arctic', 'Arctic', '#0e7490', '#4f46e5'],
    ['amber', 'Amber', '#b45309', '#1d4ed8'], ['coral', 'Coral', '#d9480f', '#0f766e']
  ];
  // Apply a palette: sets <html data-palette>, ticks the active menu item,
  // updates the swatch on the button and remembers the choice in localStorage.
  function setPalette(p) {
    const pal = PALETTES.find(x => x[0] === p) || PALETTES[0];
    document.documentElement.dataset.palette = pal[0];
    document.querySelectorAll('#paletteList button').forEach(b => b.setAttribute('aria-checked', b.dataset.palette === pal[0]));
    const sw = document.getElementById('palSw');
    if (sw) sw.style.cssText = `--sw1:${pal[2]};--sw2:${pal[3]}`;
    try { localStorage.setItem('palette2', pal[0]); } catch (e) {}
  }
  // Builds the palette dropdown list, opens/closes it, and applies a palette on click.
  function initPalettes() {
    const btn = document.getElementById('paletteBtn'), list = document.getElementById('paletteList');
    if (!btn) { setPalette(document.documentElement.dataset.palette || 'cream'); return; }
    list.innerHTML = '<li class="menu-title" role="presentation">Color palette</li>';
    PALETTES.forEach(([id, name, a, b]) => {
      const li = document.createElement('li'); li.setAttribute('role', 'none');
      li.innerHTML = `<button type="button" role="menuitemradio" aria-checked="false" data-palette="${id}"><span class="pal-sw" style="--sw1:${a};--sw2:${b}"></span>${name}<i class="fas fa-check check"></i></button>`;
      list.appendChild(li);
      li.firstChild.addEventListener('click', () => { setPalette(id); open(false); });
    });
    // Open (true) or close (false) the dropdown and keep aria-expanded in sync.
    function open(o) { list.hidden = !o; btn.setAttribute('aria-expanded', o); }
    btn.addEventListener('click', () => {
      const willOpen = list.hidden; open(willOpen);
      if (willOpen) { // only one dropdown open at a time
        const cl = document.getElementById('cursorList'), cb = document.getElementById('cursorBtn');
        if (cl) { cl.hidden = true; cb.setAttribute('aria-expanded', 'false'); }
      }
    });
    // Clicking anywhere outside the dropdown closes it.
    document.addEventListener('click', e => { if (!list.hidden && !e.target.closest('.palette-menu')) open(false); }, true);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !list.hidden) { open(false); btn.focus(); } });
    setPalette(document.documentElement.dataset.palette || 'cream');
  }
  document.addEventListener('DOMContentLoaded', () => {
    initPalettes();
    initHero(); initBars(); initRadar(); initDonut();
  });
  // Exposed globally so the mode switch (block 7) can redraw the charts for the new mode.
  window.rebuildCharts = () => { initBars(); initRadar(); initDonut(); };

  /* Hero: model training curves */
  // Hero chart (Data Science mode): animates fake model-training curves,
  // accuracy rising and loss falling, one epoch at a time.
  function initHero() {
    const acc = $('#heroAcc'); if (!acc) return;
    const loss = $('#heroLoss'), area = $('#heroArea'), dot = $('#heroDot'), out = $('#heroReadout');
    // N = number of epochs, A = accuracy per epoch, L = loss per epoch.
    const N = 40, A = [], L = [];
    // Generate smooth curves with a tiny wobble so they look like real training.
    for (let e = 0; e < N; e++) {
      A.push(0.55 + 0.42 * (1 - Math.exp(-e / 10)) + Math.sin(e * 1.7) * 0.008);
      L.push(1.1 * Math.exp(-e / 9) + 0.08 + Math.cos(e * 1.3) * 0.02);
    }
    // Convert an epoch / value into SVG coordinates (the chart is 300 x 120).
    const X = e => e / (N - 1) * 300, YA = v => 110 - (v - 0.5) / 0.5 * 95, YL = v => 110 - v / 1.2 * 95;
    const path = (arr, Y, n) => arr.slice(0, n + 1).map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('');
    // Draw both curves up to epoch n and update the text under the chart.
    function draw(n) {
      const pa = path(A, YA, n);
      acc.setAttribute('d', pa);
      loss.setAttribute('d', path(L, YL, n));
      area.setAttribute('d', pa + `L${X(n).toFixed(1)} 120L0 120Z`);
      dot.setAttribute('cx', X(n)); dot.setAttribute('cy', YA(A[n]));
      out.textContent = `epoch ${n + 1}/${N} · acc ${(A[n] * 100).toFixed(1)}% · loss ${L[n].toFixed(2)}`;
    }
    // If the visitor wants less motion, show the finished chart without animating.
    if (reduce) { draw(N - 1); return; }
    // e = current epoch, hold = number of ticks to pause at the end before restarting.
    let e = -1, hold = 0;
    setInterval(() => {
      if (document.hidden) return;
      if (hold) { if (--hold === 0) e = -1; return; }
      e++; draw(e);
      if (e === N - 1) hold = 15;
    }, 130);
  }

  /* Skill bars */
  // Skill bars: builds one row per skill and fills the bars when scrolled into view.
  function initBars() {
    const box = $('#skillBars'); if (!box) return;
    // Skill levels (0-100) for each mode. These are placeholders: edit them to match your real ability.
    const BARS = {
      ds: [['Python', 85], ['SQL', 80], ['Pandas & NumPy', 80], ['Data visualization', 78],
           ['Power BI', 75], ['Machine learning', 70], ['Generative AI', 68], ['Deep learning', 60]],
      fs: [['Python', 85], ['Java', 78], ['REST APIs', 80], ['SQL & databases', 78],
           ['Django & Flask', 72], ['Spring Boot', 70], ['React & JavaScript', 70], ['Git & Docker', 68]]
    };
    const skills = BARS[role()] || BARS.ds;
    box.innerHTML = skills.map(([n, v], i) =>
      `<div class="bar-row" title="${n}: ${v}%"><span>${n}</span><div class="bar-track"><div class="bar-fill" style="--w:${v}%;transition-delay:${i * 80}ms"></div></div><b>${v}%</b></div>`).join('');
    box.classList.remove('in');
    whenVisible(box, () => box.classList.add('in'));
  }

  /* Radar */
  // Radar (spider) chart of skill domains, drawn with SVG shapes.
  function initRadar() {
    const svg = $('#radar'); if (!svg) return;
    svg.innerHTML = ''; svg.classList.remove('in');
    // Domain scores (0-100) for each mode. Edit these to change the radar.
    const AXES = {
      ds: [['Analytics', 82], ['Machine learning', 70], ['Deep learning', 60], ['Generative AI', 68], ['Programming', 78], ['Visualization', 76]],
      fs: [['Backend', 82], ['Frontend', 72], ['Databases', 76], ['APIs', 80], ['DevOps', 62], ['Testing', 60]]
    };
    const axes = AXES[role()] || AXES.ds;
    // C = centre of the chart, R = outer radius, n = number of axes.
    const C = 110, R = 70, n = axes.length;
    // Returns the x,y point on axis i at fraction f (0 to 1) of the radius.
    const pt = (i, f) => {
      const a = (-90 + i * 360 / n) * Math.PI / 180;
      return [C + Math.cos(a) * R * f, C + Math.sin(a) * R * f];
    };
    [0.25, 0.5, 0.75, 1].forEach(f =>
      mk('polygon', { class: 'ring', points: axes.map((_, i) => pt(i, f).join(',')).join(' ') }, svg));
    axes.forEach(([name], i) => {
      const [x, y] = pt(i, 1), [lx, ly] = pt(i, 1.28);
      mk('line', { class: 'axis', x1: C, y1: C, x2: x, y2: y }, svg);
      const t = mk('text', { x: lx, y: ly + 3, 'text-anchor': Math.abs(lx - C) < 4 ? 'middle' : lx > C ? 'start' : 'end' }, svg);
      t.textContent = name;
    });
    const g = mk('g', { class: 'radar-data' }, svg);
    mk('polygon', { points: axes.map(([, v], i) => pt(i, v / 100).join(',')).join(' ') }, g);
    axes.forEach(([name, v], i) => {
      const [x, y] = pt(i, v / 100);
      const c = mk('circle', { cx: x, cy: y, r: 3.5 }, g);
      mk('title', {}, c).textContent = `${name}: ${v}%`;
    });
    whenVisible(svg, () => svg.classList.add('in'));
  }

  /* Donut: projects by category, counted from the cards */
  // Donut chart of project categories. The counts come from the tags on the project
  // cards of the current mode, so it updates by itself when you add or edit cards.
  function initDonut() {
    const svg = $('#donut'), legend = $('#donutLegend'); if (!svg) return;
    svg.innerHTML = ''; legend.innerHTML = ''; svg.classList.remove('dim');
    const tags = [...document.querySelectorAll(`.project-card[data-role-only="${role()}"] .tag`)].map(t => t.textContent.trim());
    const counts = {}; tags.forEach(t => counts[t] = (counts[t] || 0) + 1);
    const entries = Object.entries(counts), total = tags.length;
    // Segment colors: palette variables, so they follow the selected palette.
    const cols = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];
    // Grey background ring behind the colored segments.
    mk('circle', { class: 'ring', cx: 18, cy: 18, r: 15.9155 }, svg);
    const big = mk('text', { class: 'big', x: 18, y: 19.5 }, svg);
    const small = mk('text', { class: 'small', x: 18, y: 24 }, svg);
    const segs = []; let cum = 0;
    entries.forEach(([name, n], i) => {
      const len = n / total * 100, color = cols[i % cols.length];
      const s = mk('circle', { class: 'seg', cx: 18, cy: 18, r: 15.9155, stroke: color,
        'stroke-dasharray': '0 100', 'stroke-dashoffset': 25 - cum, tabindex: 0 }, svg);
      mk('title', {}, s).textContent = `${name}: ${n}`;
      s.dataset.len = len; cum += len; segs.push(s);
      const li = document.createElement('li'); li.tabIndex = 0;
      li.innerHTML = `<i style="background:${color}"></i>${name}<b>${n}</b>`;
      legend.appendChild(li);
      [s, li].forEach(el => {
        el.addEventListener('mouseenter', () => on(i)); el.addEventListener('focus', () => on(i));
        el.addEventListener('mouseleave', off); el.addEventListener('blur', off);
      });
    });
    // Highlight segment i and show its name and count in the middle of the donut.
    function on(i) {
      svg.classList.add('dim'); segs.forEach((s, k) => s.classList.toggle('on', k === i));
      big.textContent = entries[i][1]; small.textContent = entries[i][0];
    }
    // Remove the highlight and show the total number of projects again.
    function off() { svg.classList.remove('dim'); segs.forEach(s => s.classList.remove('on')); big.textContent = total; small.textContent = 'projects'; }
    off();
    whenVisible(svg, () => segs.forEach(s => {
      const l = +s.dataset.len; s.setAttribute('stroke-dasharray', `${Math.max(l - 0.8, 0)} ${100 - Math.max(l - 0.8, 0)}`);
    }));
  }

})();

// BLOCK 3: project filter buttons.
/* ---------- Project filters ---------- */
(function () {
  const $ = s => document.querySelector(s);

  /* Project filters (built from the card tags) */
  // Builds the filter buttons (All, plus one per category) from the cards of the current mode,
  // then shows or hides cards when a button is clicked.
  function initFilters() {
    const box = $('#filters'); if (!box) return;
    // Current mode: 'ds' or 'fs'.
    const role = document.documentElement.dataset.role || 'ds';
    box.textContent = '';
    const all = [...document.querySelectorAll('.project-card')]; all.forEach(c => c.hidden = false);
    const cards = all.filter(c => c.dataset.roleOnly === role);
    const cats = [...new Set(cards.map(c => c.querySelector('.tag').textContent.trim()))];
    // Creates one filter button with its label and count.
    const make = (label, cat, n) => {
      const b = document.createElement('button');
      b.textContent = `${label} (${n})`; b.dataset.cat = cat; b.setAttribute('aria-pressed', cat === 'all');
      b.addEventListener('click', () => {
        box.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
        cards.forEach(c => c.hidden = cat !== 'all' && c.querySelector('.tag').textContent.trim() !== cat);
      });
      box.appendChild(b);
    };
    make('All', 'all', cards.length);
    cats.forEach(cat => make(cat, cat, cards.filter(c => c.querySelector('.tag').textContent.trim() === cat).length));
  }

  document.addEventListener('DOMContentLoaded', () => { initFilters(); });
  // Exposed globally so the mode switch can rebuild the filter buttons.
  window.rebuildFilters = initFilters;
})();

// BLOCK 4: scroll animations and the basic custom cursor.
/* ---------- Scroll and cursor animations ---------- */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = s => document.querySelector(s);

  /* Scroll progress bar */
  // Thin bar at the very top that fills as you scroll down the page.
  function progress() {
    const bar = document.createElement('div');
    bar.id = 'scrollProgress'; document.body.appendChild(bar);
    let tick = false;
    const upd = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      tick = false;
    };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* Reveal on scroll, with stagger */
  // Fade and slide elements in as they scroll into view, with a small delay between neighbours.
  function reveal() {
    // CSS selector list: everything that should animate in.
    const sel = 'section h2,.section-note,.about-grid p,.stats div,.timeline li,.certs li,.skill-group,.chart-panel,.filters,.project-card,.contact-icons a,#contact .lead,.hero-text > *';
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target; io.unobserve(el);
      el.classList.add('in');
      if (el.matches('h2')) el.classList.add('drawn');
      // Remove helper classes afterwards so the element's own hover transitions return
      // Afterwards remove the helper classes so the element's normal hover effects work again.
      setTimeout(() => { el.classList.remove('reveal', 'in'); el.style.transitionDelay = ''; }, 1000 + parseInt(el.style.transitionDelay || 0));
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll(sel).forEach(el => {
      const i = [...el.parentElement.children].indexOf(el);
      el.style.transitionDelay = (i % 4) * 90 + 'ms';
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  /* Count-up numbers in the stats cards */
  // Counts numbers such as "6+" up from 0 when they scroll into view.
  function countUp() {
    document.querySelectorAll('.stats b').forEach(b => {
      const m = b.textContent.trim().match(/^(\d+)(\+?)$/); if (!m) return;
      const target = +m[1], suffix = m[2]; b.textContent = '0' + suffix;
      const io = new IntersectionObserver(es => {
        if (!es[0].isIntersecting) return; io.disconnect();
        const t0 = performance.now(), dur = 1200;
        (function step(t) {
          const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
          b.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      }, { threshold: 0.6 });
      io.observe(b);
    });
  }

  /* Hero parallax */
  // Hero photo and chart drift at different speeds while you scroll.
  function parallax() {
    const hv = $('.hero-visual'); if (!hv) return;
    let tick = false;
    addEventListener('scroll', () => {
      if (tick || scrollY > innerHeight * 1.3) return; tick = true;
      requestAnimationFrame(() => {
        hv.style.setProperty('--py', (-scrollY * 0.06).toFixed(1) + 'px');
        hv.style.setProperty('--cy', (scrollY * 0.09).toFixed(1) + 'px');
        tick = false;
      });
    }, { passive: true });
  }

  /* Hero tilt following the cursor */
  // Tilts the hero picture slightly toward the mouse.
  function tilt() {
    const hero = $('.hero'), hv = $('.hero-visual'); if (!hero || !hv) return;
    hero.addEventListener('mousemove', e => {
      const r = hv.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / innerWidth;
      const y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      hv.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
      hv.style.setProperty('--rx', (-y * 12).toFixed(2) + 'deg');
    });
    hero.addEventListener('mouseleave', () => { hv.style.setProperty('--rx', '0deg'); hv.style.setProperty('--ry', '0deg'); });
  }

  /* Custom cursor: ring follows with easing, dot is instant, clicks send a ripple */
  // Custom cursor: a ring that eases after the mouse, an instant dot,
  // and a small ripple on every click.
  function cursor() {
    const ring = document.createElement('div'), dot = document.createElement('div');
    ring.className = 'cursor-ring'; dot.className = 'cursor-dot';
    document.documentElement.classList.add('custom-cursor'); // hides the system cursor
    document.body.append(ring, dot);
    // mx,my = real mouse position. rx,ry = ring position, which chases the mouse.
    let mx = -100, my = -100, rx = -100, ry = -100;
    // Elements over which the cursor ring grows (links, buttons, tabs...).
    const HOVER = 'a,button,[role=tab],.legend li,.profile-image,.seg,.close-btn,input[type=range],label';
    // Text fields: the ring turns into a thin bar here.
    const TEXT = 'textarea,input[type=text],select';
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.translate = `${mx}px ${my}px`;
      ring.style.opacity = dot.style.opacity = 1;
      ring.classList.toggle('text', !!e.target.closest(TEXT));
      ring.classList.toggle('hover', !e.target.closest(TEXT) && !!e.target.closest(HOVER));
    });
    document.documentElement.addEventListener('mouseleave', () => { ring.style.opacity = dot.style.opacity = 0; });
    document.addEventListener('mousedown', () => ring.classList.add('down'));
    document.addEventListener('mouseup', () => ring.classList.remove('down'));
    document.addEventListener('click', e => {
      const r = document.createElement('div'), inner = document.createElement('div');
      r.style.cssText = `position:fixed;top:0;left:0;pointer-events:none;z-index:10000;transform:translate(${e.clientX}px,${e.clientY}px)`;
      inner.className = 'ripple'; // the inner node scales, so the wrapper keeps the position
      r.appendChild(inner); document.body.appendChild(r);
      setTimeout(() => r.remove(), 700);
    });
    (function loop() {
      // Easing: each frame the ring moves 18% of the way to the mouse.
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.translate = `${rx.toFixed(1)}px ${ry.toFixed(1)}px`;
      requestAnimationFrame(loop);
    })();
  }

  /* Spotlight glow that follows the pointer on cards */
  // Adds a soft spotlight that follows the pointer inside cards.
  function glow() {
    document.querySelectorAll('.project-card,.chart-panel,.skill-group,.stats div,.certs li').forEach(el => el.classList.add('glow'));
    document.addEventListener('mousemove', e => {
      const g = e.target.closest('.glow'); if (!g) return;
      const r = g.getBoundingClientRect();
      g.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      g.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* Magnetic buttons: the pull is measured from a fixed anchor point, so the
     button can never chase or drift away from the pointer */
  // Main buttons lean slightly toward the pointer and spring back.
  function magnetic() {
    let cur = null, base = null;
    const release = el => {
      if (!el) return;
      const from = el.style.translate || '0px 0px';
      el.style.translate = '';
      el.animate({ translate: [from, '0px 0px'] }, { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
    };
    const clamp = (v, m) => Math.max(-m, Math.min(m, v));
    document.addEventListener('mousemove', e => {
      const m = e.target.closest('.btn,.contact-icons a');
      if (cur && cur !== m) { release(cur); cur = null; }
      if (!m) return;
      if (cur !== m) {
        cur = m;
        const r = m.getBoundingClientRect();
        base = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
      m.style.translate = `${clamp((e.clientX - base.x) * 0.15, 7).toFixed(1)}px ${clamp((e.clientY - base.y) * 0.2, 5).toFixed(1)}px`;
    });
    addEventListener('scroll', () => { if (cur) { cur.style.translate = ''; cur = null; } }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    progress();
    if (!reduce) { reveal(); countUp(); parallax(); }
    if (fine && !reduce) { cursor(); glow(); magnetic(); tilt(); }
  });
})();

// BLOCK 5: the 3-dot menu and all the cursor styles.
/* ---------- Cursor style menu ---------- */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;
  // Cursor styles: [id, name, description, icon].
  // To add a style: add a row here, then add its CSS (html[data-cursor="id"]) and any logic below.
  const MODES = [
    ['ring', 'Ring and dot', 'Smooth follower ring', 'fa-circle-dot'],
    ['dot', 'Single dot', 'Minimal and sharp', 'fa-circle'],
    ['trail', 'Comet trail', 'Fading tail of dots', 'fa-meteor'],
    ['spotlight', 'Spotlight', 'Soft glow around the pointer', 'fa-lightbulb'],
    ['crosshair', 'Data crosshair', 'Axis lines with x and y readout', 'fa-crosshairs'],
    ['particles', 'Sparkles', 'Particles burst as you move', 'fa-wand-magic-sparkles'],
    ['orbit', 'Orbit', 'Three dots circling the pointer', 'fa-satellite'],
    ['radar', 'Radar pulse', 'Rings pulsing outward', 'fa-tower-broadcast'],
    ['neon', 'Neon glow', 'Glowing ring and dot', 'fa-bolt'],
    ['frame', 'Snap frame', 'A box that locks onto buttons', 'fa-expand'],
    ['binary', 'Binary rain', '0s and 1s fall from the pointer', 'fa-binary'],
    ['confetti', 'Confetti click', 'Colorful burst on every click', 'fa-champagne-glasses'],
    ['rocket', 'Rocket', 'Emoji that points where you move', 'fa-rocket'],
    ['finger', 'Middle finger', 'Emoji cursor with attitude', 'fa-hand-middle-finger'],
    ['system', 'System default', 'Your normal pointer', 'fa-arrow-pointer']
  ];

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('cursorBtn'), list = document.getElementById('cursorList');
    if (!btn) return;
    if (!fine || reduce) { btn.parentElement.remove(); return; }

    let mode = 'ring', mx = -100, my = -100;
    const dot = document.querySelector('.cursor-dot');
    // Elements over which the cursor ring grows (links, buttons, tabs...).
    const HOVER = 'a,button,[role=tab],[role=menuitemradio],.legend li,.profile-image,.seg,.close-btn,input[type=range],label';

    /* Build the menu */
    list.innerHTML = '<li class="menu-title" role="presentation">Cursor style</li>';
    const items = MODES.map(([id, name, desc, icon]) => {
      const li = document.createElement('li'); li.setAttribute('role', 'none');
      li.innerHTML = `<button type="button" role="menuitemradio" aria-checked="false" data-cursor="${id}"><i class="fas ${icon}"></i>${name}<small>${desc}</small><i class="fas fa-check check"></i></button>`;
      list.appendChild(li); return li.firstChild;
    });
    const openMenu = o => { list.hidden = !o; btn.setAttribute('aria-expanded', o); };
    btn.addEventListener('click', e => { e.stopPropagation(); openMenu(list.hidden); });
    document.addEventListener('click', e => { if (!list.hidden && !e.target.closest('.cursor-menu')) openMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !list.hidden) { openMenu(false); btn.focus(); } });
    items.forEach(b => b.addEventListener('click', () => { setMode(b.dataset.cursor); openMenu(false); }));

    /* Crosshair elements */
    const xh = document.createElement('div'), xv = document.createElement('div'), xl = document.createElement('div');
    xh.className = 'xh xh-h'; xv.className = 'xh xh-v'; xl.className = 'xh xh-label';
    document.body.append(xh, xv, xl);

    /* Emoji cursor */
    const fg = document.createElement('div');
    fg.className = 'cursor-emoji'; fg.textContent = '\u{1F595}'; fg.setAttribute('aria-hidden', 'true');
    document.body.appendChild(fg);
    let tiltTimer;

    /* Extra cursor parts: orbit, radar, snap frame */
    // Emoji used by the emoji cursors.
    const EMOJI = { finger: '\u{1F595}', rocket: '\u{1F680}' };
    const orbit = document.createElement('div'), radar = document.createElement('div'), frame = document.createElement('div');
    orbit.className = 'cursor-orbit'; orbit.innerHTML = '<div class="orbit-spin"><i></i><i></i><i></i></div>';
    radar.className = 'cursor-radar'; radar.innerHTML = '<i></i><i></i><i></i>';
    frame.className = 'cursor-frame';
    document.body.append(orbit, radar, frame);
    let ox = -100, oy = -100, rot = 0, lastBit = 0, lastSmoke = 0;

    // Snap frame: lock onto element t (a button or link), or follow the pointer when t is null.
    function moveFrame(t) {
      if (t) {
        const r = t.getBoundingClientRect();
        frame.style.width = r.width + 12 + 'px'; frame.style.height = r.height + 12 + 'px';
        frame.style.translate = `${r.left - 6}px ${r.top - 6}px`; frame.classList.add('snap');
      } else {
        frame.style.width = frame.style.height = '18px';
        frame.style.translate = `${mx - 9}px ${my - 9}px`; frame.classList.remove('snap');
      }
    }
    // Put the extra cursor parts at the current mouse position (used right after switching style).
    function place() {
      radar.style.translate = `${mx}px ${my}px`;
      if (mode === 'rocket') { fg.style.translate = `${mx}px ${my}px`; fg.style.opacity = 1; }
      if (mode === 'frame') moveFrame(null);
    }
    document.addEventListener('mousemove', e => {
      const t = e.target.closest(HOVER);
      radar.style.translate = `${mx}px ${my}px`;
      if (mode === 'frame') moveFrame(t);
      if (mode === 'rocket') {
        fg.style.translate = `${mx}px ${my}px`; fg.style.opacity = 1; fg.classList.toggle('hover', !!t);
        if (Math.hypot(e.movementX, e.movementY) > 3) {
          const target = Math.atan2(e.movementY, e.movementX) * 180 / Math.PI + 45; // emoji points up-right
          rot += (((target - rot + 540) % 360) + 360) % 360 - 180;
          fg.style.rotate = rot + 'deg';
        }
        // Rocket smoke: while moving, every ~28ms add a flame puff and a smoke puff behind the rocket.
        if (Math.hypot(e.movementX, e.movementY) > 2 && performance.now() - lastSmoke > 28) {
          lastSmoke = performance.now();
          const back = (rot - 45 + 180) * Math.PI / 180; // opposite to the flight direction
          [0, 1].forEach(k => {
            const p = document.createElement('i'), dist = 15 + k * 5;
            p.className = 'smoke' + (k === 0 ? ' fire' : '');
            p.style.cssText = `left:${(mx + Math.cos(back) * dist).toFixed(1)}px;top:${(my + Math.sin(back) * dist).toFixed(1)}px;--dx:${(Math.cos(back) * 26 + Math.random() * 14 - 7).toFixed(0)}px;--dy:${(Math.sin(back) * 26 - 8 + Math.random() * 14 - 7).toFixed(0)}px`;
            p.addEventListener('animationend', () => p.remove());
            document.body.appendChild(p);
          });
        }
      }
      if (mode === 'binary' && performance.now() - lastBit > 45) {
        lastBit = performance.now();
        const b = document.createElement('span');
        b.className = 'bit'; b.textContent = Math.random() < 0.5 ? '0' : '1';
        b.style.cssText = `left:${mx + (Math.random() * 16 - 8)}px;top:${my + 8}px;color:var(--c${1 + Math.floor(Math.random() * 2)})`;
        b.addEventListener('animationend', () => b.remove());
        document.body.appendChild(b);
      }
    });
    document.addEventListener('click', e => {
      if (mode !== 'confetti') return;
      for (let i = 0; i < 24; i++) {
        const c = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 70;
        c.className = 'confetti';
        c.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;background:var(--c${1 + Math.floor(Math.random() * 5)});--x:${(Math.cos(a) * d).toFixed(0)}px;--y:${(Math.sin(a) * d + 30).toFixed(0)}px;--r:${Math.floor(Math.random() * 720 - 360)}deg`;
        c.addEventListener('animationend', () => c.remove());
        document.body.appendChild(c);
      }
    });
    // Animation loop for the Orbit style: its centre eases toward the mouse.
    (function orbitLoop() {
      if (mode === 'orbit') {
        ox += (mx - ox) * 0.3; oy += (my - oy) * 0.3;
        orbit.style.translate = `${ox.toFixed(1)}px ${oy.toFixed(1)}px`;
      }
      requestAnimationFrame(orbitLoop);
    })();
    document.addEventListener('mousedown', () => {
      if (mode !== 'finger') return;
      fg.classList.remove('pop'); void fg.offsetWidth; fg.classList.add('pop');
    });

    /* Trail dots */
    const TRAIL = 14; let trail = [];
    // Comet trail: creates the row of fading dots that follow the pointer.
    function makeTrail() {
      trail = Array.from({ length: TRAIL }, (_, i) => {
        const el = document.createElement('div'), s = 11 - i * 0.55;
        el.className = 'cursor-trail';
        el.style.cssText = `width:${s}px;height:${s}px;margin:${-s / 2}px 0 0 ${-s / 2}px;opacity:${1 - i / (TRAIL + 2)};background:color-mix(in srgb,var(--c1) ${100 - i * 100 / TRAIL}%,var(--c2))`;
        document.body.appendChild(el);
        return { el, x: mx, y: my };
      });
    }
    // Removes the trail dots when you switch to another style.
    const clearTrail = () => { trail.forEach(t => t.el.remove()); trail = []; };

    // Switch cursor style: sets <html data-cursor>, creates or removes helper elements,
    // ticks the menu item and saves the choice.
    function setMode(m) {
      mode = m; root.dataset.cursor = m;
      root.classList.toggle('custom-cursor', m !== 'system');
      clearTrail(); if (m === 'trail') makeTrail();
      if (EMOJI[m]) fg.textContent = EMOJI[m];
      ox = mx; oy = my; place();
      items.forEach(b => b.setAttribute('aria-checked', b.dataset.cursor === m));
      try { localStorage.setItem('cursorMode', m); } catch (e) {}
    }

    /* Pointer tracking for the extra modes */
    let lastSpark = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (dot) dot.classList.toggle('hover', !!e.target.closest(HOVER));
      if (mode === 'finger') {
        fg.style.translate = `${mx}px ${my}px`;
        fg.style.opacity = 1;
        fg.classList.toggle('hover', !!e.target.closest(HOVER));
        fg.style.rotate = Math.max(-25, Math.min(25, e.movementX * 1.4)) + 'deg';
        clearTimeout(tiltTimer); tiltTimer = setTimeout(() => { fg.style.rotate = '0deg'; }, 80);
      }
      if (mode === 'crosshair') {
        xh.style.transform = `translateY(${my}px)`; xv.style.transform = `translateX(${mx}px)`;
        xl.style.transform = `translate(${mx + 16}px,${my + 16}px)`;
        xl.textContent = `x ${Math.round(mx)} · y ${Math.round(my)}`;
      } else if (mode === 'particles' && performance.now() - lastSpark > 35) {
        lastSpark = performance.now();
        const p = document.createElement('div'), a = Math.random() * Math.PI * 2, d = 22 + Math.random() * 30;
        p.className = 'particle';
        p.style.cssText = `left:${mx}px;top:${my}px;background:var(--c${1 + Math.floor(Math.random() * 3)});--x:${(Math.cos(a) * d).toFixed(0)}px;--y:${(Math.sin(a) * d).toFixed(0)}px`;
        p.addEventListener('animationend', () => p.remove());
        document.body.appendChild(p);
      }
    });
    (function loop() {
      if (mode === 'trail' && trail.length) {
        let px = mx, py = my;
        trail.forEach((t, i) => {
          t.x += (px - t.x) * (i ? 0.42 : 0.5); t.y += (py - t.y) * (i ? 0.42 : 0.5);
          t.el.style.transform = `translate(${t.x.toFixed(1)}px,${t.y.toFixed(1)}px)`;
          px = t.x; py = t.y;
        });
      }
      requestAnimationFrame(loop);
    })();

    let saved = 'ring'; try { saved = localStorage.getItem('cursorMode') || 'ring'; } catch (e) {}
    setMode(MODES.some(m => m[0] === saved) ? saved : 'ring');
  });
})();

// BLOCK 6: the endless-runner game on a <canvas>. It plays itself (auto-play)
// and you can take over with a click or the Space key.
/* ---------- Data Dino Run ---------- */
(function () {
  const cv = document.getElementById('dino'); if (!cv) return;
  const ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // H = canvas height, GROUND = y of the ground line, G = gravity (px/s squared),
  // V0 = jump speed (px/s), STEP = fixed physics step so the game behaves the same on every screen.
  const H = 220, GROUND = 186, G = 2000, V0 = 680, STEP = 1 / 120;
  const MONO = 'ui-monospace, Menlo, Consolas, monospace';
  // Obstacle and game-over labels for each mode.
  const LAB = { ds: { NULL: 'NULL', LOSS: 'LOSS', OUT: 'outlier', dead: 'MODEL DIVERGED' }, fs: { NULL: '404', LOSS: 'BUG', OUT: 'timeout', dead: 'SERVER CRASHED' } };
  const lab = () => LAB[document.documentElement.dataset.role] || LAB.ds;
  // Obstacle sizes: w/h in pixels, yb = height of the obstacle's bottom above the ground (the outlier floats).
  const TYPES = { NULL: { w: 44, h: 40, yb: 0 }, LOSS: { w: 56, h: 52, yb: 0 }, OUT: { w: 26, h: 26, yb: 40 } };
  let W = 900;

  /* Theme colors, resolved from the page's CSS variables so palettes and dark mode apply */
  // Hidden element used to turn CSS variables into real color values the canvas can use.
  const probe = document.createElement('span'); probe.style.display = 'none'; document.body.appendChild(probe);
  let C = {};
  const getColor = v => { probe.style.color = `var(${v})`; return getComputedStyle(probe).color; };
  // Read the current theme colors so the game follows the palette and dark mode.
  function colors() {
    C = { ink: getColor('--ink'), muted: getColor('--muted'), accent: getColor('--accent'), signal: getColor('--signal'),
          c3: getColor('--c3'), surface: getColor('--surface'), bg: getColor('--bg') };
  }

  // The dino: x position, y = height above the ground, vy = vertical speed, size and run timer.
  const D = { x: 56, y: 0, vy: 0, w: 44, h: 48, runT: 0 };
  // Game state: speed, score, hi-score, obstacle list, whether a person is controlling it, etc.
  const S = { speed: 340, score: 0, hi: 0, dodged: 0, dead: false, deadT: 0, t: 0, gx: 0,
              manual: false, paused: reduce, obs: [], gap: 260, pts: [], glitches: 0 };

  // Faint dots and plus signs in the background that drift slowly (like a scatter plot).
  function makePoints() {
    S.pts = Array.from({ length: 16 }, () => ({ x: Math.random() * W, y: 20 + Math.random() * 110, r: 1.5 + Math.random() * 2, plus: Math.random() < 0.4 }));
  }
  // Match the canvas to the width of its card (and the screen's pixel density).
  function resize() {
    const w = Math.round(Math.max(320, Math.min(900, cv.parentElement.clientWidth - 24)));
    if (w === W && cv.width === W * Math.min(devicePixelRatio || 1, 2)) return;
    W = w;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makePoints();
  }
  // Start a new run. manual = true if a person is playing, false for auto-play.
  function reset(manual) {
    S.speed = 340; S.score = 0; S.dodged = 0; S.dead = false; S.deadT = 0; S.obs = []; S.gap = 260;
    S.manual = manual; D.y = 0; D.vy = 0; ui();
  }

  /* Obstacles: NULL box, LOSS spikes, floating OUTLIER dot */
  // Create the next obstacle (sometimes two together) just off the right edge.
  function spawn() {
    const n = Math.random() < 0.22 ? 2 : 1; let x = W + 30;
    for (let i = 0; i < n; i++) {
      const r = Math.random();
      const k = i === 0 ? (r < 0.38 ? 'NULL' : r < 0.7 ? 'LOSS' : 'OUT') : (r < 0.6 ? 'NULL' : 'OUT');
      const t = TYPES[k];
      S.obs.push({ k, x, w: t.w, h: t.h, yb: t.yb, passed: false });
      x += t.w + 14;
    }
    S.gap = S.speed * (0.85 + Math.random() * 0.7) + 30;
  }
  // Collision box of an obstacle (slightly smaller than what is drawn, to be forgiving).
  const hitbox = o => {
    const top = GROUND - o.yb - o.h;
    return o.k === 'LOSS' ? [o.x + 9, top + 14, o.x + o.w - 9, GROUND - 3] : [o.x + 5, top + 5, o.x + o.w - 5, GROUND - o.yb - 3];
  };
  // Collision box of the dino.
  const dinoBox = () => [D.x + 9, GROUND - D.y - D.h + 6, D.x + D.w - 7, GROUND - D.y - 3];
  // True if two boxes overlap.
  const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

  // Start a jump if the dino is on the ground.
  function jump() { if (D.y <= 0) { D.vy = V0; D.y = 0.01; } }

  /* Auto-play: jump when the next obstacle is about 0.19s away */
  // Auto-play: jump when the next obstacle is about 0.19 seconds away.
  function ai() {
    if (S.manual || D.y > 0) return;
    const o = S.obs.find(o => o.x + o.w > D.x + 4);
    if (o && o.x - (D.x + D.w) < S.speed * 0.19) jump();
  }

  // Advance the game by dt seconds: speed up, move everything, spawn obstacles, check crashes.
  function update(dt) {
    // After a crash, wait 1.6s then restart in auto-play.
    if (S.dead) { S.deadT += dt; if (S.deadT > 1.6) reset(false); return; }
    S.t += dt; S.speed = Math.min(640, S.speed + 7 * dt);
    S.score += S.speed * dt / 12; S.gx += S.speed * dt; D.runT += dt;
    ai();
    if (D.y > 0 || D.vy > 0) { D.vy -= G * dt; D.y += D.vy * dt; if (D.y <= 0) { D.y = 0; D.vy = 0; } }
    S.pts.forEach(p => { p.x -= S.speed * 0.12 * dt; if (p.x < -6) { p.x = W + 6; p.y = 20 + Math.random() * 110; } });
    S.obs.forEach(o => {
      o.x -= S.speed * dt;
      if (!o.passed && o.x + o.w < D.x) { o.passed = true; S.dodged++; }
    });
    S.obs = S.obs.filter(o => o.x + o.w > -20);
    if (!S.obs.length || Math.max(...S.obs.map(o => o.x + o.w)) < W - S.gap) spawn();
    // Crash check. A person crashing ends the run; in auto-play the obstacle is just removed.
    const db = dinoBox(), crash = S.obs.find(o => hit(db, hitbox(o)));
    if (crash) {
      if (S.manual) { S.dead = true; S.deadT = 0; S.hi = Math.max(S.hi, Math.floor(S.score)); }
      else { S.glitches++; /*GLITCH*/ S.obs = S.obs.filter(o => o !== crash); }
    }
  }

  /* Drawing */
  // Draw a rounded rectangle (falls back to a plain one on old browsers).
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  // Draw the dino from simple rectangles; the legs alternate while running.
  function drawDino() {
    const x = D.x, y = GROUND - D.y - D.h, R = (a, b, c, d) => ctx.fillRect(x + a, y + b, c, d);
    ctx.fillStyle = C.ink;
    R(22, 0, 22, 16); R(8, 14, 26, 24); R(0, 20, 10, 8); R(3, 16, 8, 6); R(32, 26, 8, 4);
    const air = D.y > 0, ph = Math.floor(D.runT * 11) % 2;
    R(12, 38, 8, air || ph ? 10 : 6); R(24, 38, 8, air || !ph ? 10 : 6);
    ctx.fillStyle = C.surface; R(30, 12, 14, 2);
    if (S.dead) {
      ctx.strokeStyle = C.surface; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(x + 33, y + 3); ctx.lineTo(x + 38, y + 8); ctx.moveTo(x + 38, y + 3); ctx.lineTo(x + 33, y + 8); ctx.stroke();
    } else R(34, 3, 4, 4);
  }
  // Draw one obstacle: dashed box (NULL / 404), spikes (LOSS / BUG) or floating dot (outlier / timeout).
  function drawObstacle(o) {
    const top = GROUND - o.yb - o.h;
    ctx.textAlign = 'center';
    if (o.k === 'NULL') {
      ctx.fillStyle = C.surface; ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.setLineDash([5, 3]);
      rr(o.x + 1, top + 1, o.w - 2, o.h - 2, 6); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.accent; ctx.font = `700 13px ${MONO}`; ctx.fillText(lab().NULL, o.x + o.w / 2, top + o.h / 2 + 5);
    } else if (o.k === 'LOSS') {
      ctx.fillStyle = C.c3;
      [[0, o.h], [28, o.h * 0.68]].forEach(([dx, hh]) => {
        ctx.beginPath(); ctx.moveTo(o.x + dx, GROUND); ctx.lineTo(o.x + dx + 14, GROUND - hh); ctx.lineTo(o.x + dx + 28, GROUND); ctx.fill();
      });
      ctx.font = `700 11px ${MONO}`; ctx.fillText(lab().LOSS, o.x + o.w / 2, top - 6);
    } else {
      const bob = Math.sin(S.t * 4 + o.x * 0.04) * 3, cx = o.x + o.w / 2, cy = top + o.h / 2 + bob;
      ctx.fillStyle = C.signal; ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.signal; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(cx, cy, 15 + Math.sin(S.t * 5) * 2, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      ctx.font = `700 11px ${MONO}`; ctx.fillText(lab().OUT, cx, cy - 22);
    }
  }
  const pad = n => String(Math.floor(n)).padStart(5, '0');
  // Draw everything: background dots, ground, obstacles, dino, score and overlays.
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.muted; ctx.strokeStyle = C.muted; ctx.globalAlpha = 0.3; ctx.lineWidth = 1.5;
    S.pts.forEach(p => {
      if (p.plus) { ctx.beginPath(); ctx.moveTo(p.x - 4, p.y); ctx.lineTo(p.x + 4, p.y); ctx.moveTo(p.x, p.y - 4); ctx.lineTo(p.x, p.y + 4); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
    });
    ctx.globalAlpha = 0.55; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, GROUND + 2); ctx.lineTo(W, GROUND + 2); ctx.stroke();
    ctx.globalAlpha = 0.3; ctx.setLineDash([14, 20]); ctx.lineDashOffset = S.gx % 34;
    ctx.beginPath(); ctx.moveTo(0, GROUND + 12); ctx.lineTo(W, GROUND + 12); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    S.obs.forEach(drawObstacle);
    drawDino();
    ctx.font = `700 14px ${MONO}`; ctx.fillStyle = C.muted;
    ctx.textAlign = 'right'; ctx.fillText(`HI ${pad(S.hi)}   ${pad(S.score)}`, W - 14, 24);
    ctx.textAlign = 'left'; ctx.fillText(`dodged ${S.dodged}`, 14, 24);
    if (S.dead) {
      ctx.globalAlpha = 0.75; ctx.fillStyle = C.bg; ctx.fillRect(0, 60, W, 80); ctx.globalAlpha = 1;
      ctx.textAlign = 'center'; ctx.fillStyle = C.ink; ctx.font = `700 22px ${MONO}`; ctx.fillText(lab().dead, W / 2, 98);
      ctx.fillStyle = C.muted; ctx.font = `13px ${MONO}`; ctx.fillText('click to retry, or auto-play restarts', W / 2, 122);
    } else if (S.paused) {
      ctx.textAlign = 'center'; ctx.fillStyle = C.muted; ctx.font = `13px ${MONO}`; ctx.fillText('paused: press Play or click the game', W / 2, 90);
    }
  }

  /* Controls */
  const modeEl = document.getElementById('runnerMode'), autoBtn = document.getElementById('runnerAuto'), pauseBtn = document.getElementById('runnerPause');
  // Update the status text and the Take control / Pause buttons.
  function ui() {
    modeEl.textContent = S.paused ? 'Paused' : S.manual ? 'Your turn: click or press Space to jump' : 'Auto-play running';
    autoBtn.textContent = S.manual ? 'Switch to auto-play' : 'Take control';
    pauseBtn.textContent = S.paused ? 'Play' : 'Pause';
  }
  // Jump requested by a person: take control, restart after a crash, or un-pause.
  function userJump() {
    if (S.paused) { S.paused = false; }
    if (S.dead) { if (S.deadT > 0.4) reset(true); return; }
    S.manual = true; jump(); ui();
  }
  cv.addEventListener('pointerdown', () => { cv.focus({ preventScroll: true }); userJump(); });
  cv.addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); userJump(); } });
  autoBtn.addEventListener('click', () => { S.manual = !S.manual; S.paused = false; ui(); });
  pauseBtn.addEventListener('click', () => { S.paused = !S.paused; ui(); });

  /* Loop: runs only while the game is on screen */
  let last = 0, acc = 0, visible = false, n = 0;
  // Main loop (runs every screen frame). Physics uses a fixed step so speed does not depend on frame rate.
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { last = ts; return; }
    const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    if (!S.paused) { acc += dt; while (acc >= STEP) { update(STEP); acc -= STEP; } }
    if (n++ % 30 === 0) colors();
    draw();
  }
  // The game only runs while it is on screen.
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0.1 }).observe(cv);
  new ResizeObserver(resize).observe(cv.parentElement);
  colors(); resize(); makePoints(); reset(false); requestAnimationFrame(frame);
})();

// BLOCK 7: switching the whole site between Data Science (ds) and Full Stack (fs).
/* ---------- Role switch: Data Science / Full Stack ---------- */
(function () {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Per-mode page title and the job titles for the typing effect.
  const META = {
    ds: { title: 'Syed Mohammed Mujahid | Data Science & AI Engineer',
          roles: ['Data Analyst', 'Data Scientist', 'AI Engineer', 'Machine Learning Engineer', 'Prompt Engineer'] },
    fs: { title: 'Syed Mohammed Mujahid | Python & Java Full Stack Developer',
          roles: ['Full Stack Developer', 'Python Developer', 'Java Developer', 'Backend Engineer', 'Web Developer'] }
  };

  // Switch the site to a mode: sets <html data-role> (CSS then shows/hides
  // elements marked data-role-only), updates title, typing text and buttons,
  // and rebuilds filters and charts.
  function apply(role, initial) {
    root.dataset.role = role;
    document.title = META[role].title;
    // Swap the titles in the typing-effect array (declared at the top of this file).
    roles.splice(0, roles.length, ...META[role].roles); // the typing effect reads this array
    roleIndex = 0; charIndex = 0;
    if (roleEl) roleEl.textContent = '';
    document.querySelectorAll('.role-switch button').forEach(b => b.setAttribute('aria-pressed', b.dataset.role === role));
    try { localStorage.setItem('role', role); } catch (e) {}
    if (!initial) {
      if (window.rebuildFilters) window.rebuildFilters();
      if (window.rebuildCharts) window.rebuildCharts();
    }
  }
  /* Seamless switch: a circle grows from the clicked button and reveals the new site.
     Uses the View Transitions API when available, otherwise a gradient wipe. */
  // Blocks a second click while the switch animation is still running.
  let switching = false;
  const EASE = 'cubic-bezier(.22,.8,.2,1)';
  // After a switch, the hero pieces slide up and sharpen one after another.
  function enterAnimation() {
    const targets = ['.hero-big', '.hero-sub', '.dynamic-roles', '.hero .lead', '.hero .cta']
      .map(q => document.querySelector(q)).filter(Boolean);
    const card = [...document.querySelectorAll('.hero-visual .chart-card')].find(c => c.offsetParent !== null);
    if (card) targets.push(card);
    targets.forEach((el, i) => el.animate(
      { opacity: [0, 1], translate: ['0 28px', '0 0'], filter: ['blur(8px)', 'blur(0px)'] },
      { duration: 700, delay: 260 + i * 90, easing: EASE, fill: 'backwards' }));
  }
  // Animated switch: a circle grows from the clicked point and reveals the new site.
  // Uses the View Transitions API when available, otherwise a gradient wipe.
  function switchTo(role, origin) {
    if (role === root.dataset.role || switching) return;
    const swap = () => { apply(role); window.scrollTo({ top: 0, behavior: 'instant' }); };
    if (reduce) { swap(); return; }
    const x = origin.x, y = origin.y;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const circle = rad => `circle(${rad}px at ${x}px ${y}px)`;
    switching = true;
    const done = () => { switching = false; };

    if (document.startViewTransition) {
      const t = document.startViewTransition(swap);
      t.ready.then(() => {
        root.animate({ clipPath: [circle(0), circle(r)] },
          { duration: 800, easing: EASE, pseudoElement: '::view-transition-new(root)' });
        enterAnimation();
      }).catch(() => {});
      t.finished.then(done, done);
    } else {
      const ov = document.createElement('div'); ov.className = 'role-wipe'; document.body.appendChild(ov);
      ov.animate({ clipPath: [circle(0), circle(r)] }, { duration: 520, easing: EASE, fill: 'forwards' }).finished
        .then(() => { swap(); enterAnimation(); return ov.animate({ opacity: [1, 0] }, { duration: 450, fill: 'forwards' }).finished; })
        .then(() => { ov.remove(); done(); }, () => { ov.remove(); done(); });
    }
  }

  /* Code card in the hero (Full Stack): types Python and Java snippets in turn */
  // Code shown in the Full Stack hero card (typed out, then the next snippet).
  const SNIPS = [
    { file: 'app.py', code: '@app.get("/api/projects")\ndef projects():\n    return db.all(Project)' },
    { file: 'ProjectController.java', code: '@GetMapping("/api/projects")\npublic List<Project> all() {\n    return repo.findAll();\n}' }
  ];
  const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Very small syntax highlighter: strings, @annotations and a few keywords get colored.
  const highlight = t => esc(t).replace(/("[^"]*")|(@\w+)|\b(def|return|public|import)\b/g,
    (m, str, dec, kw) => `<span class="${str ? 's' : dec ? 'd' : 'k'}">${m}</span>`);
  // Typing animation for the code card; it idles while Data Science mode is active.
  function codeLoop() {
    const body = document.getElementById('codeBody'), file = document.getElementById('codeFile');
    if (!body) return;
    let si = 0, ci = 0;
    (function tick() {
      if (root.dataset.role !== 'fs' || document.hidden) { setTimeout(tick, 500); return; }
      const sn = SNIPS[si];
      file.textContent = sn.file;
      if (reduce) { body.innerHTML = highlight(sn.code); setTimeout(tick, 3000); return; }
      if (ci <= sn.code.length) { body.innerHTML = highlight(sn.code.slice(0, ci++)); setTimeout(tick, 38); }
      else { setTimeout(() => { ci = 0; si = (si + 1) % SNIPS.length; tick(); }, 2400); ci = sn.code.length + 1; }
    })();
  }

  document.addEventListener('DOMContentLoaded', () => {
    apply(root.dataset.role === 'fs' ? 'fs' : 'ds', true);
    document.querySelectorAll('.role-switch button').forEach(b => b.addEventListener('click', e => {
      const r = b.getBoundingClientRect();
      const kb = !e.clientX && !e.clientY; // keyboard activation has no pointer position
      switchTo(b.dataset.role, { x: kb ? r.left + r.width / 2 : e.clientX, y: kb ? r.top + r.height / 2 : e.clientY });
    }));
    codeLoop();
  });
})();

// BLOCK 8: smooth, eased scrolling and scroll-linked effects.
/* ---------- Seamless scrolling: inertia scroll, parallax orbs, hero scrub, chip pop ---------- */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce) return;

  /* Inertia (eased) wheel scrolling */
  if (fine) {
    // target = where the wheel wants to go, cur = where the page is now. cur eases toward target.
    let target = scrollY, cur = scrollY, running = false;
    const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
    // Each frame move 11% of the remaining distance, which gives the gliding feel.
    function tick() {
      const d = target - cur;
      cur += d * 0.11;
      if (Math.abs(d) < 0.4) { cur = target; running = false; }
      window.scrollTo({ top: cur, behavior: 'instant' });
      if (running) requestAnimationFrame(tick);
    }
    // Take over mouse-wheel scrolling (but not zoom, text boxes, code boxes or the open photo).
    addEventListener('wheel', e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
      if (document.body.style.overflow === 'hidden') return;              // image modal is open
      if (e.target.closest && e.target.closest('textarea,select,input,pre,.menu-list')) return; // let inner scrolling work
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
      if (!running) { cur = scrollY; target = scrollY; }
      target = Math.max(0, Math.min(maxScroll(), target + dy));
      if (!running) { running = true; requestAnimationFrame(tick); }
    }, { passive: false });
    // If the page was scrolled some other way (keyboard, nav click), stay in sync.
    addEventListener('scroll', () => { if (!running) { cur = target = scrollY; } }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    /* Parallax background orbs */
    // Three big soft glows behind the page that move at different speeds as you scroll.
    const orbs = document.createElement('div');
    orbs.className = 'bg-orbs'; orbs.setAttribute('aria-hidden', 'true'); orbs.innerHTML = '<i></i><i></i><i></i>';
    document.body.prepend(orbs);
    const orb = [...orbs.children], speeds = [-0.07, -0.12, -0.18];

    /* Hero scrub: the intro eases out as you scroll past it */
    // Hero scrub: the intro text fades, rises and shrinks a little as you scroll past it.
    const heroText = document.querySelector('.hero-text'), hero = document.querySelector('.hero');
    let sy = scrollY, hs = 0;
    (function loop() {
      sy += (scrollY - sy) * 0.1;
      orb.forEach((o, i) => { o.style.translate = `0 ${(sy * speeds[i]).toFixed(1)}px`; });
      if (heroText && hero) {
        const t = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * 0.75)));
        hs += (t - hs) * 0.14;
        if (hs > 0.002 || heroText.style.opacity) {
          heroText.style.opacity = (1 - hs * 0.85).toFixed(3);
          heroText.style.translate = `0 ${(-hs * 50).toFixed(1)}px`;
          heroText.style.scale = (1 - hs * 0.05).toFixed(3);
        }
      }
      requestAnimationFrame(loop);
    })();

    /* Skill chips pop in one after another when their group scrolls into view */
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.querySelectorAll('li').forEach((li, i) => li.animate(
        { opacity: [0, 1], scale: [0.5, 1], translate: ['0 14px', '0 0'] },
        { duration: 520, delay: 120 + i * 55, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' }));
    }), { threshold: 0.2 });
    document.querySelectorAll('.skill-group').forEach(g => io.observe(g));
  });
})();

/* ---------- Liquid glass buttons: light that follows the pointer ---------- */
// Stores the pointer position inside the hovered button as --bx / --by.
// The CSS (::before on each button) uses them to place a soft highlight under the pointer.
(function () {
  const SEL = '.btn,.project-btn,.filters button,.runner-bar button,.pal-btn,.menu-btn,.contact-icons a';
  document.addEventListener('pointermove', e => {
    const b = e.target.closest && e.target.closest(SEL);
    if (!b) return;
    const r = b.getBoundingClientRect();
    b.style.setProperty('--bx', (e.clientX - r.left) + 'px');
    b.style.setProperty('--by', (e.clientY - r.top) + 'px');
  }, { passive: true });
})();


/* ---------- Certificate hover preview ---------- */
// BLOCK 9: hovering a certificate shows a small preview card next to the cursor.
// Each <li class="cert"> in index.html carries data-preview (image path), data-title, data-issuer and
// optionally data-extra. If the image file is missing, a certificate-style card is drawn from the text instead.
// The eye button inside each item is a normal link to the original, so it also works on touch screens.
(function () {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.certs .cert');
    if (!items.length || !fine) return;               // touch devices use the eye button instead

    // One shared preview element that is reused for every certificate
    const pv = document.createElement('div');
    pv.className = 'cert-preview'; pv.setAttribute('aria-hidden', 'true');
    pv.innerHTML = '<div class="cp-frame"><img alt="" hidden><div class="cp-fallback"><span class="cp-badge">Certificate</span><strong></strong><em></em><small></small></div></div><span class="cp-caption"></span>';
    document.body.appendChild(pv);
    const img = pv.querySelector('img'), fb = pv.querySelector('.cp-fallback'), cap = pv.querySelector('.cp-caption');
    const [tTitle, tIssuer, tExtra] = [pv.querySelector('strong'), pv.querySelector('em'), pv.querySelector('small')];

    // Show the fallback card straight away; swap to the real image as soon as it has loaded
    img.onload = () => { img.hidden = false; fb.hidden = true; };
    img.onerror = () => { img.hidden = true; fb.hidden = false; };
    function show(li) {
      const d = li.dataset;
      tTitle.textContent = d.title; tIssuer.textContent = d.issuer; tExtra.textContent = d.extra || '';
      cap.textContent = 'Click the eye to open the original';
      img.hidden = true; fb.hidden = false;
      if (img.getAttribute('src') !== d.preview) img.src = d.preview;
      else if (img.complete && img.naturalWidth) img.onload();   // same image as last time and it loaded fine
    }

    // Keep the preview next to the cursor but inside the window
    function move(x, y) {
      const w = pv.offsetWidth, h = pv.offsetHeight;
      let nx = x + 22, ny = y + 22;
      if (nx + w > innerWidth - 12) nx = x - w - 22;
      if (ny + h > innerHeight - 12) ny = innerHeight - h - 12;
      pv.style.translate = `${Math.max(12, nx)}px ${Math.max(12, ny)}px`;
    }

    items.forEach(li => {
      li.addEventListener('mouseenter', e => { show(li); move(e.clientX, e.clientY); pv.classList.add('on'); });
      li.addEventListener('mousemove', e => move(e.clientX, e.clientY));
      li.addEventListener('mouseleave', () => pv.classList.remove('on'));
      // Keyboard users: tabbing to the eye button shows the preview too
      li.addEventListener('focusin', () => { show(li); const r = li.getBoundingClientRect(); move(r.left + r.width * 0.45, r.top + r.height / 2); pv.classList.add('on'); });
      li.addEventListener('focusout', () => pv.classList.remove('on'));
    });
    addEventListener('scroll', () => pv.classList.remove('on'), { passive: true });
  });
})();