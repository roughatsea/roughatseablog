const DATA_NODE = document.querySelector('#instagram-campaign-data');
const CAMPAIGN_LIST = document.querySelector('[data-campaign-list]');

if (!DATA_NODE || !CAMPAIGN_LIST) {
  throw new Error('Instagram Studio could not find its campaign data.');
}

const campaigns = JSON.parse(DATA_NODE.textContent || '[]');
const campaignById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
const cards = Array.from(document.querySelectorAll('[data-campaign-card]'));

const STORAGE_KEY = 'roughatsea-instagram-workspace-v1';
const WORKSPACE_VERSION = 1;
const PREVIEW_WIDTH = 540;
const PREVIEW_HEIGHT = 675;
const EXPORT_WIDTH = 1080;
const EXPORT_HEIGHT = 1350;

const STATUS_META = {
  'needs-review': { label: 'Needs review', className: 'status-needs-review', order: 0 },
  ready: { label: 'Ready to post', className: 'status-ready', order: 1 },
  posted: { label: 'Posted', className: 'status-posted', order: 2 },
  skip: { label: 'Skip', className: 'status-skip', order: 3 },
};

const PALETTES = {
  note: { accent: '#ff1493', secondary: '#1493ff', tertiary: '#93ff14' },
  sounding: { accent: '#1493ff', secondary: '#51d7ff', tertiary: '#ff1493' },
  reckoning: { accent: '#93ff14', secondary: '#1493ff', tertiary: '#ff1493' },
  link: { accent: '#ffd166', secondary: '#1493ff', tertiary: '#ff1493' },
  experience: { accent: '#ff1493', secondary: '#93ff14', tertiary: '#1493ff' },
  reference: { accent: '#93ff14', secondary: '#1493ff', tertiary: '#ff1493' },
  wake: { accent: '#ff8a24', secondary: '#1493ff', tertiary: '#93ff14' },
};

const imageCache = new Map();
let workspace = loadWorkspace();
let saveTimer = null;

function loadWorkspace() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (parsed?.version === WORKSPACE_VERSION && parsed.campaigns) {
      return parsed;
    }
  } catch (error) {
    console.warn('Instagram Studio ignored unreadable local data.', error);
  }

  return { version: WORKSPACE_VERSION, campaigns: {} };
}

function persistWorkspace() {
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch (error) {
      console.error('Instagram Studio could not save local edits.', error);
      setGlobalMessage('Local edits could not be saved. Export the workspace before leaving.');
    }
  }, 120);
}

function defaultDraft(campaign) {
  return {
    status: 'needs-review',
    caption: campaign.caption,
    notes: '',
    slides: campaign.slides.map((slide) => ({
      id: slide.id,
      eyebrow: slide.eyebrow,
      headline: slide.headline,
      body: slide.body,
      altText: (
        slide.altText ||
        `Rough at Sea ${campaign.typeLabel} carousel slide: ${slide.headline}. ${slide.body} Background artwork: ${campaign.heroImageAlt}`
      ).slice(0, 500),
    })),
  };
}

function mergedDraft(campaign) {
  const defaults = defaultDraft(campaign);
  const saved = workspace.campaigns[campaign.id];
  if (!saved) return defaults;

  const savedSlides = new Map(
    Array.isArray(saved.slides) ? saved.slides.map((slide) => [slide.id, slide]) : [],
  );

  return {
    status: STATUS_META[saved.status] ? saved.status : defaults.status,
    caption: typeof saved.caption === 'string' ? saved.caption : defaults.caption,
    notes: typeof saved.notes === 'string' ? saved.notes : defaults.notes,
    slides: defaults.slides.map((slide) => ({ ...slide, ...(savedSlides.get(slide.id) || {}) })),
  };
}

function collectCardDraft(card) {
  const id = card.dataset.campaignId;
  const campaign = campaignById.get(id);
  if (!campaign) return null;

  const slideEditors = Array.from(card.querySelectorAll('[data-slide-editor]'));
  return {
    status: card.querySelector('[data-campaign-status]')?.value || 'needs-review',
    caption: card.querySelector('[data-caption]')?.value || '',
    notes: card.querySelector('[data-posting-notes]')?.value || '',
    slides: slideEditors.map((editor, index) => ({
      id: campaign.slides[index]?.id || `slide-${index + 1}`,
      eyebrow: editor.querySelector('[data-slide-field="eyebrow"]')?.value || '',
      headline: editor.querySelector('[data-slide-field="headline"]')?.value || '',
      body: editor.querySelector('[data-slide-field="body"]')?.value || '',
      altText: editor.querySelector('[data-slide-field="altText"]')?.value || '',
    })),
  };
}

function saveCard(card) {
  const draft = collectCardDraft(card);
  if (!draft) return;
  workspace.campaigns[card.dataset.campaignId] = draft;
  persistWorkspace();
}

function applyDraftToCard(card, draft) {
  const statusSelect = card.querySelector('[data-campaign-status]');
  const caption = card.querySelector('[data-caption]');
  const notes = card.querySelector('[data-posting-notes]');

  if (statusSelect) statusSelect.value = draft.status;
  if (caption) caption.value = draft.caption;
  if (notes) notes.value = draft.notes;

  const editors = Array.from(card.querySelectorAll('[data-slide-editor]'));
  editors.forEach((editor, index) => {
    const slide = draft.slides[index];
    if (!slide) return;
    const eyebrow = editor.querySelector('[data-slide-field="eyebrow"]');
    const headline = editor.querySelector('[data-slide-field="headline"]');
    const body = editor.querySelector('[data-slide-field="body"]');
    const altText = editor.querySelector('[data-slide-field="altText"]');
    if (eyebrow) eyebrow.value = slide.eyebrow;
    if (headline) headline.value = slide.headline;
    if (body) body.value = slide.body;
    if (altText) altText.value = slide.altText;
  });

  updateStatusPill(card, draft.status);
  updateCaptionCount(card);
}

function updateStatusPill(card, status) {
  const pill = card.querySelector('[data-status-pill]');
  const meta = STATUS_META[status] || STATUS_META['needs-review'];
  if (!pill) return;

  pill.textContent = meta.label;
  pill.classList.remove(
    'status-needs-review',
    'status-ready',
    'status-posted',
    'status-skip',
  );
  pill.classList.add(meta.className);
  card.dataset.campaignStatus = status;
}

function updateCaptionCount(card) {
  const caption = card.querySelector('[data-caption]');
  const counter = card.querySelector('[data-caption-count]');
  if (caption && counter) counter.textContent = String(caption.value.length);
}

function setGlobalMessage(message) {
  const output = document.querySelector('[data-global-message]');
  if (!output) return;
  output.textContent = message;
  window.setTimeout(() => {
    if (output.textContent === message) output.textContent = '';
  }, 5000);
}

function setCampaignMessage(card, message) {
  const output = card.querySelector('[data-campaign-message]');
  if (!output) return;
  output.textContent = message;
  window.setTimeout(() => {
    if (output.textContent === message) output.textContent = '';
  }, 5000);
}

function getCurrentSlide(card, index) {
  const campaign = campaignById.get(card.dataset.campaignId);
  const editor = card.querySelector(`[data-slide-editor][data-slide-index="${index}"]`);
  if (!campaign || !editor) return null;

  return {
    ...campaign.slides[index],
    eyebrow: editor.querySelector('[data-slide-field="eyebrow"]')?.value || '',
    headline: editor.querySelector('[data-slide-field="headline"]')?.value || '',
    body: editor.querySelector('[data-slide-field="body"]')?.value || '',
    altText: editor.querySelector('[data-slide-field="altText"]')?.value || '',
  };
}

