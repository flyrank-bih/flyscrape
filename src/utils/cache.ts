export class SimpleCache<K, V> {
  private cache = new Map<K, V>();
  private readonly max: number;

  constructor(max: number) {
    this.max = max;
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item !== undefined) {
      // Refresh item (LRU behavior)
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.max && !this.cache.has(key)) {
      // Evict oldest
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    // Set new value (moves to end)
    this.cache.delete(key);
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}
