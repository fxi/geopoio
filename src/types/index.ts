export interface GPXTrack {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  coordinates: [number, number][];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface POI {
  id: string;
  lat: number;
  lon: number;
  type: string;
  name?: string;
  amenity?: string;
  tags?: Record<string, string>;
}

export interface POIType {
  name: string;
  color: string;
  icon: string;
}

export interface Settings {
  selectedTypes: Record<string, boolean>;
  trackDistance: number;      // Distance for POIs along tracks (0-400m)
  nearMeDistance: number;     // Distance for POIs near user location (0-10000m)
  poiTypes: Record<string, POIType>;
  // Keep bufferDistance for backward compatibility during migration
  bufferDistance?: number;
}
