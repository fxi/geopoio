<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { settingsStore, gpxStore, cacheHelpers } from '../stores';
  import { gpxStoreHelpers } from '../stores';

  const dispatch = createEventDispatcher();
  export let show = false;

  function closeDrawer() {
    show = false;
  }

  function handleTrackDistanceChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = parseInt(target.value);
    settingsStore.update(s => ({ ...s, trackDistance: value }));
  }

  function handleNearMeDistanceChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = parseInt(target.value);
    settingsStore.update(s => ({ ...s, nearMeDistance: value }));
  }

  function updateTrackPOIs() {
    dispatch('findPOIs');
  }

  function updateNearMePOIs() {
    dispatch('findPOIsNearMe');
  }

  function togglePOIType(type: string) {
    settingsStore.update(s => ({
      ...s,
      selectedTypes: {
        ...s.selectedTypes,
        [type]: !s.selectedTypes[type]
      }
    }));
  }

  function toggleGPXTrack(id: string) {
    gpxStoreHelpers.toggleVisibility(id);
  }

  function deleteGPXTrack(id: string) {
    if (confirm('Delete this GPX track?')) {
      gpxStoreHelpers.removeTrack(id);
    }
  }

  function clearCache() {
    if (confirm('Clear all cached data? This will reload the page.')) {
      cacheHelpers.clearAllCache();
      location.reload();
    }
  }

  function clearPOICache() {
    if (confirm('Clear POI cache? This will refetch location data.')) {
      cacheHelpers.clearPOICache();
      // Trigger a refresh of POI data
      settingsStore.update(s => ({ ...s }));
    }
  }
</script>

{#if show}
  <div class="drawer-overlay" on:click={closeDrawer}></div>
  <div class="drawer">
    <div class="drawer-header">
      <h2>Settings</h2>
      <button class="close-button" on:click={closeDrawer}>✕</button>
    </div>

    <div class="drawer-content">
      <!-- POI Types -->
      <section class="settings-section">
        <h3>Location Types</h3>
        <div class="poi-types">
          {#each Object.entries($settingsStore.poiTypes) as [type, config]}
            <label class="poi-type-item">
              <input 
                type="checkbox" 
                checked={$settingsStore.selectedTypes[type]}
                on:change={() => togglePOIType(type)}
              />
              <span class="poi-icon" style="color: {config.color}">{config.icon}</span>
              <span class="poi-name">{config.name}</span>
            </label>
          {/each}
        </div>
      </section>

      <!-- POI Search Settings -->
      <section class="settings-section">
        <h3>POI Search Settings</h3>
        
        <!-- Track Distance -->
        <div class="distance-control">
          <div class="distance-header">
            <span class="distance-icon">🛤️</span>
            <span class="distance-label">Distance Along Tracks</span>
          </div>
          <div class="distance-input-row">
            <select 
              class="distance-select"
              value={$settingsStore.trackDistance}
              on:change={handleTrackDistanceChange}
            >
              <option value={10}>10m</option>
              <option value={50}>50m</option>
              <option value={100}>100m</option>
              <option value={200}>200m</option>
              <option value={400}>400m</option>
            </select>
            <button class="update-button" on:click={updateTrackPOIs}>
              Update Track POIs
            </button>
          </div>
        </div>

        <!-- Near Me Distance -->
        <div class="distance-control">
          <div class="distance-header">
            <span class="distance-icon">📍</span>
            <span class="distance-label">Distance Near Me</span>
          </div>
          <div class="distance-input-row">
            <select 
              class="distance-select"
              value={$settingsStore.nearMeDistance}
              on:change={handleNearMeDistanceChange}
            >
              <option value={1000}>1km</option>
              <option value={2000}>2km</option>
              <option value={5000}>5km</option>
              <option value={10000}>10km</option>
            </select>
            <button class="update-button" on:click={updateNearMePOIs}>
              Find POIs Near Me
            </button>
          </div>
        </div>
      </section>

      <!-- GPX Tracks -->
      <section class="settings-section">
        <h3>GPX Tracks</h3>
        <div class="gpx-tracks">
          {#each $gpxStore as track}
            <div class="gpx-track-item">
              <label class="track-toggle">
                <input 
                  type="checkbox" 
                  checked={track.visible}
                  on:change={() => toggleGPXTrack(track.id)}
                />
                <span class="track-color" style="background-color: {track.color}"></span>
                <span class="track-name">{track.name}</span>
              </label>
              <button 
                class="delete-track"
                on:click={() => deleteGPXTrack(track.id)}
              >🗑️</button>
            </div>
          {/each}
          {#if $gpxStore.length === 0}
            <p class="no-tracks">No GPX tracks loaded</p>
          {/if}
        </div>
      </section>

      <!-- POI Management -->
      <section class="settings-section">
        <h3>POI Management</h3>
        <div class="poi-controls">
          <button class="cache-button" on:click={() => dispatch('findPOIs')}>
            🔍 Find POIs
          </button>
          <button class="cache-button" on:click={() => dispatch('findPOIsNearMe')}>
            📍 Find POIs Near Me
          </button>
        </div>
      </section>

      <!-- Cache Management -->
      <section class="settings-section">
        <h3>Cache Management</h3>
        <div class="cache-controls">
          <button class="cache-button" on:click={clearPOICache}>
            Clear POI Cache
          </button>
          <button class="clear-cache-button" on:click={clearCache}>
            Clear All Cache
          </button>
        </div>
      </section>
    </div>
  </div>
{/if}

<style>
  .drawer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 2000;
  }

  .drawer {
    position: fixed;
    right: 0;
    top: 0;
    width: 90%;
    max-width: 400px;
    height: 100%;
    background: #1a1a1a;
    border-left: 1px solid #333;
    z-index: 2001;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  .drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #333;
  }

  .drawer-header h2 {
    color: white;
    margin: 0;
    font-size: 20px;
  }

  .close-button {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
  }

  .drawer-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .settings-section {
    margin-bottom: 32px;
  }

  .settings-section h3 {
    color: white;
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
  }

  .poi-types {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .poi-type-item {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: background-color 0.2s;
  }

  .poi-type-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .poi-icon {
    font-size: 20px;
    width: 24px;
    text-align: center;
  }

  .poi-name {
    color: white;
    font-size: 14px;
  }

  .buffer-control {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .buffer-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #333;
    outline: none;
    appearance: none;
  }

  .buffer-slider::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #00BFFF;
    cursor: pointer;
  }

  .buffer-value {
    color: #00BFFF;
    font-weight: 600;
    text-align: center;
  }

  .gpx-tracks {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .gpx-track-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  .track-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    flex: 1;
  }

  .track-color {
    width: 16px;
    height: 16px;
    border-radius: 2px;
  }

  .track-name {
    color: white;
    font-size: 14px;
  }

  .delete-track {
    background: none;
    border: none;
    color: #ff4444;
    cursor: pointer;
    padding: 4px;
    font-size: 16px;
  }

  .no-tracks {
    color: #666;
    font-style: italic;
    text-align: center;
    padding: 20px;
  }

  .cache-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cache-button {
    width: 100%;
    padding: 12px;
    background: #666;
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .cache-button:hover {
    background: #777;
  }

  .clear-cache-button {
    width: 100%;
    padding: 12px;
    background: #ff4444;
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .clear-cache-button:hover {
    background: #ff6666;
  }

  /* Distance Control Styles */
  .distance-control {
    margin-bottom: 20px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .distance-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .distance-icon {
    font-size: 18px;
  }

  .distance-label {
    color: white;
    font-size: 14px;
    font-weight: 500;
  }

  .distance-input-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .distance-select {
    flex: 1;
    padding: 8px 12px;
    background: #333;
    border: 1px solid #555;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s;
  }

  .distance-select:hover {
    border-color: #00BFFF;
  }

  .distance-select:focus {
    border-color: #00BFFF;
    box-shadow: 0 0 0 2px rgba(0, 191, 255, 0.2);
  }

  .distance-select option {
    background: #333;
    color: white;
  }

  .update-button {
    padding: 8px 16px;
    background: #00BFFF;
    border: none;
    border-radius: 6px;
    color: white;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    white-space: nowrap;
  }

  .update-button:hover {
    background: #0099CC;
  }

  .update-button:active {
    background: #007799;
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #00BFFF;
  }
</style>
