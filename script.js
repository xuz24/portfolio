document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

// Scrolling and section snapping are browser-managed via CSS.
// Avoid intercepting wheel/touch input or temporarily disabling snap.

const rotatingRole = document.querySelector('[data-role]');
if (rotatingRole) {
  const roles = [
    'programmer.',
    'problem solver.',
    'researcher.',
    'data scientist.',
    'builder.',
    'hobbyist.',
    'photographer.',

  ];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let roleIndex = 0;
  let character = 0;
  let deleting = false;
  let typingTimer = 0;

  function typeRole() {
    if (reducedMotion.matches || document.hidden) return;
    const role = roles[roleIndex];
    rotatingRole.textContent = deleting ? role.slice(0, character - 1) : role.slice(0, character + 1);
    character += deleting ? -1 : 1;

    if (!deleting && character === role.length) {
      deleting = true;
      typingTimer = setTimeout(typeRole, 1450);
      return;
    }
    if (deleting && character === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      typingTimer = setTimeout(typeRole, 260);
      return;
    }
    typingTimer = setTimeout(typeRole, deleting ? 48 : 82);
  }

  function syncTyping() {
    clearTimeout(typingTimer);
    if (reducedMotion.matches) {
      rotatingRole.textContent = roles[0];
      roleIndex = 0;
      character = 0;
      deleting = false;
    } else if (!document.hidden) typeRole();
  }
  reducedMotion.addEventListener('change', syncTyping);
  document.addEventListener('visibilitychange', syncTyping);
  syncTyping();
}

const lightbox = document.querySelector('#lightbox');
if (lightbox) {
  const photos = [...document.querySelectorAll('.photo-button, .experience-visual, .project-visual')];
  const image = lightbox.querySelector('img');
  const caption = lightbox.querySelector('#lightbox-caption');
  let current = 0;
  let opener;
  function show(index) {
    current = (index + photos.length) % photos.length;
    const source = photos[current].querySelector('img');
    image.src = source.dataset.fullSrc || source.currentSrc || source.src;
    image.alt = source.alt;
    caption.textContent = `${source.alt} · ${current + 1} / ${photos.length}`;
  }
  photos.forEach((button, index) => {
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = button;
      show(index);
      lightbox.showModal();
    });
  });
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
