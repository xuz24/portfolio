(() => {
  const map = document.querySelector('#travel-map');
  if (!map) return;
  const ns = 'http://www.w3.org/2000/svg';
  const cities = [...document.querySelectorAll('[data-city]')];
  const controls = [...document.querySelectorAll('[data-map-view]')];
  const layer = document.querySelector('#map-markers');
  const cityName = document.querySelector('#map-city-name');
  const countryName = document.querySelector('#map-city-country');
  const collectionLink = document.querySelector('#map-collection');
  const markerCircles = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const views = {
    world: [0, 0, 1000, 500],
    america: [125, 89, 200, 100],
    asia: [782, 111, 130, 65]
  };
  let view = [...views.world], targetView = view, animation = 0;
  const markers = cities.map(button => {
    const marker = document.createElementNS(ns, 'g');
    const x = (Number(button.dataset.lon) + 180) * 1000 / 360;
    const y = (90 - Number(button.dataset.lat)) * 500 / 180;
    marker.setAttribute('transform', `translate(${x} ${y})`);
    marker.setAttribute('role', 'button');
    marker.setAttribute('tabindex', '0');
    marker.setAttribute('aria-label', `${button.dataset.city}, ${button.dataset.country}`);
    marker.setAttribute('aria-pressed', 'false');
    marker.classList.add('map-marker');
    const circles = [];
    for (const type of ['hit', 'halo', 'dot']) {
      const circle = document.createElementNS(ns, 'circle');
      circle.classList.add(`marker-${type}`);
      marker.append(circle);
      circles.push(circle);
    }
    markerCircles.push(circles);
    const title = document.createElementNS(ns, 'title');
    title.textContent = `${button.dataset.city}, ${button.dataset.country}`;
    marker.append(title);
    layer.append(marker);
    const select = () => selectCity(button);
    marker.addEventListener('click', select);
    marker.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select();
      }
    });
    button.addEventListener('click', select);
    return marker;
  });

  function paintView() {
    map.setAttribute('viewBox', view.join(' '));
    markerCircles.forEach(([hit, halo, dot]) => {
      hit.setAttribute('r', view[2] * .014);
      halo.setAttribute('r', view[2] * .007);
      dot.setAttribute('r', view[2] * .003);
    });
  }
  function setView(name) {
    cancelAnimationFrame(animation);
    controls.forEach(button => button.setAttribute('aria-pressed', button.dataset.mapView === name));
    targetView = views[name];
    if (view.every((value, i) => value === targetView[i])) return;
    if (reduced.matches) { view = [...targetView]; paintView(); return; }
    const from = [...view], start = performance.now();
    function animate(now) {
      const t = Math.min(1, (now - start) / 550);
      const eased = t * t * (3 - 2 * t);
      view = from.map((value, i) => value + (targetView[i] - value) * eased);
      paintView();
      if (t < 1) animation = requestAnimationFrame(animate);
    }
    animation = requestAnimationFrame(animate);
  }
  function selectCity(button) {
    cities.forEach((city, i) => {
      const selected = city === button;
      city.setAttribute('aria-pressed', selected);
      markers[i].setAttribute('aria-pressed', selected);
    });
    cityName.textContent = button.dataset.city;
    countryName.textContent = button.dataset.country;
    const link = collectionLink;
    link.hidden = !button.dataset.collection;
    if (button.dataset.collection) {
      link.href = `#${button.dataset.collection}`;
      link.textContent = button.dataset.collection === 'japan' ? 'View Japan photographs ↗' : 'View photographs ↗';
    } else link.removeAttribute('href');
    setView(button.dataset.country === 'United States' ? 'america' : 'asia');
  }
  controls.forEach(button => button.addEventListener('click', () => setView(button.dataset.mapView)));
  reduced.addEventListener('change', () => {
    if (reduced.matches) { cancelAnimationFrame(animation); view = [...targetView]; paintView(); }
  });
  paintView();
})();
