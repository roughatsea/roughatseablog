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
  rationale?: string;
  readingPath?: string;
  limitations?: string;
  provenance?: string;
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
,
  {
    slug: "human-behavior",
    title: "Why Humans Do What They Do",
    subtitle: "Twelve lenses on human nature",
    description: "An interdisciplinary course on behavior, from evolution and learning to identity, culture, group conflict and meaning.",
    audience: "Curious readers seeking an evidence-aware overview of human behavior",
    approach: "Follow the original twelve-book sequence, testing each author's claims against the others rather than treating any single account as complete.",
    provenance: "Reconstructed from our November 15, 2026 reading-list conversation.",
    rationale: "Behavior does not have a single cause. The selection moves from biology and evolutionary history through learning, attachment and cognition, then toward social life, culture, collective behavior and existential concerns.",
    readingPath: "Read in the numbered order as a conceptual progression. Darwin is represented by selected portions of The Descent of Man, not a requirement to read the entire work. Pair contemporary empirical claims with up-to-date research, and treat contested theories as arguments to examine.",
    limitations: "This is a historical and interdisciplinary curriculum, not a statement that every claim in these works remains empirically secure. In particular, older evolutionary and behavioral theories warrant modern critical context.",
    books: [
      { title: "Behave", author: "Robert M. Sapolsky", contribution: "Biological and situational causes", question: "How do brains, bodies and environments shape actions?", note: "A broad synthesis across neuroscience, development, endocrinology and social context." },
      { title: "The Descent of Man (selected readings)", author: "Charles Darwin", contribution: "Evolutionary history", question: "Where might human social capacities have come from?", note: "A foundational evolutionary text; read selections historically and critically, especially dated claims." },
      { title: "Science and Human Behavior", author: "B. F. Skinner", contribution: "Learning and reinforcement", question: "How are behaviors shaped by their consequences?", note: "A systematic behavioral account to compare against cognitive and social approaches." },
      { title: "A Secure Base", author: "John Bowlby", contribution: "Attachment and development", question: "How do early relationships shape security and behavior?", note: "An accessible route into attachment theory and human bonds." },
      { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", contribution: "Judgment and cognition", question: "Why does intuition sometimes mislead us?", note: "A landmark overview of biases and judgment; some findings and replication claims require care." },
      { title: "Mistakes Were Made (But Not by Me)", author: "Carol Tavris and Elliot Aronson", contribution: "Self-justification", question: "Why do people defend choices after the evidence turns against them?", note: "Explores cognitive dissonance, rationalization and the difficulty of admitting error." },
      { title: "The Presentation of Self in Everyday Life", author: "Erving Goffman", contribution: "Social performance", question: "How do situations and audiences influence who we appear to be?", note: "A dramaturgical account of interaction, roles and impression management." },
      { title: "The Secret of Our Success", author: "Joseph Henrich", contribution: "Culture and collective learning", question: "How does accumulated culture shape human capability?", note: "Connects cultural evolution, social learning and cooperation." },
      { title: "The Righteous Mind", author: "Jonathan Haidt", contribution: "Moral intuitions and groups", question: "Why do decent people disagree so profoundly about morality?", note: "A provocative framework for moral psychology and political division." },
      { title: "Micromotives and Macrobehavior", author: "Thomas C. Schelling", contribution: "Emergent social patterns", question: "How can individual choices create outcomes nobody intends?", note: "Accessible models of how local decisions can produce large-scale patterns." },
      { title: "The Denial of Death", author: "Ernest Becker", contribution: "Mortality and motivation", question: "How might awareness of death shape human striving?", note: "An influential existential interpretation, to be read as theory rather than settled science." },
      { title: "Man’s Search for Meaning", author: "Viktor E. Frankl", contribution: "Meaning under adversity", question: "How do people sustain purpose under extreme circumstances?", note: "A personal and philosophical closing perspective on meaning and agency." }
    ]
  },
  {
    slug: "existential-tenderness",
    title: "Existential Tenderness",
    subtitle: "Wonder, grief and the ache of being alive",
    description: "Four works exploring the fragile preciousness of being here, loving others, and noticing what can never be held indefinitely.",
    audience: "Readers drawn to wonder, mortality, tenderness and the meaning of attention",
    approach: "Start with Ross Gay for accessibility; approach Rilke as the nearest foundational literary statement of the sensibility.",
    provenance: "Recovered from our October 7, 2026 discussion. “Existential tenderness” was our descriptive working term, not an established school or canonical category.",
    rationale: "These books meet at the point where appreciation and loss become entangled. They are not the same genre: poetry, essays, intimate notes and philosophy give complementary perspectives.",
    readingPath: "Begin with The Book of Delights, which invites patient noticing. Read the Ninth Elegy of Duino Elegies closely, then explore Mourning Diary and I and Thou as more demanding encounters with loss and relation. Rilke is the most seminal literary choice here, not necessarily the easiest starting point.",
    limitations: "This is an interpretive reading path, not a claim that these authors shared a movement or influenced one another directly. The writings differ substantially in form and philosophical commitments.",
    books: [
      { title: "The Book of Delights", author: "Ross Gay", contribution: "Attentive joy", question: "Can delight coexist with grief and mortality?", note: "Short essays on noticing ordinary moments of beauty without denying loss." },
      { title: "Duino Elegies", author: "Rainer Maria Rilke", contribution: "Impermanence and praise", question: "How do we affirm a fleeting existence?", note: "Especially the Ninth Elegy; the closest foundational literary touchstone for this reading path." },
      { title: "Mourning Diary", author: "Roland Barthes", contribution: "Grief and irreplaceability", question: "What becomes of ordinary life after the loss of someone beloved?", note: "Fragments of private mourning that resist neat consolation or resolution." },
      { title: "I and Thou", author: "Martin Buber", contribution: "Encounter and relation", question: "What does it mean to truly meet another being?", note: "A more abstract philosophical account of relating to another as a presence rather than an object." }
    ]
  },
  {
    slug: "religious-history-esotericism",
    title: "Religious History & Esotericism",
    subtitle: "Scholarship first, then primary sources",
    description: "A research-minded path through mysticism, Kabbalah, Hermeticism, magic and the history of what counts as religion.",
    audience: "Readers interested in religious history, mystical traditions and critical study of esotericism",
    approach: "Use the eight scholarly works as interpretive guides; then consult primary texts in reliable translations. Keep historical evidence distinct from supernatural claims.",
    provenance: "Recovered from our September 22, 2026 discussion. The first eight entries are secondary scholarship; the remaining entries are primary-text editions and translations.",
    rationale: "The scholarly selections situate traditions within cultural and historical settings. The source editions let readers check interpretations against the actual texts, while remembering that translation and manuscript selection are themselves interpretive.",
    readingPath: "A practical entry route is Hanegraaff for disciplinary framing, Copenhaver’s Hermetica for an early primary-text encounter, Scholem followed by Idel for contrasting Kabbalah scholarship, and then the other historical studies. Continue into primary editions by topic rather than assuming one continuous tradition.",
    limitations: "These sources cover different centuries, languages and traditions. Some influential older histories, notably Yates’s, have been substantially challenged. The selection is not proof of continuity among traditions or of the efficacy of magical practices.",
    books: [
      { title: "Esotericism in Western Culture: Counter-Normativity and Rejected Knowledge", author: "Wouter J. Hanegraaff", contribution: "Secondary · disciplinary framing", question: "How has the category of esotericism been constructed?", note: "A modern scholarly account of esotericism and the historical rejection or marginalization of certain forms of knowledge." },
      { title: "Major Trends in Jewish Mysticism", author: "Gershom Scholem", contribution: "Secondary · Jewish mysticism", question: "How did different forms of Jewish mysticism develop?", note: "A major scholarly synthesis; important and influential, but not the last word." },
      { title: "Kabbalah: New Perspectives", author: "Moshe Idel", contribution: "Secondary · Kabbalah", question: "What changes when we reconsider inherited histories of Kabbalah?", note: "A critical complement to Scholem, with different emphases and interpretations." },
      { title: "Giordano Bruno and the Hermetic Tradition", author: "Frances A. Yates", contribution: "Secondary · Renaissance Hermeticism", question: "How was Renaissance intellectual history once understood through Hermeticism?", note: "A classic historiographical argument whose broader claims demand subsequent scholarly scrutiny." },
      { title: "The Triumph of the Moon: A History of Modern Pagan Witchcraft", author: "Ronald Hutton", contribution: "Secondary · modern paganism", question: "What are the historical roots of modern pagan witchcraft?", note: "A detailed historical study of modern movements and their claims about the past." },
      { title: "Grimoires: A History of Magic Books", author: "Owen Davies", contribution: "Secondary · books and practices", question: "What can magical books tell us about their readers and societies?", note: "Examines the social and material histories of grimoires." },
      { title: "The Varieties of Religious Experience", author: "William James", contribution: "Secondary · psychology and philosophy", question: "What can first-person religious experiences reveal?", note: "A foundational study of religious experience, useful as an interpretive lens rather than simple historical reportage." },
      { title: "Before Religion: A History of a Modern Concept", author: "Brent Nongbri", contribution: "Secondary · category criticism", question: "Has 'religion' always meant what we now mean by it?", note: "Challenges the assumption that religion is a timeless, self-evident category." },
      { title: "Hermetica (Corpus Hermeticum and Asclepius)", author: "Brian P. Copenhaver (translator and editor)", contribution: "Primary edition · Hermetic texts", question: "What do surviving Hermetic writings actually say?", note: "A scholarly translation and introduction to major Hermetic writings." },
      { title: "Zohar: The Book of Enlightenment", author: "Daniel C. Matt (translator)", contribution: "Primary edition · Kabbalah", question: "How does Zoharic writing express mystical interpretation?", note: "An approachable selection; the larger Zohar: Pritzker Edition enables deeper study." },
      { title: "The Complete Dead Sea Scrolls in English", author: "Géza Vermes (translator)", contribution: "Primary edition · ancient manuscripts", question: "What do the Scrolls reveal about Jewish textual and religious diversity?", note: "A broad translated collection for direct engagement with the ancient sources." },
      { title: "The Nag Hammadi Scriptures", author: "Marvin Meyer (editor)", contribution: "Primary edition · ancient religious texts", question: "What do the Nag Hammadi writings contain?", note: "A collection of translated ancient texts representing diverse religious and philosophical voices." },
      { title: "Three Books of Occult Philosophy", author: "Heinrich Cornelius Agrippa; Eric Purdue (translator)", contribution: "Primary edition · Renaissance magic", question: "How did a Renaissance author synthesize occult philosophy?", note: "A modern translation of Agrippa's influential early modern work." },
      { title: "The Greek Magical Papyri in Translation", author: "Hans Dieter Betz (editor)", contribution: "Primary edition · ritual documents", question: "What do surviving magical papyri reveal about historical practices?", note: "A scholarly collection of ancient ritual texts; the earlier list specified the second edition." },
      { title: "Tetrabiblos", author: "Ptolemy; F. E. Robbins (translator)", contribution: "Primary edition · ancient astrology", question: "How was astrology rationalized in the ancient Mediterranean?", note: "The Loeb edition offers historical access to Ptolemy's astrological treatise." },
      { title: "Theogony and Works and Days", author: "Hesiod; M. L. West (translator)", contribution: "Primary edition · Greek poetry", question: "What do foundational Greek poems say about gods, work and cosmic order?", note: "The Oxford World’s Classics translations provide early literary context for later traditions." }
    ]
  }
];
