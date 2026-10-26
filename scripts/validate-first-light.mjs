import { readEditions, validateVisualLedger, countWords } from './first-light-data.mjs';
const editions = readEditions();
if (!editions.length) throw new Error('First Light needs at least one complete issue');
validateVisualLedger(editions);
for (const edition of editions) {
  const words = countWords([...edition.fiction.opening, ...edition.fiction.continuation].join(' '));
  console.log(`First Light ${edition.date}: four distinct raster illustrations, ${words} fiction words, ${edition.items.length} sourced reports, singularity analysis, generation records verified.`);
}
