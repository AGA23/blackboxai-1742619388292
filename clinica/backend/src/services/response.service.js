const { LoggerService } = require('./logger.service');

class ResponseService {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} [message='Success'] - Success message
   * @param {number} [status=200] - HTTP status code
   */
  static success(res, data, message = 'Success', status = 200) {
    try {
      res.status(status).json({
        success: true,
        message,
        data
      });
    } catch (error) {
      LoggerService.error('Error sending success response:', error);
      this.error(res);
    }
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {string} [message='Internal Server Error'] - Error message
   * @param {number} [status=500] - HTTP status code
   * @param {Object} [errors=null] - Validation errors
   */
  static error(res, message = 'Internal Server Error', status = 500, errors = null) {
    try {
      const response = {
        success: false,
        message
      };

      if (errors) {
        response.errors = errors;
      }

      res.status(status).json(response);
    } catch (error) {
      LoggerService.error('Error sending error response:', error);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  }

  /**
   * Send validation error response
   * @param {Object} res - Express response object
   * @param {Object} errors - Validation errors
   * @param {string} [message='Validation Error'] - Error message
   */
  static validationError(res, errors, message = 'Validation Error') {
    this.error(res, message, 422, errors);
  }

  /**
   * Send unauthorized response
   * @param {Object} res - Express response object
   * @param {string} [message='Unauthorized'] - Error message
   */
  static unauthorized(res, message = 'Unauthorized') {
    this.error(res, message, 401);
  }

  /**
   * Send forbidden response
   * @param {Object} res - Express response object
   * @param {string} [message='Forbidden'] - Error message
   */
  static forbidden(res, message = 'Forbidden') {
    this.error(res, message, 403);
  }

  /**
   * Send not found response
   * @param {Object} res - Express response object
   * @param {string} [message='Not Found'] - Error message
   */
  static notFound(res, message = 'Not Found') {
    this.error(res, message, 404);
  }

  /**
   * Send bad request response
   * @param {Object} res - Express response object
   * @param {string} [message='Bad Request'] - Error message
   * @param {Object} [errors=null] - Validation errors
   */
  static badRequest(res, message = 'Bad Request', errors = null) {
    this.error(res, message, 400, errors);
  }

  /**
   * Send conflict response
   * @param {Object} res - Express response object
   * @param {string} [message='Conflict'] - Error message
   */
  static conflict(res, message = 'Conflict') {
    this.error(res, message, 409);
  }

  /**
   * Send created response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} [message='Created Successfully'] - Success message
   */
  static created(res, data, message = 'Created Successfully') {
    this.success(res, data, message, 201);
  }

  /**
   * Send no content response
   * @param {Object} res - Express response object
   */
  static noContent(res) {
    res.status(204).end();
  }

  /**
   * Send paginated response
   * @param {Object} res - Express response object
   * @param {Array} data - Response data
   * @param {Object} pagination - Pagination info
   * @param {string} [message='Success'] - Success message
   */
  static paginated(res, data, pagination, message = 'Success') {
    this.success(res, {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        totalItems: pagination.totalItems,
        totalPages: pagination.totalPages
      }
    }, message);
  }

  /**
   * Send file response
   * @param {Object} res - Express response object
   * @param {Buffer} file - File buffer
   * @param {string} filename - File name
   * @param {string} mimetype - File MIME type
   */
  static file(res, file, filename, mimetype) {
    try {
      res.set({
        'Content-Type': mimetype,
        'Content-Disposition': `attachment; filename="${filename}"`
      });
      res.send(file);
    } catch (error) {
      LoggerService.error('Error sending file response:', error);
      this.error(res);
    }
  }

  /**
   * Send stream response
   * @param {Object} res - Express response object
   * @param {Stream} stream - Data stream
   * @param {string} filename - File name
   * @param {string} mimetype - File MIME type
   */
  static stream(res, stream, filename, mimetype) {
    try {
      res.set({
        'Content-Type': mimetype,
        'Content-Disposition': `attachment; filename="${filename}"`
      });
      stream.pipe(res);
    } catch (error) {
      LoggerService.error('Error sending stream response:', error);
      this.error(res);
    }
  }

  /**
   * Send too many requests response
   * @param {Object} res - Express response object
   * @param {string} [message='Too Many Requests'] - Error message
   * @param {number} [retryAfter=60] - Retry after seconds
   */
  static tooManyRequests(res, message = 'Too Many Requests', retryAfter = 60) {
    res.set('Retry-After', retryAfter);
    this.error(res, message, 429);
  }

  /**
   * Send service unavailable response
   * @param {Object} res - Express response object
   * @param {string} [message='Service Unavailable'] - Error message
   */
  static serviceUnavailable(res, message = 'Service Unavailable') {
    this.error(res, message, 503);
  }

  /**
   * Send accepted response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} [message='Request Accepted'] - Success message
   */
  static accepted(res, data, message = 'Request Accepted') {
    this.success(res, data, message, 202);
  }
}

module.exports = ResponseService;