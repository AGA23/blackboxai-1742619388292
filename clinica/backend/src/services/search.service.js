const { Op } = require('sequelize');
const { LoggerService } = require('./logger.service');
const { User, Appointment, MedicalHistory, Branch } = require('../models');
const { CacheService } = require('./cache.service');

class SearchService {
  static CACHE_PREFIX = 'search:';
  static CACHE_TTL = 300; // 5 minutes

  /**
   * Search patients
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  static async searchPatients(query, options = {}) {
    try {
      const cacheKey = `${this.CACHE_PREFIX}patients:${query}:${JSON.stringify(options)}`;
      const cached = CacheService.get(cacheKey);
      if (cached) return cached;

      const { page = 1, limit = 10, ...searchOptions } = options;
      const offset = (page - 1) * limit;

      const where = {
        role: 'patient',
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${query}%` } },
          { lastName: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } },
          { phone: { [Op.iLike]: `%${query}%` } }
        ]
      };

      const { rows, count } = await User.findAndCountAll({
        where,
        ...searchOptions,
        offset,
        limit,
        attributes: { exclude: ['password'] }
      });

      const result = {
        data: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      };

      CacheService.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      LoggerService.error('Error searching patients:', error);
      throw error;
    }
  }

  /**
   * Search doctors
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  static async searchDoctors(query, options = {}) {
    try {
      const cacheKey = `${this.CACHE_PREFIX}doctors:${query}:${JSON.stringify(options)}`;
      const cached = CacheService.get(cacheKey);
      if (cached) return cached;

      const { page = 1, limit = 10, ...searchOptions } = options;
      const offset = (page - 1) * limit;

      const where = {
        role: 'doctor',
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${query}%` } },
          { lastName: { [Op.iLike]: `%${query}%` } },
          { specialization: { [Op.iLike]: `%${query}%` } }
        ]
      };

      const { rows, count } = await User.findAndCountAll({
        where,
        ...searchOptions,
        offset,
        limit,
        attributes: { exclude: ['password'] }
      });

      const result = {
        data: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      };

      CacheService.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      LoggerService.error('Error searching doctors:', error);
      throw error;
    }
  }

  /**
   * Search appointments
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  static async searchAppointments(query, options = {}) {
    try {
      const { page = 1, limit = 10, ...searchOptions } = options;
      const offset = (page - 1) * limit;

      const where = {
        [Op.or]: [
          { status: { [Op.iLike]: `%${query}%` } },
          { type: { [Op.iLike]: `%${query}%` } },
          { notes: { [Op.iLike]: `%${query}%` } }
        ]
      };

      const { rows, count } = await Appointment.findAndCountAll({
        where,
        ...searchOptions,
        offset,
        limit,
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'doctor',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name']
          }
        ]
      });

      return {
        data: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      LoggerService.error('Error searching appointments:', error);
      throw error;
    }
  }

  /**
   * Search medical histories
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  static async searchMedicalHistories(query, options = {}) {
    try {
      const { page = 1, limit = 10, ...searchOptions } = options;
      const offset = (page - 1) * limit;

      const where = {
        [Op.or]: [
          { diagnosis: { [Op.iLike]: `%${query}%` } },
          { treatment: { [Op.iLike]: `%${query}%` } },
          { symptoms: { [Op.contains]: [query] } }
        ]
      };

      const { rows, count } = await MedicalHistory.findAndCountAll({
        where,
        ...searchOptions,
        offset,
        limit,
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'doctor',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      return {
        data: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      LoggerService.error('Error searching medical histories:', error);
      throw error;
    }
  }

  /**
   * Search branches
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  static async searchBranches(query, options = {}) {
    try {
      const cacheKey = `${this.CACHE_PREFIX}branches:${query}:${JSON.stringify(options)}`;
      const cached = CacheService.get(cacheKey);
      if (cached) return cached;

      const { page = 1, limit = 10, ...searchOptions } = options;
      const offset = (page - 1) * limit;

      const where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { address: { [Op.iLike]: `%${query}%` } },
          { city: { [Op.iLike]: `%${query}%` } },
          { state: { [Op.iLike]: `%${query}%` } }
        ]
      };

      const { rows, count } = await Branch.findAndCountAll({
        where,
        ...searchOptions,
        offset,
        limit
      });

      const result = {
        data: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      };

      CacheService.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      LoggerService.error('Error searching branches:', error);
      throw error;
    }
  }

  /**
   * Global search across all entities
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  static async globalSearch(query, options = {}) {
    try {
      const [patients, doctors, appointments, medicalHistories, branches] = await Promise.all([
        this.searchPatients(query, options),
        this.searchDoctors(query, options),
        this.searchAppointments(query, options),
        this.searchMedicalHistories(query, options),
        this.searchBranches(query, options)
      ]);

      return {
        patients,
        doctors,
        appointments,
        medicalHistories,
        branches
      };
    } catch (error) {
      LoggerService.error('Error performing global search:', error);
      throw error;
    }
  }

  /**
   * Clear search cache
   * @returns {void}
   */
  static clearCache() {
    try {
      const keys = CacheService.keys().filter(key => key.startsWith(this.CACHE_PREFIX));
      keys.forEach(key => CacheService.delete(key));
      LoggerService.info('Search cache cleared');
    } catch (error) {
      LoggerService.error('Error clearing search cache:', error);
      throw error;
    }
  }
}

module.exports = SearchService;