import maplibregl from 'maplibre-gl';
import type { POI, POIType } from '../types';

export class POIManager {
  private map: maplibregl.Map;
  private markers: Map<string, maplibregl.Marker> = new Map();
  private onPOIClick: (poi: POI) => void;

  constructor(map: maplibregl.Map, onPOIClick?: (poi: POI) => void) {
    this.map = map;
    this.onPOIClick = onPOIClick || (() => {});
  }

  /**
   * Add multiple POI markers
   */
  addPOIs(pois: POI[], poiTypes: Record<string, POIType>): void {
    console.log(`📍 Adding ${pois.length} POI markers`);
    
    // Clear existing markers first
    this.clearAll();
    
    pois.forEach(poi => {
      const poiConfig = poiTypes[poi.type];
      if (!poiConfig) {
        console.warn(`⚠️ No config found for POI type: ${poi.type}`);
        return;
      }

      // Create custom marker element
      const el = document.createElement('div');
      el.className = `poi-marker poi-marker--${poi.type}`;
      el.setAttribute('data-poi-type', poi.type);
      
      const iconEl = document.createElement('div');
      iconEl.className = 'poi-marker__icon';
      iconEl.textContent = poiConfig.icon;
      el.appendChild(iconEl);

      // Add click handler to trigger panel
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onPOIClick(poi);
      });

      // Create and add marker with custom element
      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat([poi.lon, poi.lat])
        .addTo(this.map);

      this.markers.set(poi.id, marker);
    });
    
    console.log(`✅ Added ${this.markers.size} POI markers`);
  }

  /**
   * Update visibility of POI markers by type
   */
  updateVisibility(selectedTypes: Record<string, boolean>): void {
    console.log('🔄 Updating POI marker visibility');
    
    this.markers.forEach(marker => {
      const element = marker.getElement();
      const poiType = element.getAttribute('data-poi-type');
      if (poiType) {
        const isVisible = selectedTypes[poiType];
        element.style.display = isVisible ? 'flex' : 'none';
      }
    });
  }

  /**
   * Clear all POI markers
   */
  clearAll(): void {
    console.log(`🧹 Clearing ${this.markers.size} POI markers`);
    
    this.markers.forEach(marker => marker.remove());
    this.markers.clear();
  }
}
