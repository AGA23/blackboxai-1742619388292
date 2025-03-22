const NodeCache = require('node-cache');
const { LoggerService } = require('./logger.service');

class CacheService {
  static cache = new NodeCache({
    stdTTL: 600, // 10 minutes default TTL
    checkperiod: 120, // Check for expired keys every 2 minutes
    useClones: false // Store/retrieve references to objects instead of copies
  });

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  static get(key) {
    try {
      const value = this.cache.get(key);
      if (value === undefined) {
        LoggerService.debug(`Cache miss: ${key}`);
        return null;
      }
      LoggerService.debug(`Cache hit: ${key}`);
      return value;
    } catch (error) {
      LoggerService.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} [ttl] - Time to live in seconds
   * @returns {boolean} Whether value was set
   */
  static set(key, value, ttl = 600) {
    try {
      const success = this.cache.set(key, value, ttl);
      if (success) {
        LoggerService.debug(`Cache set: ${key}`);
      }
      return success;
    } catch (error) {
      LoggerService.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {number} Number of deleted entries
   */
  static delete(key) {
    try {
      const deleted = this.cache.del(key);
      if (deleted > 0) {
        LoggerService.debug(`Cache delete: ${key}`);
      }
      return deleted;
    } catch (error) {
      LoggerService.error(`Error deleting cache key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Clear all cache
   * @returns {void}
   */
  static clear() {
    try {
      this.cache.flushAll();
      LoggerService.info('Cache cleared');
    } catch (error) {
      LoggerService.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  static getStats() {
    try {
      return this.cache.getStats();
    } catch (error) {
      LoggerService.error('Error getting cache stats:', error);
      return {};
    }
  }

  /**
   * Get multiple values from cache
   * @param {string[]} keys - Cache keys
   * @returns {Object} Object with key-value pairs
   */
  static mget(keys) {
    try {
      return this.cache.mget(keys);
    } catch (error) {
      LoggerService.error('Error getting multiple cache keys:', error);
      return {};
    }
  }

  /**
   * Set multiple values in cache
   * @param {Object} keyValuePairs - Object with key-value pairs
   * @param {number} [ttl] - Time to live in seconds
   * @returns {boolean} Whether all values were set
   */
  static mset(keyValuePairs, ttl = 600) {
    try {
      const success = this.cache.mset(
        Object.entries(keyValuePairs).map(([key, value]) => ({
          key,
          val: value,
          ttl
        }))
      );
      if (success) {
        LoggerService.debug(`Cache mset: ${Object.keys(keyValuePairs).join(', ')}`);
      }
      return success;
    } catch (error) {
      LoggerService.error('Error setting multiple cache keys:', error);
      return false;
    }
  }

  /**
   * Get cache keys
   * @returns {string[]} Array of cache keys
   */
  static keys() {
    try {
      return this.cache.keys();
    } catch (error) {
      LoggerService.error('Error getting cache keys:', error);
      return [];
    }
  }

  /**
   * Get time to live for key
   * @param {string} key - Cache key
   * @returns {number} TTL in seconds or -1 if not found
   */
  static getTtl(key) {
    try {
      return this.cache.getTtl(key);
    } catch (error) {
      LoggerService.error(`Error getting TTL for cache key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Set time to live for key
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in seconds
   * @returns {boolean} Whether TTL was set
   */
  static setTtl(key, ttl) {
    try {
      return this.cache.ttl(key, ttl);
    } catch (error) {
      LoggerService.error(`Error setting TTL for cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cache key with namespace
   * @param {string} namespace - Cache namespace
   * @param {string} key - Cache key
   * @returns {string} Namespaced cache key
   */
  static getNamespacedKey(namespace, key) {
    return `${namespace}:${key}`;
  }

  /**
   * Clear namespace
   * @param {string} namespace - Cache namespace
   * @returns {number} Number of deleted entries
   */
  static clearNamespace(namespace) {
    try {
      const keys = this.cache.keys().filter(key => key.startsWith(`${namespace}:`));
      const deleted = this.cache.del(keys);
      if (deleted > 0) {
        LoggerService.debug(`Cache namespace cleared: ${namespace}`);
      }
      return deleted;
    } catch (error) {
      LoggerService.error(`Error clearing cache namespace ${namespace}:`, error);
      return 0;
    }
  }

  /**
   * Get cache size
   * @returns {number} Number of entries in cache
   */
  static size() {
    try {
      return this.cache.keys().length;
    } catch (error) {
      LoggerService.error('Error getting cache size:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {boolean} Whether key exists
   */
  static has(key) {
    try {
      return this.cache.has(key);
    } catch (error) {
      LoggerService.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }
}

module.exports = CacheService;