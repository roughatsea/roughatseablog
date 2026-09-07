function paletteFor(campaign) {
  return PALETTES[campaign.kind] || PALETTES.note;
}

function loadImage(source) {
  if (!source) return Promise.resolve(null);
  if (imageCache.has(source)) return imageCache.get(source);

  const promise = new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });

  imageCache.set(source, promise);
  return promise;
}

function drawImageCover(context, image, x, y, width, height, zoom = 1) {
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const destinationRatio = width / height;
  let sourceWidth;
  let sourceHeight;

  if (sourceRatio > destinationRatio) {
    sourceHeight = image.naturalHeight / zoom;
    sourceWidth = sourceHeight * destinationRatio;
  } else {
    sourceWidth = image.naturalWidth / zoom;
    sourceHeight = sourceWidth / destinationRatio;
  }

  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function textLines(context, text, maxWidth) {
  const paragraphs = String(text || '').split(/\n+/);
  const lines = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    let current = '';

    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (context.measureText(candidate).width <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    });

    if (current) lines.push(current);
    if (paragraphIndex < paragraphs.length - 1 && lines.at(-1) !== '') lines.push('');
  });

  return lines.length ? lines : [''];
}

function fitText(context, text, options) {
  const {
    maxWidth,
    maxLines,
    startSize,
    minSize,
    weight = 600,
    family = 'Inter, Arial, sans-serif',
  } = options;

  for (let size = startSize; size >= minSize; size -= 2) {
    context.font = `${weight} ${size}px ${family}`;
    const lines = textLines(context, text, maxWidth);
    const widestLine = Math.max(...lines.map((line) => context.measureText(line).width));
    if (lines.length <= maxLines && widestLine <= maxWidth) return { size, lines };
  }

  context.font = `${weight} ${minSize}px ${family}`;
  const lines = textLines(context, text, maxWidth);
  return { size: minSize, lines };
}

function truncateLines(context, lines, maxLines, maxWidth) {
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  let last = visible[maxLines - 1].replace(/[\s.…]+$/, '');

  while (last && context.measureText(`${last}…`).width > maxWidth) {
    const words = last.split(' ');
    words.pop();
    last = words.join(' ');
  }

  visible[maxLines - 1] = `${last || visible[maxLines - 1]}…`;
  return visible;
}

function drawLines(context, lines, x, y, lineHeight, maxLines, maxWidth) {
  const visible = truncateLines(context, lines, maxLines, maxWidth);
  visible.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
  return y + visible.length * lineHeight;
}

function drawSpacedText(context, text, x, y, spacing) {
  let cursor = x;
  for (const character of text) {
    context.fillText(character, cursor, y);
    cursor += context.measureText(character).width + spacing;
  }
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function drawTexture(context, seedText) {
  let seed = hashString(seedText);
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  context.save();
  for (let index = 0; index < 110; index += 1) {
    const alpha = 0.018 + random() * 0.035;
    context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    context.fillRect(random() * 1080, random() * 1350, 1 + random() * 2, 1 + random() * 2);
  }
  context.restore();
}

function drawWaves(context, palette, y, opacity = 0.35) {
  context.save();
  context.lineCap = 'round';
  context.lineWidth = 3;

  [palette.accent, palette.secondary, palette.tertiary].forEach((color, row) => {
    context.strokeStyle = color;
    context.globalAlpha = opacity - row * 0.07;
    context.beginPath();
    for (let x = -40; x <= 1120; x += 10) {
      const waveY = y + row * 27 + Math.sin((x + row * 70) / 75) * 18;
      if (x === -40) context.moveTo(x, waveY);
      else context.lineTo(x, waveY);
    }
    context.stroke();
  });

  context.restore();
}

function drawFooter(context, palette, slideNumber, totalSlides) {
  context.save();
  context.fillStyle = 'rgba(255,255,255,0.82)';
  context.font = '700 24px Inter, Arial, sans-serif';
  drawSpacedText(context, 'ROUGH AT SEA', 88, 1273, 4.5);

  context.fillStyle = palette.accent;
  context.fillRect(88, 1295, 130, 5);

  context.fillStyle = 'rgba(255,255,255,0.62)';
  context.font = '600 24px Inter, Arial, sans-serif';
  context.textAlign = 'right';
  context.fillText(`${String(slideNumber).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`, 992, 1282);
  context.restore();
}

function drawFallbackBackdrop(context, palette) {
  context.fillStyle = '#07111f';
  context.fillRect(0, 0, 1080, 1350);

  const firstGlow = context.createRadialGradient(160, 140, 0, 160, 140, 620);
  firstGlow.addColorStop(0, `${palette.accent}82`);
  firstGlow.addColorStop(1, 'rgba(7,17,31,0)');
  context.fillStyle = firstGlow;
  context.fillRect(0, 0, 1080, 900);

  const secondGlow = context.createRadialGradient(940, 500, 0, 940, 500, 700);
  secondGlow.addColorStop(0, `${palette.secondary}66`);
  secondGlow.addColorStop(1, 'rgba(7,17,31,0)');
  context.fillStyle = secondGlow;
  context.fillRect(240, 0, 840, 1150);
}

function drawEyebrow(context, text, x, y, palette) {
  context.save();
  context.fillStyle = palette.accent;
  context.font = '700 26px Inter, Arial, sans-serif';
  drawSpacedText(context, String(text || '').toUpperCase(), x, y, 3.2);
  context.restore();
}

