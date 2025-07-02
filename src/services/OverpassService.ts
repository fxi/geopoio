import type { POI } from '../types';
import { CacheService } from './CacheService';

export class OverpassService {
  private readonly baseUrl = 'https://overpass-api.de/api/interpreter';
  private readonly allPOITypes = ['drinking_water', 'restaurant', 'fuel', 'supermarket', 'hospital'];
  private currentController: AbortController | null = null;

  async fetchAllPOIsAlongRoute(
    coordinates: [number, number][],
    bufferDistance: number
  ): Promise<POI[]> {
    try {
      // Cancel any existing request
      if (this.currentController) {
        console.log('🚫 Cancelling previous request');
        this.currentController.abort();
      }

      // Create new controller for this request
      this.currentController = new AbortController();

      if (coordinates.length === 0) {
        console.log('🚫 No coordinates provided for POI fetch');
        return [];
      }

      console.log(`🔍 Starting POI fetch for ${coordinates.length} coordinates with ${bufferDistance}m buffer`);

      // Generate cache key based on route coordinates and buffer distance
      const cacheKey = CacheService.generateCacheKey(
        'overpass-pois',
        coordinates,
        bufferDistance
      );

      // Try to get from cache first
      const cachedPOIs = CacheService.get<POI[]>(cacheKey);
      if (cachedPOIs) {
        console.log('💾 Using cached POI data:', cachedPOIs.length, 'POIs');
        return cachedPOIs;
      }

      console.log('🌐 Fetching fresh POI data from Overpass API');

      // Create a bounding box for the route/point
      const lats = coordinates.map(coord => coord[1]);
      const lons = coordinates.map(coord => coord[0]);
      
      // For single point searches (near me), use a larger buffer to ensure we find POIs
      const bufferDegrees = coordinates.length === 1 
        ? Math.max(0.05, bufferDistance / 111000) // Convert buffer distance to degrees, minimum 0.05
        : 0.01; // For routes, use smaller buffer since we have multiple points
      
      const bbox = {
        south: Math.min(...lats) - bufferDegrees,
        west: Math.min(...lons) - bufferDegrees,
        north: Math.max(...lats) + bufferDegrees,
        east: Math.max(...lons) + bufferDegrees
      };

      console.log('📍 Bounding box:', bbox);

      const query = this.buildOverpassQuery(this.allPOITypes, bbox);
      console.log('📝 Overpass query length:', query.length, 'characters');
      
      const startTime = Date.now();
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'text/plain'
        },
        signal: this.currentController.signal
      });

      const fetchTime = Date.now() - startTime;
      console.log(`⏱️ Overpass API response time: ${fetchTime}ms`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Overpass API error response:', errorText);
        throw new Error(`Overpass API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 Raw Overpass response:', data.elements?.length || 0, 'elements');
      
      const pois = this.parseOverpassResponse(data, this.allPOITypes);
      console.log('🏷️ Parsed POIs:', pois.length);
      
      // Filter POIs by distance from route
      const filteredPOIs = this.filterPOIsByDistance(pois, coordinates, bufferDistance);
      console.log('🎯 Filtered POIs within buffer:', filteredPOIs.length);
      
      // Cache the results for 24 hours
      CacheService.set(cacheKey, filteredPOIs);
      console.log('💾 Cached POI results');
      
      return filteredPOIs;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🚫 Request was cancelled');
        return [];
      }
      console.error('❌ Error fetching POIs:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Network error - check internet connection or CORS policy');
      }
      return [];
    } finally {
      this.currentController = null;
    }
  }

  private buildOverpassQuery(types: string[], bbox: any): string {
    const typeQueries = types.map(type => {
      switch (type) {
        case 'drinking_water':
          return `
            node["amenity"="drinking_water"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
            node["man_made"="water_tap"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
          `;
        case 'restaurant':
          return `
            node["amenity"="restaurant"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
            node["amenity"="cafe"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
            node["amenity"="fast_food"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
          `;
        case 'fuel':
          return `
            node["amenity"="fuel"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
          `;
        case 'supermarket':
          return `
            node["shop"="supermarket"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
            node["shop"="convenience"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
            node["shop"="general"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
          `;
        case 'hospital':
          return `
            node["amenity"="hospital"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
            node["amenity"="clinic"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
          `;
        default:
          return '';
      }
    }).join('');

    return `
      [out:json][timeout:25];
      (
        ${typeQueries}
      );
      out geom;
    `;
  }

  private parseOverpassResponse(data: any, types: string[]): POI[] {
    const pois: POI[] = [];

    if (!data.elements) return pois;

    data.elements.forEach((element: any) => {
      if (!element.lat || !element.lon) return;

      let poiType = 'unknown';
      
      // Determine POI type based on tags
      if (element.tags) {
        if (element.tags.amenity === 'drinking_water' || element.tags.man_made === 'water_tap') {
          poiType = 'drinking_water';
        } else if (['restaurant', 'cafe', 'fast_food'].includes(element.tags.amenity)) {
          poiType = 'restaurant';
        } else if (element.tags.amenity === 'fuel') {
          poiType = 'fuel';
        } else if (['supermarket', 'convenience', 'general'].includes(element.tags.shop)) {
          poiType = 'supermarket';
        } else if (['hospital', 'clinic'].includes(element.tags.amenity)) {
          poiType = 'hospital';
        }
      }

      if (types.includes(poiType)) {
        pois.push({
          id: `poi-${element.id}`,
          lat: element.lat,
          lon: element.lon,
          type: poiType,
          name: element.tags?.name,
          amenity: element.tags?.amenity || element.tags?.shop,
          tags: element.tags
        });
      }
    });

    return pois;
  }

  private filterPOIsByDistance(
    pois: POI[],
    routeCoordinates: [number, number][],
    maxDistance: number
  ): POI[] {
    return pois.filter(poi => {
      let minDistance: number;
      
      if (routeCoordinates.length === 1) {
        // Single point - calculate direct distance (for "near me" searches)
        minDistance = this.getDistanceBetweenPoints(
          [poi.lon, poi.lat],
          routeCoordinates[0]
        );
        console.log(`📏 Distance from POI ${poi.name || poi.type} to user: ${Math.round(minDistance)}m`);
      } else {
        // Multiple points - calculate distance to route (for track searches)
        minDistance = this.getMinDistanceToRoute(
          [poi.lon, poi.lat],
          routeCoordinates
        );
      }
      
      const withinDistance = minDistance <= maxDistance;
      if (!withinDistance && routeCoordinates.length === 1) {
        console.log(`❌ POI ${poi.name || poi.type} too far: ${Math.round(minDistance)}m > ${maxDistance}m`);
      }
      
      return withinDistance;
    });
  }

  private getMinDistanceToRoute(
    point: [number, number],
    route: [number, number][]
  ): number {
    let minDistance = Infinity;

    for (let i = 0; i < route.length - 1; i++) {
      const distance = this.getDistanceToLineSegment(
        point,
        route[i],
        route[i + 1]
      );
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }

  private getDistanceBetweenPoints(
    point1: [number, number],
    point2: [number, number]
  ): number {
    const dx = point1[0] - point2[0];
    const dy = point1[1] - point2[1];
    // Convert to meters (approximate using simple Euclidean distance)
    return Math.sqrt(dx * dx + dy * dy) * 111000;
  }

  private getDistanceToLineSegment(
    point: [number, number],
    lineStart: [number, number],
    lineEnd: [number, number]
  ): number {
    const A = point[0] - lineStart[0];
    const B = point[1] - lineStart[1];
    const C = lineEnd[0] - lineStart[0];
    const D = lineEnd[1] - lineStart[1];

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = lineStart[0];
      yy = lineStart[1];
    } else if (param > 1) {
      xx = lineEnd[0];
      yy = lineEnd[1];
    } else {
      xx = lineStart[0] + param * C;
      yy = lineStart[1] + param * D;
    }

    const dx = point[0] - xx;
    const dy = point[1] - yy;
    
    // Convert to meters (approximate)
    return Math.sqrt(dx * dx + dy * dy) * 111000;
  }
}
