import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

const articleSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  heroImage: z.string(),
  heroImageAlt: z.string(),
  date: z.date(),
  publishedAt: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
});

const notesCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/notes" }),
  schema: articleSchema,
});

const soundingsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/soundings" }),
  schema: articleSchema,
});

const reckoningSchema = articleSchema.extend({
  area: z.string(),
  difficulty: z.enum(['Foundational', 'Intermediate', 'Advanced', 'Ultra-advanced']),
  prerequisites: z.array(z.string()).default([]),
  readTimeMinutes: z.number().int().positive(),
  miniSeries: z.object({
    title: z.string(),
    part: z.number().int().positive(),
    total: z.number().int().positive(),
  }).optional(),
});

const reckoningsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/reckonings" }),
  schema: reckoningSchema,
});

const savePointLaneSchema = z.enum([
  'final-fantasy',
  'final-fantasy-xiv',
  'beyond-final-fantasy',
]);

const savePointSourceTypeSchema = z.enum([
  'video',
  'news',
  'lore',
  'interview',
  'history',
  'design',
  'music',
  'preservation',
  'criticism',
  'research',
  'other',
]);

const savePointSectionSchema = z.object({
  lane: savePointLaneSchema,
  title: z.string(),
  game: z.string(),
  summary: z.string(),
  sourceType: savePointSourceTypeSchema,
  spoilerLevel: z.enum(['none', 'light', 'major']),
  spoilerScope: z.string(),
  primarySource: z.object({
    title: z.string(),
    creator: z.string().optional(),
    url: z.string().url(),
    publishedAt: z.coerce.date().optional(),
    videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/).optional(),
  }),
  tags: z.array(z.string()).default([]),
}).superRefine((section, context) => {
  if (section.sourceType === 'video' && !section.primarySource.videoId) {
    context.addIssue({
      code: 'custom',
      message: 'Video sections require a primary-source video ID.',
      path: ['primarySource', 'videoId'],
    });
  }
});

const savePointSchema = articleSchema.extend({
  edition: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  featureLane: savePointLaneSchema,
  readTimeMinutes: z.number().int().positive(),
  sections: z.array(savePointSectionSchema).length(3),
}).superRefine((edition, context) => {
  const lanes = edition.sections.map((section) => section.lane);
  const requiredLanes = savePointLaneSchema.options;

  for (const lane of requiredLanes) {
    if (lanes.filter((candidate) => candidate === lane).length !== 1) {
      context.addIssue({
        code: 'custom',
        message: `Save Point editions require exactly one ${lane} section.`,
        path: ['sections'],
      });
    }
  }

  if (!lanes.includes(edition.featureLane)) {
    context.addIssue({
      code: 'custom',
      message: 'The feature lane must match one of the edition sections.',
      path: ['featureLane'],
    });
  }
});

const savePointsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/save-point" }),
  schema: savePointSchema,
});

const linksCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/links" }),
  schema: articleSchema.extend({ url: z.string().url() }),
});

export const collections = {
  notes: notesCollection,
  soundings: soundingsCollection,
  reckonings: reckoningsCollection,
  savePoints: savePointsCollection,
  links: linksCollection,
};
