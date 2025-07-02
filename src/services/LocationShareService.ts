import type { GroupMember } from '../types';

export class LocationShareService {
  private static baseUrl = '/api/groups';
  
  static async joinGroup(groupId?: string, name?: string, emoji?: string) {
    const response = await fetch(`${this.baseUrl}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ groupId, name, emoji }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join group');
    }
    
    return response.json();
  }
  
  static async getMembers(groupId: string) {
    const response = await fetch(`${this.baseUrl}/${groupId}/members`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get members');
    }
    
    return response.json();
  }
  
  static async updateLocation(groupId: string, userId: string, name: string, emoji: string, lat: number, lon: number) {
    const response = await fetch(`${this.baseUrl}/${groupId}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, name, emoji, lat, lon }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update location');
    }
    
    return response.json();
  }
  
  static async leaveGroup(groupId: string, userId: string) {
    const response = await fetch(`${this.baseUrl}/${groupId}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to leave group');
    }
    
    return response.json();
  }
}

export class LocationTracker {
  private watchId: number | null = null;
  private onLocationUpdate: ((lat: number, lon: number) => void) | null = null;
  
  start(callback: (lat: number, lon: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }
      
      this.onLocationUpdate = callback;
      
      // Get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          callback(position.coords.latitude, position.coords.longitude);
          resolve();
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
      
      // Start watching position
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          callback(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Location tracking error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }
  
  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.onLocationUpdate = null;
  }
}
