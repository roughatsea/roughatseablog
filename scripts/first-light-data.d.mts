export interface Source { label: string; url: string }
export interface Illustration { src: string; srcSmall?: string; width: number; height: number; alt: string; caption: string }
export interface Item { id: string; title: string; department: string; topic: string; kind: 'Update' | 'Discovery'; sourceDate: string; bullets: string[]; sources: Source[]; article?: string }
export interface Edition {
  date: string; issue: number; title: string; dek: string; theme: string;
  images: { cover: Illustration; possibility: Illustration; human: Illustration; closing: Illustration };
  fiction: { title: string; opening: string[]; continuation: string[]; assumptions: string };
  items: Item[];
  singularity: { title: string; paragraphs: string[]; signals: string[]; question: string; sources: Source[] };
  closing: { title: string; paragraphs: string[] };
}
export const departments: string[];
export const imageRoles: string[];
export function countWords(value: string): number;
export function validateEditions(editions: Edition[], options?: { assetRoot?: string }): Edition[];
export function readEditions(): Edition[];
export function validateVisualLedger(editions: Edition[]): unknown[];
