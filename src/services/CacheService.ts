export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class CacheService {
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  static set<T>(key: string, data: T, customDuration?: number): void {
    const duration = customDuration || this.CACHE_DURATION;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(entry));
      console.log('💾 CacheService.set:', key, 'data size:', JSON.stringify(entry).length, 'bytes');
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  static get<T>(key: string): T | null {
    try {
      console.log('🔍 CacheService.get:', key);
      const item = localStorage.getItem(key);
      if (!item) {
        console.log('❌ CacheService.get: No item found for key:', key);
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Check if cache has expired
      if (Date.now() > entry.expiresAt) {
        console.log('⏰ CacheService.get: Cache expired for key:', key);
        this.remove(key);
        return null;
      }

      console.log('✅ CacheService.get: Found valid cache for key:', key);
      return entry.data;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      this.remove(key);
      return null;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  static clear(): void {
    try {
      // Only clear GeoPOIO-related cache entries
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('geopoio-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  static generateCacheKey(prefix: string, ...params: any[]): string {
    const paramString = params.map(p => 
      typeof p === 'object' ? JSON.stringify(p) : String(p)
    ).join('-');
    return `geopoio-${prefix}-${this.hashString(paramString)}`;
  }

  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
