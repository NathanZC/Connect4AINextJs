// LRUCache.js
class LRUCache {
    constructor(limit) {
      this.limit = limit;
      this.cache = new Map();
    }
  
    get(key) {
      if (!this.cache.has(key)) {
        return null;
      }
      const value = this.cache.get(key);
      // Move the key to the end to show that it was recently used
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
  
    set(key, value) {
      if (this.cache.size >= this.limit) {
        // Remove the first (least recently used) key-value pair
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      this.cache.set(key, value);
    }
  }
  
  export default LRUCache;