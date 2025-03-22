const validator = require('validator');
const { LoggerService } = require('./logger.service');

class ValidationService {
  /**
   * Validate email
   * @param {string} email - Email to validate
   * @returns {boolean} Whether email is valid
   */
  static isValidEmail(email) {
    try {
      return validator.isEmail(email);
    } catch (error) {
      LoggerService.error('Error validating email:', error);
      return false;
    }
  }

  /**
   * Validate phone number
   * @param {string} phone - Phone number to validate
   * @returns {boolean} Whether phone number is valid
   */
  static isValidPhone(phone) {
    try {
      // Mexican phone number format: +52 followed by 10 digits
      return /^\+?52\d{10}$/.test(phone.replace(/\s+/g, ''));
    } catch (error) {
      LoggerService.error('Error validating phone:', error);
      return false;
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  static validatePassword(password) {
    try {
      const result = {
        isValid: false,
        errors: []
      };

      if (!password || password.length < 8) {
        result.errors.push('La contraseña debe tener al menos 8 caracteres');
      }

      if (!/[A-Z]/.test(password)) {
        result.errors.push('La contraseña debe contener al menos una letra mayúscula');
      }

      if (!/[a-z]/.test(password)) {
        result.errors.push('La contraseña debe contener al menos una letra minúscula');
      }

      if (!/[0-9]/.test(password)) {
        result.errors.push('La contraseña debe contener al menos un número');
      }

      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        result.errors.push('La contraseña debe contener al menos un carácter especial');
      }

      result.isValid = result.errors.length === 0;
      return result;
    } catch (error) {
      LoggerService.error('Error validating password:', error);
      return { isValid: false, errors: ['Error validando contraseña'] };
    }
  }

  /**
   * Validate date
   * @param {string} date - Date to validate
   * @param {Object} [options] - Validation options
   * @returns {boolean} Whether date is valid
   */
  static isValidDate(date, options = {}) {
    try {
      if (!validator.isDate(date)) return false;

      const dateObj = new Date(date);
      const now = new Date();

      if (options.futureOnly && dateObj <= now) {
        return false;
      }

      if (options.pastOnly && dateObj >= now) {
        return false;
      }

      if (options.minDate && dateObj < new Date(options.minDate)) {
        return false;
      }

      if (options.maxDate && dateObj > new Date(options.maxDate)) {
        return false;
      }

      return true;
    } catch (error) {
      LoggerService.error('Error validating date:', error);
      return false;
    }
  }

  /**
   * Validate time
   * @param {string} time - Time to validate (HH:mm format)
   * @returns {boolean} Whether time is valid
   */
  static isValidTime(time) {
    try {
      return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
    } catch (error) {
      LoggerService.error('Error validating time:', error);
      return false;
    }
  }

  /**
   * Sanitize input
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized input
   */
  static sanitizeInput(input) {
    try {
      return validator.escape(input.trim());
    } catch (error) {
      LoggerService.error('Error sanitizing input:', error);
      return '';
    }
  }

  /**
   * Validate name
   * @param {string} name - Name to validate
   * @returns {boolean} Whether name is valid
   */
  static isValidName(name) {
    try {
      return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/.test(name);
    } catch (error) {
      LoggerService.error('Error validating name:', error);
      return false;
    }
  }

  /**
   * Validate age
   * @param {number} age - Age to validate
   * @returns {boolean} Whether age is valid
   */
  static isValidAge(age) {
    try {
      return age >= 0 && age <= 120;
    } catch (error) {
      LoggerService.error('Error validating age:', error);
      return false;
    }
  }

  /**
   * Validate URL
   * @param {string} url - URL to validate
   * @returns {boolean} Whether URL is valid
   */
  static isValidUrl(url) {
    try {
      return validator.isURL(url);
    } catch (error) {
      LoggerService.error('Error validating URL:', error);
      return false;
    }
  }

  /**
   * Validate postal code
   * @param {string} postalCode - Postal code to validate
   * @returns {boolean} Whether postal code is valid
   */
  static isValidPostalCode(postalCode) {
    try {
      // Mexican postal code format: 5 digits
      return /^\d{5}$/.test(postalCode);
    } catch (error) {
      LoggerService.error('Error validating postal code:', error);
      return false;
    }
  }

  /**
   * Validate RFC
   * @param {string} rfc - RFC to validate
   * @returns {boolean} Whether RFC is valid
   */
  static isValidRFC(rfc) {
    try {
      // Mexican RFC format: 12 or 13 characters
      return /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(rfc);
    } catch (error) {
      LoggerService.error('Error validating RFC:', error);
      return false;
    }
  }

  /**
   * Validate CURP
   * @param {string} curp - CURP to validate
   * @returns {boolean} Whether CURP is valid
   */
  static isValidCURP(curp) {
    try {
      // Mexican CURP format: 18 characters
      return /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z]{2}$/.test(curp);
    } catch (error) {
      LoggerService.error('Error validating CURP:', error);
      return false;
    }
  }

  /**
   * Validate appointment type
   * @param {string} type - Appointment type to validate
   * @returns {boolean} Whether appointment type is valid
   */
  static isValidAppointmentType(type) {
    try {
      const validTypes = ['primera_vez', 'seguimiento', 'control'];
      return validTypes.includes(type);
    } catch (error) {
      LoggerService.error('Error validating appointment type:', error);
      return false;
    }
  }

  /**
   * Validate medical record fields
   * @param {Object} record - Medical record to validate
   * @returns {Object} Validation result
   */
  static validateMedicalRecord(record) {
    try {
      const errors = [];

      if (!record.diagnosis || record.diagnosis.length < 10) {
        errors.push('El diagnóstico debe tener al menos 10 caracteres');
      }

      if (!record.treatment || record.treatment.length < 10) {
        errors.push('El tratamiento debe tener al menos 10 caracteres');
      }

      if (!Array.isArray(record.symptoms) || record.symptoms.length === 0) {
        errors.push('Debe incluir al menos un síntoma');
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      LoggerService.error('Error validating medical record:', error);
      return { isValid: false, errors: ['Error validando historial médico'] };
    }
  }

  /**
   * Validate file type
   * @param {string} mimeType - File MIME type
   * @param {Array} allowedTypes - Allowed MIME types
   * @returns {boolean} Whether file type is valid
   */
  static isValidFileType(mimeType, allowedTypes) {
    try {
      return allowedTypes.includes(mimeType);
    } catch (error) {
      LoggerService.error('Error validating file type:', error);
      return false;
    }
  }

  /**
   * Validate file size
   * @param {number} size - File size in bytes
   * @param {number} maxSize - Maximum allowed size in bytes
   * @returns {boolean} Whether file size is valid
   */
  static isValidFileSize(size, maxSize) {
    try {
      return size <= maxSize;
    } catch (error) {
      LoggerService.error('Error validating file size:', error);
      return false;
    }
  }
}

module.exports = ValidationService;