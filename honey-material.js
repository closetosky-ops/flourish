/* Light bends through the moving honey silhouette into the photo and page below. */
(() => {
  'use strict';

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smooth = value => value * value * (3 - 2 * value);
  const gaussian = value => Math.exp(-value * value);
  const mix = (a, b, amount) => a + (b - a) * amount;
  const normalSteps = 65;
  const normalCenter = (normalSteps - 1) / 2;
  const normalScale = 16;

  function makeLighting() {
    const table = new Float32Array(normalSteps * normalSteps * 5);
    for (let x = 0; x < normalSteps; x++) {
      for (let y = 0; y < normalSteps; y++) {
        const u = (x - normalCenter) / normalScale;
        const v = (y - normalCenter) / normalScale;
        const z = 1 / Math.hypot(u, v, 1);
        const nx = u * z;
        const ny = v * z;
        const rx = 2 * nx * z;
        const ry = 2 * ny * z;
        const windowLight = gaussian((rx + 0.39) / 0.16) * gaussian((ry + 0.31) / 0.67);
        const softLight = gaussian((rx - 0.60) / 0.25) * gaussian((ry + 0.14) / 0.86);
        const surfaceLight = gaussian((ry + 0.69) / 0.14) * gaussian((rx + 0.07) / 0.68);
        const edgeLight = 0.024 + 0.42 * Math.pow(1 - z, 3);
        const highlight = 0.016 + windowLight * 0.45 + softLight * 0.14 + surfaceLight * 0.21;
        const underneath = gaussian((ry - 0.73) / 0.22) * (0.1 + 0.1 * Math.abs(rx));
        table.set([nx, ny, edgeLight, highlight, underneath], (x * normalSteps + y) * 5);
      }
    }
    return table;
  }

  function makeAbsorption() {
    const table = new Float32Array(256 * 3);
    for (let alpha = 0; alpha < 256; alpha++) {
      const depth = 0.20 + 1.42 * Math.pow(alpha / 255, 0.78);
      table.set([
        Math.exp(-0.205 * depth),
        Math.exp(-0.82 * depth),
        Math.exp(-2.48 * depth)
      ], alpha * 3);
    }
    return table;
  }

  function positionFraction(part) {
    if (part === 'top' || part === 'left') return 0;
    if (part === 'bottom' || part === 'right') return 1;
    if (part === 'center') return 0.5;
    return (Number.parseFloat(part) || 0) / 100;
  }

  // Separable blur for browsers that do not provide Canvas 2D filters.
  function blurLines(source, result, lines, points, lineStep, pointStep, radius) {
    const last = points - 1;
    const count = 2 * radius + 1;
    for (let line = 0; line < lines; line++) {
      const start = line * lineStep;
      let sum = (radius + 1) * source[start];
      for (let i = 1; i <= radius; i++) {
        sum += source[start + Math.min(i, last) * pointStep];
      }
      for (let i = 0; i < points; i++) {
        result[start + i * pointStep] = sum / count;
        sum += source[start + Math.min(i + radius + 1, last) * pointStep]
          - source[start + Math.max(i - radius, 0) * pointStep];
      }
    }
  }

  window.createHoneyMaterial = function (edge, photo) {
    if (!photo || typeof Path2D === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.className = 'honey-material';
    canvas.setAttribute('aria-hidden', 'true');

    const context = canvas.getContext('2d');
    const mask = document.createElement('canvas');
    const volume = document.createElement('canvas');
    const maskCtx = mask.getContext('2d', { willReadFrequently: true });
    const volumeCtx = volume.getContext('2d', { willReadFrequently: true });
    if (!context || !maskCtx || !volumeCtx) return null;

    const lighting = makeLighting();
    const absorption = makeAbsorption();
    let photoPixels = null;
    let photoWidth = 0;
    let photoHeight = 0;
    let frame = null;
    let layout = null;
    let enabled = true;
    const useCanvasFilter = 'filter' in volumeCtx;
    let volumeAlpha;
    let blurBuffer;
    let roundedPixels;

    function readPhoto() {
      if (photoPixels || !photo.naturalWidth || !photo.naturalHeight) return;
      const sample = document.createElement('canvas');
      const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
      if (!sampleCtx) return;

      photoWidth = Math.min(820, photo.naturalWidth);
      photoHeight = Math.max(1, Math.round(photoWidth * photo.naturalHeight / photo.naturalWidth));
      sample.width = photoWidth;
      sample.height = photoHeight;
      try {
        sampleCtx.drawImage(photo, 0, 0, photoWidth, photoHeight);
        photoPixels = sampleCtx.getImageData(0, 0, photoWidth, photoHeight).data;
      } catch (_) {
        // A cross-origin image can still use the cream and amber material.
      }
    }

    function resize(width, height, seam, heroHeight) {
      if (!enabled) return;
      readPhoto();
      const scale = Math.min(1, 1120 / width);
      const pixelsAcross = Math.max(1, Math.round(width * scale));
      const pixelsDown = Math.max(1, Math.round(height * scale));
      const pad = Math.ceil(46 * scale);
      const paddedWidth = pixelsAcross + pad * 2;
      if (!frame || frame.width !== pixelsAcross || frame.height !== pixelsDown || mask.width !== paddedWidth) {
        canvas.width = pixelsAcross;
        mask.width = volume.width = paddedWidth;
        canvas.height = mask.height = volume.height = pixelsDown;
        frame = context.createImageData(pixelsAcross, pixelsDown);
        if (!useCanvasFilter) {
          volumeAlpha = new Float32Array(paddedWidth * pixelsDown);
          blurBuffer = new Float32Array(volumeAlpha.length);
          roundedPixels = new Uint8ClampedArray(pixelsAcross * pixelsDown * 4);
        }
      }
      const sourceWidth = photo.naturalWidth || width;
      const sourceHeight = photo.naturalHeight || heroHeight;
      const cover = Math.max(width / sourceWidth, heroHeight / sourceHeight);
      const drawWidth = sourceWidth * cover;
      const drawHeight = sourceHeight * cover;
      const [x, y] = getComputedStyle(photo).objectPosition.split(/\s+/);
      layout = {
        width, seam, heroHeight, scale, pad, drawWidth, drawHeight,
        offsetX: (width - drawWidth) * positionFraction(x),
        offsetY: (heroHeight - drawHeight) * positionFraction(y || 'center')
      };
    }

    function readRoundedVolume(w, h, pad, blur) {
      if (useCanvasFilter) {
        volumeCtx.clearRect(0, 0, volume.width, h);
        volumeCtx.filter = 'blur(' + blur + 'px)';
        volumeCtx.drawImage(mask, 0, 0);
        volumeCtx.filter = 'none';
        return volumeCtx.getImageData(pad, 0, w, h).data;
      }

      const across = mask.width;
      const allPixels = maskCtx.getImageData(0, 0, across, h).data;
      const radius = Math.max(1, Math.round(blur * 1.21));
      for (let i = 0; i < volumeAlpha.length; i++) {
        volumeAlpha[i] = allPixels[i * 4 + 3];
      }
      for (let pass = 0; pass < 2; pass++) {
        blurLines(volumeAlpha, blurBuffer, h, across, across, 1, radius);
        blurLines(blurBuffer, volumeAlpha, across, h, 1, across, radius);
      }
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          roundedPixels[(y * w + x) * 4 + 3] = volumeAlpha[y * across + pad + x];
        }
      }
      return roundedPixels;
    }

    function shade(path, shape) {
      const { width, seam, heroHeight, scale, pad, drawWidth, drawHeight, offsetX, offsetY } = layout;
      const w = frame.width;
      const h = frame.height;
      const stride = w * 4;
      maskCtx.clearRect(0, 0, mask.width, h);
      maskCtx.save();
      maskCtx.translate(pad, 0);
      maskCtx.scale(scale, scale);
      maskCtx.fillStyle = '#fff';
      maskCtx.fill(path);
      maskCtx.restore();
      // Continue the band past the viewport so the ends have no visible meniscus.
      maskCtx.drawImage(mask, pad, 0, 1, h, 0, 0, pad, h);
      maskCtx.drawImage(mask, pad + w - 1, 0, 1, h, pad + w, 0, pad, h);

      const coverage = maskCtx.getImageData(pad, 0, w, h).data;
      const blur = (10 + Math.min(5, width / 260)) * scale;
      const rounded = readRoundedVolume(w, h, pad, blur);
      const pixels = frame.data;
      pixels.fill(0);
      const yMax = Math.min(h, Math.ceil((shape.tip + 6) * scale));
      const normalOffset = 2;
      const invScale = 1 / scale;

      for (let y = 0; y < yMax; y++) {
        const row = y * stride;
        const up = Math.max(0, y - normalOffset) * stride;
        const down = Math.min(h - 1, y + normalOffset) * stride;
        const py = y * invScale;
        for (let x = 0; x < w; x++) {
          const offset = x * 4 + 3;
          const pixel = row + offset;
          const alpha = coverage[pixel];
          if (!alpha) continue;

          const left = row + Math.max(0, x - normalOffset) * 4 + 3;
          const right = row + Math.min(w - 1, x + normalOffset) * 4 + 3;
          const xNormal = clamp(Math.round(normalCenter + (rounded[left] - rounded[right]) * 0.62), 0, normalSteps - 1);
          const yNormal = clamp(Math.round(normalCenter + (rounded[up + offset] - rounded[down + offset]) * 0.62), 0, normalSteps - 1);
          const lut = (xNormal * normalSteps + yNormal) * 5;
          const depth = rounded[pixel] / 255;
          const shift = 8 + 26 * depth;
          const tx = x * invScale - lighting[lut] * shift;
          const ty = py - lighting[lut + 1] * shift;
          const page = smooth(clamp((ty - seam + 13) / 34, 0, 1));

          let r = 0.969;
          let g = 0.945;
          let b = 0.898;
          if (page < 1 && photoPixels) {
            const inside = heroHeight - seam + ty;
            const ix = clamp(Math.round((tx - offsetX) * photoWidth / drawWidth), 0, photoWidth - 1);
            const iy = clamp(Math.round((inside - offsetY) * photoHeight / drawHeight), 0, photoHeight - 1);
            const color = (iy * photoWidth + ix) * 4;
            const across = clamp(tx / width, 0, 1);
            const shadow = width <= 700
              ? mix(0.86, 0.40, across)
              : mix(0.94, 0.21, smooth(across));
            const light = (1 - shadow) * 0.64 / 255;
            const tint = 1 - light * 255;
            r = mix(photoPixels[color] * light + tint * 0.045, r, page);
            g = mix(photoPixels[color + 1] * light + tint * 0.091, g, page);
            b = mix(photoPixels[color + 2] * light + tint * 0.053, b, page);
          }

          const a = rounded[pixel] * 3;
          const reflect = lighting[lut + 2];
          const gloss = lighting[lut + 3] * (0.77 + 0.23 * gaussian((tx - shape.center) / (width * 0.25)));
          const amber = (1 - page) * (0.19 + depth * 0.19);
          const caustic = lighting[lut + 4] * (0.73 + page * 0.22);
          r = r * absorption[a] + 0.43 * (1 - absorption[a]) + amber + caustic;
          g = g * absorption[a + 1] + 0.135 * (1 - absorption[a + 1]) + amber * 0.49 + caustic * 0.74;
          b = b * absorption[a + 2] + 0.036 * (1 - absorption[a + 2]) + amber * 0.096 + caustic * 0.29;

          pixels[pixel - 3] = (mix(r, 0.40, reflect) + gloss) * 255;
          pixels[pixel - 2] = (mix(g, 0.22, reflect) + gloss * 0.92) * 255;
          pixels[pixel - 1] = (mix(b, 0.082, reflect) + gloss * 0.72) * 255;
          pixels[pixel] = alpha;
        }
      }
      context.putImageData(frame, 0, 0);
    }

    function bubbles(path, shape, time) {
      const { width, seam, scale } = layout;
      context.save();
      context.scale(scale, scale);
      context.clip(path);
      for (let i = 0; i < 7; i++) {
        const spacing = (i * 0.618 + 0.137) % 1;
        const radius = 0.55 + ((i * 0.47) % 1) * 1.09;
        const x = width * (0.07 + spacing * 0.89) + Math.sin(time * 0.29 + i) * 1.7;
        const y = seam - 9 + Math.cos(time * 0.24 + i * 1.9) * 5;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = 'rgba(112, 51, 6, 0.13)';
        context.fill();
        context.beginPath();
        context.arc(x, y, radius, 3.25, 5.43);
        context.strokeStyle = 'rgba(255, 240, 185, 0.36)';
        context.lineWidth = 0.6;
        context.stroke();
      }
      const depth = shape.tip - seam;
      if (depth > 66) {
        const x = shape.belly - 5;
        const y = shape.tip - 18;
        context.beginPath();
        context.arc(x, y, 1.25, 2.9, 5.9);
        context.strokeStyle = 'rgba(255, 227, 162, 0.31)';
        context.lineWidth = 0.65;
        context.stroke();
      }
      context.restore();
    }

    edge.append(canvas);

    return {
      resize,
      render(shape, time) {
        if (!enabled || !layout) return;
        try {
          const path = new Path2D(shape.path);
          shade(path, shape);
          bubbles(path, shape, time);
          edge.classList.add('has-honey-material');
        } catch (_) {
          enabled = false;
          canvas.remove();
          edge.classList.remove('has-honey-material');
        }
      }
    };
  };
})();
