/**
 * Integration tests for Orders API routes
 */
import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import orderRoutes from '../../routes/orders.js';
import { createMockPrisma, TEST_IDS } from '../testHelper.js';

describe('Orders API Routes', () => {
  let app;
  let mockPrisma;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    mockPrisma = createMockPrisma();
    app.use('/api/orders', orderRoutes(mockPrisma));
  });

  describe('GET /api/orders', () => {
    it('returns a list of orders with pagination', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('filters orders by status', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ status: 'PENDING' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('filters orders by warehouse', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ warehouseId: '550e8400-e29b-41d4-a716-446655440000' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('supports search functionality', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ search: 'ORD-001' });

      expect(response.status).toBe(200);
    });

    it('validates pagination - rejects page 0', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ page: 0 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid page parameter');
    });

    it('validates pagination - rejects limit over 100', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ limit: 150 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid limit parameter');
    });
  });

  describe('GET /api/orders/summary', () => {
    it('returns order summary statistics', async () => {
      const response = await request(app).get('/api/orders/summary');

      expect(response.status).toBe(200);
    });

    it('accepts warehouseId filter', async () => {
      const response = await request(app)
        .get('/api/orders/summary')
        .query({ warehouseId: '550e8400-e29b-41d4-a716-446655440000' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('returns a single order by ID', async () => {
      const response = await request(app)
        .get(`/api/orders/${TEST_IDS.order1}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('returns 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/orders/not-a-uuid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid UUID format');
    });

    it('returns 404 for non-existent order', async () => {
      mockPrisma.order.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/orders/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Order not found');
    });
  });

  describe('POST /api/orders', () => {
    const validOrder = {
      warehouseId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      type: 'SALES',
      lines: [
        { productId: 'prod-1', quantityOrdered: 10 },
      ],
    };

    it('creates a new order with valid data', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send(validOrder);

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
    });

    it('returns 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({ customerId: 'cust-1' }); // Missing warehouseId

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('updates order status', async () => {
      const response = await request(app)
        .patch(`/api/orders/${TEST_IDS.order1}/status`)
        .send({ status: 'PICKING' });

      expect(response.status).toBe(200);
    });

    it('rejects invalid status', async () => {
      const response = await request(app)
        .patch(`/api/orders/${TEST_IDS.order1}/status`)
        .send({ status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
    });

    it('validates UUID parameter', async () => {
      const response = await request(app)
        .patch('/api/orders/not-a-uuid/status')
        .send({ status: 'PICKING' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid UUID format');
    });
  });
});

// Note: Error handling is tested at the middleware level in validation.test.js
// Route-level error handling would require integration with actual database
