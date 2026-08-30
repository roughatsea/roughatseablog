import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import * as maplibregl from 'maplibre-gl';
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import {
  type GeoJSONSource,
  type Map as MapLibreMap,
  type MapMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl';
import type { Feature, FeatureCollection, Point } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import './AtlasExperience.css';

type AtlasTheme = 'illuminated' | 'traditional';
type LabelLanguage = 'english' | 'local' | 'both';
type SectionId = 'overview' | 'geography' | 'culture' | 'history' | 'administration' | 'places';
type SearchKind = 'country' | 'capital' | 'division' | 'division-capital' | 'city';

interface Currency {
  code: string;
  name: string | null;
  symbol: string | null;
}

interface CountryProfile {
  code: string;
  iso2: string | null;
  name: string;
  formalName: string | null;
  localName: string;
  nativeNames: string[];
  flag: string;
  continent: string | null;
  region: string | null;
  subregion: string | null;
  sovereign: string | null;
  kind: string | null;
  qid: string | null;
  areaKm2: number | null;
  languages: string[];
  currencies: Currency[];
  capitals: string[];
  wikipediaTitle: string;
  wikipediaUrl: string;
  label: [number, number];
  divisionCount: number;
  divisionTerm: string;
  heritageCount: number;
}

interface SearchRecord {
  id: string;
  kind: SearchKind;
  name: string;
  secondary: string | null;
  code: string;
  divisionCode?: string;
  coordinates: [number, number];
  aliases: string[];
}

interface DivisionSummary {
  code: string;
  name: string;
  localName: string;
  type: string | null;
  coordinates: [number, number];
}

interface HeritageProperties {
  id: string;
  name: string;
  countryCode: string;
  country: string;
  wikipediaUrl: string | null;
  unescoUrl: string | null;
}

type HeritageFeature = Feature<Point, HeritageProperties>;

interface AtlasSources {
  generatedAt: string;
  sources: Array<{
    name: string;
    version?: string;
    use: string;
    license: string;
    licenseUrl?: string;
    url: string;
  }>;
  borderNote: string;
}

interface AtlasLayers {
  countryBorders: boolean;
  countryLabels: boolean;
  nationalCapitals: boolean;
  divisionBorders: boolean;
  divisionLabels: boolean;
  divisionCapitals: boolean;
  majorCities: boolean;
  heritage: boolean;
  rivers: boolean;
  lakes: boolean;
}

interface HoverCard {
  name: string;
  detail: string;
  x: number;
  y: number;
}

interface WikiResult {
  title: string;
  extract: string;
  url: string;
}

const EMPTY_COLLECTION: FeatureCollection = { type: 'FeatureCollection', features: [] };

const DEFAULT_LAYERS: AtlasLayers = {
  countryBorders: true,
  countryLabels: true,
  nationalCapitals: true,
  divisionBorders: true,
  divisionLabels: true,
  divisionCapitals: false,
  majorCities: false,
  heritage: false,
  rivers: false,
  lakes: false,
};

const PRESETS: Record<'political' | 'culture' | 'physical' | 'minimal', AtlasLayers> = {
  political: DEFAULT_LAYERS,
  culture: {
    countryBorders: true,
    countryLabels: true,
    nationalCapitals: true,
    divisionBorders: false,
    divisionLabels: false,
    divisionCapitals: false,
    majorCities: true,
    heritage: true,
    rivers: false,
    lakes: false,
  },
  physical: {
    countryBorders: false,
    countryLabels: true,
    nationalCapitals: false,
    divisionBorders: false,
    divisionLabels: false,
    divisionCapitals: false,
    majorCities: true,
    heritage: false,
    rivers: true,
    lakes: true,
  },
  minimal: {
    countryBorders: true,
    countryLabels: false,
    nationalCapitals: true,
    divisionBorders: false,
    divisionLabels: false,
    divisionCapitals: false,
    majorCities: false,
    heritage: false,
    rivers: false,
    lakes: false,
  },
};

const LAYER_GROUPS: Array<{ key: keyof AtlasLayers; label: string; detail: string; selectedOnly?: boolean }> = [
  { key: 'countryBorders', label: 'Country borders', detail: 'Global political outlines' },
  { key: 'countryLabels', label: 'Country names', detail: 'Collision-aware labels' },
  { key: 'nationalCapitals', label: 'National capitals', detail: 'Markers and names' },
  { key: 'divisionBorders', label: 'Division boundaries', detail: 'Selected country only', selectedOnly: true },
  { key: 'divisionLabels', label: 'Division names', detail: 'States, provinces, regions…', selectedOnly: true },
  { key: 'divisionCapitals', label: 'Division capitals', detail: 'Selected country only', selectedOnly: true },
  { key: 'majorCities', label: 'Major cities', detail: 'World-city reference layer' },
  { key: 'heritage', label: 'World heritage', detail: 'Representative Wikidata snapshot' },
  { key: 'rivers', label: 'Major rivers', detail: 'Physical geography' },
  { key: 'lakes', label: 'Lakes', detail: 'Physical geography' },
];

const MAP_LAYER_VISIBILITY: Record<keyof AtlasLayers, string[]> = {
  countryBorders: ['country-lines'],
  countryLabels: ['country-labels'],
  nationalCapitals: ['capital-0-dots', 'capital-0-labels'],
  divisionBorders: ['admin1-fill', 'admin1-lines', 'admin1-selected'],
  divisionLabels: ['admin1-labels'],
  divisionCapitals: ['capital-1-dots', 'capital-1-labels'],
  majorCities: ['major-city-dots', 'major-city-labels'],
  heritage: ['heritage-clusters', 'heritage-cluster-count', 'heritage-points', 'heritage-labels'],
  rivers: ['river-lines'],
  lakes: ['lake-fill', 'lake-lines'],
};

const OPTIONAL_SOURCES: Array<{ layer: keyof AtlasLayers; source: string; url: string }> = [
  { layer: 'majorCities', source: 'major-cities', url: '/atlas/major-cities.geojson' },
  { layer: 'heritage', source: 'heritage', url: '/atlas/heritage.geojson' },
  { layer: 'rivers', source: 'rivers', url: '/atlas/rivers.geojson' },
  { layer: 'lakes', source: 'lakes', url: '/atlas/lakes.geojson' },
];

const CORE_SOURCES = [
  { source: 'countries', url: '/atlas/countries.geojson' },
  { source: 'country-label-points', url: '/atlas/country-labels.geojson' },
  { source: 'capitals', url: '/atlas/capitals.geojson' },
] as const;

const PALETTES = {
  illuminated: {
    outside: '#010611',
    ocean: '#041a2a',
    land: ['#163a4a', '#273957', '#3b3459', '#184849', '#3d3b31', '#283f52', '#45324c', '#25463d'],
    border: '#72d8e4',
    admin: '#a3eff4',
    label: '#edfaff',
    halo: '#06131d',
    selected: '#ffcb68',
    capital: '#ffd978',
    city: '#a7f3f7',
    heritage: '#ff5ea8',
    river: '#43b7db',
    lake: '#0c3552',
  },
  traditional: {
    outside: '#d8d0bd',
    ocean: '#aac9cd',
    land: ['#d6c49d', '#c8d0ac', '#d3b8a8', '#bfc8b4', '#dbcba8', '#c7b9a5', '#c5c8a3', '#d7bda4'],
    border: '#4c493f',
    admin: '#6e6a5e',
    label: '#2e2c27',
    halo: '#eee6d3',
    selected: '#8d2744',
    capital: '#8d2744',
    city: '#365c61',
    heritage: '#7c3d66',
    river: '#3b8297',
    lake: '#8bb7c0',
  },
} as const;

const wikiCache = new Map<string, WikiResult | null>();

function storedTheme(): AtlasTheme {
  if (typeof window === 'undefined') return 'illuminated';
  const fromUrl = new URLSearchParams(window.location.search).get('theme');
  if (fromUrl === 'traditional' || fromUrl === 'illuminated') return fromUrl;
  try {
    return localStorage.getItem('roughatsea-atlas-theme') === 'traditional' ? 'traditional' : 'illuminated';
  } catch {
    return 'illuminated';
  }
}

function storedLayers(): AtlasLayers {
  if (typeof window === 'undefined') return DEFAULT_LAYERS;
  try {
    return { ...DEFAULT_LAYERS, ...JSON.parse(localStorage.getItem('roughatsea-atlas-layers') ?? '{}') };
  } catch {
    return DEFAULT_LAYERS;
  }
}

function storedLanguage(): LabelLanguage {
  if (typeof window === 'undefined') return 'english';
  try {
    const value = localStorage.getItem('roughatsea-atlas-label-language');
    return value === 'local' || value === 'both' ? value : 'english';
  } catch {
    return 'english';
  }
}

function storedWelcomeDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('roughatsea-atlas-welcome-dismissed') === 'true';
  } catch {
    return false;
  }
}

function initialCountry(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('country')?.toUpperCase() ?? null;
}

function landExpression(theme: AtlasTheme): unknown[] {
  const colors = PALETTES[theme].land;
  return [
    'match', ['to-number', ['get', 'mapColor'], 1],
    1, colors[0], 2, colors[1], 3, colors[2], 4, colors[3],
    5, colors[4], 6, colors[5], 7, colors[6], 8, colors[7],
    9, colors[0], 10, colors[1], 11, colors[2], 12, colors[3],
    13, colors[4], colors[0],
  ];
}

function createStyle(theme: AtlasTheme): StyleSpecification {
  const palette = PALETTES[theme];
  return {
    version: 8,
    projection: { type: 'globe' },
    sky: { 'atmosphere-blend': theme === 'illuminated' ? 1 : 0 },
    sources: {
      countries: { type: 'geojson', data: EMPTY_COLLECTION, generateId: true },
      'country-label-points': { type: 'geojson', data: EMPTY_COLLECTION },
      capitals: { type: 'geojson', data: EMPTY_COLLECTION },
      admin1: { type: 'geojson', data: EMPTY_COLLECTION },
      'major-cities': { type: 'geojson', data: EMPTY_COLLECTION },
      heritage: {
        type: 'geojson',
        data: EMPTY_COLLECTION,
        cluster: true,
        clusterMaxZoom: 5,
        clusterRadius: 36,
      },
      rivers: { type: 'geojson', data: EMPTY_COLLECTION },
      lakes: { type: 'geojson', data: EMPTY_COLLECTION },
    },
    layers: [
      { id: 'atlas-background', type: 'background', paint: { 'background-color': palette.ocean } },
      {
        id: 'countries-fill',
        type: 'fill',
        source: 'countries',
        paint: { 'fill-color': landExpression(theme) as never, 'fill-opacity': theme === 'illuminated' ? 0.98 : 1 },
      },
      {
        id: 'lake-fill',
        type: 'fill',
        source: 'lakes',
        layout: { visibility: 'none' },
        paint: { 'fill-color': palette.lake, 'fill-opacity': 0.92 },
      },
      {
        id: 'river-lines',
        type: 'line',
        source: 'rivers',
        layout: { visibility: 'none', 'line-cap': 'round' },
        paint: {
          'line-color': palette.river,
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.3, 4, 0.72],
          'line-width': ['interpolate', ['linear'], ['zoom'], 0, 0.35, 5, 1.25],
        },
      },
      {
        id: 'lake-lines',
        type: 'line',
        source: 'lakes',
        layout: { visibility: 'none' },
        paint: { 'line-color': palette.river, 'line-opacity': 0.64, 'line-width': 0.7 },
      },
      {
        id: 'country-lines',
        type: 'line',
        source: 'countries',
        paint: {
          'line-color': palette.border,
          'line-opacity': theme === 'illuminated' ? 0.52 : 0.62,
          'line-width': ['interpolate', ['linear'], ['zoom'], 0, 0.45, 4, 1.1, 7, 1.7],
        },
      },
      {
        id: 'selected-country-fill',
        type: 'fill',
        source: 'countries',
        filter: ['==', ['get', 'code'], '__none__'],
        paint: { 'fill-color': palette.selected, 'fill-opacity': theme === 'illuminated' ? 0.25 : 0.2 },
      },
      {
        id: 'selected-country-line',
        type: 'line',
        source: 'countries',
        filter: ['==', ['get', 'code'], '__none__'],
        paint: { 'line-color': palette.selected, 'line-width': 2.4, 'line-opacity': 0.98 },
      },
      {
        id: 'admin1-fill',
        type: 'fill',
        source: 'admin1',
        filter: ['==', ['get', 'kind'], 'division'],
        layout: { visibility: 'visible' },
        paint: { 'fill-color': palette.admin, 'fill-opacity': theme === 'illuminated' ? 0.035 : 0.025 },
      },
      {
        id: 'admin1-selected',
        type: 'fill',
        source: 'admin1',
        filter: ['==', ['get', 'code'], '__none__'],
        layout: { visibility: 'visible' },
        paint: { 'fill-color': palette.selected, 'fill-opacity': 0.3 },
      },
      {
        id: 'admin1-lines',
        type: 'line',
        source: 'admin1',
        filter: ['==', ['get', 'kind'], 'division'],
        layout: { visibility: 'visible' },
        paint: {
          'line-color': palette.admin,
          'line-opacity': theme === 'illuminated' ? 0.78 : 0.66,
          'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.35, 6, 1.1],
        },
      },
      {
        id: 'country-labels',
        type: 'symbol',
        source: 'country-label-points',
        layout: {
          'text-field': ['get', 'labelEnglish'],
          'text-font': ['Inter'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 0, 9, 3, 12, 6, 17],
          'text-letter-spacing': 0.07,
          'text-max-width': 8,
          'text-padding': 5,
          'text-optional': true,
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': palette.label,
          'text-halo-color': palette.halo,
          'text-halo-width': theme === 'illuminated' ? 1.3 : 1.8,
          'text-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.74, 2.5, 0.94],
        },
      },
      {
        id: 'major-city-dots',
        type: 'circle',
        source: 'major-cities',
        layout: { visibility: 'none' },
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 1.6, 6, 3.2],
          'circle-color': palette.city,
          'circle-stroke-color': palette.halo,
          'circle-stroke-width': 1,
          'circle-opacity': 0.86,
        },
      },
      {
        id: 'major-city-labels',
        type: 'symbol',
        source: 'major-cities',
        minzoom: 2.2,
        layout: {
          visibility: 'none',
          'text-field': ['get', 'name'],
          'text-font': ['Inter'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 2, 9, 6, 12],
          'text-offset': [0, 0.9],
          'text-anchor': 'top',
          'text-padding': 3,
          'text-optional': true,
        },
        paint: { 'text-color': palette.label, 'text-halo-color': palette.halo, 'text-halo-width': 1.2 },
      },
      {
        id: 'capital-0-dots',
        type: 'circle',
        source: 'capitals',
        filter: ['==', ['get', 'level'], 0],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 2.2, 5, 4.4],
          'circle-color': palette.capital,
          'circle-stroke-color': palette.halo,
          'circle-stroke-width': 1.25,
          'circle-blur': theme === 'illuminated' ? 0.16 : 0,
        },
      },
      {
        id: 'capital-0-labels',
        type: 'symbol',
        source: 'capitals',
        filter: ['==', ['get', 'level'], 0],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Inter'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 0, 9, 5, 13],
          'text-offset': [0, 1],
          'text-anchor': 'top',
          'text-padding': 5,
          'text-optional': true,
        },
        paint: { 'text-color': palette.capital, 'text-halo-color': palette.halo, 'text-halo-width': 1.35 },
      },
      {
        id: 'admin1-labels',
        type: 'symbol',
        source: 'admin1',
        filter: ['==', ['get', 'kind'], 'division-label'],
        minzoom: 2.4,
        layout: {
          'text-field': ['get', 'labelEnglish'],
          'text-font': ['Inter'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 2, 8.5, 6, 12.5],
          'text-max-width': 7,
          'text-padding': 4,
          'text-optional': true,
        },
        paint: {
          'text-color': palette.label,
          'text-halo-color': palette.halo,
          'text-halo-width': 1.15,
          'text-opacity': 0.82,
        },
      },
      {
        id: 'capital-1-dots',
        type: 'circle',
        source: 'capitals',
        filter: ['all', ['==', ['get', 'level'], 1], ['==', ['get', 'countryCode'], '__none__']],
        minzoom: 3,
        layout: { visibility: 'none' },
        paint: { 'circle-radius': 2.5, 'circle-color': palette.admin, 'circle-stroke-color': palette.halo, 'circle-stroke-width': 1 },
      },
      {
        id: 'capital-1-labels',
        type: 'symbol',
        source: 'capitals',
        filter: ['all', ['==', ['get', 'level'], 1], ['==', ['get', 'countryCode'], '__none__']],
        minzoom: 3.5,
        layout: {
          visibility: 'none',
          'text-field': ['get', 'name'],
          'text-font': ['Inter'],
          'text-size': 10,
          'text-offset': [0, 0.85],
          'text-anchor': 'top',
          'text-padding': 3,
          'text-optional': true,
        },
        paint: { 'text-color': palette.admin, 'text-halo-color': palette.halo, 'text-halo-width': 1.15 },
      },
      {
        id: 'heritage-clusters',
        type: 'circle',
        source: 'heritage',
        filter: ['has', 'point_count'],
        layout: { visibility: 'none' },
        paint: {
          'circle-color': palette.heritage,
          'circle-radius': ['step', ['get', 'point_count'], 9, 10, 13, 35, 17],
          'circle-opacity': 0.82,
          'circle-stroke-color': palette.halo,
          'circle-stroke-width': 1.4,
        },
      },
      {
        id: 'heritage-cluster-count',
        type: 'symbol',
        source: 'heritage',
        filter: ['has', 'point_count'],
        layout: {
          visibility: 'none',
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Inter'],
          'text-size': 10,
        },
        paint: { 'text-color': '#ffffff' },
      },
      {
        id: 'heritage-points',
        type: 'circle',
        source: 'heritage',
        filter: ['!', ['has', 'point_count']],
        layout: { visibility: 'none' },
        paint: {
          'circle-color': palette.heritage,
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 2.4, 7, 5],
          'circle-stroke-color': palette.halo,
          'circle-stroke-width': 1.1,
        },
      },
      {
        id: 'heritage-labels',
        type: 'symbol',
        source: 'heritage',
        filter: ['!', ['has', 'point_count']],
        minzoom: 4,
        layout: {
          visibility: 'none',
          'text-field': ['get', 'name'],
          'text-font': ['Inter'],
          'text-size': 10,
          'text-offset': [0, 0.9],
          'text-anchor': 'top',
          'text-padding': 3,
          'text-optional': true,
        },
        paint: { 'text-color': palette.heritage, 'text-halo-color': palette.halo, 'text-halo-width': 1.2 },
      },
    ],
  } as StyleSpecification;
}

function applyMapTheme(map: MapLibreMap, theme: AtlasTheme) {
  const palette = PALETTES[theme];
  const setPaint = (layer: string, property: string, value: unknown) => {
    if (map.getLayer(layer)) {
      (map.setPaintProperty as unknown as (layerId: string, propertyName: string, propertyValue: unknown) => void)(layer, property, value);
    }
  };
  map.setSky({ 'atmosphere-blend': theme === 'illuminated' ? 1 : 0 });
  setPaint('atlas-background', 'background-color', palette.ocean);
  setPaint('countries-fill', 'fill-color', landExpression(theme));
  setPaint('countries-fill', 'fill-opacity', theme === 'illuminated' ? 0.98 : 1);
  setPaint('country-lines', 'line-color', palette.border);
  setPaint('country-lines', 'line-opacity', theme === 'illuminated' ? 0.52 : 0.62);
  setPaint('selected-country-fill', 'fill-color', palette.selected);
  setPaint('selected-country-fill', 'fill-opacity', theme === 'illuminated' ? 0.25 : 0.2);
  setPaint('selected-country-line', 'line-color', palette.selected);
  setPaint('admin1-fill', 'fill-color', palette.admin);
  setPaint('admin1-fill', 'fill-opacity', theme === 'illuminated' ? 0.035 : 0.025);
  setPaint('admin1-selected', 'fill-color', palette.selected);
  setPaint('admin1-lines', 'line-color', palette.admin);
  setPaint('admin1-lines', 'line-opacity', theme === 'illuminated' ? 0.78 : 0.66);
  setPaint('country-labels', 'text-color', palette.label);
  setPaint('country-labels', 'text-halo-color', palette.halo);
  setPaint('country-labels', 'text-halo-width', theme === 'illuminated' ? 1.3 : 1.8);
  setPaint('major-city-dots', 'circle-color', palette.city);
  setPaint('major-city-dots', 'circle-stroke-color', palette.halo);
  setPaint('major-city-labels', 'text-color', palette.label);
  setPaint('major-city-labels', 'text-halo-color', palette.halo);
  setPaint('capital-0-dots', 'circle-color', palette.capital);
  setPaint('capital-0-dots', 'circle-stroke-color', palette.halo);
  setPaint('capital-0-dots', 'circle-blur', theme === 'illuminated' ? 0.16 : 0);
  setPaint('capital-0-labels', 'text-color', palette.capital);
  setPaint('capital-0-labels', 'text-halo-color', palette.halo);
  setPaint('admin1-labels', 'text-color', palette.label);
  setPaint('admin1-labels', 'text-halo-color', palette.halo);
  setPaint('capital-1-dots', 'circle-color', palette.admin);
  setPaint('capital-1-dots', 'circle-stroke-color', palette.halo);
  setPaint('capital-1-labels', 'text-color', palette.admin);
  setPaint('capital-1-labels', 'text-halo-color', palette.halo);
  setPaint('heritage-clusters', 'circle-color', palette.heritage);
  setPaint('heritage-clusters', 'circle-stroke-color', palette.halo);
  setPaint('heritage-points', 'circle-color', palette.heritage);
  setPaint('heritage-points', 'circle-stroke-color', palette.halo);
  setPaint('heritage-labels', 'text-color', palette.heritage);
  setPaint('heritage-labels', 'text-halo-color', palette.halo);
  setPaint('river-lines', 'line-color', palette.river);
  setPaint('lake-fill', 'fill-color', palette.lake);
  setPaint('lake-lines', 'line-color', palette.river);
}

function countryZoom(profile: CountryProfile) {
  const area = profile.areaKm2 ?? 0;
  if (area > 7_500_000) return 2.15;
  if (area > 1_500_000) return 2.7;
  if (area > 400_000) return 3.2;
  if (area > 80_000) return 3.75;
  if (area > 12_000) return 4.35;
  return 5.2;
}

function formatArea(area: number | null) {
  if (!area) return 'Not available';
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(area)} km²`;
}

function joinList(values: string[], empty = 'Not available') {
  return values.length ? values.join(', ') : empty;
}

function labelField(language: LabelLanguage) {
  if (language === 'local') return 'labelLocal';
  if (language === 'both') return 'labelBoth';
  return 'labelEnglish';
}

function kindLabel(kind: SearchKind) {
  if (kind === 'country') return 'Country or territory';
  if (kind === 'capital') return 'National capital';
  if (kind === 'division') return 'State / province / region';
  if (kind === 'division-capital') return 'Division capital';
  return 'Major city';
}

function iconFor(kind: SearchKind) {
  if (kind === 'country') return '◎';
  if (kind === 'capital') return '★';
  if (kind === 'division') return '◇';
  if (kind === 'division-capital') return '◆';
  return '•';
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Could not load ${url}`);
  return response.json() as Promise<T>;
}

async function fetchWikiResult(topic: 'geography' | 'culture' | 'history', profile: CountryProfile) {
  const cacheKey = `${topic}:${profile.code}`;
  if (wikiCache.has(cacheKey)) return wikiCache.get(cacheKey) ?? null;
  const heading = `${topic[0].toUpperCase()}${topic.slice(1)} of ${profile.name}`;
  const parameters = new URLSearchParams({
    origin: '*',
    action: 'query',
    generator: 'search',
    gsrsearch: `intitle:"${heading}"`,
    gsrnamespace: '0',
    gsrlimit: '5',
    prop: 'extracts|info',
    exintro: '1',
    explaintext: '1',
    exchars: '760',
    inprop: 'url',
    redirects: '1',
    format: 'json',
  });
  try {
    const response = await fetch(`https://en.wikipedia.org/w/api.php?${parameters}`);
    if (!response.ok) throw new Error('Wikipedia unavailable');
    const payload = await response.json();
    const pages = Object.values(payload.query?.pages ?? {}) as Array<{ title?: string; extract?: string; fullurl?: string }>;
    const preferred = pages.find((page) => page.title?.toLowerCase().startsWith(`${topic} of `)) ?? pages[0];
    const result = preferred?.extract && preferred.fullurl
      ? { title: preferred.title ?? heading, extract: preferred.extract, url: preferred.fullurl }
      : null;
    wikiCache.set(cacheKey, result);
    return result;
  } catch {
    wikiCache.set(cacheKey, null);
    return null;
  }
}

function WikiExtract({ topic, profile, active }: {
  topic: 'geography' | 'culture' | 'history';
  profile: CountryProfile;
  active: boolean;
}) {
  const [result, setResult] = useState<WikiResult | null | undefined>(undefined);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setResult(undefined);
    fetchWikiResult(topic, profile).then((value) => {
      if (!cancelled) setResult(value);
    });
    return () => { cancelled = true; };
  }, [active, profile.code, topic]);

  const searchUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(`${topic} of ${profile.name}`)}`;
  if (result === undefined) return <div className="atlas-wiki-loading"><i /> Consulting Wikipedia…</div>;
  if (result === null) {
    return (
      <p className="atlas-wiki-fallback">
        The introduction could not be loaded. <a href={searchUrl} target="_blank" rel="noreferrer">Search Wikipedia ↗</a>
      </p>
    );
  }
  return (
    <div className="atlas-wiki-extract">
      <p>{result.extract}</p>
      <small>
        From <a href={result.url} target="_blank" rel="noreferrer">{result.title} on Wikipedia</a> · text available under CC BY-SA
      </small>
    </div>
  );
}

function AccordionSection({
  id,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  summary?: string;
  open: boolean;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  return (
    <section className={`atlas-accordion ${open ? 'is-open' : ''}`}>
      <button type="button" aria-expanded={open} aria-controls={`atlas-section-${id}`} onClick={() => onToggle(id)}>
        <span><strong>{title}</strong>{summary && <small>{summary}</small>}</span>
        <i aria-hidden="true">⌄</i>
      </button>
      {open && <div id={`atlas-section-${id}`} className="atlas-accordion-content">{children}</div>}
    </section>
  );
}

function LayerSwitch({ checked, label, detail, disabled, onChange }: {
  checked: boolean;
  label: string;
  detail: string;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className="atlas-layer-switch"
      onClick={onChange}
    >
      <span className="atlas-switch-track"><i /></span>
      <span><strong>{label}</strong><small>{detail}</small></span>
    </button>
  );
}

export default function AtlasExperience() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const sourceDialogRef = useRef<HTMLElement | null>(null);
  const sourceTriggerRef = useRef<HTMLButtonElement | null>(null);
  const loadedOptionalSourcesRef = useRef(new Set<string>());
  const selectCountryRef = useRef<(code: string, coordinates?: [number, number], zoom?: number) => void>(() => {});
  const selectDivisionRef = useRef<(code: string, coordinates: [number, number]) => void>(() => {});
  const selectHeritageRef = useRef<(properties: HeritageProperties, coordinates: [number, number]) => void>(() => {});
  const themeRef = useRef<AtlasTheme>('illuminated');
  const initialFocusHandledRef = useRef(false);

  const [theme, setTheme] = useState<AtlasTheme>(storedTheme);
  const [layers, setLayers] = useState<AtlasLayers>(storedLayers);
  const [labelLanguage, setLabelLanguage] = useState<LabelLanguage>(storedLanguage);
  const [profiles, setProfiles] = useState<Record<string, CountryProfile>>({});
  const [searchIndex, setSearchIndex] = useState<SearchRecord[]>([]);
  const [heritage, setHeritage] = useState<HeritageFeature[]>([]);
  const [sources, setSources] = useState<AtlasSources | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(initialCountry);
  const [selectedDivisionCode, setSelectedDivisionCode] = useState<string | null>(null);
  const [selectedHeritageId, setSelectedHeritageId] = useState<string | null>(null);
  const [divisions, setDivisions] = useState<DivisionSummary[]>([]);
  const [divisionQuery, setDivisionQuery] = useState('');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchActiveIndex, setSearchActiveIndex] = useState(0);
  const [layerPanelOpen, setLayerPanelOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1050);
  const [drawerOpen, setDrawerOpen] = useState(Boolean(initialCountry()));
  const [sourcePanelOpen, setSourcePanelOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [coreDataReady, setCoreDataReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(storedWelcomeDismissed);
  const [hoverCard, setHoverCard] = useState<HoverCard | null>(null);
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>({
    overview: true,
    geography: true,
    culture: false,
    history: false,
    administration: false,
    places: true,
  });

  themeRef.current = theme;

  const selectedProfile = selectedCode ? profiles[selectedCode] ?? null : null;
  const selectedHeritage = selectedCode
    ? heritage.filter((feature) => feature.properties.countryCode === selectedCode)
    : [];

  const activePreset = useMemo(() => {
    const match = Object.entries(PRESETS).find(([, preset]) =>
      (Object.keys(preset) as Array<keyof AtlasLayers>).every((key) => preset[key] === layers[key]));
    return match?.[0] ?? 'custom';
  }, [layers]);

  const searchResults = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return [];
    const kindRank: Record<SearchKind, number> = { country: 0, capital: 1, division: 2, 'division-capital': 3, city: 4 };
    return searchIndex
      .map((record) => {
        const name = record.name.toLocaleLowerCase();
        const haystack = [record.name, record.secondary, ...record.aliases].filter(Boolean).join(' ').toLocaleLowerCase();
        if (!haystack.includes(needle)) return null;
        const score = name === needle ? 0 : name.startsWith(needle) ? 1 : haystack.split(/\s+/).some((part) => part.startsWith(needle)) ? 2 : 3;
        return { record, score };
      })
      .filter((value): value is { record: SearchRecord; score: number } => Boolean(value))
      .sort((a, b) => a.score - b.score || kindRank[a.record.kind] - kindRank[b.record.kind] || a.record.name.localeCompare(b.record.name))
      .slice(0, 9)
      .map(({ record }) => record);
  }, [query, searchIndex]);

  const visibleDivisions = useMemo(() => {
    const needle = divisionQuery.trim().toLocaleLowerCase();
    return divisions
      .filter((division) => !needle || `${division.name} ${division.localName} ${division.type ?? ''}`.toLocaleLowerCase().includes(needle))
      .slice(0, 180);
  }, [divisionQuery, divisions]);

  useEffect(() => {
    if (!coreDataReady) return;
    const controller = new AbortController();
    Promise.all([
      fetchJson<Record<string, CountryProfile>>('/atlas/profiles.json', controller.signal),
      fetchJson<SearchRecord[]>('/atlas/search-index.json', controller.signal),
      fetchJson<FeatureCollection<Point, HeritageProperties>>('/atlas/heritage.geojson', controller.signal),
      fetchJson<AtlasSources>('/atlas/sources.json', controller.signal),
    ]).then(([profileData, searchData, heritageData, sourceData]) => {
      setProfiles(profileData);
      setSearchIndex(searchData);
      setHeritage(heritageData.features);
      setSources(sourceData);
      if (selectedCode && profileData[selectedCode]) setDrawerOpen(true);
      else if (selectedCode) {
        setSelectedCode(null);
        setDrawerOpen(false);
      }
    }).catch(() => setMapError('The atlas reference data could not be loaded.'));
    return () => controller.abort();
  }, [coreDataReady]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    document.fonts?.load("12px 'Inter'");
    const probe = document.createElement('canvas');
    const probeContext = probe.getContext('webgl2');
    if (!probeContext) {
      setMapError('This atlas needs WebGL2, which is unavailable or disabled in this browser.');
      return;
    }
    probeContext.getExtension('WEBGL_lose_context')?.loseContext();
    let startupTimer: number | undefined;
    try {
      // MapLibre v6 ships its worker as a separate ES module. Vite's worker
      // pipeline bundles it with its shared module so the production URL is
      // self-contained rather than pointing at an un-emitted sibling file.
      maplibregl.setWorkerUrl(mapLibreWorkerUrl);
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: createStyle(themeRef.current),
        center: [-18, 18],
        zoom: 1.25,
        minZoom: 0.45,
        maxZoom: 8,
        attributionControl: false,
        renderWorldCopies: false,
        cooperativeGestures: false,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-left');
      map.addControl(new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '<a href="https://www.naturalearthdata.com/">Natural Earth</a> · <a href="https://www.wikidata.org/">Wikidata</a>',
      }), 'bottom-left');

      startupTimer = window.setTimeout(() => {
        if (!map.loaded()) setMapError('The atlas renderer did not finish loading. Reload the page to try again.');
      }, 20_000);

      map.on('style.load', () => {
        map.getCanvas().setAttribute('aria-label', 'Interactive world globe. Drag to rotate and use the atlas search or layer controls to explore.');
      });

      map.on('load', () => {
        if (startupTimer) window.clearTimeout(startupTimer);
        setMapReady(true);
      });

      map.on('error', (event) => {
        const message = event.error?.message ?? '';
        if (/WebGL2|countries\.geojson|country-labels\.geojson|capitals\.geojson/i.test(message)) {
          setMapError('The globe or its core reference data could not be loaded. Reload the page to try again.');
        }
      });

      map.on('click', async (event: MapMouseEvent) => {
        const available = [
          'heritage-clusters', 'heritage-points', 'capital-1-dots', 'capital-0-dots',
          'major-city-dots', 'admin1-fill', 'selected-country-fill', 'countries-fill',
        ].filter((id) => map.getLayer(id));
        const feature = map.queryRenderedFeatures(event.point, { layers: available })[0];
        if (!feature) return;
        const properties = feature.properties as Record<string, unknown>;

        if (feature.layer.id === 'heritage-clusters') {
          const source = map.getSource('heritage') as GeoJSONSource;
          const zoom = await source.getClusterExpansionZoom(Number(properties.cluster_id));
          map.easeTo({ center: event.lngLat, zoom, duration: 700 });
          return;
        }
        if (feature.layer.id === 'heritage-points') {
          const coordinates = (feature.geometry as Point).coordinates as [number, number];
          selectHeritageRef.current(properties as unknown as HeritageProperties, coordinates);
          return;
        }
        if (feature.layer.id === 'admin1-fill') {
          selectDivisionRef.current(String(properties.code), [event.lngLat.lng, event.lngLat.lat]);
          return;
        }
        if (feature.layer.id === 'capital-0-dots' || feature.layer.id === 'capital-1-dots' || feature.layer.id === 'major-city-dots') {
          selectCountryRef.current(String(properties.countryCode), [event.lngLat.lng, event.lngLat.lat], Math.max(map.getZoom(), 4.4));
          return;
        }
        selectCountryRef.current(String(properties.code));
      });

      map.on('mousemove', (event: MapMouseEvent) => {
        const available = ['heritage-points', 'capital-1-dots', 'capital-0-dots', 'major-city-dots', 'admin1-fill', 'countries-fill']
          .filter((id) => map.getLayer(id));
        const feature = map.queryRenderedFeatures(event.point, { layers: available })[0];
        map.getCanvas().style.cursor = feature ? 'pointer' : '';
        if (!feature) {
          setHoverCard(null);
          return;
        }
        const properties = feature.properties as Record<string, unknown>;
        const name = String(properties.name ?? properties.country ?? 'Explore');
        const detail = feature.layer.id === 'admin1-fill'
          ? String(properties.type ?? 'First-level division')
          : feature.layer.id === 'heritage-points'
            ? 'World heritage highlight'
            : feature.layer.id.includes('capital')
              ? String(properties.role ?? 'Capital')
              : feature.layer.id === 'major-city-dots'
                ? 'Major city'
                : String(properties.kind ?? 'Country or territory');
        setHoverCard({ name, detail, x: event.point.x, y: event.point.y });
      });
      map.on('mouseout', () => setHoverCard(null));
      map.on('webglcontextlost', () => setMapError('The globe paused because its graphics context was lost. Reload the page to restore it.'));
    } catch {
      setMapError('The interactive globe could not be started in this browser.');
    }

    return () => {
      if (startupTimer) window.clearTimeout(startupTimer);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const controller = new AbortController();
    let finished = false;
    const loadTimer = window.setTimeout(() => {
      if (!finished) setMapError('The country map data took too long to prepare. Reload the page to try again.');
    }, 20_000);

    Promise.all(CORE_SOURCES.map(({ url }) => fetchJson<FeatureCollection>(url, controller.signal)))
      .then(async (collections) => {
        if (controller.signal.aborted) return;
        if (collections.some((collection) => collection.type !== 'FeatureCollection' || collection.features.length === 0)) {
          throw new Error('A core atlas dataset was empty.');
        }
        await Promise.all(CORE_SOURCES.map(({ source }, index) =>
          (map.getSource(source) as GeoJSONSource).setData(collections[index])));
        if (controller.signal.aborted) return;
        finished = true;
        window.clearTimeout(loadTimer);
        setCoreDataReady(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setMapError('The atlas country data could not be loaded. Reload the page to try again.');
      });

    return () => {
      controller.abort();
      window.clearTimeout(loadTimer);
    };
  }, [mapReady]);

  const flyTo = useCallback((coordinates: [number, number], zoom: number) => {
    const map = mapRef.current;
    if (!map) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    map.flyTo({
      center: coordinates,
      zoom,
      duration: reducedMotion ? 0 : 1350,
      essential: false,
      padding: window.innerWidth >= 900 ? { top: 80, right: 430, bottom: 40, left: 90 } : { top: 90, right: 20, bottom: 260, left: 20 },
    });
  }, []);

  const selectCountry = useCallback((code: string, coordinates?: [number, number], zoom?: number) => {
    const profile = profiles[code];
    if (!profile) return;
    initialFocusHandledRef.current = true;
    setSelectedCode(code);
    setSelectedDivisionCode(null);
    setSelectedHeritageId(null);
    setDivisionQuery('');
    setDrawerOpen(true);
    setSearchOpen(false);
    setQuery('');
    flyTo(coordinates ?? profile.label, zoom ?? countryZoom(profile));
  }, [flyTo, profiles]);

  const selectDivision = useCallback((code: string, coordinates: [number, number]) => {
    setSelectedDivisionCode(code);
    setDrawerOpen(true);
    setOpenSections((current) => ({ ...current, administration: true }));
    flyTo(coordinates, Math.max(mapRef.current?.getZoom() ?? 4, 4.7));
  }, [flyTo]);

  const selectHeritage = useCallback((properties: HeritageProperties, coordinates: [number, number]) => {
    if (properties.countryCode && profiles[properties.countryCode]) {
      setSelectedCode(properties.countryCode);
      setDrawerOpen(true);
    }
    setSelectedHeritageId(properties.id);
    setOpenSections((current) => ({ ...current, places: true }));
    flyTo(coordinates, Math.max(mapRef.current?.getZoom() ?? 4.5, 5.1));
  }, [flyTo, profiles]);

  selectCountryRef.current = selectCountry;
  selectDivisionRef.current = selectDivision;
  selectHeritageRef.current = selectHeritage;

  useEffect(() => {
    if (!mapReady || !selectedProfile || initialFocusHandledRef.current) return;
    initialFocusHandledRef.current = true;
    flyTo(selectedProfile.label, countryZoom(selectedProfile));
  }, [flyTo, mapReady, selectedProfile]);

  useEffect(() => {
    if (!mapReady) return;
    applyMapTheme(mapRef.current!, theme);
    try { localStorage.setItem('roughatsea-atlas-theme', theme); } catch { /* Preferences remain session-only. */ }
  }, [mapReady, theme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !coreDataReady || !map) return;
    for (const optional of OPTIONAL_SOURCES) {
      if (!layers[optional.layer] || loadedOptionalSourcesRef.current.has(optional.source)) continue;
      const source = map.getSource(optional.source) as GeoJSONSource | undefined;
      if (!source) continue;
      loadedOptionalSourcesRef.current.add(optional.source);
      source.setData(optional.url);
    }
    for (const [key, layerIds] of Object.entries(MAP_LAYER_VISIBILITY) as Array<[keyof AtlasLayers, string[]]>) {
      for (const layerId of layerIds) {
        if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', layers[key] ? 'visible' : 'none');
      }
    }
    try { localStorage.setItem('roughatsea-atlas-layers', JSON.stringify(layers)); } catch { /* Preferences remain session-only. */ }
  }, [coreDataReady, layers, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const field = labelField(labelLanguage);
    for (const layerId of ['country-labels', 'admin1-labels']) {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'text-field', ['get', field]);
    }
    try { localStorage.setItem('roughatsea-atlas-label-language', labelLanguage); } catch { /* Preferences remain session-only. */ }
  }, [labelLanguage, mapReady]);

  useEffect(() => {
    if (!sourcePanelOpen) return;
    const dialog = sourceDialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => [...dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    focusable()[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSourcePanelOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      (previousFocus ?? sourceTriggerRef.current)?.focus();
    };
  }, [sourcePanelOpen]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const code = selectedCode ?? '__none__';
    map.setFilter('selected-country-fill', ['==', ['get', 'code'], code]);
    map.setFilter('selected-country-line', ['==', ['get', 'code'], code]);
    map.setFilter('capital-1-dots', ['all', ['==', ['get', 'level'], 1], ['==', ['get', 'countryCode'], code]]);
    map.setFilter('capital-1-labels', ['all', ['==', ['get', 'level'], 1], ['==', ['get', 'countryCode'], code]]);
    map.setFilter('admin1-selected', ['==', ['get', 'code'], selectedDivisionCode ?? '__none__']);
  }, [mapReady, selectedCode, selectedDivisionCode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const source = map.getSource('admin1') as GeoJSONSource;
    if (!selectedCode) {
      source.setData(EMPTY_COLLECTION);
      setDivisions([]);
      return;
    }
    const controller = new AbortController();
    fetchJson<FeatureCollection>(`/atlas/admin1/${selectedCode}.geojson`, controller.signal)
      .then((data) => {
        source.setData(data);
        const summaries = data.features
          .filter((feature) => feature.geometry.type === 'Point' && feature.properties?.kind === 'division-label')
          .map((feature) => ({
            code: String(feature.properties?.code),
            name: String(feature.properties?.name),
            localName: String(feature.properties?.localName ?? feature.properties?.name),
            type: feature.properties?.type ? String(feature.properties.type) : null,
            coordinates: (feature.geometry as Point).coordinates as [number, number],
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setDivisions(summaries);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        source.setData(EMPTY_COLLECTION);
        setDivisions([]);
      });
    return () => controller.abort();
  }, [mapReady, selectedCode]);

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    if (selectedCode) parameters.set('country', selectedCode);
    else parameters.delete('country');
    parameters.set('theme', theme);
    const next = `${window.location.pathname}?${parameters.toString()}`;
    window.history.replaceState({}, '', next);
  }, [selectedCode, theme]);

  const handleSearchSelection = useCallback((record: SearchRecord) => {
    if (record.kind === 'division') {
      selectCountry(record.code, record.coordinates, 4.7);
      setSelectedDivisionCode(record.divisionCode ?? null);
      setOpenSections((current) => ({ ...current, administration: true }));
    } else {
      selectCountry(record.code, record.coordinates, record.kind === 'country' ? undefined : 4.8);
    }
  }, [selectCountry]);

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setSearchOpen(false);
      return;
    }
    if (!searchResults.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSearchActiveIndex((index) => (index + 1) % searchResults.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSearchActiveIndex((index) => (index - 1 + searchResults.length) % searchResults.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleSearchSelection(searchResults[searchActiveIndex] ?? searchResults[0]);
    }
  };

  const toggleSection = (id: SectionId) => {
    setOpenSections((current) => ({ ...current, [id]: !current[id] }));
  };

  const setPreset = (preset: keyof typeof PRESETS) => setLayers({ ...PRESETS[preset] });
  const updateLayer = (key: keyof AtlasLayers) => setLayers((current) => ({ ...current, [key]: !current[key] }));

  const dismissWelcome = () => {
    setWelcomeDismissed(true);
    try { localStorage.setItem('roughatsea-atlas-welcome-dismissed', 'true'); } catch { /* Dismissal remains session-only. */ }
  };

  const focusHeritage = (feature: HeritageFeature) => {
    setSelectedHeritageId(feature.properties.id);
    flyTo(feature.geometry.coordinates as [number, number], 5.3);
  };

  const resetGlobe = () => {
    setSelectedCode(null);
    setSelectedDivisionCode(null);
    setSelectedHeritageId(null);
    setDrawerOpen(false);
    setDivisions([]);
    const map = mapRef.current;
    if (map) map.flyTo({ center: [-18, 18], zoom: 1.25, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1200 });
  };

  return (
    <div className="atlas-root" data-atlas-theme={theme}>
      <div ref={mapContainerRef} className="atlas-map" role="application" aria-label="Interactive world atlas" />
      <div className="atlas-map-wash" aria-hidden="true" />

      <header className="atlas-topbar">
        <a href="/" className="atlas-brand" aria-label="Return to Rough at Sea">
          <svg viewBox="0 0 48 32" aria-hidden="true">
            <path d="M3 11c5.2 0 5.2-5 10.4-5s5.2 5 10.4 5S29 6 34.2 6s5.2 5 10.4 5" />
            <path d="M3 20c5.2 0 5.2-5 10.4-5s5.2 5 10.4 5 5.2-5 10.4-5 5.2 5 10.4 5" />
            <path d="M3 29c5.2 0 5.2-5 10.4-5s5.2 5 10.4 5 5.2-5 10.4-5 5.2 5 10.4 5" />
          </svg>
          <span><strong>Rough at Sea</strong><small>Atlas</small></span>
        </a>

        <div className="atlas-search-shell">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            role="combobox"
            value={query}
            placeholder="Search countries, capitals, or regions"
            aria-label="Search countries, capitals, regions, and major cities"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded={searchOpen && Boolean(query)}
            aria-controls="atlas-search-results"
            aria-activedescendant={searchOpen && query ? searchResults[searchActiveIndex]?.id : undefined}
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); setSearchActiveIndex(0); }}
            onKeyDown={handleSearchKeyDown}
          />
          {query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>×</button>}
          {searchOpen && query && (
            <div id="atlas-search-results" role="listbox" className="atlas-search-results">
              {searchResults.length ? searchResults.map((record, index) => (
                <button
                  id={record.id}
                  key={record.id}
                  type="button"
                  role="option"
                  aria-selected={index === searchActiveIndex}
                  className={index === searchActiveIndex ? 'is-active' : ''}
                  onMouseEnter={() => setSearchActiveIndex(index)}
                  onClick={() => handleSearchSelection(record)}
                >
                  <i aria-hidden="true">{iconFor(record.kind)}</i>
                  <span><strong>{record.name}</strong><small>{record.secondary}</small></span>
                  <em>{kindLabel(record.kind)}</em>
                </button>
              )) : <p>No places found.</p>}
            </div>
          )}
          <span className="atlas-sr-only" aria-live="polite">
            {searchOpen && query ? `${searchResults.length} search result${searchResults.length === 1 ? '' : 's'}` : ''}
          </span>
        </div>

        <div className="atlas-theme-switch" role="group" aria-label="Globe appearance">
          <button type="button" aria-pressed={theme === 'illuminated'} onClick={() => setTheme('illuminated')}>
            <i aria-hidden="true">✦</i><span>Illuminated</span>
          </button>
          <button type="button" aria-pressed={theme === 'traditional'} onClick={() => setTheme('traditional')}>
            <i aria-hidden="true">◫</i><span>Traditional</span>
          </button>
        </div>
      </header>

      <div className="atlas-left-actions">
        <button type="button" className={layerPanelOpen ? 'is-active' : ''} onClick={() => setLayerPanelOpen((open) => !open)} aria-expanded={layerPanelOpen}>
          <span aria-hidden="true">☷</span> Layers
        </button>
        <button type="button" aria-label="Reset to world view" onClick={resetGlobe}><span aria-hidden="true">↺</span><span className="atlas-action-label">World</span></button>
      </div>

      {layerPanelOpen && (
        <aside className="atlas-layer-panel" aria-label="Atlas layers">
          <div className="atlas-panel-heading">
            <div><small>Chart table</small><h2>Layers</h2></div>
            <button type="button" aria-label="Close layer panel" onClick={() => setLayerPanelOpen(false)}>×</button>
          </div>

          <div className="atlas-presets" aria-label="Layer presets">
            {(['political', 'culture', 'physical', 'minimal'] as const).map((preset) => (
              <button key={preset} type="button" className={activePreset === preset ? 'is-active' : ''} onClick={() => setPreset(preset)}>
                {preset === 'culture' ? 'Culture & history' : preset[0].toUpperCase() + preset.slice(1)}
              </button>
            ))}
          </div>
          {activePreset === 'custom' && <p className="atlas-custom-badge">Custom layer mix</p>}

          <div className="atlas-layer-list">
            {LAYER_GROUPS.map((item) => (
              <LayerSwitch
                key={item.key}
                checked={layers[item.key]}
                label={item.label}
                detail={item.selectedOnly && !selectedProfile ? `${item.detail} · select a country` : item.detail}
                disabled={item.selectedOnly && !selectedProfile}
                onChange={() => updateLayer(item.key)}
              />
            ))}
          </div>

          <div className="atlas-label-language">
            <span>Label language</span>
            <div role="group" aria-label="Label language">
              {(['english', 'local', 'both'] as const).map((language) => (
                <button key={language} type="button" aria-pressed={labelLanguage === language} onClick={() => setLabelLanguage(language)}>
                  {language === 'both' ? 'Both' : language[0].toUpperCase() + language.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </aside>
      )}

      {!selectedProfile && !drawerOpen && !welcomeDismissed && (
        <section className="atlas-welcome" aria-label="Atlas introduction">
          <button type="button" className="atlas-welcome-close" aria-label="Dismiss atlas introduction" onClick={dismissWelcome}>×</button>
          <small>THE WORLD, WITH CONTEXT</small>
          <h1>Spin the world.</h1>
          <p>Drag the globe, choose a country, or search for a capital, state, province, region, or major city.</p>
          <div><span><i /> National capital</span><span>Scroll to zoom</span></div>
        </section>
      )}

      {selectedProfile && drawerOpen && (
        <aside className="atlas-place-drawer" aria-label={`About ${selectedProfile.name}`}>
          <div className="atlas-place-scroll">
            <div className="atlas-place-heading">
              <button type="button" className="atlas-drawer-close" aria-label="Collapse place information" onClick={() => setDrawerOpen(false)}>×</button>
              <span className="atlas-flag" aria-hidden="true">{selectedProfile.flag}</span>
              <p>{selectedProfile.kind ?? 'Country or territory'} · {selectedProfile.subregion ?? selectedProfile.continent}</p>
              <h2>{selectedProfile.name}</h2>
              {selectedProfile.localName !== selectedProfile.name && <h3>{selectedProfile.localName}</h3>}
              {selectedProfile.formalName && selectedProfile.formalName !== selectedProfile.name && <small>{selectedProfile.formalName}</small>}
              <div className="atlas-place-actions">
                <a href={selectedProfile.wikipediaUrl} target="_blank" rel="noreferrer">Wikipedia <span aria-hidden="true">↗</span></a>
                <button type="button" onClick={() => setLayerPanelOpen(true)}>Adjust layers</button>
              </div>
            </div>

            <div className="atlas-place-sections">
              <AccordionSection id="overview" title="Overview" summary="Names, capitals, and reference facts" open={openSections.overview} onToggle={toggleSection}>
                <dl className="atlas-facts">
                  <div><dt>{selectedProfile.capitals.length > 1 ? 'Capitals / seats' : 'Capital'}</dt><dd>{joinList(selectedProfile.capitals)}</dd></div>
                  <div><dt>Region</dt><dd>{joinList([selectedProfile.region, selectedProfile.subregion].filter(Boolean) as string[])}</dd></div>
                  <div><dt>Area</dt><dd>{formatArea(selectedProfile.areaKm2)}</dd></div>
                  <div><dt>Languages</dt><dd>{joinList(selectedProfile.languages.slice(0, 8))}</dd></div>
                  <div><dt>Currencies</dt><dd>{selectedProfile.currencies.length ? selectedProfile.currencies.map((currency) => `${currency.name ?? currency.code}${currency.symbol ? ` (${currency.symbol})` : ''}`).join(', ') : 'Not available'}</dd></div>
                  <div><dt>Divisions</dt><dd>{selectedProfile.divisionCount ? `${selectedProfile.divisionCount} ${selectedProfile.divisionTerm.toLocaleLowerCase()}` : 'No mapped administrative divisions in this atlas'}</dd></div>
                  {selectedProfile.sovereign && selectedProfile.sovereign !== selectedProfile.name && <div><dt>Sovereign relationship</dt><dd>{selectedProfile.sovereign}</dd></div>}
                </dl>
              </AccordionSection>

              <AccordionSection id="geography" title="Geography" summary={`${selectedProfile.continent ?? 'World'} · physical setting`} open={openSections.geography} onToggle={toggleSection}>
                <WikiExtract key={`${selectedProfile.code}:geography`} topic="geography" profile={selectedProfile} active={openSections.geography} />
              </AccordionSection>

              <AccordionSection id="culture" title="Culture" summary="Arts, languages, traditions, and daily life" open={openSections.culture} onToggle={toggleSection}>
                <WikiExtract key={`${selectedProfile.code}:culture`} topic="culture" profile={selectedProfile} active={openSections.culture} />
              </AccordionSection>

              <AccordionSection id="history" title="History" summary="A concise path into a much larger story" open={openSections.history} onToggle={toggleSection}>
                <WikiExtract key={`${selectedProfile.code}:history`} topic="history" profile={selectedProfile} active={openSections.history} />
              </AccordionSection>

              <AccordionSection id="administration" title={selectedProfile.divisionTerm} summary={selectedProfile.divisionCount ? `${selectedProfile.divisionCount} mapped` : 'No mapped divisions'} open={openSections.administration} onToggle={toggleSection}>
                {divisions.length ? (
                  <>
                    <label className="atlas-division-search">
                      <span>Find a division</span>
                      <input value={divisionQuery} onChange={(event) => setDivisionQuery(event.target.value)} placeholder={`Search ${selectedProfile.divisionTerm.toLocaleLowerCase()}`} />
                    </label>
                    <div className="atlas-division-list">
                      {visibleDivisions.map((division) => (
                        <button
                          type="button"
                          key={division.code}
                          className={selectedDivisionCode === division.code ? 'is-active' : ''}
                          onClick={() => selectDivision(division.code, division.coordinates)}
                        >
                          <span><strong>{division.name}</strong>{division.localName !== division.name && <small>{division.localName}</small>}</span>
                          <em>{division.type ?? 'Division'}</em>
                        </button>
                      ))}
                    </div>
                  </>
                ) : <p className="atlas-empty-note">Natural Earth does not provide mapped administrative boundaries for this place, usually because it is very small or its status is disputed.</p>}
              </AccordionSection>

              <AccordionSection id="places" title="Notable places" summary={selectedHeritage.length ? `${selectedHeritage.length} representative heritage highlights` : 'No heritage snapshot entries'} open={openSections.places} onToggle={toggleSection}>
                {selectedHeritage.length ? (
                  <div className="atlas-heritage-list">
                    {selectedHeritage.map((feature) => (
                      <article key={feature.properties.id} className={selectedHeritageId === feature.properties.id ? 'is-active' : ''}>
                        <button type="button" onClick={() => focusHeritage(feature)}>
                          <i aria-hidden="true">✦</i><span>{feature.properties.name}</span>
                        </button>
                        <div>
                          {feature.properties.wikipediaUrl && <a href={feature.properties.wikipediaUrl} target="_blank" rel="noreferrer">Wikipedia ↗</a>}
                          {feature.properties.unescoUrl && <a href={feature.properties.unescoUrl} target="_blank" rel="noreferrer">UNESCO ↗</a>}
                        </div>
                      </article>
                    ))}
                    <small className="atlas-editorial-note">A representative, automatically ranked snapshot—not a claim that these are the only places that matter.</small>
                  </div>
                ) : <p className="atlas-empty-note">No World Heritage entries from the current Wikidata snapshot are attached to this map unit.</p>}
              </AccordionSection>
            </div>
          </div>
        </aside>
      )}

      {selectedProfile && !drawerOpen && (
        <button type="button" className="atlas-reopen-drawer" onClick={() => setDrawerOpen(true)}>
          <span aria-hidden="true">{selectedProfile.flag}</span><strong>{selectedProfile.name}</strong><i aria-hidden="true">‹</i>
        </button>
      )}

      {hoverCard && (
        <div className="atlas-hover-card" style={{ transform: `translate(${hoverCard.x + 15}px, ${hoverCard.y + 15}px)` }}>
          <strong>{hoverCard.name}</strong><small>{hoverCard.detail}</small>
        </div>
      )}

      <button ref={sourceTriggerRef} type="button" className="atlas-data-button" onClick={() => setSourcePanelOpen(true)}>Data & boundaries</button>

      {sourcePanelOpen && (
        <div className="atlas-source-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSourcePanelOpen(false); }}>
          <section ref={sourceDialogRef} className="atlas-source-panel" role="dialog" aria-modal="true" aria-labelledby="atlas-source-title">
            <button type="button" aria-label="Close data notes" onClick={() => setSourcePanelOpen(false)}>×</button>
            <small>HOW THE CHART WAS MADE</small>
            <h2 id="atlas-source-title">Data, boundaries, and uncertainty</h2>
            <p>{sources?.borderNote ?? 'Boundaries are presented as a reference visualization, not a legal position.'}</p>
            <div>
              {sources?.sources.map((source) => (
                <article key={source.name}>
                  <h3><a href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a></h3>
                  <p>{source.use}</p>
                  <small>
                    {source.version && `${source.version} · `}
                    {source.licenseUrl
                      ? <a href={source.licenseUrl} target="_blank" rel="noreferrer">{source.license} ↗</a>
                      : source.license}
                  </small>
                </article>
              ))}
            </div>
            <p className="atlas-source-footnote">Mapped administrative units follow the source schema: in some places they are below the first level or omit newer divisions. Coverage is also incomplete for a small number of tiny or disputed places. Wikipedia introductions load only when their sections are opened and retain their own attribution.</p>
          </section>
        </div>
      )}

      {mapError && (
        <div className="atlas-error" role="status">
          <strong>The globe hit rough water.</strong><span>{mapError}</span><button type="button" onClick={() => window.location.reload()}>Reload atlas</button>
        </div>
      )}

      {(!mapReady || !coreDataReady) && !mapError && <div className="atlas-loading" role="status"><i /><span>Charting the world…</span></div>}
    </div>
  );
}
