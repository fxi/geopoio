<script lang="ts">
  import type { POI } from '../types';

  export let show = false;
  export let poi: POI | null = null;

  function closeDrawer() {
    show = false;
    poi = null;
  }

  function getGoogleMapsUrl(poi: POI): string {
    return `https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lon}`;
  }

  function getGoogleDirectionsUrl(poi: POI): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lon}`;
  }

  function getGoogleStreetViewUrl(poi: POI): string {
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${poi.lat},${poi.lon}`;
  }

  function formatOpeningHours(hours: string): string {
    if (!hours) return '';
    // Simple formatting - can be enhanced later
    return hours.replace(/;/g, '\n').replace(/:/g, ': ');
  }

  function getInterestingTags(poi: POI): Array<{key: string, value: string}> {
    if (!poi.tags) return [];
    
    const interestingKeys = [
      'cuisine', 'diet', 'wheelchair', 'internet_access', 
      'phone', 'website', 'email', 'addr:street', 'addr:city',
      'brand', 'operator', 'fuel:diesel', 'fuel:octane_95'
    ];
    
    return Object.entries(poi.tags)
      .filter(([key, value]) => interestingKeys.includes(key) && value)
      .map(([key, value]) => ({
        key: key.replace('addr:', '').replace('_', ' '),
        value
      }));
  }

  $: interestingTags = poi ? getInterestingTags(poi) : [];
</script>

{#if show && poi}
  <div class="drawer-overlay" on:click={closeDrawer}></div>
  <div class="drawer">
    <div class="drawer-header">
      <h2>{poi.name || poi.amenity || poi.type}</h2>
      <button class="close-button" on:click={closeDrawer}>✕</button>
    </div>

    <div class="drawer-content">
      <!-- POI Basic Info -->
      <section class="settings-section">
        <h3>Information</h3>
        <div class="poi-info">
          <div class="poi-type-display">
            <span class="poi-icon">{poi.type === 'drinking_water' ? '💧' : poi.type === 'restaurant' ? '🍽️' : poi.type === 'fuel' ? '⛽' : poi.type === 'supermarket' ? '🛒' : poi.type === 'hospital' ? '🏥' : '📍'}</span>
            <span class="poi-name">{poi.amenity || poi.type}</span>
          </div>
          <div class="poi-coordinates">
            <small>{poi.lat.toFixed(6)}, {poi.lon.toFixed(6)}</small>
          </div>
        </div>
      </section>

      <!-- Opening Hours -->
      {#if poi.tags?.opening_hours}
        <section class="settings-section">
          <h3>Opening Hours</h3>
          <div class="opening-hours">
            <pre>{formatOpeningHours(poi.tags.opening_hours)}</pre>
          </div>
        </section>
      {/if}

      <!-- Interesting Tags -->
      {#if interestingTags.length > 0}
        <section class="settings-section">
          <h3>Details</h3>
          <div class="poi-tags">
            {#each interestingTags as tag}
              <div class="tag-item">
                <span class="tag-key">{tag.key}:</span>
                <span class="tag-value">{tag.value}</span>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- Google Integration -->
      <section class="settings-section">
        <h3>External Links</h3>
        <div class="google-links">
          <a href={getGoogleMapsUrl(poi)} target="_blank" class="cache-button">
            🗺️ View on Google Maps
          </a>
          <a href={getGoogleDirectionsUrl(poi)} target="_blank" class="cache-button">
            🧭 Get Directions
          </a>
          <a href={getGoogleStreetViewUrl(poi)} target="_blank" class="cache-button">
            👁️ Street View
          </a>
        </div>
      </section>
    </div>
  </div>
{/if}

<style>
  /* Reuse SettingsDrawer styles */
  .drawer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 1500;
    pointer-events: none; /* Allow map interaction */
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
    z-index: 1501;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease-out;
    pointer-events: auto; /* Panel itself is interactive */
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

  /* POI-specific styles */
  .poi-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .poi-type-display {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  .poi-icon {
    font-size: 20px;
    width: 24px;
    text-align: center;
  }

  .poi-name {
    color: white;
    font-size: 14px;
    text-transform: capitalize;
  }

  .poi-coordinates {
    color: #666;
    text-align: center;
  }

  .opening-hours pre {
    color: white;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.4;
    margin: 0;
    white-space: pre-wrap;
  }

  .poi-tags {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tag-item {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  .tag-key {
    color: #00BFFF;
    font-weight: 600;
    text-transform: capitalize;
  }

  .tag-value {
    color: white;
    text-align: right;
  }

  .google-links {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cache-button {
    display: block;
    width: 100%;
    padding: 12px;
    background: #666;
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    text-decoration: none;
    text-align: center;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .cache-button:hover {
    background: #777;
  }
</style>
