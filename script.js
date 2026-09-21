document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

// Give the first wheel gesture a slower, deliberate transition. Later sections
// retain native snapping; touch and keyboard scrolling remain browser managed.
const landing = document.querySelector('#about');
const firstSection = document.querySelector('#about-me') || document.querySelector('#experience');
if (landing && firstSection) {
  const root = document.documentElement;
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let transition = null;
  function finishIntroScroll() {
    if (!transition) return;
    cancelAnimationFrame(transition.frame);
    root.style.scrollSnapType = transition.snap;
    root.style.scrollBehavior = transition.behavior;
    transition = null;
  }
  addEventListener('wheel', event => {
    if (event.ctrlKey || motionPreference.matches) return;
    if (transition) {
      if (event.deltaY < 0) finishIntroScroll();
      else event.preventDefault();
      return;
    }
    if (scrollY > 2 || event.deltaY <= 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    const start = scrollY;
    const destination = firstSection.getBoundingClientRect().top + start;
    const started = performance.now();
    transition = { frame: 0, snap: root.style.scrollSnapType, behavior: root.style.scrollBehavior };
    root.style.scrollSnapType = 'none';
    root.style.scrollBehavior = 'auto';
    function advance(now) {
      if (!transition) return;
      const t = Math.min(1, (now - started) / 1250);
      const progress = t * t * (3 - 2 * t);
      scrollTo({ top: start + (destination - start) * progress, behavior: 'instant' });
      if (t < 1) transition.frame = requestAnimationFrame(advance);
      else finishIntroScroll();
    }
    transition.frame = requestAnimationFrame(advance);
  }, { passive: false });
  for (const event of ['touchstart', 'pointerdown', 'keydown', 'resize']) {
    addEventListener(event, finishIntroScroll, { passive: true });
  }
  motionPreference.addEventListener('change', finishIntroScroll);
}

const rotatingRole = document.querySelector('[data-role]');
if (rotatingRole) {
  const roles = [
    'programmer.',
    'problem solver.',
    'researcher.',
    'data scientist.',
    'builder.',
    'hobbiest.',
    'photographer.',

  ];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let roleIndex = 0;
  let character = 0;
  let deleting = false;

  function typeRole() {
    const role = roles[roleIndex];
    rotatingRole.textContent = deleting ? role.slice(0, character - 1) : role.slice(0, character + 1);
    character += deleting ? -1 : 1;

    if (!deleting && character === role.length) {
      deleting = true;
      setTimeout(typeRole, 1450);
      return;
    }
    if (deleting && character === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      setTimeout(typeRole, 260);
      return;
    }
    setTimeout(typeRole, deleting ? 48 : 82);
  }

  if (reducedMotion.matches) {
    rotatingRole.textContent = roles[0];
  } else {
    typeRole();
  }
  reducedMotion.addEventListener('change', event => {
    if (event.matches) rotatingRole.textContent = roles[0];
  });
}

const lightbox = document.querySelector('#lightbox');
if (lightbox) {
  const photos = [...document.querySelectorAll('.photo-button')];
  const image = lightbox.querySelector('img');
  const caption = lightbox.querySelector('#lightbox-caption');
  let current = 0;
  let opener;
  function show(index) {
    current = (index + photos.length) % photos.length;
    const source = photos[current].querySelector('img');
    image.src = source.src;
    image.alt = source.alt;
    caption.textContent = `${source.alt} · ${current + 1} / ${photos.length}`;
  }
  photos.forEach((button, index) => button.addEventListener('click', () => {
    opener = button;
    show(index);
    lightbox.showModal();
  }));
  lightbox.addEventListener('close', () => opener?.focus());
  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.querySelector('[data-prev]').addEventListener('click', () => show(current - 1));
  lightbox.querySelector('[data-next]').addEventListener('click', () => show(current + 1));
  lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      lightbox.close();
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
}
