(function () {
  const visualBuilders = {
    radar: radarVisual,
    map: mapVisual,
    timeline: timelineVisual,
    actors: actorsVisual,
    compass: compassVisual,
    intercept: interceptVisual,
    boardroom: boardroomVisual,
    scales: scalesVisual,
    badge: badgeVisual,
    memory: memoryVisual,
    loop: loopVisual,
    reports: reportsVisual,
    blueprint: blueprintVisual,
    horizon: horizonVisual,
    debrief: debriefVisual
  };

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function renderPresentation(slides) {
    const stage = document.querySelector("[data-stage]");
    const nav = document.querySelector("[data-nav]");
    const progress = document.querySelector("[data-progress]");
    const notes = document.querySelector("[data-notes]");
    const current = document.querySelector("[data-current]");
    const total = document.querySelector("[data-total]");

    total.textContent = String(slides.length).padStart(2, "0");
    stage.innerHTML = "";
    nav.innerHTML = "";

    slides.forEach((slide, index) => {
      const section = createSlide(slide, index, slides.length);
      stage.appendChild(section);

      const dot = el("button", "slide-dot");
      dot.type = "button";
      dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
      dot.addEventListener("click", () => {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      nav.appendChild(dot);
    });

    const sections = Array.from(stage.querySelectorAll(".slide"));
    const dots = Array.from(nav.querySelectorAll(".slide-dot"));

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const index = Number(entry.target.dataset.index);
          setActive(index, slides, sections, dots, progress, notes, current);
        });
      },
      { threshold: 0.58 }
    );

    sections.forEach(section => observer.observe(section));
    wireKeys(slides, sections, notes);
    mountStarfield();
    setActive(0, slides, sections, dots, progress, notes, current);
  }

  function createSlide(slide, index, total) {
    const section = el("section", `slide slide-${slide.visual}`);
    section.dataset.index = index;

    const shell = el("div", "slide-shell");
    const copy = el("div", "slide-copy");
    const visual = el("div", "slide-visual");
    const foot = el("div", "slide-footer");

    copy.appendChild(el("p", "eyebrow", slide.eyebrow));
    copy.appendChild(el("h1", "slide-title", slide.title));
    copy.appendChild(el("p", "slide-subtitle", slide.subtitle));

    const pointList = el("ul", "point-list");
    slide.points.forEach(point => {
      pointList.appendChild(el("li", "", `<span>${escapeHtml(point)}</span>`));
    });
    copy.appendChild(pointList);

    visual.appendChild(buildVisual(slide.visual));

    foot.appendChild(el("span", "timecode", slide.time));
    foot.appendChild(el("span", "slide-count", `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`));

    shell.appendChild(copy);
    shell.appendChild(visual);
    shell.appendChild(foot);
    section.appendChild(shell);
    return section;
  }

  function buildVisual(type) {
    const builder = visualBuilders[type] || radarVisual;
    const wrap = el("div", `visual visual-${type}`);
    wrap.innerHTML = builder();
    return wrap;
  }

  function setActive(index, slides, sections, dots, progress, notes, current) {
    const percentage = ((index + 1) / slides.length) * 100;
    progress.style.width = `${percentage}%`;
    current.textContent = String(index + 1).padStart(2, "0");
    notes.textContent = slides[index].notes;

    sections.forEach((section, sectionIndex) => {
      section.classList.toggle("is-active", sectionIndex === index);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
    });
  }

  function wireKeys(slides, sections, notes) {
    document.addEventListener("keydown", event => {
      const active = document.querySelector(".slide.is-active");
      const index = active ? Number(active.dataset.index) : 0;

      if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        sections[Math.min(index + 1, slides.length - 1)].scrollIntoView({ behavior: "smooth" });
      }
      if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        sections[Math.max(index - 1, 0)].scrollIntoView({ behavior: "smooth" });
      }
      if (event.key.toLowerCase() === "n") {
        notes.parentElement.classList.toggle("is-open");
      }
    });
  }

  function mountStarfield() {
    const canvas = document.querySelector("[data-starfield]");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let stars = [];
    let raf = 0;

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      stars = Array.from({ length: Math.min(150, Math.floor(width / 9)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.6 + 0.2,
        v: Math.random() * 0.22 + 0.04,
        a: Math.random() * 0.65 + 0.15
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
      stars.forEach(star => {
        star.y += star.v;
        if (star.y > height + 8) {
          star.y = -8;
          star.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(179, 231, 255, ${star.a})`;
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    resize();
    draw();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else draw();
    });
  }

  function radarVisual() {
    return `
      <div class="radar-core"></div>
      <div class="radar-ring ring-one"></div>
      <div class="radar-ring ring-two"></div>
      <div class="radar-ring ring-three"></div>
      <div class="radar-sweep"></div>
      <div class="coordinate-grid"></div>
    `;
  }

  function mapVisual() {
    return `
      <svg viewBox="0 0 680 520" aria-hidden="true" class="map-svg">
        <path class="land land-left" d="M70 45 C190 24 245 90 220 175 C195 260 270 280 245 365 C225 435 130 455 62 405 Z"/>
        <path class="land land-right" d="M470 35 C590 65 635 160 592 245 C548 330 618 380 540 458 C475 520 365 465 388 370 C415 262 365 215 405 135 C420 92 435 60 470 35 Z"/>
        <path class="waterway" d="M333 10 C302 92 365 130 318 202 C270 275 350 326 315 404 C292 456 320 496 340 520"/>
        <path class="border-pulse" d="M355 5 C326 90 386 134 340 205 C296 274 374 324 340 403 C318 456 348 500 365 520"/>
        <g class="map-points">
          <circle cx="318" cy="203" r="6"/>
          <circle cx="340" cy="403" r="6"/>
          <circle cx="355" cy="92" r="6"/>
        </g>
      </svg>
    `;
  }

  function timelineVisual() {
    return `
      <div class="timeline-rail">
        ${["Board", "Blind", "Intercept", "Seize"].map((label, index) => `
          <div class="timeline-node" style="--i:${index}">
            <span></span><strong>${label}</strong>
          </div>
        `).join("")}
      </div>
    `;
  }

  function actorsVisual() {
    return `
      <div class="actor-grid">
        ${actor("Vanguard", "15", "operators")}
        ${actor("IRGCN", "fast", "gunboats")}
        ${actor("Command", "MoD", "distance")}
      </div>
    `;
  }

  function actor(title, mark, label) {
    return `<div class="actor-token"><div class="actor-mark">${mark}</div><strong>${title}</strong><span>${label}</span></div>`;
  }

  function compassVisual() {
    return `
      <div class="compass">
        <div class="compass-face"></div>
        <div class="compass-needle"></div>
        <div class="warning-triangle"></div>
      </div>
    `;
  }

  function interceptVisual() {
    return `
      <div class="water-lines"></div>
      <div class="boat boat-a"></div>
      <div class="boat boat-b"></div>
      <div class="intercept-line"></div>
    `;
  }

  function boardroomVisual() {
    return `
      <div class="table-perspective">
        <span></span><span></span><span></span><span></span>
      </div>
      <div class="empty-chair"></div>
      <div class="decision-haze"></div>
    `;
  }

  function scalesVisual() {
    return `
      <div class="scale">
        <div class="scale-arm"></div>
        <div class="scale-post"></div>
        <div class="scale-pan pan-left"><span>Escalate</span></div>
        <div class="scale-pan pan-right"><span>Survive</span></div>
      </div>
    `;
  }

  function badgeVisual() {
    return `
      <div class="badge">
        <div class="badge-star"></div>
        <div class="crack c1"></div>
        <div class="crack c2"></div>
        <div class="camera-flash"></div>
      </div>
    `;
  }

  function memoryVisual() {
    return `
      <div class="memory-panels">
        <div><span>2004</span><b>Warning</b></div>
        <div><span>2007</span><b>Repeat</b></div>
      </div>
      <div class="memory-tear"></div>
    `;
  }

  function loopVisual() {
    return `
      <div class="routine-loop"></div>
      <div class="routine-loop loop-two"></div>
      <div class="ambush-spike"></div>
    `;
  }

  function reportsVisual() {
    return `
      <div class="report-stack">
        <div><strong>Fulton</strong><span>Operational inquiry</span></div>
        <div><strong>Hall</strong><span>Media review</span></div>
      </div>
    `;
  }

  function blueprintVisual() {
    return `
      <div class="blueprint-grid"></div>
      <div class="pillar p1"><span>Doctrine</span></div>
      <div class="pillar p2"><span>Memory</span></div>
      <div class="pillar p3"><span>Ethics</span></div>
    `;
  }

  function horizonVisual() {
    return `
      <div class="horizon-line"></div>
      <div class="signal signal-a"></div>
      <div class="signal signal-b"></div>
      <div class="signal signal-c"></div>
    `;
  }

  function debriefVisual() {
    return `
      <div class="debrief-mark">?</div>
      <div class="debrief-rings"></div>
    `;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  window.PresentationComponents = {
    renderPresentation,
    buildVisual
  };
})();
