/**
 * Test helper for API route testing
 * Creates a minimal Express app with mocked Prisma client
 */
import express from 'express';
import { jest } from '@jest/globals';

// Valid UUIDs for testing
export const TEST_IDS = {
  order1: '550e8400-e29b-41d4-a716-446655440001',
  order2: '550e8400-e29b-41d4-a716-446655440002',
  task1: '550e8400-e29b-41d4-a716-446655440011',
  task2: '550e8400-e29b-41d4-a716-446655440012',
  alert1: '550e8400-e29b-41d4-a716-446655440021',
  alert2: '550e8400-e29b-41d4-a716-446655440022',
  customer1: '550e8400-e29b-41d4-a716-446655440031',
  customer2: '550e8400-e29b-41d4-a716-446655440032',
  warehouse1: '550e8400-e29b-41d4-a716-446655440041',
  user1: '550e8400-e29b-41d4-a716-446655440051',
  product1: '550e8400-e29b-41d4-a716-446655440061',
  location1: '550e8400-e29b-41d4-a716-446655440071',
  carrier1: '550e8400-e29b-41d4-a716-446655440081',
  inventory1: '550e8400-e29b-41d4-a716-446655440091',
};

// Create mock Prisma client for testing
export function createMockPrisma() {
  const mockData = {
    orders: [
      {
        id: TEST_IDS.order1,
        orderNumber: 'ORD-001',
        status: 'PENDING',
        customerId: TEST_IDS.customer1,
        warehouseId: TEST_IDS.warehouse1,
        priority: 5,
        totalLines: 3,
        totalUnits: 100,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        customer: { id: TEST_IDS.customer1, code: 'CUST01', name: 'Test Customer' },
        carrier: null,
        wave: null,
        _count: { lines: 3, shipments: 0 },
      },
      {
        id: TEST_IDS.order2,
        orderNumber: 'ORD-002',
        status: 'SHIPPED',
        customerId: TEST_IDS.customer2,
        warehouseId: TEST_IDS.warehouse1,
        priority: 3,
        totalLines: 1,
        totalUnits: 50,
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-15'),
        customer: { id: TEST_IDS.customer2, code: 'CUST02', name: 'Another Customer' },
        carrier: { id: TEST_IDS.carrier1, code: 'FEDEX', name: 'FedEx' },
        wave: null,
        _count: { lines: 1, shipments: 1 },
      },
    ],
    tasks: [
      {
        id: TEST_IDS.task1,
        taskNumber: 'TSK-PIC-000001',
        type: 'PICKING',
        status: 'PENDING',
        priority: 3,
        warehouseId: TEST_IDS.warehouse1,
        assignedToId: null,
        totalLines: 5,
        totalUnits: 25,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: TEST_IDS.task2,
        taskNumber: 'TSK-PUT-000001',
        type: 'PUTAWAY',
        status: 'IN_PROGRESS',
        priority: 5,
        warehouseId: TEST_IDS.warehouse1,
        assignedToId: TEST_IDS.user1,
        totalLines: 3,
        totalUnits: 15,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        assignedTo: { id: TEST_IDS.user1, fullName: 'John Doe', username: 'jdoe' },
      },
    ],
    alerts: [
      {
        id: TEST_IDS.alert1,
        type: 'LOW_STOCK',
        severity: 'WARNING',
        title: 'Low Stock Alert',
        message: 'Product SKU-001 is below reorder point',
        warehouseId: TEST_IDS.warehouse1,
        isRead: false,
        isResolved: false,
        createdAt: new Date('2024-01-15'),
      },
      {
        id: TEST_IDS.alert2,
        type: 'ORDER_LATE',
        severity: 'CRITICAL',
        title: 'Late Order',
        message: 'Order ORD-001 is past due date',
        warehouseId: TEST_IDS.warehouse1,
        isRead: false,
        isResolved: false,
        createdAt: new Date('2024-01-14'),
      },
    ],
    inventory: [
      {
        id: TEST_IDS.inventory1,
        productId: TEST_IDS.product1,
        warehouseId: TEST_IDS.warehouse1,
        locationId: TEST_IDS.location1,
        quantityOnHand: 100,
        quantityAllocated: 20,
        quantityAvailable: 80,
        status: 'AVAILABLE',
        product: { id: TEST_IDS.product1, sku: 'SKU-001', name: 'Widget A' },
        location: { id: TEST_IDS.location1, code: 'A-01-01' },
      },
    ],
  };

  return {
    order: {
      findMany: jest.fn().mockResolvedValue(mockData.orders),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const order = mockData.orders.find(o => o.id === where.id);
        return Promise.resolve(order || null);
      }),
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(mockData.orders.length),
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: 'new-order', orderNumber: 'ORD-003', ...data })
      ),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const order = mockData.orders.find(o => o.id === where.id);
        return Promise.resolve(order ? { ...order, ...data } : null);
      }),
      groupBy: jest.fn().mockResolvedValue([
        { status: 'PENDING', _count: 5 },
        { status: 'SHIPPED', _count: 10 },
      ]),
    },
    task: {
      findMany: jest.fn().mockResolvedValue(mockData.tasks),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const task = mockData.tasks.find(t => t.id === where.id);
        return Promise.resolve(task || null);
      }),
      findFirst: jest.fn().mockResolvedValue(mockData.tasks[0]),
      count: jest.fn().mockResolvedValue(mockData.tasks.length),
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: 'new-task', taskNumber: 'TSK-NEW-000001', ...data })
      ),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const task = mockData.tasks.find(t => t.id === where.id);
        return Promise.resolve(task ? { ...task, ...data } : null);
      }),
      groupBy: jest.fn().mockResolvedValue([
        { status: 'PENDING', _count: 5 },
        { status: 'IN_PROGRESS', _count: 3 },
      ]),
    },
    alert: {
      findMany: jest.fn().mockResolvedValue(mockData.alerts),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const alert = mockData.alerts.find(a => a.id === where.id);
        return Promise.resolve(alert || null);
      }),
      findFirst: jest.fn().mockResolvedValue(mockData.alerts[0]),
      count: jest.fn().mockResolvedValue(mockData.alerts.length),
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: 'new-alert', ...data, createdAt: new Date() })
      ),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const alert = mockData.alerts.find(a => a.id === where.id);
        return Promise.resolve(alert ? { ...alert, ...data } : null);
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
      groupBy: jest.fn().mockResolvedValue([
        { severity: 'WARNING', _count: 1 },
        { severity: 'CRITICAL', _count: 1 },
      ]),
    },
    inventory: {
      findMany: jest.fn().mockResolvedValue(mockData.inventory),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const inv = mockData.inventory.find(i => i.id === where.id);
        return Promise.resolve(inv || null);
      }),
      count: jest.fn().mockResolvedValue(mockData.inventory.length),
      aggregate: jest.fn().mockResolvedValue({
        _sum: { quantityOnHand: 100, quantityAllocated: 20 },
      }),
    },
    orderLine: {
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ count: 10 }]),
    $queryRawUnsafe: jest.fn().mockResolvedValue([{ count: 10 }]),
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn().mockImplementation(async (callback) => {
      // For transaction callbacks, pass the mock prisma client
      if (typeof callback === 'function') {
        const txClient = {
          order: {
            create: jest.fn().mockResolvedValue({
              id: 'new-order-id',
              orderNumber: 'ORD-003',
              status: 'PENDING',
            }),
            findFirst: jest.fn().mockResolvedValue(null),
          },
          orderLine: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(txClient);
      }
      // For array of promises
      return Promise.all(callback);
    }),
  };
}

// Create Express app for testing
export function createTestApp(routeSetup) {
  const app = express();
  app.use(express.json());

  const mockPrisma = createMockPrisma();
  routeSetup(app, mockPrisma);

  return { app, mockPrisma };
}
