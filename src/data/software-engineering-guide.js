import catalog from './code-guru/index.js';
import { conceptSlugs } from './code-guru/concept-slugs.js';
import { supplementalConcepts } from './code-guru/supplements.js';

const ALIASES = {
  'abstraction-and-indirection': ['abstraction layer'],
  'api-design-as-contract': ['API contract'],
  'architectural-boundaries-and-the-dependency-rule': ['Clean Architecture', 'dependency rule'],
  'async-await': ['asynchronous programming', 'async', 'await'],
  'characterization-and-golden-master-tests': ['characterization test', 'golden master', 'snapshot test'],
  'cohesion-and-coupling': ['high cohesion', 'loose coupling'],
  'command-query-separation': ['CQS'],
  'concurrency-vs-parallelism': ['concurrency', 'parallelism'],
  'cqrs-and-event-sourcing': ['CQRS', 'event sourcing'],
  'dependency-injection': ['DI', 'inversion of control', 'IoC'],
  'dependency-inversion-principle': ['DIP', 'SOLID'],
  'dry': ["don't repeat yourself", 'DRY', 'one source of truth'],
  'facade': ['facade', 'façade'],
  'functional-core-imperative-shell': ['functional core', 'imperative shell'],
  'http-semantics-and-resource-modeling': ['HTTP verbs', 'REST'],
  'interface-segregation-principle': ['ISP', 'SOLID'],
  'kiss': ['KISS', 'keep it simple', 'keep the design direct'],
  'least-privilege-authentication-and-authorization': ['authn', 'authz', 'least privilege'],
  'liskov-substitution-principle': ['LSP', 'SOLID'],
  'metrics-traces-and-correlation-context': ['distributed tracing', 'telemetry'],
  'open-closed-principle': ['OCP', 'SOLID'],
  'ports-and-adapters': ['hexagonal architecture'],
  'replace-nested-conditional-with-guard-clauses': ['guard clause', 'early return'],
  'repository-unit-of-work-and-persistence-ignorance': ['repository pattern', 'unit of work'],
  'single-responsibility-principle': ['SRP', 'SOLID'],
  'shotgun-surgery': ['change in many files', 'coordinated edits across classes'],
  'singleton-pattern': ['GoF singleton', 'global instance'],
  'singleton-lifetime': ['DI singleton', 'container singleton', 'AddSingleton'],
  'slis-slos-and-error-budgets': ['SLI', 'SLO', 'service-level objective', 'error budget'],
  'test-driven-development': ['TDD', 'red green refactor'],
  'test-doubles-fakes-stubs-spies-and-mocks': ['test double', 'fake', 'stub', 'spy', 'mock'],
  'ubiquitous-language-and-bounded-context': ['bounded context', 'ubiquitous language', 'DDD'],
  'yagni': ["you aren't gonna need it", 'YAGNI', 'build for evidence'],
};

const COMPARISONS = {
  'adapter': ['facade', 'decorator', 'proxy'],
  'command-query-separation': ['cqrs-and-event-sourcing'],
  'composition-over-inheritance': ['replace-inheritance-with-delegation'],
  'dependency-injection': ['dependency-inversion-principle', 'singleton-lifetime'],
  'dependency-inversion-principle': ['dependency-injection'],
  'factory-method': ['abstract-factory'],
  'idempotency': ['retries-circuit-breakers-and-bulkheads'],
  'refactoring': ['behavior-preserving-change', 'extract-method', 'characterization-and-golden-master-tests'],
  'singleton-pattern': ['singleton-lifetime', 'hidden-global-state'],
  'singleton-lifetime': ['singleton-pattern', 'dependency-injection'],
  'state': ['strategy', 'template-method'],
  'strategy': ['state', 'template-method'],
};

const SOURCE_GROUPS = {
  foundation: {
    label: 'Foundational design vocabulary',
    lineage: 'General software-design and refactoring vocabulary',
    sources: [
      {
        label: 'Martin Fowler — Refactoring catalog',
        url: 'https://martinfowler.com/refactoring/',
      },
    ],
  },
  refactoring: {
    label: 'Refactoring catalog',
    lineage: 'Code-smell and refactoring catalogs',
    sources: [
      {
        label: 'Refactoring.Guru — Refactoring catalog',
        url: 'https://refactoring.guru/refactoring/catalog',
      },
      {
        label: 'Martin Fowler — Catalog of Refactorings',
        url: 'https://martinfowler.com/refactoring/catalog.html',
      },
    ],
  },
  patterns: {
    label: 'Design-pattern catalog',
    lineage: 'Gang of Four design-pattern vocabulary',
    sources: [
      {
        label: 'Design Patterns: Elements of Reusable Object-Oriented Software',
        url: 'https://www.pearson.com/en-us/subject-catalog/p/design-patterns-elements-of-reusable-object-oriented-software/P200000009480',
      },
      {
        label: 'Refactoring.Guru — Design-pattern catalog',
        url: 'https://refactoring.guru/design-patterns/catalog',
      },
    ],
  },
  domain: {
    label: 'Domain and architecture practice',
    lineage: 'Domain modeling and architectural-boundary vocabulary',
    sources: [
      {
        label: 'Domain Language — Domain-Driven Design reference',
        url: 'https://www.domainlanguage.com/ddd/',
      },
    ],
  },
  testing: {
    label: 'Testing and change practice',
    lineage: 'Contemporary testing and incremental-change vocabulary',
    sources: [
      {
        label: 'Microsoft — .NET unit-testing best practices',
        url: 'https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-best-practices',
      },
      {
        label: 'Martin Fowler — Refactoring, second edition',
        url: 'https://martinfowler.com/articles/refactoring-2nd-changes.html',
      },
    ],
  },
  concurrency: {
    label: 'Concurrency and asynchronous practice',
    lineage: 'Language and platform concurrency vocabulary',
    sources: [
      {
        label: 'Microsoft — Asynchronous programming with async and await',
        url: 'https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/',
      },
      {
        label: 'Python — asyncio documentation',
        url: 'https://docs.python.org/3/library/asyncio.html',
      },
    ],
  },
  distributed: {
    label: 'API and distributed-systems practice',
    lineage: 'HTTP, API, and distributed-failure vocabulary',
    sources: [
      {
        label: 'RFC 9110 — HTTP Semantics',
        url: 'https://www.rfc-editor.org/rfc/rfc9110.html',
      },
      {
        label: 'Microsoft Azure Architecture Center — Cloud design patterns',
        url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/',
      },
    ],
  },
  operations: {
    label: 'Reliability and observability practice',
    lineage: 'Production-observability and site-reliability vocabulary',
    sources: [
      {
        label: 'OpenTelemetry — Signals',
        url: 'https://opentelemetry.io/docs/concepts/signals/',
      },
      {
        label: 'Google — Site Reliability Engineering',
        url: 'https://sre.google/sre-book/table-of-contents/',
      },
    ],
  },
  security: {
    label: 'Security engineering practice',
    lineage: 'Application-security and secure-development vocabulary',
    sources: [
      {
        label: 'OWASP — Application Security Verification Standard',
        url: 'https://owasp.org/www-project-application-security-verification-standard/',
      },
      {
        label: 'NIST SP 800-218 — Secure Software Development Framework',
        url: 'https://csrc.nist.gov/pubs/sp/800/218/final',
      },
    ],
  },
  performance: {
    label: 'Performance engineering practice',
    lineage: 'Measurement, profiling, capacity, and performance vocabulary',
    sources: [
      {
        label: 'Microsoft — .NET diagnostics documentation',
        url: 'https://learn.microsoft.com/en-us/dotnet/core/diagnostics/',
      },
    ],
  },
  platform: {
    label: 'Platform lifetime vocabulary',
    lineage: 'Dependency-injection container lifetime vocabulary',
    sources: [
      {
        label: 'Microsoft — Dependency injection guidelines',
        url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines',
      },
    ],
  },
};

export function slugifyConceptTitle(title) {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function sourceKeyFor(concept) {
  if (concept.source_tag === 'MODERN PLATFORM VOCABULARY') return 'platform';
  if (concept.source_tag.includes('GOF PATTERN')) return 'patterns';
  if (concept.source_tag.includes('CODE SMELL') || concept.source_tag.includes('REFACTORING')) {
    return 'refactoring';
  }
  if (concept.index == null) return 'platform';
  if (concept.index <= 20) return 'foundation';
  if (concept.index <= 153) return 'refactoring';
  if (concept.index <= 161) return 'domain';
  if (concept.index <= 171) return 'testing';
  if (concept.index <= 178) return 'concurrency';
  if (concept.index <= 187) return 'distributed';
  if (concept.index <= 191) return 'operations';
  if (concept.index <= 198) return 'security';
  return 'performance';
}

const flattened = catalog.flatMap((part) =>
  part.chapters.flatMap((chapter) =>
    chapter.concepts.map((concept) => ({
      ...concept,
      position: concept.index,
      partNumber: part.number,
      domain: part.title,
      chapter: chapter.title,
    })),
  ),
);

const singletonChapter = flattened.find((concept) => concept.title === 'Singleton Pattern');
const supplemental = supplementalConcepts.map((concept) => ({
  ...concept,
  partNumber: singletonChapter.partNumber,
  domain: singletonChapter.domain,
  chapter: singletonChapter.chapter,
}));

const withMetadata = [...flattened, ...supplemental]
  .map((concept) => {
    const slug = concept.slug ?? conceptSlugs[concept.index] ?? slugifyConceptTitle(concept.title);
    const sourceKey = sourceKeyFor(concept);
    return {
      ...concept,
      slug,
      aliases: ALIASES[slug] ?? [],
      sourceKey,
      source: SOURCE_GROUPS[sourceKey],
    };
  })
  .sort((a, b) => a.position - b.position);

const bySlug = new Map(withMetadata.map((concept) => [concept.slug, concept]));

function relatedConceptsFor(concept) {
  const rawRelation = concept.related ?? '';
  const relationText = rawRelation.replace(/^Related:\s*/i, '');
  const explicit = COMPARISONS[concept.slug] ?? [];
  const normalize = (value) => value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const listLike = /^Related:\s*/i.test(rawRelation) || !/[.!?]/.test(relationText);
  const listTokens = listLike
    ? relationText.split(';').map(normalize).filter(Boolean)
    : [];
  const discovered = withMetadata
    .filter((candidate) => candidate.slug !== concept.slug)
    .filter((candidate) => {
      const names = [candidate.title, ...candidate.aliases].map(normalize);
      return names.some((name) => listTokens.includes(name));
    })
    .map((candidate) => candidate.slug);

  return [...new Set([...explicit, ...discovered])]
    .map((slug) => bySlug.get(slug))
    .filter(Boolean)
    .map(({ slug, title }) => ({ slug, title }));
}

export const guideConcepts = withMetadata.map((concept) => ({
  ...concept,
  relatedConcepts: relatedConceptsFor(concept),
}));

export const guideIndex = guideConcepts.map((concept) => ({
  slug: concept.slug,
  title: concept.title,
  aliases: concept.aliases,
  definition: concept.definition,
  lookFor: concept.look_for,
  tier: concept.tier,
  tierLabel: concept.tier_label,
  domain: concept.domain,
  chapter: concept.chapter,
  sourceKey: concept.sourceKey,
  sourceLabel: concept.source.label,
}));

export const guideDomains = [...new Set(guideIndex.map((concept) => concept.domain))];
export const guideSources = Object.entries(SOURCE_GROUPS).map(([key, value]) => ({
  key,
  label: value.label,
}));

export function getGuideConcept(slug) {
  return guideConcepts.find((concept) => concept.slug === slug);
}
