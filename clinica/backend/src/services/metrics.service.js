const { LoggerService } = require('./logger.service');
const { CacheService } = require('./cache.service');

class MetricsService {
  static METRICS_CACHE_KEY = 'app:metrics';
  static METRICS_TTL = 300; // 5 minutes

  /**
   * Initialize metrics
   */
  static init() {
    try {
      // Initialize metrics in cache
      const initialMetrics = {
        requests: {
          total: 0,
          success: 0,
          error: 0,
          byEndpoint: {}
        },
        auth: {
          logins: 0,
          failedLogins: 0,
          registrations: 0
        },
        appointments: {
          created: 0,
          cancelled: 0,
          completed: 0
        },
        performance: {
          responseTime: [],
          dbQueryTime: [],
          cacheHits: 0,
          cacheMisses: 0
        },
        system: {
          uptime: 0,
          memory: {},
          cpu: {}
        }
      };

      CacheService.set(this.METRICS_CACHE_KEY, initialMetrics, this.METRICS_TTL);
      LoggerService.info('Metrics service initialized');
    } catch (error) {
      LoggerService.error('Error initializing metrics service:', error);
      throw error;
    }
  }

  /**
   * Get current metrics
   * @returns {Object} Current metrics
   */
  static async getMetrics() {
    try {
      let metrics = CacheService.get(this.METRICS_CACHE_KEY);
      if (!metrics) {
        this.init();
        metrics = CacheService.get(this.METRICS_CACHE_KEY);
      }

      // Add system metrics
      metrics.system = {
        ...metrics.system,
        ...this.getSystemMetrics()
      };

      return metrics;
    } catch (error) {
      LoggerService.error('Error getting metrics:', error);
      throw error;
    }
  }

  /**
   * Track request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} responseTime - Response time in milliseconds
   */
  static trackRequest(req, res, responseTime) {
    try {
      const metrics = CacheService.get(this.METRICS_CACHE_KEY);
      const { method, path } = req;
      const statusCode = res.statusCode;
      const endpoint = `${method} ${path}`;

      // Update total requests
      metrics.requests.total++;

      // Update success/error counts
      if (statusCode >= 200 && statusCode < 400) {
        metrics.requests.success++;
      } else {
        metrics.requests.error++;
      }

      // Update endpoint metrics
      if (!metrics.requests.byEndpoint[endpoint]) {
        metrics.requests.byEndpoint[endpoint] = {
          count: 0,
          success: 0,
          error: 0,
          avgResponseTime: 0
        };
      }

      const endpointMetrics = metrics.requests.byEndpoint[endpoint];
      endpointMetrics.count++;
      if (statusCode >= 200 && statusCode < 400) {
        endpointMetrics.success++;
      } else {
        endpointMetrics.error++;
      }

      // Update response time
      metrics.performance.responseTime.push(responseTime);
      if (metrics.performance.responseTime.length > 100) {
        metrics.performance.responseTime.shift();
      }

      // Update endpoint average response time
      endpointMetrics.avgResponseTime = (
        (endpointMetrics.avgResponseTime * (endpointMetrics.count - 1) + responseTime) /
        endpointMetrics.count
      );

      CacheService.set(this.METRICS_CACHE_KEY, metrics, this.METRICS_TTL);
    } catch (error) {
      LoggerService.error('Error tracking request:', error);
    }
  }

  /**
   * Track authentication event
   * @param {string} event - Event type (login, failedLogin, registration)
   */
  static trackAuth(event) {
    try {
      const metrics = CacheService.get(this.METRICS_CACHE_KEY);
      metrics.auth[event]++;
      CacheService.set(this.METRICS_CACHE_KEY, metrics, this.METRICS_TTL);
    } catch (error) {
      LoggerService.error('Error tracking auth event:', error);
    }
  }

  /**
   * Track appointment event
   * @param {string} event - Event type (created, cancelled, completed)
   */
  static trackAppointment(event) {
    try {
      const metrics = CacheService.get(this.METRICS_CACHE_KEY);
      metrics.appointments[event]++;
      CacheService.set(this.METRICS_CACHE_KEY, metrics, this.METRICS_TTL);
    } catch (error) {
      LoggerService.error('Error tracking appointment event:', error);
    }
  }

  /**
   * Track database query
   * @param {number} queryTime - Query execution time in milliseconds
   */
  static trackDbQuery(queryTime) {
    try {
      const metrics = CacheService.get(this.METRICS_CACHE_KEY);
      metrics.performance.dbQueryTime.push(queryTime);
      if (metrics.performance.dbQueryTime.length > 100) {
        metrics.performance.dbQueryTime.shift();
      }
      CacheService.set(this.METRICS_CACHE_KEY, metrics, this.METRICS_TTL);
    } catch (error) {
      LoggerService.error('Error tracking DB query:', error);
    }
  }

  /**
   * Track cache event
   * @param {string} event - Event type (hit, miss)
   */
  static trackCache(event) {
    try {
      const metrics = CacheService.get(this.METRICS_CACHE_KEY);
      if (event === 'hit') {
        metrics.performance.cacheHits++;
      } else if (event === 'miss') {
        metrics.performance.cacheMisses++;
      }
      CacheService.set(this.METRICS_CACHE_KEY, metrics, this.METRICS_TTL);
    } catch (error) {
      LoggerService.error('Error tracking cache event:', error);
    }
  }

  /**
   * Get system metrics
   * @private
   * @returns {Object} System metrics
   */
  static getSystemMetrics() {
    try {
      const memory = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      return {
        uptime: process.uptime(),
        memory: {
          heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
          rss: Math.round(memory.rss / 1024 / 1024)
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        }
      };
    } catch (error) {
      LoggerService.error('Error getting system metrics:', error);
      return {};
    }
  }

  /**
   * Calculate average response time
   * @returns {number} Average response time
   */
  static getAverageResponseTime() {
    try {
      const metrics = CacheService.get(this.METRICS_CACHE_KEY);
      const times = metrics.performance.responseTime;
      if (!times.length) return 0;
      return times.reduce((a, b) => a + b) / times.length;
    } catch (error) {
      LoggerService.error('Error calculating average response time:', error);
      return 0;
    }
  }

  /**
   * Calculate error rate
   * @returns {number} Error rate percentage
   */
  static getErrorRate() {
    try {
      const metrics = CacheService.get(this.METRICS_CACHE_KEY);
      const { total, error } = metrics.requests;
      if (!total) return 0;
      return (error / total) * 100;
    } catch (error) {
      LoggerService.error('Error calculating error rate:', error);
      return 0;
    }
  }

  /**
   * Get cache hit rate
   * @returns {number} Cache hit rate percentage
   */
  static getCacheHitRate() {
    try {
      const metrics = CacheService.get(this.METRICS_CACHE_KEY);
      const { cacheHits, cacheMisses } = metrics.performance;
      const total = cacheHits + cacheMisses;
      if (!total) return 0;
      return (cacheHits / total) * 100;
    } catch (error) {
      LoggerService.error('Error calculating cache hit rate:', error);
      return 0;
    }
  }

  /**
   * Reset metrics
   */
  static reset() {
    try {
      this.init();
      LoggerService.info('Metrics reset');
    } catch (error) {
      LoggerService.error('Error resetting metrics:', error);
      throw error;
    }
  }
}

module.exports = MetricsService;