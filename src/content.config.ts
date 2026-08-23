import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

const notesCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    heroImage: z.string(),
    heroImageAlt: z.string(),
    date: z.date(),
    publishedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const linksCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/links" }),
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    date: z.date(),
    publishedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = {
  'notes': notesCollection,
  'links': linksCollection,
};
