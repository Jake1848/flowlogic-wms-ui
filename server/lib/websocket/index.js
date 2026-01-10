/**
 * WebSocket Module (Socket.io)
 * Real-time communication for inventory updates, alerts, task assignments, etc.
 */

import { Server } from 'socket.io';

let io = null;

/**
 * Event types for WMS real-time updates
 */
export const WS_EVENTS = {
  // Inventory Events
  INVENTORY_UPDATED: 'inventory:updated',
  INVENTORY_LOW_STOCK: 'inventory:low_stock',
  INVENTORY_ADJUSTMENT: 'inventory:adjustment',

  // Order Events
  ORDER_CREATED: 'order:created',
  ORDER_STATUS_CHANGED: 'order:status_changed',
  ORDER_SHIPPED: 'order:shipped',
  ORDER_WAVE_RELEASED: 'order:wave_released',

  // Task Events
  TASK_ASSIGNED: 'task:assigned',
  TASK_COMPLETED: 'task:completed',
  TASK_UPDATED: 'task:updated',

  // Alert Events
  ALERT_CREATED: 'alert:created',
  ALERT_RESOLVED: 'alert:resolved',

  // Receiving Events
  ASN_ARRIVED: 'asn:arrived',
  RECEIPT_COMPLETED: 'receipt:completed',

  // Shipping Events
  SHIPMENT_LOADED: 'shipment:loaded',
  TRUCK_DEPARTED: 'truck:departed',

  // Dock Events
  DOCK_APPOINTMENT_CHECKED_IN: 'dock:checked_in',
  DOCK_STATUS_CHANGED: 'dock:status_changed',

  // System Events
  SYSTEM_NOTIFICATION: 'system:notification',
  USER_ACTIVITY: 'user:activity',
};

/**
 * Rooms for targeted broadcasts
 */
export const WS_ROOMS = {
  WAREHOUSE: (id) => `warehouse:${id}`,
  USER: (id) => `user:${id}`,
  DEPARTMENT: (name) => `department:${name}`,
  ROLE: (role) => `role:${role}`,
  ALERTS: 'alerts',
  ADMIN: 'admin',
};

/**
 * Initialize Socket.io with Express server
 */
export function initializeWebSocket(httpServer, options = {}) {
  const corsOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];

  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? corsOrigins : '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: options.pingTimeout || 60000,
    pingInterval: options.pingInterval || 25000,
    transports: ['websocket', 'polling'],
  });

  const isDev = process.env.NODE_ENV !== 'production';

  // Connection handling
  io.on('connection', (socket) => {
    if (isDev) console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Authenticate and join rooms based on user
    socket.on('authenticate', (data) => {
      const { userId, warehouseId, role, department } = data;

      if (userId) {
        socket.join(WS_ROOMS.USER(userId));
        socket.userId = userId;
      }

      if (warehouseId) {
        socket.join(WS_ROOMS.WAREHOUSE(warehouseId));
        socket.warehouseId = warehouseId;
      }

      if (role) {
        socket.join(WS_ROOMS.ROLE(role));
        if (role === 'ADMIN' || role === 'MANAGER') {
          socket.join(WS_ROOMS.ADMIN);
        }
      }

      if (department) {
        socket.join(WS_ROOMS.DEPARTMENT(department));
      }

      // Always join alerts room
      socket.join(WS_ROOMS.ALERTS);

      socket.emit('authenticated', {
        success: true,
        rooms: Array.from(socket.rooms)
      });

      if (isDev) console.log(`[WebSocket] User ${userId} authenticated`);
    });

    // Join specific room
    socket.on('join_room', (room) => {
      socket.join(room);
    });

    // Leave specific room
    socket.on('leave_room', (room) => {
      socket.leave(room);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Silent disconnect - no logging needed in production
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  if (isDev) console.log('[WebSocket] Socket.io initialized');
  return io;
}

/**
 * Get the Socket.io instance
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeWebSocket first.');
  }
  return io;
}

/**
 * Emit event to all connected clients
 */
export function broadcast(event, data) {
  if (!io) return;
  io.emit(event, { ...data, timestamp: Date.now() });
}

/**
 * Emit event to a specific room
 */
export function emitToRoom(room, event, data) {
  if (!io) return;
  io.to(room).emit(event, { ...data, timestamp: Date.now() });
}

/**
 * Emit event to a specific warehouse
 */
export function emitToWarehouse(warehouseId, event, data) {
  emitToRoom(WS_ROOMS.WAREHOUSE(warehouseId), event, data);
}

/**
 * Emit event to a specific user
 */
export function emitToUser(userId, event, data) {
  emitToRoom(WS_ROOMS.USER(userId), event, data);
}

/**
 * Emit event to admin users
 */
export function emitToAdmins(event, data) {
  emitToRoom(WS_ROOMS.ADMIN, event, data);
}

/**
 * Emit alert to all subscribers
 */
export function emitAlert(alert) {
  emitToRoom(WS_ROOMS.ALERTS, WS_EVENTS.ALERT_CREATED, alert);

  // Also send to specific warehouse if applicable
  if (alert.warehouseId) {
    emitToWarehouse(alert.warehouseId, WS_EVENTS.ALERT_CREATED, alert);
  }
}

/**
 * Emit inventory update
 */
export function emitInventoryUpdate(warehouseId, data) {
  emitToWarehouse(warehouseId, WS_EVENTS.INVENTORY_UPDATED, data);
}

/**
 * Emit task assignment
 */
export function emitTaskAssignment(userId, warehouseId, task) {
  emitToUser(userId, WS_EVENTS.TASK_ASSIGNED, task);
  emitToWarehouse(warehouseId, WS_EVENTS.TASK_ASSIGNED, task);
}

/**
 * Emit order status change
 */
export function emitOrderStatusChange(warehouseId, order) {
  emitToWarehouse(warehouseId, WS_EVENTS.ORDER_STATUS_CHANGED, order);
}

/**
 * Get connected clients count
 */
export async function getConnectedClientsCount() {
  if (!io) return 0;
  const sockets = await io.fetchSockets();
  return sockets.length;
}

/**
 * Get connected clients in a room
 */
export async function getRoomClients(room) {
  if (!io) return [];
  const sockets = await io.in(room).fetchSockets();
  return sockets.map(s => ({
    id: s.id,
    userId: s.userId,
    warehouseId: s.warehouseId,
    rooms: Array.from(s.rooms),
  }));
}

export default {
  initializeWebSocket,
  getIO,
  broadcast,
  emitToRoom,
  emitToWarehouse,
  emitToUser,
  emitToAdmins,
  emitAlert,
  emitInventoryUpdate,
  emitTaskAssignment,
  emitOrderStatusChange,
  getConnectedClientsCount,
  getRoomClients,
  WS_EVENTS,
  WS_ROOMS,
};
