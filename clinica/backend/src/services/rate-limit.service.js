const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const { LoggerService } = require('./logger.service');

class RateLimitService {
  static redis = null;

  /**
   * Initialize Redis connection
   */
  static initRedis() {
    try {
      this.redis = new Redis(process.env.REDIS_URL);
      LoggerService.info('Rate limit Redis connection initialized');
    } catch (error) {
      LoggerService.error('Error initializing Redis connection:', error);
      throw error;
    }
  }

  /**
   * Create rate limiter middleware
   * @param {Object} options - Rate limit options
   * @returns {Function} Rate limit middleware
   */
  static createLimiter(options = {}) {
    if (!this.redis) {
      this.initRedis();
    }

    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests, please try again later.',
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      store: new RedisStore({
        client: this.redis,
        prefix: 'rate-limit:'
      })
    };

    return rateLimit({
      ...defaultOptions,
      ...options,
      handler: (req, res) => {
        LoggerService.warn(`Rate limit exceeded for IP ${req.ip}`);
        res.status(429).json({
          status: 'error',
          message: options.message || defaultOptions.message
        });
      }
    });
  }

  /**
   * Create authentication rate limiter
   * @returns {Function} Auth rate limit middleware
   */
  static createAuthLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // 5 failed attempts per hour
      message: 'Too many failed login attempts, please try again later.',
      skipSuccessfulRequests: true // Don't count successful logins
    });
  }

  /**
   * Create API rate limiter
   * @returns {Function} API rate limit middleware
   */
  static createApiLimiter() {
    return this.createLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // 100 requests per 15 minutes
    });
  }

  /**
   * Create signup rate limiter
   * @returns {Function} Signup rate limit middleware
   */
  static createSignupLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 accounts per hour
      message: 'Too many accounts created, please try again later.'
    });
  }

  /**
   * Create password reset rate limiter
   * @returns {Function} Password reset rate limit middleware
   */
  static createPasswordResetLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 reset requests per hour
      message: 'Too many password reset attempts, please try again later.'
    });
  }

  /**
   * Create appointment booking rate limiter
   * @returns {Function} Appointment booking rate limit middleware
   */
  static createAppointmentLimiter() {
    return this.createLimiter({
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      max: 5, // 5 appointments per day
      message: 'Maximum appointment booking limit reached for today.'
    });
  }

  /**
   * Create contact form rate limiter
   * @returns {Function} Contact form rate limit middleware
   */
  static createContactFormLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // 5 messages per hour
      message: 'Too many messages sent, please try again later.'
    });
  }

  /**
   * Create file upload rate limiter
   * @returns {Function} File upload rate limit middleware
   */
  static createUploadLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // 10 uploads per hour
      message: 'Too many files uploaded, please try again later.'
    });
  }

  /**
   * Create custom rate limiter
   * @param {Object} options - Rate limit options
   * @returns {Function} Custom rate limit middleware
   */
  static createCustomLimiter(options) {
    return this.createLimiter(options);
  }

  /**
   * Reset rate limit for IP
   * @param {string} ip - IP address
   * @returns {Promise<void>}
   */
  static async resetLimit(ip) {
    try {
      if (!this.redis) {
        this.initRedis();
      }

      const keys = await this.redis.keys(`rate-limit:${ip}*`);
      if (keys.length) {
        await this.redis.del(keys);
        LoggerService.info(`Rate limit reset for IP ${ip}`);
      }
    } catch (error) {
      LoggerService.error(`Error resetting rate limit for IP ${ip}:`, error);
      throw error;
    }
  }

  /**
   * Get current rate limit status for IP
   * @param {string} ip - IP address
   * @returns {Promise<Object>} Rate limit status
   */
  static async getLimitStatus(ip) {
    try {
      if (!this.redis) {
        this.initRedis();
      }

      const keys = await this.redis.keys(`rate-limit:${ip}*`);
      const status = {};

      for (const key of keys) {
        const [remaining, reset] = await this.redis.mget(key, `${key}:reset`);
        status[key.replace(`rate-limit:${ip}:`, '')] = {
          remaining: remaining ? parseInt(remaining) : null,
          reset: reset ? new Date(parseInt(reset)) : null
        };
      }

      return status;
    } catch (error) {
      LoggerService.error(`Error getting rate limit status for IP ${ip}:`, error);
      throw error;
    }
  }

  /**
   * Close Redis connection
   * @returns {Promise<void>}
   */
  static async close() {
    try {
      if (this.redis) {
        await this.redis.quit();
        LoggerService.info('Rate limit Redis connection closed');
      }
    } catch (error) {
      LoggerService.error('Error closing Redis connection:', error);
      throw error;
    }
  }
}

module.exports = RateLimitService;