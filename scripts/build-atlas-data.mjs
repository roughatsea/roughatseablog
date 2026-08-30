import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(root, 'public', 'atlas');
const adminOutput = path.join(outputRoot, 'admin1');
const sourceRoot = process.env.ATLAS_SOURCE_DIR || '/tmp';

const SOURCE_FILES = {
  countries: 'ne_50m_admin_0_countries.simplified.geojson',
  admin1: 'ne_10m_admin_1_states_provinces.simplified.geojson',
  places: 'ne_10m_populated_places.geojson',
  rivers: 'ne_50m_rivers_lake_centerlines.geojson',
  lakes: 'ne_50m_lakes.geojson',
  profiles: 'world-countries.json',
  heritage: 'wikidata-heritage.json',
};

// Seats that complement the single constitutional capital supplied by the
// country profile source. The UI describes multi-entry lists as capitals/seats.
const CAPITAL_PROFILE_ADDITIONS = {
  BEN: ['Cotonou'],
  BOL: ['La Paz'],
  CIV: ['Abidjan'],
  KOS: ['Pristina'],
  LKA: ['Sri Jayawardenepura Kotte'],
  MSR: ['Brades'],
  MYS: ['Putrajaya'],
  NLD: ['The Hague'],
  SOL: ['Hargeisa'],
  SWZ: ['Mbabane'],
};

const CAPITAL_PROFILE_REPLACEMENTS = {
  HKG: ['Hong Kong'],
  MNG: ['Ulaanbaatar'],
};

const CAPITAL_NAME_ALIASES = {
  PLW: { Ngerulmud: ['Melekeok'] },
  SMR: { 'City of San Marino': ['San Marino'] },
};

// Natural Earth's populated-place theme intentionally omits some very small
// islands and territories. These CC0 coordinates come from Wikidata (P36/P625),
// with Jamestown supplied from the same item's coordinate record.
const CAPITAL_FALLBACKS = [
  { code: 'AIA', name: 'The Valley', coordinates: [-63.051667, 18.220833] },
  { code: 'ATF', name: 'Port-aux-Français', coordinates: [70.216667, -49.35] },
  { code: 'BLM', name: 'Gustavia', coordinates: [-62.849167, 17.898611] },
  { code: 'GGY', name: 'St. Peter Port', coordinates: [-2.55194, 49.46] },
  { code: 'IOT', name: 'Diego Garcia', coordinates: [72.411111, -7.313333] },
  { code: 'JEY', name: 'Saint Helier', coordinates: [-2.11, 49.185833] },
  { code: 'MAF', name: 'Marigot', coordinates: [-63.084722, 18.066667] },
  { code: 'MNP', name: 'Saipan', coordinates: [145.7545, 15.21233] },
  { code: 'MSR', name: 'Plymouth', coordinates: [-62.215839, 16.706417] },
  { code: 'MSR', name: 'Brades', coordinates: [-62.210556, 16.792778] },
  { code: 'NFK', name: 'Kingston', coordinates: [167.966667, -29.05] },
  { code: 'NRU', name: 'Yaren', coordinates: [166.920867, -0.5477] },
  { code: 'PCN', name: 'Adamstown', coordinates: [-130.1, -25.066667] },
  { code: 'SAH', name: 'El Aaiún', coordinates: [-13.203333, 27.153611] },
  { code: 'SGS', name: 'King Edward Point', coordinates: [-36.494182, -54.283291] },
  { code: 'SHN', name: 'Jamestown', coordinates: [-5.7181, -15.9244] },
  { code: 'SPM', name: 'Saint-Pierre', coordinates: [-56.177778, 46.777778] },
  { code: 'SXM', name: 'Philipsburg', coordinates: [-63.043333, 18.024167] },
  { code: 'VGB', name: 'Road Town', coordinates: [-64.616667, 18.433333] },
  { code: 'VIR', name: 'Charlotte Amalie', coordinates: [-64.95, 18.35] },
  { code: 'WLF', name: 'Mata-Utu', coordinates: [-176.1737, -13.2827] },
];

const DIVISION_TERM_OVERRIDES = {
  NLD: 'Provinces / special municipalities',
  SWZ: 'Regions',
};

const DIVISION_TYPE_OVERRIDES = {
  SWZ: 'Region',
};

const INVALID_CODES = new Set(['', '-99', 'null', 'undefined']);

function clean(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text && !INVALID_CODES.has(text) ? text : null;
}

function firstCode(...values) {
  return values.map(clean).find(Boolean) ?? null;
}

function compactFeatureCollection(features) {
  return { type: 'FeatureCollection', features };
}

function countryCode(properties) {
  return firstCode(
    properties.ADM0_A3,
    properties.adm0_a3,
    properties.ISO_A3_EH,
    properties.iso_a3,
    properties.SOV_A3,
    properties.sov_a3,
    properties.GU_A3,
    properties.gu_a3,
  );
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeName(value) {
  return clean(value)?.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]/gi, '').toLocaleLowerCase() ?? '';
}

function pluralize(value) {
  if (!value) return 'Administrative divisions';
  if (/s$/i.test(value)) return value;
  if (/[^aeiou]y$/i.test(value)) return `${value.slice(0, -1)}ies`;
  return `${value}s`;
}

function formatArea(area) {
  const number = Number(area);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function flagFromIso2(iso2) {
  if (!iso2 || !/^[A-Z]{2}$/.test(iso2)) return '◎';
  return [...iso2].map((character) => String.fromCodePoint(127397 + character.charCodeAt(0))).join('');
}

function wikidataId(uri) {
  return clean(uri)?.split('/').pop() ?? null;
}

function parsePoint(value) {
  const match = clean(value)?.match(/^Point\((-?[\d.]+) (-?[\d.]+)\)$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2])];
}

function selectDivisionTerm(features) {
  const counts = new Map();
  for (const feature of features) {
    const type = clean(feature.properties.type_en) ?? clean(feature.properties.type);
    if (type) counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  const ordered = [...counts].sort((a, b) => b[1] - a[1]);
  if (!ordered.length) return 'Administrative divisions';
  if (ordered.length > 1 && ordered[0][1] / features.length < 0.72) {
    return unique(ordered.slice(0, 2).map(([name]) => pluralize(name))).join(' / ');
  }
  return pluralize(ordered[0][0]);
}

async function loadJson(name) {
  return JSON.parse(await readFile(path.join(sourceRoot, SOURCE_FILES[name]), 'utf8'));
}

async function writeJson(relativePath, value) {
  await writeFile(path.join(outputRoot, relativePath), JSON.stringify(value));
}

const [countryData, adminData, placeData, riverData, lakeData, worldCountries, heritageData] =
  await Promise.all([
    loadJson('countries'),
    loadJson('admin1'),
    loadJson('places'),
    loadJson('rivers'),
    loadJson('lakes'),
    loadJson('profiles'),
    loadJson('heritage'),
  ]);

await mkdir(adminOutput, { recursive: true });

const worldByCode = new Map(worldCountries.map((country) => [country.cca3, country]));
const countryFeatures = [];
const countryLabels = [];
const countryProfiles = {};
const countryQidToCode = new Map();
const countryNameToCode = new Map();
const countryAliasToCode = new Map();

for (const [index, feature] of countryData.features.entries()) {
  const source = feature.properties;
  const code = countryCode(source) ?? `NE-${source.NE_ID ?? index}`;
  const worldCode = unique([code, source.ISO_A3])
    .find((candidate) => worldByCode.has(candidate));
  const world = worldCode ? worldByCode.get(worldCode) : undefined;
  const name = clean(world?.name?.common) ?? clean(source.NAME_EN) ?? clean(source.ADMIN) ?? code;
  const nativeNames = unique(
    Object.values(world?.name?.native ?? {}).flatMap((entry) => [clean(entry.common), clean(entry.official)]),
  );
  const localName = nativeNames.find((value) => value.localeCompare(name, undefined, { sensitivity: 'base' }) !== 0) ?? name;
  const iso2 = clean(world?.cca2) ?? clean(source.ISO_A2_EH) ?? clean(source.ISO_A2);
  const qid = clean(source.WIKIDATAID);
  const labelLng = Number(source.LABEL_X);
  const labelLat = Number(source.LABEL_Y);
  const properties = {
    code,
    iso2,
    name,
    formalName: clean(world?.name?.official) ?? clean(source.FORMAL_EN) ?? clean(source.NAME_LONG),
    localName,
    labelEnglish: name,
    labelLocal: localName,
    labelBoth: localName === name ? name : `${name} · ${localName}`,
    continent: clean(source.CONTINENT) ?? clean(world?.region),
    subregion: clean(source.SUBREGION) ?? clean(world?.subregion),
    sovereign: clean(source.SOVEREIGNT),
    kind: clean(source.TYPE),
    qid,
    mapColor: Number(source.MAPCOLOR13) || 1,
    minLabel: Number(source.MIN_LABEL) || 1,
  };

  countryFeatures.push({
    type: 'Feature',
    id: source.NE_ID ?? code,
    properties,
    geometry: feature.geometry,
  });

  if (Number.isFinite(labelLng) && Number.isFinite(labelLat)) {
    countryLabels.push({
      type: 'Feature',
      id: `label-${code}`,
      properties,
      geometry: { type: 'Point', coordinates: [labelLng, labelLat] },
    });
  }

  countryProfiles[code] = {
    code,
    iso2,
    name,
    formalName: properties.formalName,
    localName,
    nativeNames,
    flag: clean(world?.flag) ?? flagFromIso2(iso2),
    continent: properties.continent,
    region: clean(world?.region) ?? properties.continent,
    subregion: clean(world?.subregion) ?? properties.subregion,
    sovereign: properties.sovereign,
    kind: properties.kind,
    qid,
    areaKm2: formatArea(world?.area),
    languages: Object.values(world?.languages ?? {}).map(clean).filter(Boolean),
    currencies: Object.entries(world?.currencies ?? {}).map(([currencyCode, currency]) => ({
      code: currencyCode,
      name: clean(currency.name),
      symbol: clean(currency.symbol),
    })),
    capitals: unique(world?.capital ?? []),
    wikipediaTitle: name,
    wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replaceAll(' ', '_'))}`,
    label: [labelLng, labelLat],
    divisionCount: 0,
    divisionTerm: 'Administrative divisions',
    heritageCount: 0,
  };

  if (qid) countryQidToCode.set(qid, code);
  for (const alias of unique([code, source.ADM0_A3, source.ISO_A3])) {
    if (!countryAliasToCode.has(alias) || alias === code) countryAliasToCode.set(alias, code);
  }
  for (const alias of unique([name, source.ADMIN, source.NAME, source.NAME_LONG, source.SOVEREIGNT])) {
    countryNameToCode.set(alias.toLocaleLowerCase(), code);
  }
}

for (const [code, names] of Object.entries(CAPITAL_PROFILE_ADDITIONS)) {
  if (countryProfiles[code]) countryProfiles[code].capitals = unique([...countryProfiles[code].capitals, ...names]);
}
for (const [code, names] of Object.entries(CAPITAL_PROFILE_REPLACEMENTS)) {
  if (countryProfiles[code]) countryProfiles[code].capitals = names;
}

const adminGroups = new Map();
for (const feature of adminData.features) {
  const properties = feature.properties;
  const rawCode = countryCode(properties);
  const code = (rawCode ? countryAliasToCode.get(rawCode) : null)
    ?? countryNameToCode.get(clean(properties.admin)?.toLocaleLowerCase());
  if (!code || !countryProfiles[code]) continue;
  const group = adminGroups.get(code) ?? [];
  group.push(feature);
  adminGroups.set(code, group);
}

const searchRecords = [];
for (const profile of Object.values(countryProfiles)) {
  searchRecords.push({
    id: `country:${profile.code}`,
    kind: 'country',
    name: profile.name,
    secondary: profile.formalName ?? profile.localName,
    code: profile.code,
    coordinates: profile.label,
    aliases: unique([profile.formalName, profile.localName, ...profile.nativeNames]),
  });
}

for (const [code, features] of adminGroups) {
  const outputFeatures = [];
  for (const feature of features) {
    const source = feature.properties;
    const divisionCode = clean(source.adm1_code) ?? clean(source.iso_3166_2) ?? `${code}-${source.ne_id}`;
    const name = clean(source.name_en) ?? clean(source.name) ?? divisionCode;
    const localName = clean(source.name_local) ?? name;
    const lng = Number(source.longitude);
    const lat = Number(source.latitude);
    const properties = {
      kind: 'division',
      code: divisionCode,
      countryCode: code,
      name,
      localName,
      labelEnglish: name,
      labelLocal: localName,
      labelBoth: localName === name ? name : `${name} · ${localName}`,
      type: DIVISION_TYPE_OVERRIDES[code] ?? clean(source.type_en) ?? clean(source.type),
      iso: clean(source.iso_3166_2),
      qid: clean(source.wikidataid),
    };
    outputFeatures.push({
      type: 'Feature',
      id: divisionCode,
      properties,
      geometry: feature.geometry,
    });
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      outputFeatures.push({
        type: 'Feature',
        id: `label-${divisionCode}`,
        properties: { ...properties, kind: 'division-label' },
        geometry: { type: 'Point', coordinates: [lng, lat] },
      });
      searchRecords.push({
        id: `division:${divisionCode}`,
        kind: 'division',
        name,
        secondary: countryProfiles[code].name,
        code,
        divisionCode,
        coordinates: [lng, lat],
        aliases: unique([localName, source.name_alt, source.iso_3166_2, source.postal]),
      });
    }
  }
  countryProfiles[code].divisionCount = features.length;
  countryProfiles[code].divisionTerm = DIVISION_TERM_OVERRIDES[code] ?? selectDivisionTerm(features);
  await writeJson(`admin1/${code}.geojson`, compactFeatureCollection(outputFeatures));
}

const capitals = [];
const majorCities = [];

for (const feature of placeData.features) {
  const source = feature.properties;
  const rawCode = countryCode(source);
  const code = (rawCode ? countryAliasToCode.get(rawCode) : null)
    ?? countryNameToCode.get(clean(source.ADM0NAME)?.toLocaleLowerCase());
  if (!code || !countryProfiles[code]) continue;
  const featureClass = clean(source.FEATURECLA) ?? '';
  const name = clean(source.NAME_EN) ?? clean(source.NAMEASCII) ?? clean(source.NAME);
  if (!name) continue;

  const baseProperties = {
    name,
    localName: clean(source.NAME) ?? name,
    countryCode: code,
    country: countryProfiles[code].name,
    division: clean(source.ADM1NAME),
    qid: clean(source.WIKIDATAID),
    rank: Number(source.RANK_MAX) || 0,
  };

  const sourceNames = unique([name, source.NAME, source.NAME_EN, source.NAMEASCII]);
  const matchedProfileCapital = countryProfiles[code].capitals.find((capital) => {
    const acceptedNames = [capital, ...(CAPITAL_NAME_ALIASES[code]?.[capital] ?? [])];
    return acceptedNames.some((accepted) => sourceNames.some((sourceName) => normalizeName(accepted) === normalizeName(sourceName)));
  });
  const isNationalCapital = Boolean(matchedProfileCapital);

  if (isNationalCapital) {
    const item = {
      type: 'Feature',
      id: `capital-0-${source.NE_ID}`,
      properties: { ...baseProperties, name: matchedProfileCapital, level: 0, role: featureClass },
      geometry: feature.geometry,
    };
    capitals.push(item);
    searchRecords.push({
      id: `capital:${source.NE_ID}`,
      kind: 'capital',
      name: matchedProfileCapital,
      secondary: countryProfiles[code].name,
      code,
      coordinates: feature.geometry.coordinates,
      aliases: sourceNames,
    });
  } else if (featureClass.startsWith('Admin-1')) {
    capitals.push({
      type: 'Feature',
      id: `capital-1-${source.NE_ID}`,
      properties: { ...baseProperties, level: 1, role: featureClass },
      geometry: feature.geometry,
    });
    searchRecords.push({
      id: `division-capital:${source.NE_ID}`,
      kind: 'division-capital',
      name,
      secondary: unique([source.ADM1NAME, countryProfiles[code].name]).join(', '),
      code,
      coordinates: feature.geometry.coordinates,
      aliases: unique([source.NAME, source.NAMEASCII]),
    });
  } else if (featureClass === 'Populated place' && (source.WORLDCITY === 1 || Number(source.RANK_MAX) >= 11)) {
    majorCities.push({
      type: 'Feature',
      id: `city-${source.NE_ID}`,
      properties: baseProperties,
      geometry: feature.geometry,
    });
    searchRecords.push({
      id: `city:${source.NE_ID}`,
      kind: 'city',
      name,
      secondary: countryProfiles[code].name,
      code,
      coordinates: feature.geometry.coordinates,
      aliases: unique([source.NAME, source.NAMEASCII]),
    });
  }
}

const mappedCapitalKeys = new Set(capitals
  .filter((feature) => feature.properties.level === 0)
  .map((feature) => `${feature.properties.countryCode}:${feature.properties.name.toLocaleLowerCase()}`));

for (const [index, fallback] of CAPITAL_FALLBACKS.entries()) {
  const profile = countryProfiles[fallback.code];
  const key = `${fallback.code}:${fallback.name.toLocaleLowerCase()}`;
  if (!profile || mappedCapitalKeys.has(key)) continue;
  capitals.push({
    type: 'Feature',
    id: `capital-0-fallback-${fallback.code}-${index}`,
    properties: {
      name: fallback.name,
      localName: fallback.name,
      countryCode: fallback.code,
      country: profile.name,
      division: null,
      qid: null,
      rank: 7,
      level: 0,
      role: 'Capital or government seat',
    },
    geometry: { type: 'Point', coordinates: fallback.coordinates },
  });
  searchRecords.push({
    id: `capital:fallback-${fallback.code}-${index}`,
    kind: 'capital',
    name: fallback.name,
    secondary: profile.name,
    code: fallback.code,
    coordinates: fallback.coordinates,
    aliases: [],
  });
}

function capitalPriority(feature) {
  const role = feature.properties.role;
  if (role === 'Admin-0 capital') return 0;
  if (role === 'Admin-0 capital alt') return 1;
  if (role === 'Admin-0 region capital') return 2;
  if (role === 'Capital or government seat') return 3;
  if (role === 'Admin-1 capital') return 4;
  return 5;
}

const bestNationalCapitals = new Map();
for (const feature of capitals.filter((item) => item.properties.level === 0)) {
  const key = `${feature.properties.countryCode}:${normalizeName(feature.properties.name)}`;
  const existing = bestNationalCapitals.get(key);
  if (!existing || capitalPriority(feature) < capitalPriority(existing)) bestNationalCapitals.set(key, feature);
}
const keptCapitalSearchIds = new Set([...bestNationalCapitals.values()]
  .map((feature) => `capital:${String(feature.id).replace(/^capital-0-/, '')}`));
capitals.splice(0, capitals.length,
  ...capitals.filter((feature) => feature.properties.level !== 0),
  ...bestNationalCapitals.values(),
);
searchRecords.splice(0, searchRecords.length, ...searchRecords.filter((record) =>
  record.kind !== 'capital' || keptCapitalSearchIds.has(record.id)));

const heritageByCountry = new Map();
const heritageSeen = new Set();
for (const binding of heritageData.results.bindings) {
  const siteId = wikidataId(binding.site?.value);
  const countryQid = wikidataId(binding.country?.value);
  const code = countryQidToCode.get(countryQid);
  const coordinates = parsePoint(binding.coord?.value);
  if (!siteId || !code || !coordinates) continue;
  const dedupeKey = `${code}:${siteId}`;
  const sitelinks = Number(binding.sitelinks?.value) || 0;
  const entry = {
    id: siteId,
    name: clean(binding.siteLabel?.value) ?? siteId,
    code,
    country: countryProfiles[code].name,
    coordinates,
    sitelinks,
    whcId: clean(binding.whcId?.value),
    wikipediaUrl: clean(binding.article?.value),
  };
  const existing = heritageSeen.has(dedupeKey)
    ? (heritageByCountry.get(code) ?? []).find((item) => item.id === siteId)
    : null;
  if (existing) {
    if (!existing.wikipediaUrl && entry.wikipediaUrl) existing.wikipediaUrl = entry.wikipediaUrl;
    existing.sitelinks = Math.max(existing.sitelinks, sitelinks);
    continue;
  }
  heritageSeen.add(dedupeKey);
  const entries = heritageByCountry.get(code) ?? [];
  entries.push(entry);
  heritageByCountry.set(code, entries);
}

const heritageFeatures = [];
for (const [code, entries] of heritageByCountry) {
  const selected = entries.sort((a, b) => b.sitelinks - a.sitelinks || a.name.localeCompare(b.name)).slice(0, 12);
  countryProfiles[code].heritageCount = selected.length;
  for (const item of selected) {
    const unescoId = item.whcId?.match(/\d+/)?.[0] ?? null;
    heritageFeatures.push({
      type: 'Feature',
      id: `${code}-${item.id}`,
      properties: {
        id: item.id,
        name: item.name,
        countryCode: code,
        country: item.country,
        wikipediaUrl: item.wikipediaUrl,
        unescoUrl: unescoId ? `https://whc.unesco.org/en/list/${unescoId}` : null,
      },
      geometry: { type: 'Point', coordinates: item.coordinates },
    });
  }
}

const rivers = riverData.features.map((feature, index) => ({
  type: 'Feature',
  id: feature.properties.ne_id ?? `river-${index}`,
  properties: {
    name: clean(feature.properties.name_en) ?? clean(feature.properties.name),
    rank: Number(feature.properties.scalerank) || 0,
  },
  geometry: feature.geometry,
}));

const lakes = lakeData.features.map((feature, index) => ({
  type: 'Feature',
  id: feature.properties.ne_id ?? `lake-${index}`,
  properties: {
    name: clean(feature.properties.name_en) ?? clean(feature.properties.name),
    rank: Number(feature.properties.scalerank) || 0,
  },
  geometry: feature.geometry,
}));

searchRecords.sort((a, b) => a.name.localeCompare(b.name));

await Promise.all([
  writeJson('countries.geojson', compactFeatureCollection(countryFeatures)),
  writeJson('country-labels.geojson', compactFeatureCollection(countryLabels)),
  writeJson('capitals.geojson', compactFeatureCollection(capitals)),
  writeJson('major-cities.geojson', compactFeatureCollection(majorCities)),
  writeJson('heritage.geojson', compactFeatureCollection(heritageFeatures)),
  writeJson('rivers.geojson', compactFeatureCollection(rivers)),
  writeJson('lakes.geojson', compactFeatureCollection(lakes)),
  writeJson('profiles.json', countryProfiles),
  writeJson('search-index.json', searchRecords),
  writeJson('sources.json', {
    generatedAt: new Date().toISOString(),
    sources: [
      {
        name: 'Natural Earth',
        version: '5.1.2',
        use: 'Country geometry, administrative divisions, capitals, cities, rivers, and lakes',
        license: 'Public domain (see Natural Earth terms; some contributed themes carry additional notices)',
        url: 'https://www.naturalearthdata.com/',
      },
      {
        name: 'mledoze/countries',
        version: '9eff32e4eef26715aa59d99b200127d1ef150e7a',
        use: 'Names, native names, languages, currencies, flags, and area',
        license: 'Open Database License (ODbL) 1.0',
        licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
        url: 'https://github.com/mledoze/countries',
      },
      {
        name: 'Wikidata',
        version: 'Snapshot generated 2026-08-30',
        use: 'World Heritage identifiers and fallback coordinates for small-territory capitals',
        license: 'CC0 1.0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        url: 'https://www.wikidata.org/',
      },
      {
        name: 'Wikipedia',
        use: 'On-demand geography, culture, and history introductions with per-section attribution',
        license: 'CC BY-SA',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        url: 'https://www.wikipedia.org/',
      },
    ],
    borderNote: 'Natural Earth uses a de facto boundary worldview. Boundaries are a reference visualization, not a legal position.',
  }),
]);

console.log(JSON.stringify({
  countries: countryFeatures.length,
  divisions: [...adminGroups.values()].reduce((sum, group) => sum + group.length, 0),
  capitals: capitals.length,
  majorCities: majorCities.length,
  heritageHighlights: heritageFeatures.length,
  searchRecords: searchRecords.length,
}, null, 2));
