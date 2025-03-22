const winston = require('winston');
const path = require('path');

class LoggerService {
  static logger = null;

  /**
   * Initialize logger
   */
  static init() {
    const logDir = path.join(__dirname, '../../logs');

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta)}`;
        }
        if (stack) {
          log += `\n${stack}`;
        }
        return log;
      })
    );

    // Create logger instance
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // File transport for all logs
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        // File transport for error logs
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });

    // Handle uncaught exceptions and unhandled rejections
    this.logger.exceptions.handle(
      new winston.transports.File({
        filename: path.join(logDir, 'exceptions.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );

    this.logger.rejections.handle(
      new winston.transports.File({
        filename: path.join(logDir, 'rejections.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  static info(message, meta = {}) {
    if (!this.logger) this.init();
    this.logger.info(message, meta);
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Error|Object} [error] - Error object or metadata
   */
  static error(message, error = {}) {
    if (!this.logger) this.init();
    if (error instanceof Error) {
      this.logger.error(message, {
        error: {
          message: error.message,
          stack: error.stack,
          ...error
        }
      });
    } else {
      this.logger.error(message, error);
    }
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  static warn(message, meta = {}) {
    if (!this.logger) this.init();
    this.logger.warn(message, meta);
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  static debug(message, meta = {}) {
    if (!this.logger) this.init();
    this.logger.debug(message, meta);
  }

  /**
   * Log HTTP request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} responseTime - Response time in milliseconds
   */
  static logRequest(req, res, responseTime) {
    if (!this.logger) this.init();
    
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user ? req.user.id : null
    };

    if (res.statusCode >= 400) {
      this.error('HTTP Request Error', logData);
    } else {
      this.info('HTTP Request', logData);
    }
  }

  /**
   * Log database query
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @param {number} duration - Query duration in milliseconds
   */
  static logQuery(query, params, duration) {
    if (!this.logger) this.init();
    
    this.debug('Database Query', {
      query,
      params,
      duration
    });
  }

  /**
   * Log security event
   * @param {string} event - Security event type
   * @param {Object} data - Event data
   */
  static logSecurityEvent(event, data) {
    if (!this.logger) this.init();
    
    this.info(`Security Event: ${event}`, {
      event,
      ...data
    });
  }

  /**
   * Log performance metric
   * @param {string} metric - Metric name
   * @param {number} value - Metric value
   * @param {Object} [tags] - Metric tags
   */
  static logMetric(metric, value, tags = {}) {
    if (!this.logger) this.init();
    
    this.info(`Metric: ${metric}`, {
      metric,
      value,
      tags
    });
  }

  /**
   * Get log stream
   * @returns {Object} Log stream
   */
  static getStream() {
    if (!this.logger) this.init();
    
    return {
      write: (message) => {
        this.info(message.trim());
      }
    };
  }

  /**
   * Clear logs
   * @returns {Promise<void>}
   */
  static async clearLogs() {
    if (!this.logger) this.init();
    
    await Promise.all(
      this.logger.transports.map(transport => {
        if (transport instanceof winston.transports.File) {
          return new Promise((resolve, reject) => {
            transport.clear();
            resolve();
          });
        }
      })
    );
  }
}

module.exports = LoggerService;