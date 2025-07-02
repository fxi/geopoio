import { writable } from 'svelte/store';
import type { GPXTrack, POI, Settings } from '../types';
import { CacheService } from '../services/CacheService';

export const gpxStore = writable<GPXTrack[]>([]);
export const poiStore = writable<POI[]>([]);
export const settingsStore = writable<Settings>({
  selectedTypes: {
    drinking_water: true,
    restaurant: true,
    fuel: true,
    supermarket: true,
    hospital: true
  },
  trackDistance: 100,      // Default 100m for track POIs
  nearMeDistance: 2000,    // Default 2km for near me POIs
  poiTypes: {
    drinking_water: { name: 'Drinking Water', color: '#00BFFF', icon: '💧' },
    restaurant: { name: 'Restaurant', color: '#FF6B35', icon: '🍽️' },
    fuel: { name: 'Gas Station', color: '#FFD700', icon: '⛽' },
    supermarket: { name: 'Supermarket', color: '#32CD32', icon: '🛒' },
    hospital: { name: 'Hospital', color: '#FF4444', icon: '🏥' }
  }
});

// Load from cache on initialization FIRST
if (typeof window !== 'undefined') {
  // Load GPX tracks from cache
  const gpxCacheKey = CacheService.generateCacheKey('gpx', 'tracks');
  console.log('🔍 Looking for cached GPX with key:', gpxCacheKey);
  const savedGPX = CacheService.get<GPXTrack[]>(gpxCacheKey);
  if (savedGPX) {
    console.log('📦 Loading cached GPX tracks:', savedGPX.length, 'tracks');
    gpxStore.set(savedGPX);
  } else {
    console.log('❌ No cached GPX tracks found');
  }

  // Don't load POI data on startup - wait for manual request
  // Clear any existing POI data
  poiStore.set([]);

  // Load settings from cache with migration support
  const settingsCacheKey = CacheService.generateCacheKey('app', 'settings');
  const savedSettings = CacheService.get<any>(settingsCacheKey);
  if (savedSettings) {
    // Migration: Handle old bufferDistance setting
    const migratedSettings: Settings = {
      selectedTypes: savedSettings.selectedTypes || {
        drinking_water: true,
        restaurant: true,
        fuel: true,
        supermarket: true,
        hospital: true
      },
      trackDistance: savedSettings.trackDistance || (savedSettings.bufferDistance ? Math.min(400, savedSettings.bufferDistance) : 100),
      nearMeDistance: savedSettings.nearMeDistance || (savedSettings.bufferDistance ? Math.max(1000, savedSettings.bufferDistance) : 2000),
      poiTypes: savedSettings.poiTypes || {
        drinking_water: { name: 'Drinking Water', color: '#00BFFF', icon: '💧' },
        restaurant: { name: 'Restaurant', color: '#FF6B35', icon: '🍽️' },
        fuel: { name: 'Gas Station', color: '#FFD700', icon: '⛽' },
        supermarket: { name: 'Supermarket', color: '#32CD32', icon: '🛒' },
        hospital: { name: 'Hospital', color: '#FF4444', icon: '🏥' }
      }
    };
    
    console.log('📦 Loading settings with migration:', migratedSettings);
    settingsStore.set(migratedSettings);
  }
}

// Enhanced store methods with caching - set up AFTER initial loading
gpxStore.subscribe((tracks) => {
  console.log('💾 Caching GPX tracks:', tracks.length, 'tracks');
  CacheService.set(CacheService.generateCacheKey('gpx', 'tracks'), tracks);
});

poiStore.subscribe((pois) => {
  CacheService.set(CacheService.generateCacheKey('poi', 'data'), pois);
});

settingsStore.subscribe((settings) => {
  CacheService.set(CacheService.generateCacheKey('app', 'settings'), settings);
});

// Store helper methods
export const gpxStoreHelpers = {
  addTrack: (track: GPXTrack) => {
    gpxStore.update(tracks => [...tracks, track]);
  },
  removeTrack: (id: string) => {
    gpxStore.update(tracks => tracks.filter(t => t.id !== id));
  },
  toggleVisibility: (id: string) => {
    gpxStore.update(tracks => 
      tracks.map(t => t.id === id ? { ...t, visible: !t.visible } : t)
    );
  },
  clearAll: () => {
    gpxStore.set([]);
    // Also clear related POI cache when GPX tracks are cleared
    poiStore.set([]);
  }
};

export const poiStoreHelpers = {
  addPOIs: (pois: POI[]) => {
    poiStore.update(current => [...current, ...pois]);
  },
  clear: () => {
    poiStore.set([]);
  },
  filterByTypes: (selectedTypes: Record<string, boolean>) => {
    // This will be handled by MapLibre GL filters now
    // Keep this method for potential future use
  }
};

export const cacheHelpers = {
  clearAllCache: () => {
    CacheService.clear();
  },
  clearPOICache: () => {
    // Clear all POI-related cache entries
    const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('geopoio-') && key.includes('overpass-pois')) {
          CacheService.remove(key);
        }
      });
  }
};
