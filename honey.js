/* The honey gathers at one shoulder and stretches as the page moves. */
(() => {
  'use strict';

  const hero = document.querySelector('.hero');
  const edge = hero?.querySelector('.honey-edge');
  const svg = edge?.querySelector('#honey-svg');
  if (!svg) return;

  const body = svg.querySelector('#honey-body');
  const topLight = svg.querySelector('#honey-top-light');
  const rim = svg.querySelector('#honey-rim');
  const shine = svg.querySelector('#honey-drop-shine');
  const photo = hero.querySelector('.hero-image');
  const material = window.createHoneyMaterial?.(edge, photo);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smooth = value => value * value * (3 - 2 * value);
  const point = (x, y) => x.toFixed(2) + ' ' + y.toFixed(2);

  let width = 0;
  let seam = 0;
  let reach = 0;
  let scrollStart = 0;
  let scrollLength = 1;
  let target = 0;
  let progress = 0;
  let time = 0;
  let energy = 0;
  let pull = 0;
  let scrollImpulse = 0;
  let previousY = window.scrollY;
  let previousScroll = 0;
  let visible = false;
  let frame = 0;
  let previousFrame = 0;
  let previousPaint = 0;

  const slope = (line, x) => line(x + 0.5) - line(x - 0.5);
  const cubic = (x1, y1, x2, y2, x, y) =>
    ' C' + point(x1, y1) + ' ' + point(x2, y2) + ' ' + point(x, y);

  function trace(from, to, line) {
    const steps = Math.max(1, Math.ceil(Math.abs(to - from) / 27));
    const interval = (to - from) / steps;
    let path = '';

    for (let step = 0; step < steps; step++) {
      const x = from + step * interval;
      const next = from + (step + 1) * interval;
      const handle = interval / 3;
      path += cubic(
        x + handle, line(x) + slope(line, x) * handle,
        next - handle, line(next) - slope(line, next) * handle,
        next, line(next)
      );
    }
    return path;
  }

  function shape(amount, clock, activity, drag) {
    const extend = smooth(amount);
    const center = width * 0.79 + Math.sin(clock * 1.13) * (1 + activity * 1.4);
    const leftSpan = Math.min(220, width * 0.32);
    const rightSpan = Math.min(145, width * 0.167);
    const left = center - leftSpan;
    const right = center + rightSpan;
    const spread = Math.min(134, width * 0.19);
    const pool = x => Math.exp(-Math.pow((x - center) / spread, 2));
    const wave = x => {
      const across = x / width;
      return Math.sin(across * 15.5 + clock * 0.87) * (4.6 + activity * 2.8)
        + Math.sin(across * 31.8 - clock * 1.08 + 1.7) * (1.5 + activity * 1.6)
        + Math.cos(across * 7.4 + clock * 0.44 + 0.7) * 2.4;
    };
    const upper = x => seam - 22 - pool(x) * (18 - extend * 4) + wave(x) * 0.49 + drag * 1.4;
    const lower = x => seam + 14 + pool(x) * (6 + extend * 3) + wave(x) * 0.86 + drag * 1.6;

    const bulb = Math.min(36, width * 0.064) * (1 + extend * 0.075);
    const neck = bulb * (0.88 - extend * 0.27);
    const belly = center + 2 + extend * 4 + Math.sin(clock * 1.13 - 0.5) * (1 + activity);
    const tip = seam + reach * (0.397 + extend * 0.487)
      + Math.sin(clock * 1.65 - 0.2) * (1 + activity * 2.5) + drag * 4;
    const shoulderY = Math.min(seam + 31, tip - bulb * 1.62 - 7);
    const bulbTop = tip - bulb * 1.57;
    const span = bulbTop - shoulderY;

    let bottom = 'M' + point(0, lower(0)) + trace(0, left, lower);
    bottom += cubic(
      left + leftSpan * 0.41, lower(left) + slope(lower, left) * leftSpan * 0.41,
      center - neck * 1.44, Math.max(seam + 2, shoulderY - 22),
      center - neck, shoulderY
    );
    bottom += cubic(
      center - neck * 0.69, shoulderY + span * 0.34,
      belly - bulb * 0.43, bulbTop - span * 0.21,
      belly - bulb * 0.69, bulbTop
    );
    bottom += cubic(
      belly - bulb * 1.13, tip - bulb * 0.88,
      belly - bulb * 1.04, tip - bulb * 0.24,
      belly - bulb * 0.62, tip - bulb * 0.075
    );
    bottom += cubic(
      belly - bulb * 0.25, tip + bulb * 0.095,
      belly + bulb * 0.27, tip + bulb * 0.13,
      belly + bulb * 0.62, tip - bulb * 0.075
    );
    bottom += cubic(
      belly + bulb * 1.08, tip - bulb * 0.31,
      belly + bulb * 1.05, tip - bulb * 0.91,
      belly + bulb * 0.68, bulbTop + bulb * 0.06
    );
    bottom += cubic(
      belly + bulb * 0.47, bulbTop - span * 0.25,
      center + neck * 0.65, shoulderY + span * 0.31,
      center + neck, shoulderY + 1
    );
    bottom += cubic(
      center + neck * 1.39, Math.max(seam + 2, shoulderY - 21),
      right - rightSpan * 0.39, lower(right) - slope(lower, right) * rightSpan * 0.39,
      right, lower(right)
    );
    bottom += trace(right, width, lower);

    const upperGlint = x => upper(x) + 4.5;
    const dropGlint = 'M' + point(belly - bulb * 0.51, bulbTop + bulb * 0.28)
      + cubic(
        belly - bulb * 0.7, tip - bulb * 0.75,
        belly - bulb * 0.71, tip - bulb * 0.46,
        belly - bulb * 0.47, tip - bulb * 0.29
      );

    return {
      path: bottom + ' L' + point(width, upper(width)) + trace(width, 0, upper) + ' Z',
      top: 'M' + point(0, upperGlint(0)) + trace(0, width, upperGlint),
      bottom,
      dropGlint,
      center,
      belly,
      tip
    };
  }

  function paint() {
    if (!width) return;
    const rest = reduced.matches;
    const visual = shape(rest ? 0.24 : progress, rest ? 0 : time, rest ? 0 : energy, rest ? 0 : pull);
    body.setAttribute('d', visual.path);
    topLight.setAttribute('d', visual.top);
    rim.setAttribute('d', visual.bottom);
    shine.setAttribute('d', visual.dropGlint);
    material?.render(visual, rest ? 0 : time);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousFrame = 0;
    previousPaint = 0;
  }

  function start() {
    if (!frame && visible && !document.hidden && !reduced.matches) {
      frame = requestAnimationFrame(tick);
    }
  }

  function tick(now) {
    if (!visible || document.hidden || reduced.matches) {
      stop();
      return;
    }
    const elapsed = previousFrame ? Math.min((now - previousFrame) / 1000, 0.065) : 1 / 60;
    previousFrame = now;
    time += elapsed;
    const rate = target < progress ? 5.1 : 4.6;
    progress += (target - progress) * (1 - Math.exp(-elapsed * rate));
    energy *= Math.exp(-elapsed * 2.7);
    if (now - previousScroll > 90) scrollImpulse = 0;
    pull += (scrollImpulse - pull) * (1 - Math.exp(-elapsed * 6));

    const paintInterval = 1000 / 30;
    if (!previousPaint || now - previousPaint >= paintInterval) {
      previousPaint = previousPaint ? now - (now - previousPaint) % paintInterval : now;
      paint();
    }
    frame = requestAnimationFrame(tick);
  }

  function update() {
    const y = Math.max(0, window.scrollY);
    target = clamp((y - scrollStart) / scrollLength, 0, 1);
    if (visible && !reduced.matches && y !== previousY) {
      const now = performance.now();
      const distance = y - previousY;
      scrollImpulse = clamp(distance / Math.max(16, now - previousScroll) * 0.76, -1, 1);
      energy = Math.min(1.16, energy + Math.abs(distance) / 92);
      previousScroll = now;
    }
    previousY = y;
    start();
  }

  function resize() {
    const bounds = hero.getBoundingClientRect();
    const edgeBounds = edge.getBoundingClientRect();
    width = edge.clientWidth;
    const height = edge.clientHeight;
    if (!width || !height) return;
    seam = bounds.bottom - edgeBounds.top;
    reach = height - seam;
    const heroBottom = bounds.bottom + window.scrollY;
    scrollStart = Math.max(0, heroBottom - window.innerHeight - 45);
    scrollLength = Math.max(280, bounds.height * 0.57);
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    material?.resize(width, height, seam, bounds.height);
    update();
    if (!visible) progress = target;
    paint();
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pageshow', resize);
  photo?.addEventListener('load', resize, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else update();
  });
  reduced.addEventListener('change', () => {
    stop();
    energy = 0;
    pull = 0;
    scrollImpulse = 0;
    update();
    paint();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) update();
      else stop();
    }, { rootMargin: '64px' }).observe(edge);
  } else {
    visible = true;
  }
  resize();
})();
