const { Sequelize } = require('sequelize');
const { LoggerService } = require('./logger.service');
const { MetricsService } = require('./metrics.service');

class DatabaseService {
  static sequelize = null;

  /**
   * Initialize database connection
   * @returns {Promise<void>}
   */
  static async init() {
    try {
      this.sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          dialect: 'postgres',
          logging: (query, time) => {
            LoggerService.logQuery(query, null, time);
            MetricsService.trackDbQuery(time);
          },
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
          }
        }
      );

      // Test connection
      await this.testConnection();

      LoggerService.info('Database connection initialized');
    } catch (error) {
      LoggerService.error('Error initializing database connection:', error);
      throw error;
    }
  }

  /**
   * Test database connection
   * @returns {Promise<void>}
   */
  static async testConnection() {
    try {
      await this.sequelize.authenticate();
      LoggerService.info('Database connection test successful');
    } catch (error) {
      LoggerService.error('Database connection test failed:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  static async close() {
    try {
      await this.sequelize.close();
      LoggerService.info('Database connection closed');
    } catch (error) {
      LoggerService.error('Error closing database connection:', error);
      throw error;
    }
  }

  /**
   * Execute transaction
   * @param {Function} callback - Transaction callback
   * @returns {Promise<*>} Transaction result
   */
  static async transaction(callback) {
    const t = await this.sequelize.transaction();
    try {
      const result = await callback(t);
      await t.commit();
      return result;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Execute raw query
   * @param {string} query - SQL query
   * @param {Object} [options] - Query options
   * @returns {Promise<Array>} Query results
   */
  static async query(query, options = {}) {
    try {
      const startTime = Date.now();
      const result = await this.sequelize.query(query, options);
      const duration = Date.now() - startTime;

      LoggerService.logQuery(query, options, duration);
      MetricsService.trackDbQuery(duration);

      return result;
    } catch (error) {
      LoggerService.error('Error executing raw query:', error);
      throw error;
    }
  }

  /**
   * Sync database models
   * @param {Object} [options] - Sync options
   * @returns {Promise<void>}
   */
  static async sync(options = {}) {
    try {
      await this.sequelize.sync(options);
      LoggerService.info('Database models synchronized');
    } catch (error) {
      LoggerService.error('Error synchronizing database models:', error);
      throw error;
    }
  }

  /**
   * Check database health
   * @returns {Promise<Object>} Health status
   */
  static async checkHealth() {
    try {
      const startTime = Date.now();
      await this.testConnection();
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        connections: await this.getConnectionStats()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Get connection statistics
   * @private
   * @returns {Promise<Object>} Connection stats
   */
  static async getConnectionStats() {
    try {
      const pool = this.sequelize.connectionManager.pool;
      return {
        total: pool.size,
        idle: pool.idle,
        active: pool.length - pool.idle
      };
    } catch (error) {
      LoggerService.error('Error getting connection stats:', error);
      return {};
    }
  }

  /**
   * Backup database
   * @returns {Promise<string>} Backup file path
   */
  static async backup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.sql`;
      const path = `./backups/${filename}`;

      // Execute pg_dump
      await this.query(`COPY (
        SELECT table_schema, table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
      ) TO '${path}'`);

      LoggerService.info(`Database backup created: ${path}`);
      return path;
    } catch (error) {
      LoggerService.error('Error creating database backup:', error);
      throw error;
    }
  }

  /**
   * Restore database
   * @param {string} backupPath - Backup file path
   * @returns {Promise<void>}
   */
  static async restore(backupPath) {
    try {
      // Execute psql
      await this.query(`\i ${backupPath}`);
      LoggerService.info(`Database restored from backup: ${backupPath}`);
    } catch (error) {
      LoggerService.error('Error restoring database:', error);
      throw error;
    }
  }

  /**
   * Get database size
   * @returns {Promise<Object>} Database size info
   */
  static async getSize() {
    try {
      const [result] = await this.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size,
               pg_database_size(current_database()) as bytes
      `);
      return result[0];
    } catch (error) {
      LoggerService.error('Error getting database size:', error);
      throw error;
    }
  }

  /**
   * Get table sizes
   * @returns {Promise<Array>} Table sizes
   */
  static async getTableSizes() {
    try {
      const [result] = await this.query(`
        SELECT
          relname as table,
          pg_size_pretty(pg_total_relation_size(relid)) as size,
          pg_total_relation_size(relid) as bytes
        FROM pg_catalog.pg_statio_user_tables
        ORDER BY pg_total_relation_size(relid) DESC
      `);
      return result;
    } catch (error) {
      LoggerService.error('Error getting table sizes:', error);
      throw error;
    }
  }

  /**
   * Vacuum database
   * @param {string} [table] - Specific table to vacuum
   * @returns {Promise<void>}
   */
  static async vacuum(table = '') {
    try {
      const query = table ? `VACUUM ANALYZE ${table}` : 'VACUUM ANALYZE';
      await this.query(query);
      LoggerService.info(`Vacuum completed${table ? ` for table ${table}` : ''}`);
    } catch (error) {
      LoggerService.error('Error vacuuming database:', error);
      throw error;
    }
  }
}

module.exports = DatabaseService;