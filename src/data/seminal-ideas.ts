export const thinkers = [{
  slug: 'nietzsche', name: 'Friedrich Nietzsche', years: '1844–1900',
  introduction: 'A philosopher who asks what our values reveal about the lives that produced them. This opening work examines moral judgment, guilt, and the meaning we give suffering.'
}, {
  slug: 'freud', name: 'Sigmund Freud', years: '1856–1939',
  introduction: 'The founder of psychoanalysis. This guided work examines his account of the conflict between individual wishes and communal life, with particular attention to aggression, guilt, and conscience.'
}, {
  slug: 'jung', name: 'Carl Gustav Jung', years: '1875–1961',
  introduction: 'The founder of analytical psychology. This guided work examines persona, the proposed collective unconscious, and individuation, while separating illuminating interpretation from demonstrated explanation.'
}, {
  slug: 'mill', name: 'John Stuart Mill', years: '1806–1873',
  introduction: 'A philosopher and political economist who defends free discussion and the development of individuality. This guided work examines harm, obligations, and the limits of authority, including the exclusions and difficult cases within his defense of liberty.'
}, {
  slug: 'du-bois', name: 'W. E. B. Du Bois', years: '1868–1963',
  introduction: 'A sociologist, historian, writer, and political thinker who studies how the color line shapes institutions and inner life. This guided work examines the Veil, double consciousness, freedom after emancipation, education, and the testimony carried by the Sorrow Songs.'
}, {
  slug: 'wollstonecraft', name: 'Mary Wollstonecraft', years: '1759–1797',
  introduction: 'A moral and political philosopher who asks whether anyone can become virtuous while being educated for dependence. This guided work examines reason, equal moral standards, economic and civil independence, and national coeducation.'
}, {
  slug: 'tagore', name: 'Rabindranath Tagore', years: '1861–1941',
  introduction: 'A Bengali poet, educator, and thinker who challenges the subordination of human relationships to organized power. This guided work examines nationalism, empire, cultural exchange, and the social conditions of freedom.'
}, {
  slug: 'snow', name: 'John Snow', years: '1813–1858',
  introduction: 'A physician whose investigations of cholera joined a proposed transmission mechanism to household inquiries and comparisons of water supplies. This guided work examines causal evidence, measurement, and decisions under uncertainty without reducing his work to a pump-handle legend.'
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
}, {
  slug: 'two-essays-on-analytical-psychology', thinker: 'jung', title: 'Two Essays on Analytical Psychology', year: 1928,
  question: 'How do you become yourself without mistaking your social role for your whole identity?',
  description: 'Explore persona, unconscious conflict, symbolic interpretation, and Jung’s account of individuation, grounded in the 1928 edition.',
  disciplines: ['Analytical psychology', 'Identity'],
  concepts: [
    { name: 'Persona', anchor: 'persona', question: 'When does a social role become your whole identity?' },
    { name: 'Personal and collective unconscious', anchor: 'personal-and-collective-unconscious', question: 'What does Jung think lies beyond personal experience?' },
    { name: 'Compensation', anchor: 'compensation', question: 'Can an unconscious response challenge a one-sided self-image?' },
    { name: 'Individuation', anchor: 'individuation', question: 'How does becoming yourself differ from getting your own way?' },
    { name: 'Inflation', anchor: 'inflation', question: 'When does an insight turn into an exaggerated sense of importance?' }
  ]
}, {
  slug: 'on-liberty', thinker: 'mill', title: 'On Liberty', year: 1859,
  question: 'When may society interfere with your life?',
  description: 'Follow Mill’s defense of free discussion and chosen lives, then test its boundaries through harm, duties, consent, and social pressure.',
  disciplines: ['Political philosophy', 'Ethics'],
  concepts: [
    { name: 'Harm principle', anchor: 'harm-principle', question: 'When does preventing harm justify interference?' },
    { name: 'Self-regarding conduct and obligations', anchor: 'self-regarding-conduct-and-obligations', question: 'Which choices involve a duty to someone else?' },
    { name: 'Free discussion', anchor: 'free-discussion', question: 'How does an opinion remain open to correction?' },
    { name: 'Living conviction and dead dogma', anchor: 'living-conviction-and-dead-dogma', question: 'Can you hold a true belief without understanding it?' },
    { name: 'Individuality and experiments of living', anchor: 'individuality-and-experiments-of-living', question: 'What do we develop by choosing how to live?' }
  ]
}, {
  slug: 'the-souls-of-black-folk', thinker: 'du-bois', title: 'The Souls of Black Folk', year: 1903,
  question: 'What does freedom require beyond emancipation?',
  description: 'Follow Du Bois from the color line and double consciousness to political rights, education, economic power, and the Sorrow Songs.',
  disciplines: ['Sociology', 'Political thought', 'Literature'],
  concepts: [
    { name: 'Color line', anchor: 'color-line', question: 'How does racial hierarchy organize institutions and opportunity?' },
    { name: 'The Veil', anchor: 'the-veil', question: 'What does segregation conceal from people on either side?' },
    { name: 'Double consciousness', anchor: 'double-consciousness', question: 'What happens when contempt becomes a measure of the self?' },
    { name: 'Freedom after emancipation', anchor: 'freedom-after-emancipation', question: 'Why is legal freedom insufficient on its own?' },
    { name: 'The Sorrow Songs', anchor: 'the-sorrow-songs', question: 'How can music carry historical knowledge and political hope?' }
  ]
}, {
  slug: 'a-vindication-of-the-rights-of-woman', thinker: 'wollstonecraft', title: 'A Vindication of the Rights of Woman', year: 1792,
  question: 'Can anyone become virtuous while being educated for dependence?',
  description: 'Follow Wollstonecraft from reason and equal moral standards to economic independence, citizenship, and a public system of coeducation.',
  disciplines: ['Political philosophy', 'Education', 'Feminist thought'],
  concepts: [
    { name: 'Reason and virtue', anchor: 'reason-and-virtue', question: 'Why must moral duties be understood rather than merely obeyed?' },
    { name: 'Educated dependence', anchor: 'educated-dependence', question: 'What happens when a person is trained to please instead of judge?' },
    { name: 'Effect mistaken for cause', anchor: 'effect-mistaken-for-cause', question: 'Can inequality create the behavior later used to justify it?' },
    { name: 'Independence and citizenship', anchor: 'independence-and-citizenship', question: 'Which conditions let someone act as a moral and political agent?' },
    { name: 'National coeducation', anchor: 'national-coeducation', question: 'Why does Wollstonecraft make schooling a public concern?' }
  ]
}, {
  slug: 'nationalism', thinker: 'tagore', title: 'Nationalism', year: 1917,
  question: 'When does loyalty to a country become obedience to a machine of power?',
  description: 'Read Tagore’s critique of empire and nation-worship alongside his defense of cultural exchange and his challenge to social domination within India.',
  disciplines: ['Political thought', 'Social philosophy', 'Literature'],
  concepts: [
    { name: 'Nation and society', anchor: 'nation-and-society', question: 'What happens when a tool of collective power becomes the purpose of life?' },
    { name: 'Organized selfishness', anchor: 'organized-selfishness', question: 'Can defensive rivalry reproduce the danger it seeks to escape?' },
    { name: 'Moral anaesthesia', anchor: 'moral-anaesthesia', question: 'Why might decent people excuse harm when acting for their country?' },
    { name: 'Assimilation rather than imitation', anchor: 'assimilation-rather-than-imitation', question: 'How can a culture learn without surrendering its judgment?' },
    { name: 'Social freedom', anchor: 'social-freedom', question: 'Can political independence coexist with everyday subjection?' }
  ]
}, {
  slug: 'on-the-mode-of-communication-of-cholera', thinker: 'snow', title: 'On the Mode of Communication of Cholera', year: 1849,
  question: 'How can we identify a cause before we can see the agent responsible?',
  description: 'Read the expanded 1855 edition to follow Snow from a proposed mechanism to household evidence, water-supplier comparisons, and the limits of the famous pump intervention.',
  disciplines: ['Epidemiology', 'Scientific reasoning', 'Public health'],
  concepts: [
    { name: 'Mechanism and testable predictions', anchor: 'mechanism-and-testable-predictions', question: 'What observations should differ if an explanation is right?' },
    { name: 'Exposure beyond proximity', anchor: 'exposure-beyond-proximity', question: 'Why can living near a hazard differ from encountering it?' },
    { name: 'Denominators and comparison', anchor: 'denominators-and-comparison', question: 'What must a count be compared with before it means a rate?' },
    { name: 'Natural experiment', anchor: 'natural-experiment', question: 'When can circumstances supply a useful comparison without random assignment?' },
    { name: 'Action under uncertainty', anchor: 'action-under-uncertainty', question: 'When is there enough evidence to act but not enough to claim proof?' }
  ]
}];
