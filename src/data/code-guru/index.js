import part1 from './part-1.json';
import part2 from './part-2.json';
import part3a from './part-3-a.json';
import part3b from './part-3-b.json';
const part3 = { ...part3a, chapters: [...part3a.chapters, ...part3b.chapters] };
import part4 from './part-4.json';
import part5 from './part-5.json';
import part6 from './part-6.json';
import part7 from './part-7.json';
import part8 from './part-8.json';
import { conceptOverrides } from './concept-overrides.js';

const catalog = [part1, part2, part3, part4, part5, part6, part7, part8].map((part) => ({
  ...part,
  chapters: part.chapters.map((chapter) => ({
    ...chapter,
    concepts: chapter.concepts.map((concept) => ({
      ...concept,
      ...(conceptOverrides[concept.index] ?? {}),
    })),
  })),
}));

export default catalog;
