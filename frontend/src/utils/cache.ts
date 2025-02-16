interface CacheItem {
  value: any;
  timestamp: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
}

class Cache {
  private storage: Map<string, CacheItem>;
  private config: CacheConfig;

  constructor(config: CacheConfig = { ttl: 1000 * 60 * 60 }) { // Default 1 hour TTL
    this.storage = new Map();
    this.config = config;
  }

  set(key: string, value: any): void {
    this.storage.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const item = this.storage.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.config.ttl) {
      this.storage.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

// Create a singleton instance for the nickname cache
export const nicknameCache = new Cache({ ttl: 1000 * 60 * 60 * 24 }); // 24 hour TTL

export default Cache; 