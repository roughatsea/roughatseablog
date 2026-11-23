export interface CuratedBook {
  title: string;
  author: string;
  contribution: string;
  question: string;
  note: string;
}
export interface CuratedList {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  audience: string;
  approach: string;
  books: CuratedBook[];
}
export const curatedLists: CuratedList[] = [
  {
    slug: 'writing-fiction',
    title: 'Four Books for New Writers',
    subtitle: 'From clean sentences to emotional resonance',
    description: 'A compact writing-craft syllabus recommended as a set by a published author on Instagram. Four books, four different lenses on what makes writing work.',
    audience: 'New writers, especially aspiring fiction writers',
    approach: 'Read for tools, not commandments. Try the exercises on your own pages, and keep what improves the work.',
    books: [
      {
        title: 'The First Five Pages',
        author: 'Noah Lukeman',
        contribution: 'Diagnosis and revision',
        question: 'Why does a manuscript lose its reader?',
        note: 'An editorial eye for clichés, clutter, weak dialogue and other problems that can derail a promising opening. Its advice is best treated as a diagnostic checklist, not a prohibition on stylistic risk.'
      },
      {
        title: 'Writing Tools',
        author: 'Roy Peter Clark',
        contribution: 'Practical technique',
        question: 'What choices make prose clearer and more forceful?',
        note: 'A broad toolkit for word placement, rhythm, structure, emphasis and revision. The techniques travel across journalism, essays and fiction; they are options rather than compulsory formulas.'
      },
      {
        title: 'Several Short Sentences About Writing',
        author: 'Verlyn Klinkenborg',
        contribution: 'Attention to sentences',
        question: 'What happens when we give each sentence our full attention?',
        note: 'A distinctive invitation to rethink how we compose and perceive sentences. It cultivates deliberateness and close attention more than conventional plot construction.'
      },
      {
        title: 'The Emotional Craft of Fiction',
        author: 'Donald Maass',
        contribution: 'Reader experience',
        question: 'How can a story make readers feel rather than merely describe feeling?',
        note: 'A guide to emotional stakes, inner life, subtext and the reader’s participation. It complements sentence-level craft with a view of what fiction does to its audience.'
      }
    ]
  }
];
