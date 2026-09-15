/** Append-only scientific content registry. Stable IDs are also exploration-save keys. */
export const sources = {
  blood: { title: 'NCBI · Blood and the cells it contains', url: 'https://www.ncbi.nlm.nih.gov/books/NBK2263/' },
  geometry: { title: 'Evans & Fung (1972) · Erythrocyte geometry', url: 'https://doi.org/10.1016/0026-2862(72)90069-6' },
  hb: { title: 'RCSB PDB-101 · Hemoglobin', url: 'https://pdb101.rcsb.org/motm/41' },
  skeleton: { title: 'Nans et al. (2011) · Red-cell cytoskeleton tomography', url: 'https://doi.org/10.1016/j.bpj.2011.09.050' },
  ankyrin: { title: 'Xia et al. (2022) · Human RBC ankyrin complex', url: 'https://www.nature.com/articles/s41594-022-00779-7' },
  complex: { title: 'Vallese et al. (2022) · Human erythrocyte membrane complex', url: 'https://www.nature.com/articles/s41594-022-00792-w' },
  abo: { title: 'NCBI · The ABO blood group', url: 'https://www.ncbi.nlm.nih.gov/sites/books/NBK2267/' },
  rh: { title: 'NCBI · The Rh blood group', url: 'https://www.ncbi.nlm.nih.gov/sites/books/NBK2269/' },
};
export const topics = [
  { id: 'shape', title: 'Biconcave shape', short: 'Shape', category: 'Architecture', color: '#ff816e', view: 'whole',
    intro: 'Not a doughnut. A disc with a thin center on both sides—and no hole through it.',
    body: 'The model is approximately 7.8 micrometers across. Its thicker rim and thinner middle reproduce the characteristic resting shape of a human red blood cell. This is one idealized cell, not the geometry of every cell in a blood sample.',
    why: 'Shape is part of the cell’s engineering: a large surface relative to its volume and the ability to deform support its work in narrow vessels.',
    try: 'Drag the cell until you see it edge-on. Then compare that silhouette with the view from above.',
    question: 'Is the depression an opening?', answer: 'No. The membrane and cytoplasm continue across the center. The disc is indented on both faces.',
    sources: ['geometry', 'blood'], related: ['membrane', 'spectrin'], anchor: [0, 0, 0.42] },
  { id: 'membrane', title: 'Plasma membrane', short: 'Membrane', category: 'Boundary', color: '#ffab8d', view: 'whole',
    intro: 'A flexible boundary, not a rigid wall.',
    body: 'A lipid bilayer separates the cytoplasm from plasma. Proteins embedded in it carry out transport and connect to a supporting skeleton underneath. The smooth red envelope here represents that boundary; individual lipid molecules are not resolved.',
    why: 'The membrane, its protein anchors, and the underlying skeleton work together. A bag of lipids alone would not explain the red cell’s mechanical stability.',
    try: 'Switch to Scaffold to separate the supporting network visually from the cell’s outer envelope.',
    question: 'Does the membrane supply all the mechanical support by itself?', answer: 'No. Connections to the spectrin-based membrane skeleton are essential to the complete structure.',
    sources: ['complex'], related: ['spectrin', 'band3'], anchor: [3.25, 0.3, 0.93] },
  { id: 'hemoglobin', title: 'Hemoglobin', short: 'Hemoglobin', category: 'Cargo & function', color: '#ffa476', view: 'inside',
    intro: 'The oxygen-carrying protein packed into the cytoplasm.',
    body: 'The major adult form, HbA, contains two alpha and two beta globin chains. Each chain contains a heme group whose iron can bind one oxygen molecule. A tetramer can therefore carry up to four oxygen molecules. The four-lobed objects here are enlarged symbols, not atomically resolved proteins or a realistic molecule count.',
    why: 'The subunits influence one another’s oxygen affinity. That cooperation helps hemoglobin load oxygen where it is plentiful and release it where it is less plentiful.',
    try: 'Move the oxygenation slider. It illustrates the color difference between more- and less-oxygenated hemoglobin; it does not calculate gas exchange.',
    question: 'How many oxygen molecules can one HbA tetramer bind?', answer: 'Up to four: one at each of its four heme groups. Deoxygenated blood is dark red, not blue.',
    sources: ['hb'], related: ['shape', 'no-nucleus'], anchor: [1.3, -0.8, 0] },
  { id: 'spectrin', title: 'Spectrin–actin skeleton', short: 'Spectrin', category: 'Mechanical support', color: '#62dcd2', view: 'scaffold',
    intro: 'A protein network just underneath the membrane.',
    body: 'Spectrin links actin-containing junctions in a membrane-associated network. This flexible architecture helps the cell withstand deformation. The turquoise mesh is an explanatory diagram: its regularity, strand thickness, and node spacing are not a reconstruction of an individual human cell. The linked tomography study examined mouse erythrocyte skeletons.',
    why: 'Mechanical resilience comes from a connected system, rather than a hard shell. The network and its membrane attachments are different parts of that system.',
    try: 'Hide the membrane shell in Scaffold view, then orbit the exposed network.',
    question: 'Is spectrin floating freely throughout the cytoplasm?', answer: 'The membrane skeleton is concentrated beneath the membrane, with anchoring complexes linking it to membrane proteins.',
    sources: ['skeleton', 'complex'], related: ['ankyrin', 'membrane'], anchor: [-1.8, -1.1, 0.65] },
  { id: 'ankyrin', title: 'Ankyrin attachment', short: 'Ankyrin', category: 'Mechanical support', color: '#ffd275', view: 'scaffold',
    intro: 'A connection between the supporting network and membrane protein complexes.',
    body: 'Ankyrin participates in attachments involving spectrin, band 3, and protein 4.2. Structural studies of human red-cell complexes reveal how these proteins assemble. The gold connectors mark representative attachment sites; their shape is schematic and does not reproduce the experimental atomic structures.',
    why: 'Mutations affecting components of this attachment system can compromise red-cell stability. An anchor can matter just as much as the material it anchors.',
    try: 'Select Band 3 next. Follow the relationship from an internal support to a membrane-spanning protein.',
    question: 'Is ankyrin a surface blood-group sugar?', answer: 'No. It is a protein involved in attaching the internal membrane skeleton to membrane protein complexes.',
    sources: ['ankyrin'], related: ['spectrin', 'band3'], anchor: [0, 2.9, 0.9] },
  { id: 'band3', title: 'Band 3 / AE1', short: 'Band 3', category: 'Membrane protein', color: '#bda5ff', view: 'scaffold',
    intro: 'A membrane-spanning anion exchanger with a structural role as well.',
    body: 'Band 3 is also called anion exchanger 1, or AE1. It exchanges chloride and bicarbonate across the membrane. A subset of band 3 participates in complexes that connect the membrane to its skeleton. The violet forms identify selected examples, not every copy in the cell.',
    why: 'The same protein can participate in transport and in structural organization. Biological machinery is not neatly divided into one-purpose parts.',
    try: 'Use the related links to move between Band 3, Ankyrin, and Spectrin.',
    question: 'Is every copy of band 3 necessarily attached to ankyrin?', answer: 'No. This model highlights representative anchored complexes, not a claim that every band 3 molecule has the same associations.',
    sources: ['ankyrin', 'complex'], related: ['ankyrin', 'membrane'], anchor: [-2.7, 0.45, 1.05] },
  { id: 'abo', title: 'ABO: the A antigen', short: 'A antigen', category: 'Surface identity', color: '#ffc66b', view: 'whole',
    intro: 'A blood-group identity written in sugars.',
    body: 'This specimen represents an A, RhD-positive cell. A antigens are carbohydrate structures carried on membrane glycoproteins and glycolipids. An A-specific transferase adds N-acetylgalactosamine to the H precursor. B specificity uses a different terminal sugar; ordinary group O cells retain H without A or B modification.',
    why: 'Antibodies can recognize these carbohydrate differences. That is why a seemingly small surface detail matters in transfusion biology. This exhibit is not a transfusion-compatibility calculator.',
    try: 'Compare these branching gold sugar symbols with the teal RhD protein symbols.',
    question: 'Does ordinary group O mean “no surface antigens”?', answer: 'No. It means no A or B antigen expression in the ordinary ABO phenotype. H and many other blood-group antigens can still be present.',
    sources: ['abo'], related: ['rhd', 'membrane'], anchor: [1.8, 1.1, 1.45] },
  { id: 'rhd', title: 'RhD protein', short: 'RhD', category: 'Surface identity', color: '#7ce2d9', view: 'whole',
    intro: 'The “positive” in this specimen’s A-positive label.',
    body: 'RhD is a multipass membrane protein carrying the D antigen. Unlike ABO determinants, D antigen specificity is protein-based rather than a terminal carbohydrate pattern. The Rh system includes more than D alone. The teal symbols locate representative RhD proteins, with enlarged exterior portions for visibility.',
    why: 'Exposure to D-positive cells can cause some D-negative individuals to form anti-D. The clinical implications depend on context and variants; this exhibit does not make treatment recommendations.',
    try: 'Orbit around the membrane and compare the RhD symbols with the A-antigen sugar branches.',
    question: 'Are ABO and RhD different names for the same surface structure?', answer: 'No. ABO specificity is carbohydrate-based. RhD is a membrane protein and belongs to a different blood-group system.',
    sources: ['rh'], related: ['abo', 'membrane'], anchor: [0.2, -2.7, 1.6] },
  { id: 'no-nucleus', title: 'The missing nucleus', short: 'No nucleus', category: 'A revealing absence', color: '#c3c9dd', view: 'inside',
    intro: 'An absence is part of the anatomy, too.',
    body: 'A mature human red blood cell has no nucleus and lacks mitochondria and ribosomes. It is not the same as its nucleated precursors in bone marrow. There are deliberately no conventional organelles hidden in this interior.',
    why: 'Specialization involves giving things up. Do not use this mature human RBC as a template for every blood cell, every developmental stage, or every animal species.',
    try: 'Explore the cutaway. Its interior contains a schematic sample of hemoglobin, not a nucleus waiting to be discovered.',
    question: 'Will a mature human RBC divide to make another RBC?', answer: 'No. New red cells develop from precursors in the bone marrow; the mature circulating cell does not divide.',
    sources: ['blood'], related: ['hemoglobin', 'shape'], anchor: [0, 0, 0] },
];
export const tour = ['shape', 'no-nucleus', 'hemoglobin', 'spectrin', 'band3', 'abo', 'rhd'];
export const world = {
  name: 'Microcosm', version: '0.1.0', activeCell: 'rbc',
  cells: [
    { id: 'rbc', title: 'Red blood cell', status: 'available', stage: 'Foundation', model: 'rbc' },
    { id: 'neutrophil', title: 'Neutrophil', status: 'planned', stage: 'Not built yet' },
    { id: 'lymphocyte', title: 'Lymphocyte', status: 'planned', stage: 'Not built yet' },
  ],
  milestones: [
    { title: 'An explorable foundation', done: true, detail: '3D geometry, nine encounters, three views, sources, and a guided tour.' },
    { title: 'Deeper molecular anatomy', done: false, detail: 'Resolve a membrane patch with independently reviewed molecular arrangements.' },
    { title: 'A functional experiment', done: false, detail: 'Add a validated mechanism such as oxygen binding or deformability—not just an animation.' },
    { title: 'Clinical connections', done: false, detail: 'Build and review interactive explanations of at least three structure–disease relationships.' },
  ],
  releases: [
    { version: '0.1.0', date: '2026-09-14', title: 'First light: one red blood cell', cell: 'rbc', additions: topics.map(t => t.id),
      summary: 'A biconcave cell enters the world. Explore its surface, look inside, and meet the machinery that holds it together.' },
  ],
};
export function readExplored(raw) {
  try { const value = JSON.parse(raw || '[]'); return Array.isArray(value) ? [...new Set(value.filter(id => topics.some(t => t.id === id)))] : []; }
  catch { return []; }
}
export function validateRegistry() {
  const ids = new Set(topics.map(t => t.id));
  if (ids.size !== topics.length) throw new Error('Duplicate topic ID');
  for (const t of topics) {
    if (!t.sources.length || t.sources.some(id => !sources[id])) throw new Error(`Missing source: ${t.id}`);
    if (t.related.some(id => !ids.has(id))) throw new Error(`Broken relationship: ${t.id}`);
    if (t.anchor.length !== 3 || !t.anchor.every(Number.isFinite)) throw new Error(`Bad anchor: ${t.id}`);
  }
  if (tour.some(id => !ids.has(id))) throw new Error('Broken tour');
  if (!world.cells.some(c => c.id === world.activeCell && c.status === 'available' && c.model)) throw new Error('No available active model');
  if (new Set(world.cells.map(c => c.id)).size !== world.cells.length) throw new Error('Duplicate cell ID');
  for (const r of world.releases) if (r.additions.some(id => !ids.has(id))) throw new Error('Release references missing content');
  return true;
}
validateRegistry();
