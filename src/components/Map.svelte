<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import { gpxStore, poiStore, settingsStore, poiStoreHelpers } from '../stores';
  import { locationShareStore } from '../stores/locationShare';
  import { OverpassService } from '../services/OverpassService';
  import { POIManager } from '../services/POIManager';
  import type { Map as MaplibreMap } from 'maplibre-gl';
  import type { POI, GroupMember } from '../types';
  import '../styles/marker.css';

  const dispatch = createEventDispatcher<{
    poiSelected: POI;
  }>();

  let mapContainer: HTMLDivElement;
  let map: MaplibreMap;
  let userLocation: [number, number] | null = null;
  let allPOIs: any[] = []; // Store all fetched POIs
  let poiManager: POIManager;
  let groupMemberMarkers: Map<string, maplibregl.Marker> = new Map();

  const overpassService = new OverpassService();

  // Debounce utility function
  function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
    let timeoutId: ReturnType<typeof setTimeout>;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    }) as T;
  }

  onMount(async () => {
    // Initialize map
    map = new maplibregl.Map({
      container: mapContainer,
      style: 'https://api.maptiler.com/maps/outdoor-v2/style.json?key=r0T8W9TTH8XCCGoLL9gE',
      center: [0, 0],
      zoom: 2,
      attributionControl: false
    });

    // Wait for map to load before setting up layers
    map.on('load', () => {
      console.log('Map loaded, setting up initial data');
      
      // Initialize POI Manager with click handler
      poiManager = new POIManager(map, (poi: POI) => {
        dispatch('poiSelected', poi);
      });
      
      // Setup store subscriptions after map is loaded
      gpxStore.subscribe(handleGPXChange);
      poiStore.subscribe(updatePOIMarkers);
      settingsStore.subscribe(debouncedHandleSettingsChange);
      locationShareStore.subscribe(handleLocationShareChange);
      
      // Process any existing data
      const currentTracks = $gpxStore;
      const currentPOIs = $poiStore;
      
      if (currentTracks.length > 0) {
        handleGPXChange(currentTracks);
      }
      
      if (currentPOIs.length > 0) {
        updatePOIMarkers(currentPOIs);
      }
    });

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation = [position.coords.longitude, position.coords.latitude];
          map.setCenter(userLocation);
          map.setZoom(15);
          
          // Add user location marker
          new maplibregl.Marker({ color: '#00BFFF' })
            .setLngLat(userLocation)
            .addTo(map);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  });

  onDestroy(() => {
    if (map) {
      map.remove();
    }
  });

  function handleGPXChange(tracks: any[]) {
    console.log('GPX tracks changed:', tracks.length);
    updateGPXLayers(tracks);
    
    // Don't automatically fetch POIs - wait for manual trigger
    console.log('GPX tracks updated, POIs can be fetched manually');
  }

  function updateGPXLayers(tracks: any[]) {
    if (!map || !map.isStyleLoaded()) return;

    console.log('Updating GPX layers for', tracks.length, 'tracks');

    // Remove existing GPX layers (both outline and center)
    // We need to remove all existing GPX layers, not just current tracks
    const existingLayers = map.getStyle().layers || [];
    const gpxLayers = existingLayers.filter(layer => 
      layer.id.startsWith('gpx-outline-') || layer.id.startsWith('gpx-center-')
    );
    
    gpxLayers.forEach(layer => {
      map.removeLayer(layer.id);
    });
    
    // Remove all GPX sources
    const existingSources = Object.keys(map.getStyle().sources || {});
    const gpxSources = existingSources.filter(sourceId => 
      sourceId.startsWith('gpx-source-')
    );
    
    gpxSources.forEach(sourceId => {
      map.removeSource(sourceId);
    });

    // Add new GPX layers with dual-layer system
    tracks.forEach((track, index) => {
      if (!track.visible) return;

      const sourceId = `gpx-source-${index}`;
      const outlineLayerId = `gpx-outline-${index}`;
      const centerLayerId = `gpx-center-${index}`;
      
      // Add source for this track
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: track.coordinates
          }
        }
      });

      // Add outline layer (wider, semi-transparent)
      map.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': track.color,
          'line-width': 8,
          'line-opacity': 0.2
        }
      });

      // Add center line (narrower, full opacity)
      map.addLayer({
        id: centerLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': track.color,
          'line-width': 3,
          'line-opacity': 1.0
        }
      });
    });

    // Fit bounds to all visible tracks
    const visibleTracks = tracks.filter(t => t.visible);
    if (visibleTracks.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      visibleTracks.forEach(track => {
        track.coordinates.forEach((coord: [number, number]) => {
          bounds.extend(coord);
        });
      });
      map.fitBounds(bounds, { padding: 50 });
    }
  }

  async function fetchPOIsForTracks(tracks: any[]) {
    console.log('🔍 Fetching POIs for tracks...', tracks.length, 'tracks');
    
    // Clear previous markers immediately when starting new request
    if (poiManager) {
      poiManager.clearAll();
    }
    poiStoreHelpers.clear();
    
    try {
      // Combine all track coordinates
      const allCoordinates: [number, number][] = [];
      tracks.forEach(track => {
        console.log(`📍 Track "${track.name}" has ${track.coordinates.length} coordinates`);
        allCoordinates.push(...track.coordinates);
      });

      if (allCoordinates.length === 0) {
        console.log('❌ No coordinates found');
        return;
      }

      console.log('🌍 Fetching POIs for', allCoordinates.length, 'coordinates with track buffer:', $settingsStore.trackDistance, 'meters');

      const pois = await overpassService.fetchAllPOIsAlongRoute(
        allCoordinates,
        $settingsStore.trackDistance
      );
      
      console.log('✅ Fetched', pois.length, 'POIs');
      console.log('📊 POI breakdown:', pois.reduce((acc, poi) => {
        acc[poi.type] = (acc[poi.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));
      
      allPOIs = pois;
      poiStore.set(pois);
      
    } catch (error) {
      console.error('❌ Error fetching POIs:', error);
      // Show user-friendly error message
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    }
  }

  function updatePOIMarkers(pois: any[]) {
    if (!poiManager) {
      console.log('⏳ POI Manager not ready, retrying in 100ms...');
      setTimeout(() => updatePOIMarkers(pois), 100);
      return;
    }

    console.log('🗺️ Updating POI markers with', pois.length, 'POIs');

    // Clear existing markers
    poiManager.clearAll();

    if (pois.length === 0) {
      console.log('No POIs to display');
      return;
    }

    // Add all POI markers using the POI Manager
    poiManager.addPOIs(pois, $settingsStore.poiTypes);

    // Apply current visibility settings
    poiManager.updateVisibility($settingsStore.selectedTypes);
  }

  async function handleSettingsChange(settings: any) {
    console.log('Settings changed, updating marker visibility');
    
    // Update marker visibility using POI Manager
    if (poiManager && allPOIs.length > 0) {
      poiManager.updateVisibility(settings.selectedTypes);
      console.log('🔄 Updated POI marker visibility');
    }

    // Don't automatically refetch POIs - wait for manual trigger
    console.log('Settings updated, POIs can be refetched manually if needed');
  }

  // Create debounced version of handleSettingsChange with 1 second delay
  const debouncedHandleSettingsChange = debounce(handleSettingsChange, 1000);

  function handleLocationShareChange(locationShareState: any) {
    if (!map) return;
    
    console.log('🌐 Location sharing state changed:', locationShareState);
    updateGroupMemberMarkers(locationShareState.members);
  }

  function updateGroupMemberMarkers(members: GroupMember[]) {
    if (!map) return;

    console.log('👥 Updating group member markers:', members.length, 'members');

    // Remove existing group member markers
    groupMemberMarkers.forEach(marker => marker.remove());
    groupMemberMarkers.clear();

    // Add new markers for each group member
    members.forEach(member => {
      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'group-member-marker';
      markerElement.innerHTML = `
        <div class="member-emoji">${member.emoji}</div>
        <div class="member-name">${member.name}</div>
      `;

      // Create marker
      const marker = new maplibregl.Marker(markerElement)
        .setLngLat([member.lon, member.lat])
        .addTo(map);

      // Add popup with member info
      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`
          <div class="member-popup">
            <div class="member-popup-emoji">${member.emoji}</div>
            <div class="member-popup-name">${member.name}</div>
            <div class="member-popup-time">
              Last seen: ${Math.round((Date.now() - member.lastSeen) / 1000)}s ago
            </div>
          </div>
        `);

      marker.setPopup(popup);
      groupMemberMarkers.set(member.id, marker);
    });
  }

  // Manual POI fetching methods
  export function findPOIs() {
    const tracks = $gpxStore.filter(t => t.visible);
    if (tracks.length === 0) {
      alert('No visible GPX tracks found. Please load and enable a GPX track first.');
      return;
    }
    fetchPOIsForTracks(tracks);
  }

  export async function findPOIsNearMe() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const userCoords: [number, number] = [position.coords.longitude, position.coords.latitude];
      
      // Clear previous markers
      if (poiManager) {
        poiManager.clearAll();
      }
      poiStoreHelpers.clear();

      console.log('🔍 Fetching POIs near user location:', userCoords, 'with nearMe buffer:', $settingsStore.nearMeDistance, 'meters');

      const pois = await overpassService.fetchAllPOIsAlongRoute(
        [userCoords], // Single point
        $settingsStore.nearMeDistance
      );

      console.log('✅ Fetched', pois.length, 'POIs near user');
      
      allPOIs = pois;
      poiStore.set(pois);

    } catch (error) {
      console.error('❌ Error getting user location or fetching POIs:', error);
      alert('Could not get your location. Please check location permissions.');
    }
  }

  export function centerOnUser() {
    if (userLocation && map) {
      map.setCenter(userLocation);
      map.setZoom(15);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation = [position.coords.longitude, position.coords.latitude];
          map.setCenter(userLocation);
          map.setZoom(15);
        }
      );
    }
  }
</script>

<div bind:this={mapContainer} class="map-container"></div>

<style>
  .map-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  :global(.maplibregl-popup-content) {
    background-color: white !important;
    color: black !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
  }

  :global(.group-member-marker) {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transform: translate(-50%, -100%);
  }

  :global(.member-emoji) {
    font-size: 24px;
    background: white;
    border: 3px solid #007bff;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }

  :global(.member-name) {
    background: rgba(0, 123, 255, 0.9);
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    margin-top: 4px;
    white-space: nowrap;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }

  :global(.member-popup) {
    text-align: center;
    padding: 8px;
  }

  :global(.member-popup-emoji) {
    font-size: 32px;
    margin-bottom: 8px;
  }

  :global(.member-popup-name) {
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 4px;
  }

  :global(.member-popup-time) {
    font-size: 12px;
    color: #666;
  }
</style>
