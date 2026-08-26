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

const linksCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/links" }),
  schema: articleSchema.extend({ url: z.string().url() }),
});

export const collections = {
  notes: notesCollection,
  soundings: soundingsCollection,
  links: linksCollection,
};

