(() => {
  const nav = document.querySelector('#section-nav');
  if (!nav) return;
  const toggle = document.querySelector('.section-nav-toggle');
  const compact = matchMedia('(max-width: 1199px)');
  const groups = [...nav.querySelectorAll('[data-section]')];
  const links = [...nav.querySelectorAll('a')];
  const targets = links.map(link => ({ link, target: document.querySelector(link.hash), section: link.closest('[data-section]')?.dataset.section, nested: !!link.closest('ul') }));
  const lists = new Map(groups.map(group => [group, group.querySelector('ul')]));
  let previousState = {};
  const experience = document.querySelector('#experience');
  const about = document.querySelector('#about-me');
  const projects = document.querySelector('#projects');
  const contact = document.querySelector('#contact');
  let pending = 0;
  let onHome = true;
  nav.dataset.enhanced = 'true';
  toggle.hidden = false;
  groups.forEach(group => {
    const reveal = document.createElement('div');
    reveal.className = 'section-nav-reveal';
    const list = lists.get(group);
    list.before(reveal);
    reveal.append(list);
  });

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    nav.inert = onHome || (compact.matches && !open);
  }
  function update() {
    pending = 0;
    const probe = innerHeight * .35;
    const contactRect = contact.getBoundingClientRect();
    const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
    let section = 'about';
    if (contactRect.top <= probe || atBottom) section = 'contact';
    else if (projects.getBoundingClientRect().top <= probe) section = 'projects';
    else if (experience.getBoundingClientRect().top <= probe) section = 'experience';
    else if (about.getBoundingClientRect().top <= probe) section = 'about-me';
    let current = null;
    for (const { link, target, section: targetSection, nested } of targets) {
      if (targetSection === section && nested
        && target.getBoundingClientRect().top <= probe) current = link;
    }
    // If the group's header has entered first, select its first entry.
    if (!current && section !== 'contact') current = nav.querySelector(`[data-section="${section}"] ul a`);
    const focused = document.activeElement;
    if (previousState.section === section && previousState.current === current && previousState.focused === focused && previousState.compact === compact.matches) return;
    previousState = { section, current, focused, compact: compact.matches };
    onHome = section === 'about';
    nav.classList.toggle('is-home', onHome);
    toggle.classList.toggle('is-home', onHome);
    toggle.inert = onHome;
    if (onHome) {
      if (nav.contains(document.activeElement) || document.activeElement === toggle) {
        const home = document.querySelector('#home');
        home.setAttribute('tabindex', '-1');
        home.focus({ preventScroll: true });
      }
      setOpen(false);
    } else nav.inert = compact.matches && !nav.classList.contains('is-open');
    groups.forEach(group => {
      const active = group.dataset.section === section;
      const list = lists.get(group);
      // Never hide the keyboard user's focused link while scrolling.
      const expanded = active || list.contains(document.activeElement);
      group.classList.toggle('is-expanded', expanded);
      list.inert = !expanded;
      list.setAttribute('aria-hidden', String(!expanded));
      group.classList.toggle('is-active', active);
    });
    links.forEach(link => {
      const active = link === current || link.hash === `#${section}`;
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function schedule() {
    if (!pending) pending = requestAnimationFrame(update);
  }
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (compact.matches) {
      setOpen(false);
      const target = document.querySelector(link.hash);
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });
  nav.addEventListener('focusout', schedule);
  compact.addEventListener('change', () => { setOpen(false); schedule(); });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  new ResizeObserver(schedule).observe(document.querySelector('#main'));
  setOpen(false);
  update();
})();
