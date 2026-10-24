export interface Source { label: string; url: string }
export interface FeedItem { id: string; title: string; lane: string; topic: string; kind: string; sourceDate: string; bullets: string[]; sources: Source[]; article?: string }
export interface Edition { date: string; items: FeedItem[] }
export const lanes: string[];
export function validateEditions(editions: Edition[]): Edition[];
export function readEditions(): Edition[];
