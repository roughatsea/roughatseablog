export const thinkers = [{
  slug: 'nietzsche', name: 'Friedrich Nietzsche', years: '1844–1900',
  introduction: 'A philosopher who asks what our values reveal about the lives that produced them. This opening work examines moral judgment, guilt, and the meaning we give suffering.'
}, {
  slug: 'freud', name: 'Sigmund Freud', years: '1856–1939',
  introduction: 'The founder of psychoanalysis. This guided work examines his account of the conflict between individual wishes and communal life, with particular attention to aggression, guilt, and conscience.'
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
}, {
  slug: 'civilization-and-its-discontents', thinker: 'freud', title: 'Civilization and Its Discontents', year: 1930,
  question: 'Why does the civilization that protects us also make us unhappy?',
  description: 'Follow Freud’s argument about desire, cooperation, aggression, and the inner authority that can make restraint feel like guilt.',
  disciplines: ['Psychoanalysis', 'Social theory'],
  concepts: [
    { name: 'Pleasure and reality', anchor: 'pleasure-and-reality', question: 'Why can’t we simply satisfy every desire?' },
    { name: 'Sublimation', anchor: 'sublimation', question: 'Can an impulse find a different kind of satisfaction?' },
    { name: 'Superego', anchor: 'superego', question: 'How can authority become an internal judge?' },
    { name: 'Guilt and restraint', anchor: 'guilt-and-restraint', question: 'Why might doing the right thing fail to bring relief?' },
    { name: 'Eros and the death drive', anchor: 'eros-and-the-death-drive', question: 'Does destructiveness require a fundamental drive?' }
  ]
}];
