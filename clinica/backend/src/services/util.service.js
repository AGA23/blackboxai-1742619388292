const crypto = require('crypto');
const { LoggerService } = require('./logger.service');

class UtilService {
  /**
   * Format date
   * @param {Date|string} date - Date to format
   * @param {string} [format='YYYY-MM-DD'] - Date format
   * @returns {string} Formatted date
   */
  static formatDate(date, format = 'YYYY-MM-DD') {
    try {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');

      return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
    } catch (error) {
      LoggerService.error('Error formatting date:', error);
      return '';
    }
  }

  /**
   * Generate random string
   * @param {number} length - String length
   * @returns {string} Random string
   */
  static generateRandomString(length = 32) {
    try {
      return crypto.randomBytes(length).toString('hex');
    } catch (error) {
      LoggerService.error('Error generating random string:', error);
      return '';
    }
  }

  /**
   * Calculate age from birth date
   * @param {Date|string} birthDate - Birth date
   * @returns {number} Age in years
   */
  static calculateAge(birthDate) {
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      return age;
    } catch (error) {
      LoggerService.error('Error calculating age:', error);
      return 0;
    }
  }

  /**
   * Format currency
   * @param {number} amount - Amount to format
   * @param {string} [currency='MXN'] - Currency code
   * @returns {string} Formatted currency
   */
  static formatCurrency(amount, currency = 'MXN') {
    try {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency
      }).format(amount);
    } catch (error) {
      LoggerService.error('Error formatting currency:', error);
      return '';
    }
  }

  /**
   * Format phone number
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone number
   */
  static formatPhoneNumber(phone) {
    try {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      }
      return phone;
    } catch (error) {
      LoggerService.error('Error formatting phone number:', error);
      return phone;
    }
  }

  /**
   * Calculate time difference
   * @param {Date|string} start - Start time
   * @param {Date|string} end - End time
   * @returns {Object} Time difference
   */
  static calculateTimeDifference(start, end) {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diff = endDate - startDate;

      return {
        milliseconds: diff,
        seconds: Math.floor(diff / 1000),
        minutes: Math.floor(diff / (1000 * 60)),
        hours: Math.floor(diff / (1000 * 60 * 60)),
        days: Math.floor(diff / (1000 * 60 * 60 * 24))
      };
    } catch (error) {
      LoggerService.error('Error calculating time difference:', error);
      return null;
    }
  }

  /**
   * Truncate text
   * @param {string} text - Text to truncate
   * @param {number} length - Maximum length
   * @param {string} [suffix='...'] - Suffix to add
   * @returns {string} Truncated text
   */
  static truncateText(text, length, suffix = '...') {
    try {
      if (text.length <= length) return text;
      return text.substring(0, length - suffix.length) + suffix;
    } catch (error) {
      LoggerService.error('Error truncating text:', error);
      return text;
    }
  }

  /**
   * Generate slug
   * @param {string} text - Text to convert to slug
   * @returns {string} Slug
   */
  static generateSlug(text) {
    try {
      return text
        .toLowerCase()
        .replace(/[áéíóúñ]/g, c => ({á:'a',é:'e',í:'i',ó:'o',ú:'u',ñ:'n'})[c])
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } catch (error) {
      LoggerService.error('Error generating slug:', error);
      return '';
    }
  }

  /**
   * Parse boolean
   * @param {*} value - Value to parse
   * @returns {boolean} Parsed boolean
   */
  static parseBoolean(value) {
    try {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim();
        return ['true', '1', 'yes', 'on'].includes(normalized);
      }
      return Boolean(value);
    } catch (error) {
      LoggerService.error('Error parsing boolean:', error);
      return false;
    }
  }

  /**
   * Deep clone object
   * @param {Object} obj - Object to clone
   * @returns {Object} Cloned object
   */
  static deepClone(obj) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      LoggerService.error('Error cloning object:', error);
      return obj;
    }
  }

  /**
   * Format file size
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size
   */
  static formatFileSize(bytes) {
    try {
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let size = bytes;
      let unitIndex = 0;

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }

      return `${size.toFixed(2)} ${units[unitIndex]}`;
    } catch (error) {
      LoggerService.error('Error formatting file size:', error);
      return '';
    }
  }

  /**
   * Get time slots
   * @param {string} startTime - Start time (HH:mm)
   * @param {string} endTime - End time (HH:mm)
   * @param {number} intervalMinutes - Interval in minutes
   * @returns {Array} Time slots
   */
  static getTimeSlots(startTime, endTime, intervalMinutes) {
    try {
      const slots = [];
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      let currentTime = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;

      while (currentTime < endTimeMinutes) {
        const hour = Math.floor(currentTime / 60);
        const minute = currentTime % 60;
        slots.push(
          `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        );
        currentTime += intervalMinutes;
      }

      return slots;
    } catch (error) {
      LoggerService.error('Error generating time slots:', error);
      return [];
    }
  }

  /**
   * Calculate business days between dates
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {number} Number of business days
   */
  static calculateBusinessDays(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      let days = 0;
      let current = start;

      while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) days++;
        current.setDate(current.getDate() + 1);
      }

      return days;
    } catch (error) {
      LoggerService.error('Error calculating business days:', error);
      return 0;
    }
  }
}

module.exports = UtilService;