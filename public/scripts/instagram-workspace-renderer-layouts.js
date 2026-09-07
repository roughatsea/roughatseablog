function drawCover(context, image, campaign, slide, slideNumber, totalSlides, palette) {
  if (image) drawImageCover(context, image, 0, 0, 1080, 1350, 1.04);
  else drawFallbackBackdrop(context, palette);

  const overlay = context.createLinearGradient(0, 0, 0, 1350);
  overlay.addColorStop(0, 'rgba(3, 10, 20, 0.18)');
  overlay.addColorStop(0.34, 'rgba(3, 10, 20, 0.34)');
  overlay.addColorStop(0.68, 'rgba(3, 10, 20, 0.88)');
  overlay.addColorStop(1, 'rgba(3, 10, 20, 0.98)');
  context.fillStyle = overlay;
  context.fillRect(0, 0, 1080, 1350);

  const sideGlow = context.createLinearGradient(0, 0, 1080, 0);
  sideGlow.addColorStop(0, `${palette.secondary}48`);
  sideGlow.addColorStop(0.45, 'rgba(0,0,0,0)');
  sideGlow.addColorStop(1, `${palette.accent}24`);
  context.fillStyle = sideGlow;
  context.fillRect(0, 0, 1080, 1350);

  context.fillStyle = palette.accent;
  context.fillRect(0, 0, 1080, 12);
  drawWaves(context, palette, 335, 0.38);
  drawEyebrow(context, slide.eyebrow, 88, 126, palette);

  context.fillStyle = '#ffffff';
  const title = fitText(context, slide.headline, {
    maxWidth: 900,
    maxLines: 4,
    startSize: 96,
    minSize: 58,
    weight: 600,
    family: '"Playfair Display", Georgia, serif',
  });
  context.font = `600 ${title.size}px "Playfair Display", Georgia, serif`;
  const titleBottom = drawLines(context, title.lines, 88, 500, title.size * 1.04, 4, 900);

  context.fillStyle = 'rgba(255,255,255,0.82)';
  context.font = '400 37px Inter, Arial, sans-serif';
  const bodyLines = textLines(context, slide.body, 860);
  const bodyStart = titleBottom + 38;
  const bodyLineLimit = Math.max(1, Math.min(5, Math.floor((1170 - bodyStart) / 51)));
  drawLines(context, bodyLines, 92, bodyStart, 51, bodyLineLimit, 860);

  drawTexture(context, `${campaign.id}:${slide.id}`);
  drawFooter(context, palette, slideNumber, totalSlides);
}

function drawFeature(context, image, campaign, slide, slideNumber, totalSlides, palette) {
  drawFallbackBackdrop(context, palette);

  if (image) {
    context.save();
    drawImageCover(context, image, 0, 0, 1080, 540, 1.02);
    const imageOverlay = context.createLinearGradient(0, 0, 0, 560);
    imageOverlay.addColorStop(0, 'rgba(3,10,20,0.05)');
    imageOverlay.addColorStop(0.72, 'rgba(3,10,20,0.42)');
    imageOverlay.addColorStop(1, 'rgba(3,10,20,1)');
    context.fillStyle = imageOverlay;
    context.fillRect(0, 0, 1080, 575);
    context.restore();
  }

  context.fillStyle = '#07111f';
  context.fillRect(0, 520, 1080, 830);

  const glow = context.createRadialGradient(975, 675, 0, 975, 675, 640);
  glow.addColorStop(0, `${palette.secondary}35`);
  glow.addColorStop(1, 'rgba(7,17,31,0)');
  context.fillStyle = glow;
  context.fillRect(380, 480, 700, 870);

  context.fillStyle = palette.accent;
  context.fillRect(88, 516, 160, 7);
  drawEyebrow(context, slide.eyebrow, 88, 620, palette);

  context.fillStyle = '#ffffff';
  const title = fitText(context, slide.headline, {
    maxWidth: 900,
    maxLines: 4,
    startSize: 76,
    minSize: 48,
    weight: 600,
    family: '"Playfair Display", Georgia, serif',
  });
  context.font = `600 ${title.size}px "Playfair Display", Georgia, serif`;
  const titleBottom = drawLines(context, title.lines, 88, 710, title.size * 1.08, 4, 900);

  context.fillStyle = 'rgba(255,255,255,0.78)';
  context.font = '400 34px Inter, Arial, sans-serif';
  const bodyLines = textLines(context, slide.body, 870);
  const bodyStart = titleBottom + 40;
  const bodyLineLimit = Math.max(1, Math.min(6, Math.floor((1135 - bodyStart) / 47)));
  drawLines(context, bodyLines, 92, bodyStart, 47, bodyLineLimit, 870);

  context.save();
  context.fillStyle = `${palette.accent}1f`;
  context.font = '600 250px "Playfair Display", Georgia, serif';
  context.textAlign = 'right';
  context.fillText(String(slideNumber).padStart(2, '0'), 1035, 820);
  context.restore();

  drawWaves(context, palette, 1165, 0.23);
  drawTexture(context, `${campaign.id}:${slide.id}`);
  drawFooter(context, palette, slideNumber, totalSlides);
}

function drawCta(context, image, campaign, slide, slideNumber, totalSlides, palette) {
  if (image) drawImageCover(context, image, 0, 0, 1080, 1350, 1.09);
  else drawFallbackBackdrop(context, palette);

  context.fillStyle = 'rgba(3,10,20,0.87)';
  context.fillRect(0, 0, 1080, 1350);

  const glow = context.createRadialGradient(540, 520, 0, 540, 520, 740);
  glow.addColorStop(0, `${palette.accent}42`);
  glow.addColorStop(0.46, `${palette.secondary}20`);
  glow.addColorStop(1, 'rgba(3,10,20,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 1080, 1200);

  drawWaves(context, palette, 225, 0.48);
  drawEyebrow(context, slide.eyebrow, 88, 190, palette);

  context.fillStyle = '#ffffff';
  const title = fitText(context, slide.headline, {
    maxWidth: 880,
    maxLines: 4,
    startSize: 92,
    minSize: 58,
    weight: 600,
    family: '"Playfair Display", Georgia, serif',
  });
  context.font = `600 ${title.size}px "Playfair Display", Georgia, serif`;
  drawLines(context, title.lines, 88, 430, title.size * 1.06, 4, 880);

  roundedRect(context, 88, 925, 904, 112, 56);
  context.fillStyle = 'rgba(255,255,255,0.10)';
  context.fill();
  context.strokeStyle = `${palette.accent}bf`;
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = 'rgba(255,255,255,0.9)';
  const urlText = String(slide.body || '').replace(/^https?:\/\//, '');
  const url = fitText(context, urlText, {
    maxWidth: 790,
    maxLines: 1,
    startSize: 34,
    minSize: 24,
    weight: 600,
  });
  context.font = `600 ${url.size}px Inter, Arial, sans-serif`;
  context.textAlign = 'center';
  context.fillText(url.lines[0], 540, 995);
  context.textAlign = 'left';

  context.fillStyle = palette.tertiary;
  context.beginPath();
  context.arc(540, 1120, 8, 0, Math.PI * 2);
  context.fill();

  drawTexture(context, `${campaign.id}:${slide.id}`);
  drawFooter(context, palette, slideNumber, totalSlides);
}

async function drawSlide(canvas, campaign, slide, slideNumber, totalSlides) {
  const context = canvas.getContext('2d');
  if (!context) return;

  const image = await loadImage(campaign.heroImage);
  const scaleX = canvas.width / EXPORT_WIDTH;
  const scaleY = canvas.height / EXPORT_HEIGHT;

  context.save();
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.scale(scaleX, scaleY);

  const palette = paletteFor(campaign);
  if (slide.layout === 'cover') {
    drawCover(context, image, campaign, slide, slideNumber, totalSlides, palette);
  } else if (slide.layout === 'cta') {
    drawCta(context, image, campaign, slide, slideNumber, totalSlides, palette);
  } else {
    drawFeature(context, image, campaign, slide, slideNumber, totalSlides, palette);
  }

  context.restore();
}

async function renderSlideEditor(card, editor) {
  const campaign = campaignById.get(card.dataset.campaignId);
  const index = Number(editor.dataset.slideIndex);
  const slide = getCurrentSlide(card, index);
  const canvas = editor.querySelector('[data-slide-canvas]');
  const label = editor.querySelector('[data-rendering-label]');
  if (!campaign || !slide || !canvas) return;

  const revision = String(Number(canvas.dataset.renderRevision || 0) + 1);
  canvas.dataset.renderRevision = revision;
  if (label) label.hidden = false;

  if (document.fonts?.ready) await document.fonts.ready;
  if (canvas.dataset.renderRevision !== revision) return;

  await drawSlide(canvas, campaign, slide, index + 1, campaign.slides.length);
  if (canvas.dataset.renderRevision === revision && label) label.hidden = true;
}

async function renderOpenCard(card) {
  const details = card.querySelector('[data-campaign-details]');
  if (!details?.open) return;
  const editors = Array.from(card.querySelectorAll('[data-slide-editor]'));
  await Promise.all(editors.map((editor) => renderSlideEditor(card, editor)));
}

