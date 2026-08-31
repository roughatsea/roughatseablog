export type InstagramCampaignKind =
  | 'note'
  | 'sounding'
  | 'reckoning'
  | 'link'
  | 'experience'
  | 'reference'
  | 'wake';

export type InstagramSlideLayout = 'cover' | 'feature' | 'cta';

export interface InstagramSlide {
  id: string;
  layout: InstagramSlideLayout;
  eyebrow: string;
  headline: string;
  body: string;
  altText?: string;
}

export interface InstagramCampaign {
  id: string;
  kind: InstagramCampaignKind;
  typeLabel: string;
  title: string;
  description: string;
  date: string;
  heroImage: string;
  heroImageAlt: string;
  url: string;
  tags: string[];
  caption: string;
  slides: InstagramSlide[];
}

type SupportedCollection = 'notes' | 'soundings' | 'reckonings' | 'links';

type CollectionConfig = {
  kind: InstagramCampaignKind;
  typeLabel: string;
  pathPrefix: string;
  premiseHeadline: string;
};

const collectionConfig: Record<SupportedCollection, CollectionConfig> = {
  notes: {
    kind: 'note',
    typeLabel: 'Note',
    pathPrefix: '/notes',
    premiseHeadline: 'What this piece is really exploring',
  },
  soundings: {
    kind: 'sounding',
    typeLabel: 'Morning Soundings',
    pathPrefix: '/soundings',
    premiseHeadline: 'Signals worth carrying into the day',
  },
  reckonings: {
    kind: 'reckoning',
    typeLabel: 'Reckoning',
    pathPrefix: '/reckonings',
    premiseHeadline: 'The idea beneath the notation',
  },
  links: {
    kind: 'link',
    typeLabel: 'Field Note',
    pathPrefix: '/links',
    premiseHeadline: 'Why this trail is worth following',
  },
};

const genericSectionHeadlines = [
  'The central thread',
  'A closer look',
  'What changes once you see it',
];

const ignoredHeadings = /^(sources?|references?|footnotes?|notes?|further reading|bibliography|acknowledg(e)?ments?)$/i;

function decodeEntities(value: string): string {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function cleanMarkdown(value: string): string {
  return decodeEntities(value)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*(?:import|export)\s+.*$/gm, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\{[^{}]{0,240}\}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateAtWord(value: string, maxLength: number): string {
  const clean = value.trim();
  if (clean.length <= maxLength) return clean;

  const shortened = clean.slice(0, maxLength + 1);
  const finalSpace = shortened.lastIndexOf(' ');
  const boundary = finalSpace > maxLength * 0.65 ? finalSpace : maxLength;
  return `${shortened.slice(0, boundary).trimEnd()}…`;
}

function cleanHeading(value: string): string {
  return cleanMarkdown(value.replace(/#+\s*$/, '')).replace(/\s+/g, ' ').trim();
}

function extractSections(body: string): Array<{ headline: string; body: string }> {
  const matches = Array.from(body.matchAll(/^#{2,3}\s+(.+?)\s*$/gm));
  const sections: Array<{ headline: string; body: string }> = [];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const headline = cleanHeading(match[1] ?? '');
    if (!headline || ignoredHeadings.test(headline)) continue;

    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? body.length;
    const sectionBody = truncateAtWord(cleanMarkdown(body.slice(start, end)), 330);

    if (sectionBody.length < 70) continue;
    sections.push({ headline: truncateAtWord(headline, 92), body: sectionBody });
  }

  return sections;
}

function extractParagraphs(body: string): string[] {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .split(/\n\s*\n+/)
    .map((paragraph) => truncateAtWord(cleanMarkdown(paragraph), 330))
    .filter((paragraph) => paragraph.length >= 85)
    .filter((paragraph) => !ignoredHeadings.test(paragraph));
}

function hashtagFromTag(tag: string): string | null {
  const normalized = tag
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return normalized ? `#${normalized}` : null;
}

function buildCaption(
  title: string,
  description: string,
  url: string,
  tags: string[],
  slides: InstagramSlide[],
): string {
  const talkingPoints = slides
    .filter((slide) => slide.layout === 'feature')
    .slice(0, 3)
    .map((slide) => `• ${slide.headline}`)
    .join('\n');

  const hashtags = Array.from(
    new Set([
      '#RoughAtSea',
      '#Longform',
      ...tags.map(hashtagFromTag).filter((tag): tag is string => Boolean(tag)),
    ]),
  )
    .slice(0, 8)
    .join(' ');

  return [
    `New from Rough at Sea: ${title}`,
    description,
    talkingPoints,
    `Read the full piece at https://www.roughatsea.com${url}`,
    hashtags,
  ]
    .filter(Boolean)
    .join('\n\n');
}

function buildSlides(
  title: string,
  description: string,
  body: string,
  typeLabel: string,
  premiseHeadline: string,
  url: string,
  tags: string[],
): InstagramSlide[] {
  const paragraphs = extractParagraphs(body);
  const sections = extractSections(body);
  const intro = paragraphs[0] ?? description;
  const contentSlides: InstagramSlide[] = [];

  if (intro) {
    contentSlides.push({
      id: 'premise',
      layout: 'feature',
      eyebrow: 'The premise',
      headline: premiseHeadline,
      body: truncateAtWord(intro, 330),
    });
  }

  for (const section of sections.slice(0, 3)) {
    contentSlides.push({
      id: `section-${contentSlides.length + 1}`,
      layout: 'feature',
      eyebrow: 'Inside the piece',
      headline: section.headline,
      body: section.body,
    });
  }

  let paragraphIndex = 1;
  while (contentSlides.length < 3 && paragraphIndex < paragraphs.length) {
    const bodyText = paragraphs[paragraphIndex];
    if (!contentSlides.some((slide) => slide.body === bodyText)) {
      contentSlides.push({
        id: `thread-${contentSlides.length + 1}`,
        layout: 'feature',
        eyebrow: 'A closer look',
        headline: genericSectionHeadlines[contentSlides.length - 1] ?? 'Another current',
        body: bodyText,
      });
    }
    paragraphIndex += 1;
  }

  if (contentSlides.length < 3 && tags.length > 0) {
    contentSlides.push({
      id: 'coordinates',
      layout: 'feature',
      eyebrow: 'Coordinates',
      headline: 'The ideas this piece moves through',
      body: tags.map((tag) => tag.replaceAll('-', ' ')).join(' · '),
    });
  }

  return [
    {
      id: 'cover',
      layout: 'cover',
      eyebrow: `Rough at Sea · ${typeLabel}`,
      headline: truncateAtWord(title, 120),
      body: truncateAtWord(description, 250),
    },
    ...contentSlides.slice(0, 4),
    {
      id: 'cta',
      layout: 'cta',
      eyebrow: 'Keep reading',
      headline: 'Follow the full current at Rough at Sea.',
      body: `roughatsea.com${url}`,
    },
  ];
}

export function buildInstagramCampaign(entry: any, collection: SupportedCollection): InstagramCampaign {
  const config = collectionConfig[collection];
  const title = entry.data.title;
  const description =
    entry.data.description ??
    truncateAtWord(extractParagraphs(entry.body ?? '')[0] ?? `Explore ${title} at Rough at Sea.`, 250);
  const url = `${config.pathPrefix}/${entry.id}/`;
  const tags = Array.isArray(entry.data.tags) ? entry.data.tags : [];
  const slides = buildSlides(
    title,
    description,
    entry.body ?? '',
    config.typeLabel,
    config.premiseHeadline,
    url,
    tags,
  );

  return {
    id: `${collection}/${entry.id}`,
    kind: config.kind,
    typeLabel: config.typeLabel,
    title,
    description,
    date: entry.data.date.toISOString(),
    heroImage: entry.data.heroImage,
    heroImageAlt: entry.data.heroImageAlt,
    url,
    tags,
    caption: buildCaption(title, description, url, tags, slides),
    slides,
  };
}

export const standaloneInstagramCampaigns: InstagramCampaign[] = [
  {
    id: 'experience/atlas',
    kind: 'experience',
    typeLabel: 'Interactive Experience',
    title: 'Atlas: Spin the World',
    description:
      'A full-bleed globe for wandering across countries, political divisions, and World Heritage sites without reducing the world to a list.',
    date: '2026-08-29T00:00:00.000Z',
    heroImage: '/images/notes/cosmic-currents.svg',
    heroImageAlt: 'A luminous cosmic map used as a visual stand-in for the interactive Atlas experience.',
    url: '/atlas/',
    tags: ['geography', 'world-heritage', 'interactive', 'maps'],
    slides: [
      {
        id: 'cover',
        layout: 'cover',
        eyebrow: 'Rough at Sea · Interactive experience',
        headline: 'Spin the world. Stop anywhere. Learn what is there.',
        body: 'Atlas turns geographic curiosity into an explorable globe rather than another directory of facts.',
      },
      {
        id: 'countries',
        layout: 'feature',
        eyebrow: 'Choose a place',
        headline: 'Click a country and let the globe become a field guide.',
        body: 'The information panel follows your curiosity while the world remains present, spatial, and connected around it.',
      },
      {
        id: 'boundaries',
        layout: 'feature',
        eyebrow: 'Change the scale',
        headline: 'Political divisions can appear when the overview is not enough.',
        body: 'State and regional boundaries add local structure without permanently cluttering the globe.',
      },
      {
        id: 'heritage',
        layout: 'feature',
        eyebrow: 'Follow the markers',
        headline: 'World Heritage sites become invitations to stop and look closer.',
        body: 'Select a site to learn why it matters, then pull back and see where it sits in the larger world.',
      },
      {
        id: 'cta',
        layout: 'cta',
        eyebrow: 'Enter the atlas',
        headline: 'The world is waiting to be spun.',
        body: 'roughatsea.com/atlas/',
      },
    ],
    caption: [
      'Spin the world. Stop anywhere. Learn what is there.',
      'Atlas is a full-bleed interactive globe built for geographic wandering: countries, political divisions, and World Heritage sites all remain part of one explorable world.',
      'Open it at https://www.roughatsea.com/atlas/',
      '#RoughAtSea #Interactive #Geography #WorldHeritage #Maps',
    ].join('\n\n'),
  },
  {
    id: 'reference/software-engineering-field-guide',
    kind: 'reference',
    typeLabel: 'Reference',
    title: 'Software Engineering Field Guide',
    description:
      'A recognition-first reference for finding the name of a software idea from the pressure, symptom, or half-remembered phrase you already recognize.',
    date: '2026-08-30T00:00:00.000Z',
    heroImage: '/images/notes/code-guru-rebuilt-recognition-first.webp',
    heroImageAlt: 'An engineer maps glowing software structures while a lighthouse guides a boat through a storm.',
    url: '/guides/software-engineering/',
    tags: ['software-engineering', 'programming', 'reference', 'design-patterns'],
    slides: [
      {
        id: 'cover',
        layout: 'cover',
        eyebrow: 'Rough at Sea · Reference',
        headline: 'You may know the pattern before you know its name.',
        body: 'The Software Engineering Field Guide starts with recognition, then connects it to professional vocabulary.',
      },
      {
        id: 'pressure',
        layout: 'feature',
        eyebrow: 'Start with the pressure',
        headline: 'Search for the problem you can see but cannot yet name.',
        body: 'Use a term, an alias, or a symptom in the code. The guide is organized around the moment when recognition arrives before vocabulary.',
      },
      {
        id: 'scope',
        layout: 'feature',
        eyebrow: 'Mapped vocabulary',
        headline: '206 terms, from code smells to distributed systems.',
        body: 'Each result opens a focused explanation with trade-offs, nearby concepts, source lineage, and explicit examples.',
      },
      {
        id: 'examples',
        layout: 'feature',
        eyebrow: 'Read the code two ways',
        headline: 'Verbose examples come first; concise forms follow.',
        body: 'C# and Python examples make the structure visible before introducing the compressed syntax professionals often use.',
      },
      {
        id: 'cta',
        layout: 'cta',
        eyebrow: 'Open the field guide',
        headline: 'Find the word for the thing you already understand.',
        body: 'roughatsea.com/guides/software-engineering/',
      },
    ],
    caption: [
      'You may know the pattern before you know its name.',
      'The Software Engineering Field Guide contains 206 searchable terms and begins with the pressure or symptom you recognize—not an assumption that the vocabulary is already familiar.',
      'Search it at https://www.roughatsea.com/guides/software-engineering/',
      '#RoughAtSea #SoftwareEngineering #Programming #DesignPatterns #Reference',
    ].join('\n\n'),
  },
  {
    id: 'wake/the-wake',
    kind: 'wake',
    typeLabel: 'Longitudinal Observatory',
    title: 'The Wake',
    description:
      'Soundings notices the signal. The Wake records what followed—without confusing attention for evidence, repetition for corroboration, or hindsight for what was known at the start.',
    date: '2026-08-30T00:00:00.000Z',
    heroImage: '/og.png',
    heroImageAlt: 'The Rough at Sea open-graph image, used for The Wake campaign.',
    url: '/wake/',
    tags: ['research', 'longitudinal', 'evidence', 'soundings'],
    slides: [
      {
        id: 'cover',
        layout: 'cover',
        eyebrow: 'Rough at Sea · The Wake',
        headline: 'What happened after the signal first appeared?',
        body: 'The Wake is a longitudinal record of what Rough at Sea noticed, what changed, and what remained unresolved.',
      },
      {
        id: 'point-zero',
        layout: 'feature',
        eyebrow: 'Preserve point zero',
        headline: 'Record what was actually known before hindsight rewrites the story.',
        body: 'Each subject begins with a dated observation that separates known facts, uncertainty, open questions, and source lineage.',
      },
      {
        id: 'evidence',
        layout: 'feature',
        eyebrow: 'Follow the evidence',
        headline: 'Repetition is not corroboration. Attention is not proof.',
        body: 'The record distinguishes independent evidence from many outlets repeating the same paper, announcement, allegation, or wire report.',
      },
      {
        id: 'trajectory',
        layout: 'feature',
        eyebrow: 'Watch the trajectory',
        headline: 'Confirmed, contradicted, implemented, abandoned, forgotten, or transformed.',
        body: 'The point is not to predict perfectly. It is to leave an honest trail of how a developing story changed over time.',
      },
      {
        id: 'cta',
        layout: 'cta',
        eyebrow: 'Explore the active register',
        headline: 'See what Rough at Sea is still following.',
        body: 'roughatsea.com/wake/',
      },
    ],
    caption: [
      'What happened after the signal first appeared?',
      'The Wake is Rough at Sea’s longitudinal observatory: a dated record of what was known at the start, what evidence arrived later, and whether a story was confirmed, contradicted, implemented, abandoned, forgotten, or transformed.',
      'Explore the pilot at https://www.roughatsea.com/wake/',
      '#RoughAtSea #Research #Evidence #Longitudinal #MediaLiteracy',
    ].join('\n\n'),
  },
];
