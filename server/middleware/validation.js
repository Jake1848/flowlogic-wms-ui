/**
 * Input validation middleware for API routes
 */

// Common validation helpers
const isValidUUID = (str) => {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const isValidDate = (str) => {
  if (!str) return false;
  const date = new Date(str);
  return !isNaN(date.getTime());
};

const isPositiveInteger = (val) => {
  const num = parseInt(val, 10);
  return !isNaN(num) && num > 0 && String(num) === String(val);
};

const isNonNegativeNumber = (val) => {
  const num = parseFloat(val);
  return !isNaN(num) && num >= 0;
};

const sanitizeString = (str, maxLength = 1000) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
};

// Validation error class
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

// Validate required fields
export function validateRequired(fields) {
  return (req, res, next) => {
    const missing = [];
    for (const field of fields) {
      const value = field.includes('.')
        ? field.split('.').reduce((obj, key) => obj?.[key], req.body)
        : req.body[field];

      if (value === undefined || value === null || value === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        fields: missing,
      });
    }

    next();
  };
}

// Validate UUID parameters
export function validateUUID(...params) {
  return (req, res, next) => {
    const invalid = [];

    for (const param of params) {
      const value = req.params[param] || req.query[param] || req.body[param];
      if (value && !isValidUUID(value)) {
        invalid.push(param);
      }
    }

    if (invalid.length > 0) {
      return res.status(400).json({
        error: 'Invalid UUID format',
        fields: invalid,
      });
    }

    next();
  };
}

// Validate pagination parameters
export function validatePagination(req, res, next) {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        error: 'Invalid page parameter',
        message: 'Page must be a positive integer',
      });
    }
    req.query.page = pageNum;
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: 'Invalid limit parameter',
        message: 'Limit must be between 1 and 100',
      });
    }
    req.query.limit = limitNum;
  }

  next();
}

// Validate date range
export function validateDateRange(startField = 'startDate', endField = 'endDate') {
  return (req, res, next) => {
    const start = req.query[startField] || req.body[startField];
    const end = req.query[endField] || req.body[endField];

    if (start && !isValidDate(start)) {
      return res.status(400).json({
        error: 'Invalid date format',
        field: startField,
      });
    }

    if (end && !isValidDate(end)) {
      return res.status(400).json({
        error: 'Invalid date format',
        field: endField,
      });
    }

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (startDate > endDate) {
        return res.status(400).json({
          error: 'Invalid date range',
          message: `${startField} must be before ${endField}`,
        });
      }
    }

    next();
  };
}

// Validate quantity fields
export function validateQuantity(...fields) {
  return (req, res, next) => {
    const invalid = [];

    for (const field of fields) {
      const value = req.body[field];
      if (value !== undefined && !isNonNegativeNumber(value)) {
        invalid.push(field);
      }
    }

    if (invalid.length > 0) {
      return res.status(400).json({
        error: 'Invalid quantity',
        message: 'Quantity must be a non-negative number',
        fields: invalid,
      });
    }

    next();
  };
}

// Validate enum values
export function validateEnum(field, validValues, options = {}) {
  const { allowEmpty = false, location = 'body' } = options;

  return (req, res, next) => {
    const source = location === 'query' ? req.query : req.body;
    const value = source[field];

    if (!value && allowEmpty) {
      return next();
    }

    if (value && !validValues.includes(value)) {
      return res.status(400).json({
        error: 'Invalid value',
        field,
        message: `Value must be one of: ${validValues.join(', ')}`,
      });
    }

    next();
  };
}

// Sanitize string fields
export function sanitizeFields(...fields) {
  return (req, res, next) => {
    for (const field of fields) {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = sanitizeString(req.body[field]);
      }
    }
    next();
  };
}

// Validate array field
export function validateArray(field, options = {}) {
  const { minLength = 0, maxLength = 1000, itemValidator } = options;

  return (req, res, next) => {
    const value = req.body[field];

    if (value === undefined) {
      return next();
    }

    if (!Array.isArray(value)) {
      return res.status(400).json({
        error: 'Invalid field type',
        field,
        message: 'Field must be an array',
      });
    }

    if (value.length < minLength) {
      return res.status(400).json({
        error: 'Array too short',
        field,
        message: `Array must have at least ${minLength} items`,
      });
    }

    if (value.length > maxLength) {
      return res.status(400).json({
        error: 'Array too long',
        field,
        message: `Array must have at most ${maxLength} items`,
      });
    }

    if (itemValidator) {
      for (let i = 0; i < value.length; i++) {
        const error = itemValidator(value[i], i);
        if (error) {
          return res.status(400).json({
            error: 'Invalid array item',
            field: `${field}[${i}]`,
            message: error,
          });
        }
      }
    }

    next();
  };
}

// Combine multiple validators
export function validate(...validators) {
  return async (req, res, next) => {
    for (const validator of validators) {
      let hasError = false;
      const tempNext = (err) => {
        if (err) hasError = true;
      };

      await new Promise((resolve) => {
        validator(req, res, (err) => {
          if (err) hasError = true;
          resolve();
        });
      });

      // Check if response was sent
      if (res.headersSent) {
        return;
      }
    }

    next();
  };
}

// Common WMS validations
export const wmsValidators = {
  // Order status values
  orderStatus: ['NEW', 'PENDING', 'ALLOCATED', 'PICKING', 'PICKED', 'PACKING', 'PACKED', 'SHIPPING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'ON_HOLD'],

  // Task status values
  taskStatus: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],

  // Task types
  taskType: ['PICKING', 'PUTAWAY', 'REPLENISHMENT', 'CYCLE_COUNT', 'MOVE', 'RECEIVE', 'SHIP', 'PACK', 'TRANSFER', 'ADJUSTMENT'],

  // Priority levels
  priority: ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'],

  // Alert severity
  alertSeverity: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],

  // Location types
  locationType: ['RECEIVING', 'PUTAWAY', 'PICK', 'BULK', 'RESERVE', 'STAGING', 'SHIPPING', 'DAMAGED', 'RETURNS', 'QC'],

  // Labor activity types
  activityType: ['PICKING', 'PACKING', 'RECEIVING', 'PUTAWAY', 'REPLENISHMENT', 'CYCLE_COUNT', 'SHIPPING', 'LOADING', 'BREAK', 'LUNCH', 'MEETING', 'TRAINING', 'CLEANING', 'MAINTENANCE', 'IDLE', 'OTHER'],

  // Cycle count status
  cycleCountStatus: ['NEW', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED', 'CANCELLED'],

  // Shipment status
  shipmentStatus: ['NEW', 'PACKING', 'PACKED', 'LABELED', 'STAGED', 'SHIPPED', 'DELIVERED', 'EXCEPTION'],

  // Receipt status
  receiptStatus: ['NEW', 'CHECKED_IN', 'RECEIVING', 'COMPLETED', 'EXCEPTION'],
};

export {
  isValidUUID,
  isValidDate,
  isPositiveInteger,
  isNonNegativeNumber,
  sanitizeString,
  ValidationError,
};
