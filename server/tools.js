// Claude Tool Definitions and Execution
// These tools allow Flow AI to interact with the WMS database

// Tool definitions for Claude
export const tools = [
  {
    name: 'investigate_inventory',
    description: 'Investigate inventory for a specific product by SKU. Returns inventory levels, locations, transaction history, and alerts.',
    input_schema: {
      type: 'object',
      properties: {
        sku: {
          type: 'string',
          description: 'The product SKU to investigate (e.g., "ELEC-LAPTOP-001")'
        },
        include_transactions: {
          type: 'boolean',
          description: 'Include recent transaction history',
          default: true
        }
      },
      required: ['sku']
    }
  },
  {
    name: 'investigate_location',
    description: 'Investigate a specific warehouse location. Returns inventory contents, capacity info, and recent activity.',
    input_schema: {
      type: 'object',
      properties: {
        location_code: {
          type: 'string',
          description: 'The location code to investigate (e.g., "P001")'
        }
      },
      required: ['location_code']
    }
  },
  {
    name: 'investigate_user',
    description: 'Look up performance and activity for a specific warehouse user.',
    input_schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: 'The username to look up (e.g., "jdoe")'
        }
      },
      required: ['username']
    }
  },
  {
    name: 'get_late_orders',
    description: 'Get details about all late orders including reasons and customer info.',
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of orders to return',
          default: 20
        }
      }
    }
  },
  {
    name: 'get_alerts',
    description: 'Get current unresolved alerts in the system.',
    input_schema: {
      type: 'object',
      properties: {
        severity: {
          type: 'string',
          enum: ['INFO', 'WARNING', 'CRITICAL', 'EMERGENCY'],
          description: 'Filter by severity level'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of alerts to return',
          default: 20
        }
      }
    }
  },
  {
    name: 'get_inventory_summary',
    description: 'Get a summary of inventory status across the warehouse.',
    input_schema: {
      type: 'object',
      properties: {
        warehouse_id: {
          type: 'string',
          description: 'Optional warehouse ID to filter by'
        }
      }
    }
  },
  {
    name: 'create_inventory_adjustment',
    description: 'Create an inventory adjustment to correct a discrepancy. This action modifies inventory quantities.',
    input_schema: {
      type: 'object',
      properties: {
        inventory_id: {
          type: 'string',
          description: 'Inventory record ID to adjust'
        },
        adjustment_quantity: {
          type: 'number',
          description: 'Quantity to adjust (positive for increase, negative for decrease)'
        },
        reason: {
          type: 'string',
          description: 'Reason for the adjustment'
        }
      },
      required: ['inventory_id', 'adjustment_quantity', 'reason']
    }
  },
  {
    name: 'create_task',
    description: 'Create a warehouse task (pick, replenishment, cycle count, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['PICK', 'PUTAWAY', 'REPLENISHMENT', 'CYCLE_COUNT', 'PACK', 'SHIP', 'RECEIVE', 'TRANSFER'],
          description: 'Type of task to create'
        },
        priority: {
          type: 'number',
          description: 'Priority 1-10 (1 = highest)',
          default: 5
        },
        order_id: {
          type: 'string',
          description: 'Order ID for pick/pack tasks'
        },
        location_code: {
          type: 'string',
          description: 'Location for replenishment/cycle count tasks'
        },
        notes: {
          type: 'string',
          description: 'Additional notes for the task'
        }
      },
      required: ['type']
    }
  },
  {
    name: 'create_alert',
    description: 'Create a new alert in the system.',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['INVENTORY_DISCREPANCY', 'LOW_STOCK', 'OVERSTOCK', 'ORDER_LATE', 'ORDER_EXCEPTION', 'RECEIPT_ISSUE', 'LABOR_PERFORMANCE', 'SYSTEM_ERROR', 'CUSTOM'],
          description: 'Type of alert'
        },
        severity: {
          type: 'string',
          enum: ['INFO', 'WARNING', 'CRITICAL', 'EMERGENCY'],
          description: 'Severity level'
        },
        title: {
          type: 'string',
          description: 'Alert title'
        },
        message: {
          type: 'string',
          description: 'Alert message content'
        },
        suggested_action: {
          type: 'string',
          description: 'Suggested action to resolve the alert'
        }
      },
      required: ['type', 'severity', 'title', 'message']
    }
  },
  {
    name: 'update_order_priority',
    description: 'Update the priority of one or more orders.',
    input_schema: {
      type: 'object',
      properties: {
        order_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of order IDs to update'
        },
        priority: {
          type: 'number',
          description: 'New priority (1-10, 1 = highest)'
        },
        reason: {
          type: 'string',
          description: 'Reason for priority change'
        }
      },
      required: ['order_ids', 'priority']
    }
  },
  {
    name: 'search_products',
    description: 'Search for products by SKU, name, or UPC.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (matches SKU, name, or UPC)'
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return',
          default: 10
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_order_details',
    description: 'Get detailed information about a specific order.',
    input_schema: {
      type: 'object',
      properties: {
        order_number: {
          type: 'string',
          description: 'The order number (e.g., "SO-2024-0001")'
        }
      },
      required: ['order_number']
    }
  }
];

// Create tool executor with Prisma database access
export function createToolExecutor(prisma) {
  return async function executeAction(toolName, params) {
    console.log(`Executing tool: ${toolName}`, params);

    try {
      switch (toolName) {
        case 'investigate_inventory': {
          const product = await prisma.product.findUnique({
            where: { sku: params.sku },
            include: {
              inventory: {
                include: {
                  location: { select: { code: true, type: true } },
                  warehouse: { select: { code: true, name: true } },
                },
              },
              category: { select: { name: true } },
            },
          });

          if (!product) {
            return { success: false, message: `No product found with SKU ${params.sku}` };
          }

          let transactions = [];
          if (params.include_transactions !== false) {
            transactions = await prisma.inventoryTransaction.findMany({
              where: { productId: product.id },
              orderBy: { createdAt: 'desc' },
              take: 20,
              include: {
                location: { select: { code: true } },
                user: { select: { fullName: true } },
              },
            });
          }

          const alerts = await prisma.alert.findMany({
            where: {
              entityType: 'Product',
              entityId: product.id,
              isResolved: false,
            },
          });

          const totalOnHand = product.inventory.reduce((sum, inv) => sum + inv.quantityOnHand, 0);
          const totalAllocated = product.inventory.reduce((sum, inv) => sum + inv.quantityAllocated, 0);
          const totalAvailable = product.inventory.reduce((sum, inv) => sum + inv.quantityAvailable, 0);

          return {
            success: true,
            product: {
              sku: product.sku,
              name: product.name,
              category: product.category?.name,
              reorderPoint: product.reorderPoint,
              minStock: product.minStock,
              maxStock: product.maxStock,
            },
            inventory: {
              totalOnHand,
              totalAllocated,
              totalAvailable,
              locations: product.inventory.map(inv => ({
                location: inv.location.code,
                warehouse: inv.warehouse.code,
                onHand: inv.quantityOnHand,
                allocated: inv.quantityAllocated,
                available: inv.quantityAvailable,
                status: inv.status,
              })),
            },
            recentTransactions: transactions.map(t => ({
              type: t.transactionType,
              quantity: t.quantity,
              location: t.location.code,
              user: t.user?.fullName,
              timestamp: t.createdAt,
              reason: t.reason,
            })),
            alerts: alerts.map(a => ({
              type: a.type,
              severity: a.severity,
              title: a.title,
              message: a.message,
            })),
            needsReorder: totalOnHand < (product.reorderPoint || 0),
          };
        }

        case 'investigate_location': {
          const location = await prisma.location.findFirst({
            where: { code: params.location_code },
            include: {
              zone: {
                include: { warehouse: { select: { code: true, name: true } } },
              },
              inventory: {
                include: {
                  product: { select: { sku: true, name: true } },
                },
              },
            },
          });

          if (!location) {
            return { success: false, message: `No location found with code ${params.location_code}` };
          }

          const recentTransactions = await prisma.inventoryTransaction.findMany({
            where: { locationId: location.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              product: { select: { sku: true } },
              user: { select: { fullName: true } },
            },
          });

          return {
            success: true,
            location: {
              code: location.code,
              type: location.type,
              zone: location.zone.name,
              warehouse: location.zone.warehouse.name,
              minQuantity: location.minQuantity,
              maxQuantity: location.maxQuantity,
              reorderPoint: location.reorderPoint,
              isPickable: location.isPickable,
              isReplenishable: location.isReplenishable,
            },
            contents: location.inventory.map(inv => ({
              sku: inv.product.sku,
              productName: inv.product.name,
              onHand: inv.quantityOnHand,
              allocated: inv.quantityAllocated,
              available: inv.quantityAvailable,
              status: inv.status,
            })),
            recentActivity: recentTransactions.map(t => ({
              type: t.transactionType,
              sku: t.product.sku,
              quantity: t.quantity,
              user: t.user?.fullName,
              timestamp: t.createdAt,
            })),
            needsReplenishment: location.minQuantity
              ? location.inventory.reduce((sum, inv) => sum + inv.quantityOnHand, 0) < location.minQuantity
              : false,
          };
        }

        case 'investigate_user': {
          const user = await prisma.user.findFirst({
            where: { username: params.username },
            include: {
              assignedTasks: {
                where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
                take: 10,
              },
              laborEntries: {
                orderBy: { startTime: 'desc' },
                take: 20,
              },
            },
          });

          if (!user) {
            return { success: false, message: `No user found with username ${params.username}` };
          }

          // Calculate productivity metrics
          const completedEntries = user.laborEntries.filter(e => e.endTime && e.unitsProcessed);
          const totalUnits = completedEntries.reduce((sum, e) => sum + (e.unitsProcessed || 0), 0);
          const totalMinutes = completedEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
          const unitsPerHour = totalMinutes > 0 ? Math.round((totalUnits / totalMinutes) * 60) : 0;

          return {
            success: true,
            user: {
              username: user.username,
              fullName: user.fullName,
              role: user.role,
              isActive: user.isActive,
              lastLogin: user.lastLoginAt,
            },
            activeTasks: user.assignedTasks.length,
            productivity: {
              unitsProcessed: totalUnits,
              totalMinutes,
              unitsPerHour,
            },
            recentActivity: user.laborEntries.map(e => ({
              type: e.activityType,
              startTime: e.startTime,
              endTime: e.endTime,
              duration: e.durationMinutes,
              unitsProcessed: e.unitsProcessed,
            })),
          };
        }

        case 'get_late_orders': {
          const lateOrders = await prisma.order.findMany({
            where: {
              requiredDate: { lt: new Date() },
              status: { notIn: ['SHIPPED', 'DELIVERED', 'CANCELLED'] },
            },
            include: {
              customer: { select: { name: true } },
              carrier: { select: { name: true } },
            },
            orderBy: { requiredDate: 'asc' },
            take: params.limit || 20,
          });

          return {
            success: true,
            totalLate: lateOrders.length,
            orders: lateOrders.map(o => ({
              orderNumber: o.orderNumber,
              customer: o.customer.name,
              status: o.status,
              priority: o.priority,
              requiredDate: o.requiredDate,
              daysLate: Math.ceil((Date.now() - o.requiredDate.getTime()) / (1000 * 60 * 60 * 24)),
              totalUnits: o.totalUnits,
              carrier: o.carrier?.name,
            })),
          };
        }

        case 'get_alerts': {
          const where = { isResolved: false };
          if (params.severity) where.severity = params.severity;

          const alerts = await prisma.alert.findMany({
            where,
            orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
            take: params.limit || 20,
          });

          return {
            success: true,
            totalAlerts: alerts.length,
            alerts: alerts.map(a => ({
              id: a.id,
              type: a.type,
              severity: a.severity,
              title: a.title,
              message: a.message,
              suggestedAction: a.suggestedAction,
              createdAt: a.createdAt,
            })),
          };
        }

        case 'get_inventory_summary': {
          const where = params.warehouse_id ? { warehouseId: params.warehouse_id } : {};

          const [summary, lowStock, statusCounts] = await Promise.all([
            prisma.inventory.aggregate({
              where,
              _sum: { quantityOnHand: true, quantityAllocated: true, quantityAvailable: true },
              _count: true,
            }),
            prisma.inventory.findMany({
              where: {
                ...where,
                quantityOnHand: { lt: 10 },
              },
              include: {
                product: { select: { sku: true, name: true, reorderPoint: true } },
                location: { select: { code: true } },
              },
              take: 10,
            }),
            prisma.inventory.groupBy({
              by: ['status'],
              where,
              _count: true,
            }),
          ]);

          return {
            success: true,
            summary: {
              totalRecords: summary._count,
              totalOnHand: summary._sum.quantityOnHand || 0,
              totalAllocated: summary._sum.quantityAllocated || 0,
              totalAvailable: summary._sum.quantityAvailable || 0,
            },
            statusBreakdown: statusCounts.reduce((acc, s) => {
              acc[s.status] = s._count;
              return acc;
            }, {}),
            lowStockItems: lowStock.map(inv => ({
              sku: inv.product.sku,
              name: inv.product.name,
              location: inv.location.code,
              onHand: inv.quantityOnHand,
              reorderPoint: inv.product.reorderPoint,
            })),
          };
        }

        case 'create_inventory_adjustment': {
          const inventory = await prisma.inventory.findUnique({
            where: { id: params.inventory_id },
          });

          if (!inventory) {
            return { success: false, message: 'Inventory record not found' };
          }

          const quantityBefore = inventory.quantityOnHand;
          const quantityAfter = quantityBefore + params.adjustment_quantity;

          if (quantityAfter < 0) {
            return { success: false, message: 'Cannot adjust below zero' };
          }

          // Find a system user for the adjustment
          const systemUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
          });

          const [updatedInventory, transaction] = await prisma.$transaction([
            prisma.inventory.update({
              where: { id: params.inventory_id },
              data: {
                quantityOnHand: quantityAfter,
                quantityAvailable: quantityAfter - inventory.quantityAllocated,
              },
            }),
            prisma.inventoryTransaction.create({
              data: {
                transactionType: params.adjustment_quantity > 0 ? 'ADJUST_IN' : 'ADJUST_OUT',
                productId: inventory.productId,
                locationId: inventory.locationId,
                inventoryId: inventory.id,
                quantity: Math.abs(params.adjustment_quantity),
                quantityBefore,
                quantityAfter,
                reason: params.reason,
                notes: 'Created by Flow AI',
                userId: systemUser?.id || inventory.productId, // Fallback
                referenceType: 'AI_ADJUSTMENT',
              },
            }),
          ]);

          return {
            success: true,
            message: `Inventory adjusted from ${quantityBefore} to ${quantityAfter} (${params.adjustment_quantity > 0 ? '+' : ''}${params.adjustment_quantity})`,
            adjustment: {
              inventoryId: params.inventory_id,
              quantityBefore,
              quantityAfter,
              change: params.adjustment_quantity,
              reason: params.reason,
            },
          };
        }

        case 'create_task': {
          // Get default warehouse
          const warehouse = await prisma.warehouse.findFirst({
            where: { isDefault: true },
          });

          if (!warehouse) {
            return { success: false, message: 'No default warehouse configured' };
          }

          // Generate task number
          const lastTask = await prisma.task.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { taskNumber: true },
          });

          let nextNum = 1;
          if (lastTask) {
            const parts = lastTask.taskNumber.split('-');
            nextNum = parseInt(parts[parts.length - 1]) + 1;
          }

          const taskNumber = `TSK-${params.type.substring(0, 3)}-${nextNum.toString().padStart(6, '0')}`;

          const task = await prisma.task.create({
            data: {
              taskNumber,
              type: params.type,
              warehouseId: warehouse.id,
              priority: params.priority || 5,
              orderId: params.order_id || null,
              notes: params.notes ? `${params.notes} [Created by Flow AI]` : 'Created by Flow AI',
              status: 'PENDING',
            },
          });

          return {
            success: true,
            message: `Task ${taskNumber} created successfully`,
            task: {
              id: task.id,
              taskNumber: task.taskNumber,
              type: task.type,
              priority: task.priority,
              status: task.status,
            },
          };
        }

        case 'create_alert': {
          const warehouse = await prisma.warehouse.findFirst({
            where: { isDefault: true },
          });

          const alert = await prisma.alert.create({
            data: {
              type: params.type,
              severity: params.severity,
              title: params.title,
              message: params.message,
              suggestedAction: params.suggested_action,
              warehouseId: warehouse?.id,
              aiConfidence: 0.9,
            },
          });

          return {
            success: true,
            message: `Alert created: ${params.title}`,
            alert: {
              id: alert.id,
              type: alert.type,
              severity: alert.severity,
              title: alert.title,
            },
          };
        }

        case 'update_order_priority': {
          const updated = await prisma.order.updateMany({
            where: {
              id: { in: params.order_ids },
            },
            data: {
              priority: params.priority,
              notes: params.reason ? `Priority updated: ${params.reason}` : undefined,
            },
          });

          return {
            success: true,
            message: `Updated priority for ${updated.count} order(s) to ${params.priority}`,
            ordersUpdated: updated.count,
            newPriority: params.priority,
          };
        }

        case 'search_products': {
          const products = await prisma.product.findMany({
            where: {
              OR: [
                { sku: { contains: params.query, mode: 'insensitive' } },
                { name: { contains: params.query, mode: 'insensitive' } },
                { upc: { contains: params.query, mode: 'insensitive' } },
              ],
            },
            include: {
              category: { select: { name: true } },
              _count: { select: { inventory: true } },
            },
            take: params.limit || 10,
          });

          return {
            success: true,
            resultsCount: products.length,
            products: products.map(p => ({
              id: p.id,
              sku: p.sku,
              name: p.name,
              upc: p.upc,
              category: p.category?.name,
              cost: p.cost,
              price: p.price,
              inventoryLocations: p._count.inventory,
              isActive: p.isActive,
            })),
          };
        }

        case 'get_order_details': {
          const order = await prisma.order.findFirst({
            where: { orderNumber: params.order_number },
            include: {
              customer: true,
              carrier: { select: { name: true } },
              lines: {
                include: {
                  product: { select: { sku: true, name: true } },
                },
              },
              tasks: {
                select: { taskNumber: true, type: true, status: true },
              },
              shipments: {
                select: { shipmentNumber: true, status: true, trackingNumber: true },
              },
            },
          });

          if (!order) {
            return { success: false, message: `Order ${params.order_number} not found` };
          }

          return {
            success: true,
            order: {
              orderNumber: order.orderNumber,
              status: order.status,
              priority: order.priority,
              type: order.type,
              customer: order.customer.name,
              orderDate: order.orderDate,
              requiredDate: order.requiredDate,
              shipToAddress: `${order.shipToAddress}, ${order.shipToCity}, ${order.shipToState} ${order.shipToZipCode}`,
              carrier: order.carrier?.name,
              totalLines: order.totalLines,
              totalUnits: order.totalUnits,
              pickedUnits: order.pickedUnits,
              shippedUnits: order.shippedUnits,
            },
            lines: order.lines.map(l => ({
              lineNumber: l.lineNumber,
              sku: l.product.sku,
              productName: l.product.name,
              ordered: l.quantityOrdered,
              allocated: l.quantityAllocated,
              picked: l.quantityPicked,
              shipped: l.quantityShipped,
              status: l.status,
            })),
            tasks: order.tasks,
            shipments: order.shipments,
          };
        }

        default:
          return {
            success: false,
            message: `Unknown tool: ${toolName}`
          };
      }
    } catch (error) {
      console.error(`Tool execution error (${toolName}):`, error);
      return {
        success: false,
        message: `Error executing ${toolName}: ${error.message}`
      };
    }
  };
}

// Legacy export for backwards compatibility
export async function executeAction(toolName, params) {
  console.warn('Using legacy executeAction without database access');
  return {
    success: false,
    message: 'Database not connected. Please use createToolExecutor(prisma) instead.'
  };
}
