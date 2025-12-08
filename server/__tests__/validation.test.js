import {
  isValidUUID,
  isValidDate,
  isPositiveInteger,
  isNonNegativeNumber,
  sanitizeString,
  validateRequired,
  validateUUID,
  validatePagination,
  validateQuantity,
  validateEnum,
  wmsValidators,
} from '../middleware/validation.js';

describe('Validation Helpers', () => {
  describe('isValidUUID', () => {
    it('returns true for valid UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('returns false for invalid UUIDs', () => {
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID(null)).toBe(false);
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isValidUUID(12345)).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('returns true for valid dates', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('2024-01-15T10:30:00Z')).toBe(true);
      expect(isValidDate(new Date().toISOString())).toBe(true);
    });

    it('returns false for invalid dates', () => {
      expect(isValidDate('')).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate('not-a-date')).toBe(false);
      expect(isValidDate('2024-13-45')).toBe(false);
    });
  });

  describe('isPositiveInteger', () => {
    it('returns true for positive integers', () => {
      expect(isPositiveInteger(1)).toBe(true);
      expect(isPositiveInteger(100)).toBe(true);
      expect(isPositiveInteger('50')).toBe(true);
    });

    it('returns false for non-positive or non-integers', () => {
      expect(isPositiveInteger(0)).toBe(false);
      expect(isPositiveInteger(-1)).toBe(false);
      expect(isPositiveInteger(1.5)).toBe(false);
      expect(isPositiveInteger('abc')).toBe(false);
    });
  });

  describe('isNonNegativeNumber', () => {
    it('returns true for non-negative numbers', () => {
      expect(isNonNegativeNumber(0)).toBe(true);
      expect(isNonNegativeNumber(100)).toBe(true);
      expect(isNonNegativeNumber(1.5)).toBe(true);
      expect(isNonNegativeNumber('50.5')).toBe(true);
    });

    it('returns false for negative numbers', () => {
      expect(isNonNegativeNumber(-1)).toBe(false);
      expect(isNonNegativeNumber(-0.5)).toBe(false);
      expect(isNonNegativeNumber('abc')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('truncates to max length', () => {
      expect(sanitizeString('hello world', 5)).toBe('hello');
    });

    it('handles non-strings', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123)).toBe('');
    });
  });
});

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('validateRequired', () => {
    it('calls next when all required fields are present', () => {
      req.body = { name: 'Test', email: 'test@example.com' };
      const middleware = validateRequired(['name', 'email']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 400 when required fields are missing', () => {
      req.body = { name: 'Test' };
      const middleware = validateRequired(['name', 'email']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Missing required fields',
          fields: ['email'],
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('handles empty strings as missing', () => {
      req.body = { name: '', email: 'test@example.com' };
      const middleware = validateRequired(['name', 'email']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          fields: ['name'],
        })
      );
    });
  });

  describe('validateUUID', () => {
    it('calls next for valid UUIDs', () => {
      req.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      const middleware = validateUUID('id');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('returns 400 for invalid UUIDs', () => {
      req.params = { id: 'not-a-uuid' };
      const middleware = validateUUID('id');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid UUID format',
        })
      );
    });
  });

  describe('validatePagination', () => {
    it('calls next for valid pagination params', () => {
      req.query = { page: '1', limit: '50' };

      validatePagination(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.page).toBe(1);
      expect(req.query.limit).toBe(50);
    });

    it('returns 400 for invalid page', () => {
      req.query = { page: '0' };

      validatePagination(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid page parameter',
        })
      );
    });

    it('returns 400 for limit over 100', () => {
      req.query = { limit: '150' };

      validatePagination(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid limit parameter',
        })
      );
    });
  });

  describe('validateQuantity', () => {
    it('calls next for valid quantities', () => {
      req.body = { quantity: 100, amount: 50.5 };
      const middleware = validateQuantity('quantity', 'amount');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('returns 400 for negative quantities', () => {
      req.body = { quantity: -10 };
      const middleware = validateQuantity('quantity');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid quantity',
        })
      );
    });
  });

  describe('validateEnum', () => {
    it('calls next for valid enum value', () => {
      req.body = { status: 'PENDING' };
      const middleware = validateEnum('status', wmsValidators.orderStatus);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('returns 400 for invalid enum value', () => {
      req.body = { status: 'INVALID_STATUS' };
      const middleware = validateEnum('status', wmsValidators.orderStatus);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid value',
          field: 'status',
        })
      );
    });
  });
});

describe('WMS Validators', () => {
  it('has all required order statuses', () => {
    expect(wmsValidators.orderStatus).toContain('NEW');
    expect(wmsValidators.orderStatus).toContain('PENDING');
    expect(wmsValidators.orderStatus).toContain('PICKING');
    expect(wmsValidators.orderStatus).toContain('SHIPPED');
    expect(wmsValidators.orderStatus).toContain('DELIVERED');
    expect(wmsValidators.orderStatus).toContain('CANCELLED');
  });

  it('has all required task types', () => {
    expect(wmsValidators.taskType).toContain('PICKING');
    expect(wmsValidators.taskType).toContain('PUTAWAY');
    expect(wmsValidators.taskType).toContain('REPLENISHMENT');
    expect(wmsValidators.taskType).toContain('CYCLE_COUNT');
  });

  it('has all required priority levels', () => {
    expect(wmsValidators.priority).toContain('LOW');
    expect(wmsValidators.priority).toContain('NORMAL');
    expect(wmsValidators.priority).toContain('HIGH');
    expect(wmsValidators.priority).toContain('URGENT');
  });
});
