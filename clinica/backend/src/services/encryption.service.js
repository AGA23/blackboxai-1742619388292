const crypto = require('crypto');
const { LoggerService } = require('./logger.service');

class EncryptionService {
  static algorithm = 'aes-256-gcm';
  static keyLength = 32; // 256 bits
  static ivLength = 16; // 128 bits
  static saltLength = 64; // 512 bits
  static tagLength = 16; // 128 bits

  /**
   * Initialize encryption key
   * @private
   */
  static getKey() {
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    return crypto.scryptSync(
      process.env.ENCRYPTION_KEY,
      'salt',
      this.keyLength
    );
  }

  /**
   * Encrypt data
   * @param {string|Object} data - Data to encrypt
   * @returns {string} Encrypted data
   */
  static encrypt(data) {
    try {
      // Convert object to string if necessary
      const text = typeof data === 'object' ? JSON.stringify(data) : data;

      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.getKey(),
        iv
      );

      // Encrypt data
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag
      const tag = cipher.getAuthTag();

      // Combine IV, encrypted data, and auth tag
      const result = {
        iv: iv.toString('hex'),
        data: encrypted,
        tag: tag.toString('hex')
      };

      return Buffer.from(JSON.stringify(result)).toString('base64');
    } catch (error) {
      LoggerService.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data
   * @param {string} encryptedData - Encrypted data
   * @returns {string|Object} Decrypted data
   */
  static decrypt(encryptedData) {
    try {
      // Parse encrypted data
      const encrypted = JSON.parse(
        Buffer.from(encryptedData, 'base64').toString('utf8')
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.getKey(),
        Buffer.from(encrypted.iv, 'hex')
      );

      // Set auth tag
      decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));

      // Decrypt data
      let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      // Try to parse as JSON if possible
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      LoggerService.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash data
   * @param {string} data - Data to hash
   * @param {string} [salt] - Optional salt
   * @returns {string} Hashed data
   */
  static hash(data, salt = null) {
    try {
      const useSalt = salt || crypto.randomBytes(this.saltLength);
      const hash = crypto.pbkdf2Sync(
        data,
        useSalt,
        100000, // iterations
        64, // key length
        'sha512'
      );

      return `${hash.toString('hex')}.${useSalt.toString('hex')}`;
    } catch (error) {
      LoggerService.error('Hashing error:', error);
      throw new Error('Hashing failed');
    }
  }

  /**
   * Verify hash
   * @param {string} data - Data to verify
   * @param {string} hashedData - Hashed data to compare against
   * @returns {boolean} Whether hash matches
   */
  static verifyHash(data, hashedData) {
    try {
      const [hash, salt] = hashedData.split('.');
      const verifyHash = this.hash(data, Buffer.from(salt, 'hex'));
      return verifyHash === hashedData;
    } catch (error) {
      LoggerService.error('Hash verification error:', error);
      throw new Error('Hash verification failed');
    }
  }

  /**
   * Generate random token
   * @param {number} [length=32] - Token length
   * @returns {string} Random token
   */
  static generateToken(length = 32) {
    try {
      return crypto.randomBytes(length).toString('hex');
    } catch (error) {
      LoggerService.error('Token generation error:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Encrypt file
   * @param {Buffer} fileData - File data to encrypt
   * @returns {Object} Encrypted file data and metadata
   */
  static encryptFile(fileData) {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.getKey(),
        iv
      );

      // Encrypt file data
      const encryptedData = Buffer.concat([
        cipher.update(fileData),
        cipher.final()
      ]);

      // Get auth tag
      const tag = cipher.getAuthTag();

      return {
        data: encryptedData,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      LoggerService.error('File encryption error:', error);
      throw new Error('File encryption failed');
    }
  }

  /**
   * Decrypt file
   * @param {Object} encryptedFile - Encrypted file data and metadata
   * @returns {Buffer} Decrypted file data
   */
  static decryptFile(encryptedFile) {
    try {
      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.getKey(),
        Buffer.from(encryptedFile.iv, 'hex')
      );

      // Set auth tag
      decipher.setAuthTag(Buffer.from(encryptedFile.tag, 'hex'));

      // Decrypt file data
      return Buffer.concat([
        decipher.update(encryptedFile.data),
        decipher.final()
      ]);
    } catch (error) {
      LoggerService.error('File decryption error:', error);
      throw new Error('File decryption failed');
    }
  }

  /**
   * Generate secure password
   * @param {Object} [options] - Password options
   * @returns {string} Secure password
   */
  static generatePassword(options = {}) {
    try {
      const defaults = {
        length: 16,
        numbers: true,
        symbols: true,
        uppercase: true,
        lowercase: true
      };

      const config = { ...defaults, ...options };
      const chars = {
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz'
      };

      let allowedChars = '';
      Object.keys(chars).forEach(key => {
        if (config[key]) {
          allowedChars += chars[key];
        }
      });

      let password = '';
      for (let i = 0; i < config.length; i++) {
        password += allowedChars[crypto.randomInt(0, allowedChars.length)];
      }

      return password;
    } catch (error) {
      LoggerService.error('Password generation error:', error);
      throw new Error('Password generation failed');
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  static validatePasswordStrength(password) {
    const result = {
      isValid: false,
      score: 0,
      feedback: []
    };

    // Length check
    if (password.length < 8) {
      result.feedback.push('Password should be at least 8 characters long');
    } else {
      result.score += 1;
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      result.feedback.push('Password should contain uppercase letters');
    } else {
      result.score += 1;
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
      result.feedback.push('Password should contain lowercase letters');
    } else {
      result.score += 1;
    }

    // Number check
    if (!/\d/.test(password)) {
      result.feedback.push('Password should contain numbers');
    } else {
      result.score += 1;
    }

    // Special character check
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.feedback.push('Password should contain special characters');
    } else {
      result.score += 1;
    }

    result.isValid = result.score >= 4;
    return result;
  }
}

module.exports = EncryptionService;