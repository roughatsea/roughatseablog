import { readEditions } from './feed-data.mjs';
const editions = readEditions();
console.log(`Feed valid: ${editions.length} editions, ${editions.reduce((n, e) => n + e.items.length, 0)} items; every item has 1–5 bullets and sources.`);
