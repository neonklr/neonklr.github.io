const slides = [...document.querySelectorAll(".slide")];
const progress = document.querySelector(".progress span");

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle("active", entry.isIntersecting);
    });
  },
  { threshold: 0.42 }
);

slides.forEach(slide => observer.observe(slide));
slides[0]?.classList.add("active");

function updateProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const value = max > 0 ? scrollY / max : 0;
  progress.style.width = `${Math.min(100, Math.max(0, value * 100))}%`;
}

addEventListener("scroll", updateProgress, { passive: true });
addEventListener("resize", updateProgress);
updateProgress();

function currentSlideIndex() {
  const index = slides.findIndex(slide => {
    const rect = slide.getBoundingClientRect();
    return rect.top <= innerHeight * 0.45 && rect.bottom >= innerHeight * 0.45;
  });
  return index === -1 ? 0 : index;
}

function moveSlide(direction) {
  const current = currentSlideIndex();
  const next = Math.min(slides.length - 1, Math.max(0, current + direction));
  if (next === current) return;

  document.body.classList.remove("slide-transition");
  void document.body.offsetWidth;
  document.body.classList.add("slide-transition");
  slides[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => document.body.classList.remove("slide-transition"), 780);
}

addEventListener("keydown", event => {
  const forward = event.key === "ArrowDown" || event.key === "ArrowRight" || event.key === "PageDown";
  const backward = event.key === "ArrowUp" || event.key === "ArrowLeft" || event.key === "PageUp";
  if (!forward && !backward) return;

  event.preventDefault();
  moveSlide(forward ? 1 : -1);
});

function toggleMediaChrome(slide) {
  slide.classList.toggle("media-clean");
}

document.querySelectorAll(".media-toggle").forEach(slide => {
  slide.addEventListener("click", event => {
    if (event.target.closest("video")) return;
    toggleMediaChrome(slide);
  });

  slide.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleMediaChrome(slide);
  });
});
