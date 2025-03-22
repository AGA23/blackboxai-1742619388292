const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { LoggerService } = require('./logger.service');
const { ValidationService } = require('./validation.service');
const { EncryptionService } = require('./encryption.service');

class FileService {
  static UPLOAD_DIR = path.join(__dirname, '../../uploads');
  static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  static ALLOWED_MIME_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    medical: ['application/dicom', '.dcm']
  };

  /**
   * Initialize upload directory
   */
  static async init() {
    try {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
      LoggerService.info('Upload directory initialized');
    } catch (error) {
      LoggerService.error('Error initializing upload directory:', error);
      throw error;
    }
  }

  /**
   * Configure multer storage
   * @private
   */
  static storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const dir = path.join(this.UPLOAD_DIR, file.fieldname);
        await fs.mkdir(dir, { recursive: true });
        cb(null, dir);
      } catch (error) {
        cb(error);
      }
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  });

  /**
   * Configure multer upload
   * @param {Object} options - Upload options
   * @returns {Object} Multer upload instance
   */
  static upload(options = {}) {
    return multer({
      storage: this.storage,
      limits: {
        fileSize: options.maxSize || this.MAX_FILE_SIZE
      },
      fileFilter: (req, file, cb) => {
        this.validateFile(file, options.allowedTypes)
          .then(() => cb(null, true))
          .catch(error => cb(error));
      }
    });
  }

  /**
   * Validate file
   * @private
   * @param {Object} file - File object
   * @param {Array} [allowedTypes] - Allowed MIME types
   * @returns {Promise<void>}
   */
  static async validateFile(file, allowedTypes) {
    try {
      const types = allowedTypes || [
        ...this.ALLOWED_MIME_TYPES.image,
        ...this.ALLOWED_MIME_TYPES.document
      ];

      if (!ValidationService.isValidFileType(file.mimetype, types)) {
        throw new Error('Invalid file type');
      }

      if (!ValidationService.isValidFileSize(file.size, this.MAX_FILE_SIZE)) {
        throw new Error('File too large');
      }
    } catch (error) {
      LoggerService.error('File validation error:', error);
      throw error;
    }
  }

  /**
   * Save file
   * @param {Object} file - File object
   * @param {Object} options - Save options
   * @returns {Promise<Object>} Saved file info
   */
  static async saveFile(file, options = {}) {
    try {
      const fileData = await fs.readFile(file.path);
      let processedData = fileData;

      // Encrypt file if needed
      if (options.encrypt) {
        const encrypted = EncryptionService.encryptFile(fileData);
        processedData = encrypted.data;
        file.metadata = {
          iv: encrypted.iv,
          tag: encrypted.tag
        };
      }

      // Save file metadata
      const metadata = {
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedAt: new Date(),
        ...file.metadata
      };

      // Save metadata to database if needed
      if (options.saveMetadata) {
        // Implement database save logic
      }

      return metadata;
    } catch (error) {
      LoggerService.error('Error saving file:', error);
      throw error;
    }
  }

  /**
   * Read file
   * @param {string} filepath - File path
   * @param {Object} options - Read options
   * @returns {Promise<Buffer>} File data
   */
  static async readFile(filepath, options = {}) {
    try {
      const fileData = await fs.readFile(filepath);

      // Decrypt file if needed
      if (options.decrypt && options.metadata) {
        return EncryptionService.decryptFile({
          data: fileData,
          iv: options.metadata.iv,
          tag: options.metadata.tag
        });
      }

      return fileData;
    } catch (error) {
      LoggerService.error('Error reading file:', error);
      throw error;
    }
  }

  /**
   * Delete file
   * @param {string} filepath - File path
   * @returns {Promise<void>}
   */
  static async deleteFile(filepath) {
    try {
      await fs.unlink(filepath);
      LoggerService.info(`File deleted: ${filepath}`);
    } catch (error) {
      LoggerService.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Move file
   * @param {string} source - Source path
   * @param {string} destination - Destination path
   * @returns {Promise<void>}
   */
  static async moveFile(source, destination) {
    try {
      await fs.rename(source, destination);
      LoggerService.info(`File moved: ${source} -> ${destination}`);
    } catch (error) {
      LoggerService.error('Error moving file:', error);
      throw error;
    }
  }

  /**
   * Copy file
   * @param {string} source - Source path
   * @param {string} destination - Destination path
   * @returns {Promise<void>}
   */
  static async copyFile(source, destination) {
    try {
      await fs.copyFile(source, destination);
      LoggerService.info(`File copied: ${source} -> ${destination}`);
    } catch (error) {
      LoggerService.error('Error copying file:', error);
      throw error;
    }
  }

  /**
   * List files in directory
   * @param {string} directory - Directory path
   * @returns {Promise<Array>} List of files
   */
  static async listFiles(directory) {
    try {
      const files = await fs.readdir(directory);
      const fileStats = await Promise.all(
        files.map(async file => {
          const filepath = path.join(directory, file);
          const stats = await fs.stat(filepath);
          return {
            name: file,
            path: filepath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            isDirectory: stats.isDirectory()
          };
        })
      );
      return fileStats;
    } catch (error) {
      LoggerService.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Create directory
   * @param {string} directory - Directory path
   * @returns {Promise<void>}
   */
  static async createDirectory(directory) {
    try {
      await fs.mkdir(directory, { recursive: true });
      LoggerService.info(`Directory created: ${directory}`);
    } catch (error) {
      LoggerService.error('Error creating directory:', error);
      throw error;
    }
  }

  /**
   * Delete directory
   * @param {string} directory - Directory path
   * @returns {Promise<void>}
   */
  static async deleteDirectory(directory) {
    try {
      await fs.rmdir(directory, { recursive: true });
      LoggerService.info(`Directory deleted: ${directory}`);
    } catch (error) {
      LoggerService.error('Error deleting directory:', error);
      throw error;
    }
  }

  /**
   * Clean upload directory
   * @param {number} [maxAge=86400000] - Maximum file age in milliseconds (default: 24 hours)
   * @returns {Promise<void>}
   */
  static async cleanUploadDirectory(maxAge = 86400000) {
    try {
      const files = await this.listFiles(this.UPLOAD_DIR);
      const now = Date.now();

      await Promise.all(
        files.map(async file => {
          if (!file.isDirectory && now - file.created > maxAge) {
            await this.deleteFile(file.path);
          }
        })
      );

      LoggerService.info('Upload directory cleaned');
    } catch (error) {
      LoggerService.error('Error cleaning upload directory:', error);
      throw error;
    }
  }
}

module.exports = FileService;