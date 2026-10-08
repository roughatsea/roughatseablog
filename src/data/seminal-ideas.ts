export const thinkers = [{
  slug: 'nietzsche', name: 'Friedrich Nietzsche', years: '1844–1900',
  introduction: 'A philosopher who asks what our values reveal about the lives that produced them. This opening work examines moral judgment, guilt, and the meaning we give suffering.'
}];

export const works = [{
  slug: 'genealogy-of-morality', thinker: 'nietzsche', title: 'On the Genealogy of Morality', year: 1887,
  question: 'Where do our moral values come from—and what do they do to us?',
  description: 'A guided exploration of resentment, guilt, conscience, and the search for meaning in suffering.',
  disciplines: ['Philosophy', 'Moral psychology'],
  concepts: [
    { name: 'Genealogy', anchor: 'genealogy', question: 'How did a value become authoritative?' },
    { name: 'Ressentiment', anchor: 'ressentiment', question: 'Can resentment create a moral worldview?' },
    { name: 'Bad conscience', anchor: 'bad-conscience', question: 'What happens when aggression turns inward?' },
    { name: 'Ascetic ideal', anchor: 'ascetic-ideal', question: 'Why can self-denial give suffering meaning?' },
    { name: 'Perspectivism', anchor: 'perspectivism', question: 'How can several perspectives improve understanding?' }
  ]
}];
