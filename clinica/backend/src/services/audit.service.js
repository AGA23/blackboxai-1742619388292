const { LoggerService } = require('./logger.service');
const { User } = require('../models');

class AuditService {
  /**
   * Log audit event
   * @param {string} action - Action performed
   * @param {string} entityType - Type of entity affected
   * @param {string} entityId - ID of entity affected
   * @param {string} userId - ID of user performing action
   * @param {Object} changes - Changes made
   * @param {Object} [metadata] - Additional metadata
   * @returns {Promise<Object>} Created audit log
   */
  static async log(action, entityType, entityId, userId, changes, metadata = {}) {
    try {
      const user = await User.findByPk(userId);
      const auditLog = {
        timestamp: new Date(),
        action,
        entityType,
        entityId,
        userId,
        userEmail: user ? user.email : null,
        changes,
        metadata: {
          ...metadata,
          userAgent: metadata.userAgent || null,
          ipAddress: metadata.ipAddress || null
        }
      };

      // Log to database or external service
      await this.saveAuditLog(auditLog);

      // Log to application logs
      LoggerService.info(`Audit: ${action} on ${entityType} ${entityId} by user ${userId}`);

      return auditLog;
    } catch (error) {
      LoggerService.error('Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * Log data access
   * @param {string} entityType - Type of entity accessed
   * @param {string} entityId - ID of entity accessed
   * @param {string} userId - ID of user accessing
   * @param {string} accessType - Type of access (read/write)
   * @param {Object} [metadata] - Additional metadata
   */
  static async logAccess(entityType, entityId, userId, accessType, metadata = {}) {
    try {
      await this.log(
        `data_${accessType}`,
        entityType,
        entityId,
        userId,
        null,
        metadata
      );
    } catch (error) {
      LoggerService.error('Error logging data access:', error);
      throw error;
    }
  }

  /**
   * Log authentication event
   * @param {string} userId - User ID
   * @param {string} event - Auth event type
   * @param {Object} [metadata] - Additional metadata
   */
  static async logAuth(userId, event, metadata = {}) {
    try {
      await this.log(
        'authentication',
        'user',
        userId,
        userId,
        { event },
        metadata
      );
    } catch (error) {
      LoggerService.error('Error logging auth event:', error);
      throw error;
    }
  }

  /**
   * Log system configuration change
   * @param {string} userId - User ID
   * @param {string} component - Component changed
   * @param {Object} changes - Configuration changes
   * @param {Object} [metadata] - Additional metadata
   */
  static async logConfigChange(userId, component, changes, metadata = {}) {
    try {
      await this.log(
        'config_change',
        'system',
        component,
        userId,
        changes,
        metadata
      );
    } catch (error) {
      LoggerService.error('Error logging config change:', error);
      throw error;
    }
  }

  /**
   * Log security event
   * @param {string} userId - User ID
   * @param {string} event - Security event type
   * @param {Object} details - Event details
   * @param {Object} [metadata] - Additional metadata
   */
  static async logSecurityEvent(userId, event, details, metadata = {}) {
    try {
      await this.log(
        'security_event',
        'system',
        event,
        userId,
        details,
        metadata
      );
    } catch (error) {
      LoggerService.error('Error logging security event:', error);
      throw error;
    }
  }

  /**
   * Log data modification
   * @param {string} entityType - Type of entity modified
   * @param {string} entityId - ID of entity modified
   * @param {string} userId - ID of user modifying
   * @param {Object} changes - Changes made
   * @param {Object} [metadata] - Additional metadata
   */
  static async logModification(entityType, entityId, userId, changes, metadata = {}) {
    try {
      await this.log(
        'modification',
        entityType,
        entityId,
        userId,
        changes,
        metadata
      );
    } catch (error) {
      LoggerService.error('Error logging modification:', error);
      throw error;
    }
  }

  /**
   * Log data deletion
   * @param {string} entityType - Type of entity deleted
   * @param {string} entityId - ID of entity deleted
   * @param {string} userId - ID of user deleting
   * @param {Object} [metadata] - Additional metadata
   */
  static async logDeletion(entityType, entityId, userId, metadata = {}) {
    try {
      await this.log(
        'deletion',
        entityType,
        entityId,
        userId,
        null,
        metadata
      );
    } catch (error) {
      LoggerService.error('Error logging deletion:', error);
      throw error;
    }
  }

  /**
   * Log API request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {string} userId - User ID
   */
  static async logApiRequest(req, res, userId) {
    try {
      const metadata = {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        requestBody: this.sanitizeRequestBody(req.body),
        responseTime: res.get('X-Response-Time')
      };

      await this.log(
        'api_request',
        'system',
        'api',
        userId,
        null,
        metadata
      );
    } catch (error) {
      LoggerService.error('Error logging API request:', error);
      throw error;
    }
  }

  /**
   * Save audit log
   * @private
   * @param {Object} auditLog - Audit log data
   */
  static async saveAuditLog(auditLog) {
    try {
      // Here you would implement the actual storage logic
      // This could be saving to a database table, sending to an external service, etc.
      // For now, we'll just log it
      LoggerService.info('Audit Log:', JSON.stringify(auditLog));
    } catch (error) {
      LoggerService.error('Error saving audit log:', error);
      throw error;
    }
  }

  /**
   * Sanitize request body for logging
   * @private
   * @param {Object} body - Request body
   * @returns {Object} Sanitized body
   */
  static sanitizeRequestBody(body) {
    if (!body) return null;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'creditCard'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Get audit logs
   * @param {Object} filters - Search filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Audit logs
   */
  static async getAuditLogs(filters = {}, options = {}) {
    try {
      // Here you would implement the actual retrieval logic
      // This could be querying a database table, fetching from an external service, etc.
      // For now, we'll just return a placeholder
      return {
        data: [],
        total: 0,
        page: options.page || 1,
        limit: options.limit || 10
      };
    } catch (error) {
      LoggerService.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Export audit logs
   * @param {Object} filters - Export filters
   * @returns {Promise<Buffer>} Export data
   */
  static async exportAuditLogs(filters = {}) {
    try {
      const logs = await this.getAuditLogs(filters, { limit: 1000 });
      // Here you would implement the actual export logic
      // This could be generating a CSV, Excel file, etc.
      return Buffer.from(JSON.stringify(logs.data));
    } catch (error) {
      LoggerService.error('Error exporting audit logs:', error);
      throw error;
    }
  }
}

module.exports = AuditService;