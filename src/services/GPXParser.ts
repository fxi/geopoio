import type { GPXTrack } from '../types';

export class GPXParser {
  private generateTrackColor(): string {
    const colors = [
      '#FF6B35', '#F7931E', '#FFD700', '#32CD32', 
      '#00BFFF', '#9370DB', '#FF69B4', '#20B2AA'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  async parseGPX(gpxContent: string, filename: string): Promise<GPXTrack | null> {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(gpxContent, 'text/xml');

      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid GPX format');
      }

      const coordinates: [number, number][] = [];
      let trackName = filename.replace('.gpx', '');

      // Try to get track name from GPX
      const nameElement = xmlDoc.querySelector('trk > name');
      if (nameElement?.textContent) {
        trackName = nameElement.textContent;
      }

      // Parse track points
      const trkpts = xmlDoc.querySelectorAll('trkpt');
      
      if (trkpts.length === 0) {
        // Try waypoints if no track points
        const wpts = xmlDoc.querySelectorAll('wpt');
        wpts.forEach(wpt => {
          const lat = parseFloat(wpt.getAttribute('lat') || '0');
          const lon = parseFloat(wpt.getAttribute('lon') || '0');
          if (lat && lon) {
            coordinates.push([lon, lat]);
          }
        });
      } else {
        trkpts.forEach(trkpt => {
          const lat = parseFloat(trkpt.getAttribute('lat') || '0');
          const lon = parseFloat(trkpt.getAttribute('lon') || '0');
          if (lat && lon) {
            coordinates.push([lon, lat]);
          }
        });
      }

      if (coordinates.length === 0) {
        throw new Error('No valid coordinates found in GPX file');
      }

      // Calculate bounds
      const lats = coordinates.map(coord => coord[1]);
      const lons = coordinates.map(coord => coord[0]);
      const bounds = {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lons),
        west: Math.min(...lons)
      };

      return {
        id: `gpx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: trackName,
        color: this.generateTrackColor(),
        visible: true,
        coordinates,
        bounds
      };

    } catch (error) {
      console.error('Error parsing GPX:', error);
      throw error;
    }
  }
}