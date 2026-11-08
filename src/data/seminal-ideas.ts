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
}, {
  slug: 'rokeya', name: 'Rokeya Sakhawat Hossain', years: '1880–1932',
  introduction: 'A Bengali Muslim writer and advocate for girls’ education who uses an imagined society to make familiar restrictions look strange. This guided story examines seclusion, scientific opportunity, domestic work, and the difference between ending domination and reversing it.'
}, {
  slug: 'great-learning-tradition', name: 'Early Confucian tradition', years: 'Ancient China; authorship and composition date uncertain',
  introduction: 'The Great Learning joins moral cultivation to household and political responsibility. Its traditional association with Confucius and Zengzi does not establish a single author; this guide keeps the early text, later interpretations, and Legge’s English translation distinct.'
}, {
  slug: 'wallace', name: 'Alfred Russel Wallace', years: '1823–1913',
  introduction: 'A naturalist who independently developed a proposal for natural selection. This guided essay examines varieties, population checks, changing conditions, and cumulative divergence while keeping the 1858 argument distinct from later evolutionary theory.'
}, {
  slug: 'gilman', name: 'Charlotte Perkins Gilman', years: '1860–1935',
  introduction: 'A writer and social critic who uses a secret journal and a disturbing room to examine care, authority, and constrained agency. This guided story distinguishes the narrator’s experience from Gilman’s biography and resistance from recovery.'
}, {
  slug: 'smith', name: 'Adam Smith', years: '1723–1790',
  introduction: 'A Scottish moral philosopher who examines how specialized work and exchange enlarge productive capacity. This guide connects that achievement to market access, learned abilities, and his argument for public attention to education.'
}, {
  slug: 'early-buddhist-tradition', name: 'Early Buddhist tradition', years: 'Ancient South Asia; anthology compilation date uncertain',
  introduction: 'The Dhammapada transmits verses attributed to the Buddha within the Pali Buddhist canon. This guide examines heedfulness, anger, non-harming, and ethical practice while distinguishing the anthology, its translators, and later interpretation.'
}, {
  slug: 'douglass', name: 'Frederick Douglass', years: 'c. 1818–1895',
  introduction: 'An abolitionist writer and orator who makes public professions of liberty answer to the lives excluded from them. This guide examines his 1852 oration on national celebration, personhood, institutional responsibility, constitutional interpretation, and hope.'
}, {
  slug: 'clifford', name: 'William Kingdon Clifford', years: '1845–1879',
  introduction: 'A mathematician and philosopher who asks what people owe one another in forming and sharing beliefs. This guide examines inquiry, testimony, inference, and the contested moral demand for sufficient evidence.'
}, {
  slug: 'marti', name: 'José Martí', years: '1853–1895',
  introduction: 'A Cuban writer and independence organizer who asks how republics can govern people whom their elites scarcely know. This guide examines political knowledge, colonial habits, cultural learning, racial equality, and regional solidarity.'
}, {
  slug: 'nightingale', name: 'Florence Nightingale', years: '1820–1910',
  introduction: 'A nursing reformer and writer who examines the conditions that make care effective. This guide follows her arguments about continuity, observation, attention, and practical responsibility while scrutinizing her historical medical claims.'
}, {
  slug: 'woolf', name: 'Virginia Woolf', years: '1882–1941',
  introduction: 'A novelist and critic who asks how literary form can convey lived experience. This guide examines her defense of artistic freedom, attention to ordinary consciousness, and scrutiny of what even innovative methods leave out.'
}, {
  slug: 'okakura', name: 'Okakura Kakuzō', years: '1863–1913',
  introduction: 'An art educator, critic, and museum curator who presents tea as an art of everyday life. This guide examines attention, hospitality, imagination, and cultivated appreciation while questioning the book’s cultural generalizations and relations to privilege.'
}, {
  slug: 'lovelace', name: 'Ada Lovelace', years: '1815–1852',
  introduction: 'A mathematical writer whose Notes on Babbage’s proposed Analytical Engine distinguish operations, their objects, and the organization of a calculation. This guide examines representation, changing stored values, repeated procedures, and the limits of claims about machines.'
}, {
  slug: 'zitkala-sa', name: 'Zitkala-Sa', years: '1876–1938',
  introduction: 'A Yankton Dakota writer, musician, and advocate whose autobiographical account tests institutional claims against a child’s experience. This guide examines forced assimilation, misunderstood speech, routine, resistance, and achievement without belonging.'
}, {
  slug: 'plato', name: 'Plato', years: '429?–347 BCE',
  introduction: 'An Athenian philosopher whose writings examine how people should live through speech, argument, and dramatic setting. This guide reads his portrayal of Socrates at trial while distinguishing the author, the represented speaker, and the historical evidence.'
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
}, {
  slug: 'sultanas-dream', thinker: 'rokeya', title: 'Sultana’s Dream', year: 1905,
  question: 'Whose freedom is sacrificed when a society promises protection?',
  description: 'Enter Rokeya’s imagined Ladyland to examine learned timidity, education, scientific power, and the unresolved cost of reversing who gets confined.',
  disciplines: ['Literature', 'Feminist thought', 'Science fiction'],
  concepts: [
    { name: 'Estrangement and role reversal', anchor: 'estrangement-and-role-reversal', question: 'What becomes visible when a familiar rule applies to someone else?' },
    { name: 'Protection and confinement', anchor: 'protection-and-confinement', question: 'Who bears the cost of making public space safe?' },
    { name: 'Education and scientific agency', anchor: 'education-and-scientific-agency', question: 'Which institutions let a dismissed capacity become effective power?' },
    { name: 'Technology and the organization of life', anchor: 'technology-and-the-organization-of-life', question: 'How do energy, care, and work arrangements shape freedom?' },
    { name: 'Emancipation or reversed domination', anchor: 'emancipation-or-reversed-domination', question: 'Does changing who rules end the injustice of the rule?' }
  ]
}, {
  slug: 'the-great-learning', thinker: 'great-learning-tradition', title: 'The Great Learning', year: 'Ancient China; date uncertain',
  question: 'How does governing yourself shape the way you govern others?',
  description: 'Follow an early Confucian classic from inquiry and self-deception to family, reciprocity, public authority, and the purposes of wealth.',
  disciplines: ['Chinese philosophy', 'Political ethics', 'Education'],
  concepts: [
    { name: 'Root and branches', anchor: 'root-and-branches', question: 'What does public authority depend on in the person exercising it?' },
    { name: 'Investigation and moral understanding', anchor: 'investigation-and-moral-understanding', question: 'What must you learn, and what are you unwilling to acknowledge?' },
    { name: 'Sincerity and self-deception', anchor: 'sincerity-and-self-deception', question: 'Does your principle survive the absence of an audience?' },
    { name: 'Attention and partiality', anchor: 'attention-and-partiality', question: 'Can you recognize faults in those you love and merits in those you dislike?' },
    { name: 'Family, example, and reciprocity', anchor: 'family-example-and-reciprocity', question: 'Do you impose treatment you resent receiving?' },
    { name: 'Public wealth and public purpose', anchor: 'public-wealth-and-public-purpose', question: 'When does a rich treasury conceal an impoverished political relationship?' }
  ]
}, {
  slug: 'on-the-tendency-of-varieties', thinker: 'wallace', title: 'On the Tendency of Varieties to Depart Indefinitely from the Original Type', year: 1858,
  question: 'How can inherited differences accumulate without a planner?',
  description: 'Follow Wallace’s 1858 argument from domestic reversion and population checks to differential persistence, divergence, and the limits of biological superiority.',
  disciplines: ['Evolutionary biology', 'Scientific reasoning'],
  concepts: [
    { name: 'Varieties and the fixed-type objection', anchor: 'varieties-and-the-fixed-type-objection', question: 'Does domestic reversion establish a fixed limit to change?' },
    { name: 'Population checks and the struggle for existence', anchor: 'population-checks-and-the-struggle-for-existence', question: 'What prevents possible reproduction from becoming unlimited growth?' },
    { name: 'Differential persistence and inherited difference', anchor: 'differential-persistence-and-inherited-difference', question: 'When can unequal survival produce lasting population change?' },
    { name: 'Divergence without a destination', anchor: 'divergence-without-a-destination', question: 'Does increasing difference require a universal ladder of improvement?' },
    { name: 'Domestication and changed conditions', anchor: 'domestication-and-changed-conditions', question: 'Which conditions change when human support is removed?' },
    { name: 'Adaptation without intention', anchor: 'adaptation-without-intention', question: 'How can a useful feature persist without foresight?' }
  ]
}, {
  slug: 'the-yellow-wall-paper', thinker: 'gilman', title: 'The Yellow Wall-Paper', year: 1892,
  question: 'What happens when care makes disagreement impossible?',
  description: 'Read Gilman’s secret journal through paternalism, dismissed testimony, the woman behind the pattern, and an escape that resists a simple victory.',
  disciplines: ['Literature', 'Feminist thought', 'Medical humanities'],
  concepts: [
    { name: 'Care and paternalism', anchor: 'care-and-paternalism', question: 'What can make a benevolent authority reconsider?' },
    { name: 'Testimony and the cost of disbelief', anchor: 'testimony-and-the-cost-of-disbelief', question: 'Can someone’s suffering count when their explanation is doubtful?' },
    { name: 'Secret writing and a divided audience', anchor: 'secret-writing-and-a-divided-audience', question: 'What does visible compliance conceal?' },
    { name: 'Pattern, projection, and confinement', anchor: 'pattern-projection-and-confinement', question: 'How can an image be meaningful without being literally true?' },
    { name: 'Resistance without recovery', anchor: 'resistance-without-recovery', question: 'Does reversing authority restore freedom?' }
  ]
}, {
  slug: 'the-wealth-of-nations', thinker: 'smith', title: 'The Wealth of Nations', year: 1776,
  question: 'How can dividing work enlarge shared possibilities while narrowing the worker’s life?',
  description: 'Read Smith on specialization, exchange, market size, learned abilities, and the educational responsibilities of commercial society.',
  disciplines: ['Economics', 'Political thought'],
  concepts: [
    { name: 'Division of labour and productivity', anchor: 'division-of-labour-and-productivity', question: 'How can reorganizing work change what a day’s labor produces?' },
    { name: 'Exchange and mutual advantage', anchor: 'exchange-and-mutual-advantage', question: 'Why can cooperation extend beyond friendship?' },
    { name: 'The extent of the market', anchor: 'the-extent-of-the-market', question: 'How many buyers can a specialist actually serve?' },
    { name: 'Learned abilities and natural differences', anchor: 'learned-abilities-and-natural-differences', question: 'Can different occupations produce the abilities used to justify them?' },
    { name: 'Repetitive work and public education', anchor: 'repetitive-work-and-public-education', question: 'Who provides the development that narrow work neglects?' }
  ]
}, {
  slug: 'the-dhammapada', thinker: 'early-buddhist-tradition', title: 'The Dhammapada', year: 'Ancient South Asia; compilation date uncertain',
  question: 'How can we stop adding suffering through the habits of our own response?',
  description: 'Read an early Buddhist anthology through heedfulness, trained attention, retaliation, shared vulnerability, and the difference between recitation and practice.',
  disciplines: ['Buddhist philosophy', 'Ethics', 'Religion'],
  concepts: [
    { name: 'Heedfulness and the use of attention', anchor: 'heedfulness-and-the-use-of-attention', question: 'What direction does repeated conduct give a life?' },
    { name: 'Training the mind', anchor: 'training-the-mind', question: 'How can attention become a practice rather than a wish?' },
    { name: 'Anger and the interruption of retaliation', anchor: 'anger-and-the-interruption-of-retaliation', question: 'Can we protect ourselves without adding cruelty?' },
    { name: 'Non-harming and shared vulnerability', anchor: 'non-harming-and-shared-vulnerability', question: 'What does another being’s fear ask of us?' },
    { name: 'Responsibility without moral outsourcing', anchor: 'responsibility-without-moral-outsourcing', question: 'What can a teacher help with but never do for us?' },
    { name: 'Practice and the limits of borrowed knowledge', anchor: 'practice-and-the-limits-of-borrowed-knowledge', question: 'When does knowing a teaching change how we live?' }
  ]
}, {
  slug: 'what-to-the-slave-is-the-fourth-of-july', thinker: 'douglass', title: 'What to the Slave Is the Fourth of July?', year: 1852,
  question: 'What must people do when their public principles condemn the institutions they support?',
  description: 'Follow Douglass from an unshared celebration of liberty to moral evasion, national enforcement, religious responsibility, and a contested constitutional hope.',
  disciplines: ['Political thought', 'Ethics', 'Rhetoric'],
  concepts: [
    { name: 'Celebration and unequal membership', anchor: 'celebration-and-unequal-membership', question: 'Who actually shares the liberty being celebrated?' },
    { name: 'Principles turned into obligations', anchor: 'principles-turned-into-obligations', question: 'What does honoring a principle require now?' },
    { name: 'Personhood and the refusal of evasive debate', anchor: 'personhood-and-the-refusal-of-evasive-debate', question: 'When does demanding more proof postpone an acknowledged obligation?' },
    { name: 'Institutions and distributed responsibility', anchor: 'institutions-and-distributed-responsibility', question: 'How can people sustain a wrong without performing its central act?' },
    { name: 'Religious profession and practical conduct', anchor: 'religious-profession-and-practical-conduct', question: 'What should a community’s professed commitments change in its conduct?' },
    { name: 'Constitutional interpretation and the possibility of change', anchor: 'constitutional-interpretation-and-the-possibility-of-change', question: 'Can founding principles become resources against established practices?' }
  ]
}, {
  slug: 'the-ethics-of-belief', thinker: 'clifford', title: 'The Ethics of Belief', year: 1877,
  question: 'What do we owe one another in forming and passing on beliefs?',
  description: 'Read Clifford on sincere conviction, responsible inquiry, trustworthy testimony, and action without manufactured certainty.',
  disciplines: ['Epistemology', 'Ethics', 'Scientific reasoning'],
  concepts: [
    { name: 'Sincerity, truth, and responsible inquiry', anchor: 'sincerity-truth-and-responsible-inquiry', question: 'Can a lucky conclusion excuse neglected evidence?' },
    { name: 'Belief as a social responsibility', anchor: 'belief-as-a-social-responsibility', question: 'How might an apparently private belief affect others?' },
    { name: 'Testimony and the limits of expertise', anchor: 'testimony-and-the-limits-of-expertise', question: 'What makes someone able to know this particular claim?' },
    { name: 'Tradition as a method of questioning', anchor: 'tradition-as-a-method-of-questioning', question: 'Do we inherit an answer or the means of testing it?' },
    { name: 'Inference beyond immediate experience', anchor: 'inference-beyond-immediate-experience', question: 'Which relevant likeness carries an inference to an unobserved case?' },
    { name: 'Action without manufactured certainty', anchor: 'action-without-manufactured-certainty', question: 'Can a precaution be justified while judgment remains uncertain?' }
  ]
}, {
  slug: 'nuestra-america', thinker: 'marti', title: 'Nuestra América (Our America)', year: 1891,
  question: 'How can a people govern itself through institutions that disregard who its members are?',
  description: 'Read Martí on locally grounded government, colonial habits within republics, cultural learning, racial equality, and solidarity without inherited hatred.',
  disciplines: ['Latin American political thought', 'Literature', 'Political ethics'],
  concepts: [
    { name: 'Political knowledge before borrowed formulas', anchor: 'political-knowledge-before-borrowed-formulas', question: 'What must a government learn before importing an admired model?' },
    { name: 'The people excluded by cultivated authority', anchor: 'the-people-excluded-by-cultivated-authority', question: 'Whose knowledge does official expertise refuse to hear?' },
    { name: 'Independence beyond a change of rulers', anchor: 'independence-beyond-a-change-of-rulers', question: 'Which habits of domination survive formal liberation?' },
    { name: 'Learning from the world without copying it', anchor: 'learning-from-the-world-without-copying-it', question: 'How can a culture borrow while retaining judgment?' },
    { name: 'Human equality and the persistence of racial power', anchor: 'human-equality-and-the-persistence-of-racial-power', question: 'Does shared humanity make organized inequality disappear?' },
    { name: 'Solidarity without inherited hatred', anchor: 'solidarity-without-inherited-hatred', question: 'Can people coordinate against a danger without declaring another people inherently evil?' }
  ]
}, {
  slug: 'notes-on-nursing', thinker: 'nightingale', title: 'Notes on Nursing: What It Is, and What It Is Not', year: 1859,
  question: 'What makes help reliable from the perspective of the person receiving it?',
  description: 'Read Nightingale on conditions of care, continuity during absence, precise observation, attention, and support that leaves room for honest experience.',
  disciplines: ['Nursing', 'Medical history', 'Practical reasoning'],
  concepts: [
    { name: 'Care as the management of conditions', anchor: 'care-as-the-management-of-conditions', question: 'Has the intended benefit actually reached its recipient?' },
    { name: 'Petty management and continuity', anchor: 'petty-management-and-continuity', question: 'What happens when the usual helper is absent?' },
    { name: 'Observation before reassuring summaries', anchor: 'observation-before-reassuring-summaries', question: 'Which observations support a claim that someone is better?' },
    { name: 'Attention is part of the work', anchor: 'attention-is-part-of-the-work', question: 'Does receiving help require supervising the helper?' },
    { name: 'Variety and the patient’s own experience', anchor: 'variety-and-the-patients-own-experience', question: 'Which needs does the caregiver’s checklist leave unheard?' },
    { name: 'Truthful support instead of compulsory reassurance', anchor: 'truthful-support-instead-of-compulsory-reassurance', question: 'Can someone explain difficulty without being required to deny it?' }
  ]
}, {
  slug: 'modern-fiction', thinker: 'woolf', title: 'Modern Fiction', year: 1925,
  question: 'Why can a meticulously constructed novel still feel lifeless?',
  description: 'Read Woolf on convention, ordinary consciousness, changing emphasis, and artistic freedom without making one experimental method compulsory.',
  disciplines: ['Literary criticism', 'Aesthetics'],
  concepts: [
    { name: 'Modernity without guaranteed progress', anchor: 'modernity-without-guaranteed-progress', question: 'Does a new technique establish a better work?' },
    { name: 'Materialism and misplaced attention', anchor: 'materialism-and-misplaced-attention', question: 'What does a convincing detail actually help us perceive?' },
    { name: 'Ordinary consciousness and changing emphasis', anchor: 'ordinary-consciousness-and-changing-emphasis', question: 'Can a small incident carry the significance a plot gives to a catastrophe?' },
    { name: 'Freedom through form', anchor: 'freedom-through-form', question: 'How can a writer discard a convention without abandoning composition?' },
    { name: 'Experiment and its exclusions', anchor: 'experiment-and-its-exclusions', question: 'What does an innovative method leave outside its attention?' }
  ]
}, {
  slug: 'the-book-of-tea', thinker: 'okakura', title: 'The Book of Tea', year: 1906,
  question: 'What makes an ordinary gathering an art?',
  description: 'Read Okakura on adjustment, useful emptiness, unfinished beauty, hospitality, and appreciation that reaches beyond prestige.',
  disciplines: ['Japanese aesthetics', 'Art criticism', 'Cultural thought'],
  concepts: [
    { name: 'Teaism and the art of the ordinary', anchor: 'teaism-and-the-art-of-the-ordinary', question: 'What makes a small daily practice worthy of serious attention?' },
    { name: 'Adjustment rather than a fixed formula', anchor: 'adjustment-rather-than-a-fixed-formula', question: 'Which purpose does a rule serve in this particular situation?' },
    { name: 'Useful emptiness and room for participation', anchor: 'useful-emptiness-and-room-for-participation', question: 'What activity does an unfilled space make possible?' },
    { name: 'Unfinished beauty and the particular occasion', anchor: 'unfinished-beauty-and-the-particular-occasion', question: 'How can meticulous preparation leave room for another person?' },
    { name: 'Appreciation as a cultivated encounter', anchor: 'appreciation-as-a-cultivated-encounter', question: 'Am I responding to a work or performing admiration for its reputation?' }
  ]
}, {
  slug: 'notes-on-the-analytical-engine', thinker: 'lovelace', title: 'Notes on the Analytical Engine', year: 1843,
  question: 'What must we specify before a machine’s capability becomes a dependable procedure?',
  description: 'Read Lovelace on operations and data, representation beyond quantity, changing state, cycles, and the difference between correct execution and a correct task.',
  disciplines: ['Computing', 'Mathematics', 'Philosophy of technology'],
  concepts: [
    { name: 'Operations, data, and the order of work', anchor: 'operations-data-and-the-order-of-work', question: 'Why does a list of operations fail to specify a calculation?' },
    { name: 'Representation beyond quantity', anchor: 'representation-beyond-quantity', question: 'When can numerical operations transform something besides quantity?' },
    { name: 'Stored values and changing state', anchor: 'stored-values-and-changing-state', question: 'What must persist, change, or be cleared during a calculation?' },
    { name: 'Cycles and reusable procedures', anchor: 'cycles-and-reusable-procedures', question: 'How can the same repeated instructions produce new results?' },
    { name: 'Execution, error, and the limits of a claim', anchor: 'execution-error-and-the-limits-of-a-claim', question: 'Can flawless execution follow wrong instructions?' }
  ]
}, {
  slug: 'the-school-days-of-an-indian-girl', thinker: 'zitkala-sa', title: 'The School Days of an Indian Girl', year: 1900,
  question: 'When does education enlarge a life, and when does it demand its replacement?',
  description: 'Read Zitkala-Sa on forced assimilation, misunderstood speech, institutional routine, resistance, and the distance between achievement and belonging.',
  disciplines: ['Indigenous literature', 'Education', 'Political thought'],
  concepts: [
    { name: 'Education and forced assimilation', anchor: 'education-and-forced-assimilation', question: 'Can a useful skill justify the conditions imposed to teach it?' },
    { name: 'Meaning before judgment', anchor: 'meaning-before-judgment', question: 'Does a reply express refusal or a failure of understanding?' },
    { name: 'Routine and the disappearance of need', anchor: 'routine-and-the-disappearance-of-need', question: 'What does an efficient record leave unexplained?' },
    { name: 'Resistance and its costs', anchor: 'resistance-and-its-costs', question: 'What can a constrained act change, and what remains beyond it?' },
    { name: 'Achievement without belonging', anchor: 'achievement-without-belonging', question: 'Can a public prize settle a person’s estrangement?' }
  ]
}, {
  slug: 'apology', thinker: 'plato', title: 'Apology', year: 'After 399 BCE; exact composition date uncertain',
  question: 'What is worth protecting when safety and integrity come apart?',
  description: 'Read Plato’s portrayal of Socrates on human wisdom, examination, care of the soul, civic dissent, and uncertainty about death.',
  disciplines: ['Ancient Greek philosophy', 'Ethics', 'Political thought'],
  concepts: [
    { name: 'Human wisdom and the limits of expertise', anchor: 'human-wisdom-and-the-limits-of-expertise', question: 'Where does a real competence stop supporting a claim to authority?' },
    { name: 'Examination and the limits of refutation', anchor: 'examination-and-the-limits-of-refutation', question: 'What does exposing a contradiction actually establish?' },
    { name: 'Care of the soul and the order of goods', anchor: 'care-of-the-soul-and-the-order-of-goods', question: 'What makes an advantage worth having?' },
    { name: 'Civic dissent and accountability', anchor: 'civic-dissent-and-accountability', question: 'Can criticism serve a community while remaining answerable to it?' },
    { name: 'Uncertainty and moral courage', anchor: 'uncertainty-and-moral-courage', question: 'Can an unknown outcome justify a known wrong?' }
  ]
}];
