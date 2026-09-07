function safeFilename(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function canvasBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('The browser could not create the PNG.'));
    }, 'image/png');
  });
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function downloadSlide(card, index) {
  const campaign = campaignById.get(card.dataset.campaignId);
  const slide = getCurrentSlide(card, index);
  if (!campaign || !slide) return;

  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;
  if (document.fonts?.ready) await document.fonts.ready;
  await drawSlide(canvas, campaign, slide, index + 1, campaign.slides.length);
  const blob = await canvasBlob(canvas);
  const number = String(index + 1).padStart(2, '0');
  triggerDownload(blob, `${safeFilename(campaign.id)}-${number}.png`);
}

async function downloadCarousel(card, button) {
  const campaign = campaignById.get(card.dataset.campaignId);
  if (!campaign) return;

  const originalLabel = button.textContent;
  button.disabled = true;

  try {
    for (let index = 0; index < campaign.slides.length; index += 1) {
      button.textContent = `Rendering ${index + 1} of ${campaign.slides.length}…`;
      await downloadSlide(card, index);
      await new Promise((resolve) => window.setTimeout(resolve, 180));
    }
    setCampaignMessage(
      card,
      `Started ${campaign.slides.length} PNG downloads. The browser may ask you to allow multiple files.`,
    );
  } catch (error) {
    console.error(error);
    setCampaignMessage(card, 'One or more slides could not be downloaded. Try the individual slide buttons.');
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const fallback = document.createElement('textarea');
  fallback.value = text;
  fallback.style.position = 'fixed';
  fallback.style.opacity = '0';
  document.body.append(fallback);
  fallback.select();
  document.execCommand('copy');
  fallback.remove();
}

function updateStats() {
  const counts = { 'needs-review': 0, ready: 0, posted: 0, skip: 0 };
  cards.forEach((card) => {
    const status = card.dataset.campaignStatus || 'needs-review';
    counts[status] = (counts[status] || 0) + 1;
  });

  const total = document.querySelector('[data-stat-total]');
  const needsReview = document.querySelector('[data-stat-needs-review]');
  const ready = document.querySelector('[data-stat-ready]');
  const posted = document.querySelector('[data-stat-posted]');
  if (total) total.textContent = String(cards.length);
  if (needsReview) needsReview.textContent = String(counts['needs-review']);
  if (ready) ready.textContent = String(counts.ready);
  if (posted) posted.textContent = String(counts.posted);
}

function applyFilters() {
  const query = document.querySelector('[data-filter-search]')?.value.trim().toLowerCase() || '';
  const type = document.querySelector('[data-filter-type]')?.value || 'all';
  const status = document.querySelector('[data-filter-status]')?.value || 'all';
  const sort = document.querySelector('[data-filter-sort]')?.value || 'newest';

  const sortedCards = [...cards].sort((first, second) => {
    if (sort === 'oldest') {
      return new Date(first.dataset.campaignDate).valueOf() - new Date(second.dataset.campaignDate).valueOf();
    }
    if (sort === 'title') {
      return first.dataset.campaignTitle.localeCompare(second.dataset.campaignTitle);
    }
    if (sort === 'status') {
      const firstOrder = STATUS_META[first.dataset.campaignStatus]?.order ?? 0;
      const secondOrder = STATUS_META[second.dataset.campaignStatus]?.order ?? 0;
      return firstOrder - secondOrder || first.dataset.campaignTitle.localeCompare(second.dataset.campaignTitle);
    }
    return new Date(second.dataset.campaignDate).valueOf() - new Date(first.dataset.campaignDate).valueOf();
  });

  let visible = 0;
  sortedCards.forEach((card) => {
    const matchesQuery = !query || card.dataset.campaignSearch.includes(query);
    const matchesType = type === 'all' || card.dataset.campaignKind === type;
    const matchesStatus = status === 'all' || card.dataset.campaignStatus === status;
    card.hidden = !(matchesQuery && matchesType && matchesStatus);
    if (!card.hidden) visible += 1;
    CAMPAIGN_LIST.append(card);
  });

  const count = document.querySelector('[data-result-count]');
  if (count) count.textContent = `${visible} ${visible === 1 ? 'campaign' : 'campaigns'}`;
  const empty = document.querySelector('[data-empty-state]');
  if (empty) empty.hidden = visible !== 0;
}

function exportWorkspace() {
  const currentCampaigns = {};
  cards.forEach((card) => {
    const draft = collectCardDraft(card);
    if (draft) currentCampaigns[card.dataset.campaignId] = draft;
  });

  const payload = {
    version: WORKSPACE_VERSION,
    exportedAt: new Date().toISOString(),
    source: 'https://www.roughatsea.com/instagram/',
    campaigns: currentCampaigns,
  };

  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
  const date = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `rough-at-sea-instagram-workspace-${date}.json`);
  setGlobalMessage('Workspace exported. Keep the JSON as a backup or move it to another browser.');
}

async function importWorkspace(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);

  if (parsed?.version !== WORKSPACE_VERSION || !parsed.campaigns || typeof parsed.campaigns !== 'object') {
    throw new Error('This is not a compatible Instagram Studio workspace export.');
  }

  workspace = { version: WORKSPACE_VERSION, campaigns: parsed.campaigns };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  window.location.reload();
}

function resetCampaign(card) {
  const campaign = campaignById.get(card.dataset.campaignId);
  if (!campaign) return;
  delete workspace.campaigns[campaign.id];
  applyDraftToCard(card, defaultDraft(campaign));
  persistWorkspace();
  updateStats();
  applyFilters();
  renderOpenCard(card);
  setCampaignMessage(card, 'Campaign restored to the generated draft.');
}

cards.forEach((card) => {
  const campaign = campaignById.get(card.dataset.campaignId);
  if (!campaign) return;

  applyDraftToCard(card, mergedDraft(campaign));

  const details = card.querySelector('[data-campaign-details]');
  details?.addEventListener('toggle', () => {
    if (details.open) renderOpenCard(card);
  });

  card.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

    saveCard(card);
    if (target.matches('[data-caption]')) updateCaptionCount(card);

    if (target.matches('[data-slide-field]:not([data-slide-field="altText"])')) {
      const editor = target.closest('[data-slide-editor]');
      if (editor) renderSlideEditor(card, editor);
    }
  });

  card.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (!target.matches('[data-campaign-status]')) return;

    updateStatusPill(card, target.value);
    saveCard(card);
    updateStats();
    applyFilters();
  });

  card.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    if (button.matches('[data-download-slide]')) {
      const editor = button.closest('[data-slide-editor]');
      const index = Number(editor?.dataset.slideIndex);
      button.disabled = true;
      try {
        await downloadSlide(card, index);
        setCampaignMessage(card, `Slide ${index + 1} downloaded.`);
      } catch (error) {
        console.error(error);
        setCampaignMessage(card, `Slide ${index + 1} could not be downloaded.`);
      } finally {
        button.disabled = false;
      }
    }

    if (button.matches('[data-download-all]')) {
      await downloadCarousel(card, button);
    }

    if (button.matches('[data-copy-caption]')) {
      const caption = card.querySelector('[data-caption]')?.value || '';
      try {
        await copyText(caption);
        setCampaignMessage(card, 'Caption copied.');
      } catch (error) {
        console.error(error);
        setCampaignMessage(card, 'The browser could not copy the caption.');
      }
    }

    if (button.matches('[data-copy-alt-text]')) {
      const editor = button.closest('[data-slide-editor]');
      const altText = editor?.querySelector('[data-slide-field="altText"]')?.value || '';
      try {
        await copyText(altText);
        setCampaignMessage(card, 'Slide alt text copied.');
      } catch (error) {
        console.error(error);
        setCampaignMessage(card, 'The browser could not copy the alt text.');
      }
    }

    if (button.matches('[data-reset-campaign]')) {
      const title = campaign.title;
      if (window.confirm(`Reset all local edits for “${title}”?`)) resetCampaign(card);
    }
  });
});

document.querySelectorAll('[data-filter-search], [data-filter-type], [data-filter-status], [data-filter-sort]')
  .forEach((control) => control.addEventListener('input', applyFilters));

document.querySelector('[data-export-workspace]')?.addEventListener('click', exportWorkspace);

document.querySelector('[data-import-workspace]')?.addEventListener('change', async (event) => {
  const input = event.target;
  const file = input.files?.[0];
  if (!file) return;

  try {
    await importWorkspace(file);
  } catch (error) {
    console.error(error);
    setGlobalMessage(error instanceof Error ? error.message : 'The workspace could not be imported.');
    input.value = '';
  }
});

document.querySelector('[data-clear-workspace]')?.addEventListener('click', () => {
  if (!window.confirm('Clear every local edit, status, and posting note in Instagram Studio?')) return;
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
});

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) {
    setGlobalMessage('This workspace changed in another tab. Reload to see the latest edits.');
  }
});

updateStats();
applyFilters();
