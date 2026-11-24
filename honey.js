/* Stretch the honey artwork traced from the Flourish mockup. */
(() => {
  'use strict';

  const hero = document.querySelector('.hero');
  const edge = hero?.querySelector('.honey-edge');
  const artwork = edge?.querySelector('.honey-artwork');
  const canvas = edge?.querySelector('.honey-canvas');
  const context = canvas?.getContext('2d');
  if (!artwork || !context) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smooth = value => value * value * (3 - 2 * value);
  const sourceLip = 69;
  const sourceBulb = 198;
  const dropCenter = 526;

  let columns = [];
  let scaleY = 0;
  let scrollStart = 0;
  let scrollLength = 1;
  let target = 0;
  let progress = 0;
  let time = 0;
  let energy = 0;
  let previousY = window.scrollY;
  let visible = false;
  let frame = 0;
  let previousFrame = 0;
  let previousPaint = 0;

  function paint() {
    if (!columns.length) return;
    const relaxed = (1 - smooth(progress)) * 0.69;
    const sourceTip = artwork.naturalHeight - sourceBulb;
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Stretch the stem independently of the lit surface and rounded tip.
    for (const { x, width, sourceX, sourceWidth, across, weight } of columns) {
      const wave = Math.sin(across * 22 - time * 1.52) * (1.40 + energy * 3.20)
        + Math.cos(across * 36 + time * 1.06) * 0.68;
      const shortened = relaxed * weight;
      const top = wave * scaleY;
      const lip = top + sourceLip * scaleY;
      const sourceStem = sourceBulb - sourceLip;
      const stemScale = (1 - shortened) * scaleY;
      const stem = lip + sourceStem * stemScale;
      const tipHeight = sourceTip * (1 - shortened * 0.19) * scaleY;
      context.drawImage(artwork, sourceX, 0, sourceWidth, sourceLip + 1, x, top, width, (sourceLip + 1) * scaleY);
      context.drawImage(artwork, sourceX, sourceLip, sourceWidth, sourceStem + 1, x, lip, width, (sourceStem + 1) * stemScale);
      context.drawImage(artwork, sourceX, sourceBulb, sourceWidth, sourceTip, x, stem, width, tipHeight);
    }
    edge.classList.add('has-honey-motion');
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousFrame = 0;
    previousPaint = 0;
  }

  function start() {
    if (!frame && columns.length && visible && !document.hidden && !reduced.matches) {
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
    const rate = target < progress ? 5.2 : 4.15;
    progress += (target - progress) * (1 - Math.exp(-elapsed * rate));
    energy *= Math.exp(-elapsed * 2.8);

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
    if (visible) energy = Math.min(1.15, energy + Math.abs(y - previousY) / 100);
    previousY = y;
    start();
  }

  function resize() {
    if (reduced.matches || !artwork.naturalWidth) {
      stop();
      edge.classList.remove('has-honey-motion');
      return;
    }
    const bounds = hero.getBoundingClientRect();
    const width = edge.clientWidth;
    const height = edge.clientHeight;
    if (!width || !height) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2, 1800 / width);
    const visiblePart = Number(getComputedStyle(edge).getPropertyValue('--honey-visible')) || 1;
    const sourceVisible = artwork.naturalWidth * visiblePart;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    scaleY = canvas.height / artwork.naturalHeight;

    columns = [];
    const step = Math.max(1, Math.ceil(canvas.width / 290));
    for (let x = 0; x < canvas.width; x += step) {
      const next = Math.min(x + step, canvas.width);
      const sample = (x + next) * 0.5 * sourceVisible / canvas.width;
      const distance = (sample - dropCenter) / 78;
      columns.push({
        x,
        width: next - x,
        sourceX: x * sourceVisible / canvas.width,
        sourceWidth: (next - x) * sourceVisible / canvas.width,
        across: sample / artwork.naturalWidth,
        weight: Math.exp(-distance * distance)
      });
    }

    const heroBottom = bounds.bottom + window.scrollY;
    scrollStart = Math.max(0, heroBottom - window.innerHeight - 45);
    scrollLength = clamp(bounds.height * 0.44, 224, 356);
    update();
    progress = target;
    paint();
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pageshow', resize);
  artwork.addEventListener('load', resize, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else update();
  });
  reduced.addEventListener('change', resize);

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
