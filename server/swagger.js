/**
 * OpenAPI/Swagger Configuration for FlowLogic WMS API
 */
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FlowLogic WMS API',
      version: '1.0.0',
      description: `
# FlowLogic Warehouse Management System API

A comprehensive REST API for warehouse management operations including:
- **Inventory Management** - Track stock levels, locations, and movements
- **Order Processing** - Manage customer orders from creation to shipment
- **Receiving** - Handle inbound shipments and putaway operations
- **Shipping** - Manage outbound shipments and carrier integrations
- **Task Management** - Assign and track warehouse tasks
- **Labor Management** - Track employee productivity and time
- **Alerts** - Real-time notifications and system alerts

## Authentication
All endpoints (except /api/auth/login) require a valid JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <token>
\`\`\`

## Rate Limiting
API requests are limited to 100 requests per minute per user.

## Error Handling
All errors follow a consistent format:
\`\`\`json
{
  "error": "Error message",
  "field": "fieldName" // Optional, for validation errors
}
\`\`\`
      `,
      contact: {
        name: 'FlowLogic Support',
        email: 'support@flowlogic.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.flowlogic.com',
        description: 'Production server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Warehouses', description: 'Warehouse configuration' },
      { name: 'Inventory', description: 'Inventory management' },
      { name: 'Products', description: 'Product catalog' },
      { name: 'Orders', description: 'Order processing' },
      { name: 'Receiving', description: 'Inbound operations' },
      { name: 'Shipping', description: 'Outbound operations' },
      { name: 'Tasks', description: 'Task management' },
      { name: 'Alerts', description: 'System alerts' },
      { name: 'Labor', description: 'Labor management' },
      { name: 'Vendors', description: 'Vendor management' },
      { name: 'Customers', description: 'Customer management' },
      { name: 'Carriers', description: 'Carrier management' },
      { name: 'Locations', description: 'Warehouse locations' },
      { name: 'Reports', description: 'Reporting endpoints' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        // Common schemas
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 50 },
            total: { type: 'integer', example: 100 },
            pages: { type: 'integer', example: 2 },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' },
            field: { type: 'string', example: 'fieldName' },
          },
        },
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string', example: 'jdoe' },
            email: { type: 'string', format: 'email' },
            fullName: { type: 'string', example: 'John Doe' },
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'VIEWER'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Warehouse schemas
        Warehouse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'WH-001' },
            name: { type: 'string', example: 'Main Warehouse' },
            address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zipCode: { type: 'string' },
            country: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Product schemas
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            sku: { type: 'string', example: 'SKU-001' },
            name: { type: 'string', example: 'Widget A' },
            description: { type: 'string' },
            upc: { type: 'string' },
            weight: { type: 'number', format: 'float' },
            length: { type: 'number', format: 'float' },
            width: { type: 'number', format: 'float' },
            height: { type: 'number', format: 'float' },
            unitCost: { type: 'number', format: 'float' },
            unitPrice: { type: 'number', format: 'float' },
            reorderPoint: { type: 'integer' },
            reorderQty: { type: 'integer' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Inventory schemas
        Inventory: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            productId: { type: 'string', format: 'uuid' },
            warehouseId: { type: 'string', format: 'uuid' },
            locationId: { type: 'string', format: 'uuid' },
            quantityOnHand: { type: 'integer' },
            quantityAllocated: { type: 'integer' },
            quantityAvailable: { type: 'integer' },
            lotNumber: { type: 'string' },
            expirationDate: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['AVAILABLE', 'ALLOCATED', 'QUARANTINE', 'DAMAGED'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Order schemas
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            orderNumber: { type: 'string', example: 'ORD-001' },
            customerId: { type: 'string', format: 'uuid' },
            warehouseId: { type: 'string', format: 'uuid' },
            status: {
              type: 'string',
              enum: ['NEW', 'PENDING', 'ALLOCATED', 'PICKING', 'PICKED', 'PACKING', 'PACKED', 'SHIPPING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'ON_HOLD'],
            },
            priority: { type: 'integer', minimum: 1, maximum: 10 },
            requiredDate: { type: 'string', format: 'date-time' },
            shippedDate: { type: 'string', format: 'date-time' },
            totalLines: { type: 'integer' },
            totalUnits: { type: 'integer' },
            totalWeight: { type: 'number', format: 'float' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        OrderLine: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            orderId: { type: 'string', format: 'uuid' },
            productId: { type: 'string', format: 'uuid' },
            lineNumber: { type: 'integer' },
            quantityOrdered: { type: 'integer' },
            quantityAllocated: { type: 'integer' },
            quantityPicked: { type: 'integer' },
            quantityShipped: { type: 'integer' },
            status: { type: 'string', enum: ['PENDING', 'ALLOCATED', 'PICKING', 'PICKED', 'SHIPPED'] },
          },
        },
        // Task schemas
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            taskNumber: { type: 'string', example: 'TSK-PIC-000001' },
            type: {
              type: 'string',
              enum: ['PICKING', 'PUTAWAY', 'REPLENISHMENT', 'CYCLE_COUNT', 'MOVE', 'RECEIVE', 'SHIP', 'PACK', 'TRANSFER', 'ADJUSTMENT'],
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            },
            priority: { type: 'integer', minimum: 1, maximum: 10 },
            warehouseId: { type: 'string', format: 'uuid' },
            assignedToId: { type: 'string', format: 'uuid' },
            orderId: { type: 'string', format: 'uuid' },
            totalLines: { type: 'integer' },
            totalUnits: { type: 'integer' },
            completedLines: { type: 'integer' },
            completedUnits: { type: 'integer' },
            startedAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Alert schemas
        Alert: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string', example: 'LOW_STOCK' },
            severity: { type: 'string', enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'] },
            title: { type: 'string', example: 'Low Stock Alert' },
            message: { type: 'string' },
            warehouseId: { type: 'string', format: 'uuid' },
            entityType: { type: 'string', example: 'Product' },
            entityId: { type: 'string', format: 'uuid' },
            isRead: { type: 'boolean' },
            isResolved: { type: 'boolean' },
            resolvedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Vendor schemas
        Vendor: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'VND-001' },
            name: { type: 'string', example: 'Acme Supplies' },
            contactName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
            leadTimeDays: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Customer schemas
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'CUST-001' },
            name: { type: 'string', example: 'ABC Corporation' },
            contactName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zipCode: { type: 'string' },
            country: { type: 'string' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Labor schemas
        LaborEntry: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            warehouseId: { type: 'string', format: 'uuid' },
            taskId: { type: 'string', format: 'uuid' },
            activityType: {
              type: 'string',
              enum: ['PICKING', 'PACKING', 'RECEIVING', 'PUTAWAY', 'REPLENISHMENT', 'CYCLE_COUNT', 'SHIPPING', 'LOADING', 'BREAK', 'LUNCH', 'MEETING', 'TRAINING', 'CLEANING', 'MAINTENANCE', 'IDLE', 'OTHER'],
            },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            durationMinutes: { type: 'integer' },
            unitsProcessed: { type: 'integer' },
            linesProcessed: { type: 'integer' },
          },
        },
        // Location schemas
        Location: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            warehouseId: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'A-01-01' },
            zone: { type: 'string', example: 'A' },
            aisle: { type: 'string', example: '01' },
            bay: { type: 'string', example: '01' },
            level: { type: 'string', example: '1' },
            position: { type: 'string' },
            type: {
              type: 'string',
              enum: ['RECEIVING', 'PUTAWAY', 'PICK', 'BULK', 'RESERVE', 'STAGING', 'SHIPPING', 'DAMAGED', 'RETURNS', 'QC'],
            },
            capacity: { type: 'integer' },
            isActive: { type: 'boolean' },
          },
        },
        // Carrier schemas
        Carrier: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'FEDEX' },
            name: { type: 'string', example: 'FedEx' },
            contactName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            accountNumber: { type: 'string' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Unauthorized' },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Resource not found' },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Missing required fields', fields: ['name', 'email'] },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
