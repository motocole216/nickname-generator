import NodeCache from 'node-cache';

interface CacheConfig {
  stdTTL: number; // Time to live in seconds
  checkperiod: number; // Time in seconds to check for expired keys
}

class CacheService {
  private cache: NodeCache;
  private static instance: CacheService;

  private constructor(config: CacheConfig = { stdTTL: 3600, checkperiod: 120 }) {
    this.cache = new NodeCache(config);
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public set<T>(key: string, value: T): boolean {
    return this.cache.set(key, value);
  }

  public get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public delete(key: string): number {
    return this.cache.del(key);
  }

  public clear(): void {
    this.cache.flushAll();
  }

  public getStats() {
    return this.cache.getStats();
  }
}

export const cacheService = CacheService.getInstance();
export default CacheService; 