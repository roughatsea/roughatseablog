import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

const notesCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
  }),
});

const linksCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/links" }),
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = {
  'notes': notesCollection,
  'links': linksCollection,
};
