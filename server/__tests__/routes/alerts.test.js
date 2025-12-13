/**
 * Integration tests for Alerts API routes
 */
import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import alertRoutes from '../../routes/alerts.js';
import { createMockPrisma, TEST_IDS } from '../testHelper.js';

describe('Alerts API Routes', () => {
  let app;
  let mockPrisma;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    mockPrisma = createMockPrisma();
    app.use('/api/alerts', alertRoutes(mockPrisma));
  });

  describe('GET /api/alerts', () => {
    it('returns a list of alerts with pagination', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('filters alerts by severity', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .query({ severity: 'CRITICAL' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('filters alerts by type', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .query({ type: 'LOW_STOCK' });

      expect(response.status).toBe(200);
    });

    it('filters alerts by isRead status', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .query({ isRead: 'false' });

      expect(response.status).toBe(200);
    });

    it('filters alerts by isResolved status', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .query({ isResolved: 'false' });

      expect(response.status).toBe(200);
    });

    it('validates pagination parameters', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .query({ page: 0 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid page parameter');
    });
  });

  describe('GET /api/alerts/summary', () => {
    it('returns alert summary statistics', async () => {
      const response = await request(app).get('/api/alerts/summary');

      expect(response.status).toBe(200);
    });

    it('accepts warehouseId filter', async () => {
      const response = await request(app)
        .get('/api/alerts/summary')
        .query({ warehouseId: '550e8400-e29b-41d4-a716-446655440000' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/alerts/unread', () => {
    it('returns unread alerts', async () => {
      const response = await request(app).get('/api/alerts/unread');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('accepts limit parameter', async () => {
      const response = await request(app)
        .get('/api/alerts/unread')
        .query({ limit: 5 });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/alerts/critical', () => {
    it('returns critical alerts', async () => {
      const response = await request(app).get('/api/alerts/critical');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/alerts/:id', () => {
    it('returns a single alert by ID', async () => {
      const response = await request(app)
        .get(`/api/alerts/${TEST_IDS.alert1}`);

      expect(response.status).toBe(200);
    });

    it('returns 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/alerts/not-a-uuid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid UUID format');
    });

    it('returns 404 for non-existent alert', async () => {
      mockPrisma.alert.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/alerts/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Alert not found');
    });
  });

  describe('POST /api/alerts', () => {
    const validAlert = {
      type: 'LOW_STOCK',
      severity: 'WARNING',
      title: 'Low Stock Alert',
      message: 'Product SKU-001 is below reorder point',
      warehouseId: '550e8400-e29b-41d4-a716-446655440000',
    };

    it('creates a new alert with valid data', async () => {
      const response = await request(app)
        .post('/api/alerts')
        .send(validAlert);

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
    });

    it('returns 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/alerts')
        .send({ title: 'Alert' }); // Missing type, severity, message

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });

    it('validates severity enum', async () => {
      const response = await request(app)
        .post('/api/alerts')
        .send({
          type: 'LOW_STOCK',
          severity: 'INVALID_SEVERITY',
          title: 'Alert',
          message: 'Test message',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid value');
      expect(response.body.field).toBe('severity');
    });
  });

  describe('PATCH /api/alerts/:id/read', () => {
    it('marks alert as read', async () => {
      const response = await request(app)
        .patch(`/api/alerts/${TEST_IDS.alert1}/read`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('validates UUID parameter', async () => {
      const response = await request(app)
        .patch('/api/alerts/not-a-uuid/read');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid UUID format');
    });
  });

  describe('PATCH /api/alerts/bulk-read', () => {
    it('marks multiple alerts as read', async () => {
      const response = await request(app)
        .patch('/api/alerts/bulk-read')
        .send({
          alertIds: [TEST_IDS.alert1, TEST_IDS.alert2],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('returns 400 when alertIds is missing', async () => {
      const response = await request(app)
        .patch('/api/alerts/bulk-read')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });

    it('returns 400 when alertIds is empty', async () => {
      const response = await request(app)
        .patch('/api/alerts/bulk-read')
        .send({ alertIds: [] });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/alerts/mark-all-read', () => {
    it('marks all alerts as read', async () => {
      const response = await request(app)
        .patch('/api/alerts/mark-all-read')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('accepts warehouseId filter', async () => {
      const response = await request(app)
        .patch('/api/alerts/mark-all-read')
        .send({ warehouseId: '550e8400-e29b-41d4-a716-446655440000' });

      expect(response.status).toBe(200);
    });
  });

  describe('PATCH /api/alerts/:id/resolve', () => {
    it('resolves an alert', async () => {
      const response = await request(app)
        .patch(`/api/alerts/${TEST_IDS.alert1}/resolve`)
        .send({ userId: TEST_IDS.user1 });

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('validates UUID parameter', async () => {
      const response = await request(app)
        .patch('/api/alerts/not-a-uuid/resolve')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/alerts/cleanup', () => {
    it('cleans up old resolved alerts', async () => {
      const response = await request(app)
        .delete('/api/alerts/cleanup')
        .query({ daysOld: 30 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.deleted).toBe(5);
    });
  });
});

// Note: Error handling is tested at the middleware level in validation.test.js
// Route-level error handling would require integration with actual database
