/**
 * EDI X12 Module
 * Complete EDI parsing and generation for warehouse management
 */

export { parseEDI } from './parser.js';
export {
  generate810,
  generate855,
  generate856,
  generate940,
  generate945,
  generate947,
  generateISA,
  generateGS,
  EDIBuilder,
  getNextControlNumber,
  setControlNumbers
} from './generator.js';

// Document type mappings
export const EDI_DOCUMENT_TYPES = {
  '810': { name: 'Invoice', functionalId: 'IN', direction: 'outbound' },
  '820': { name: 'Payment Order/Remittance Advice', functionalId: 'RA', direction: 'both' },
  '850': { name: 'Purchase Order', functionalId: 'PO', direction: 'inbound' },
  '855': { name: 'Purchase Order Acknowledgment', functionalId: 'PR', direction: 'outbound' },
  '856': { name: 'Advance Ship Notice', functionalId: 'SH', direction: 'both' },
  '940': { name: 'Warehouse Shipping Order', functionalId: 'OW', direction: 'inbound' },
  '943': { name: 'Warehouse Stock Transfer Shipment Advice', functionalId: 'SW', direction: 'outbound' },
  '944': { name: 'Warehouse Stock Transfer Receipt Advice', functionalId: 'SR', direction: 'outbound' },
  '945': { name: 'Warehouse Shipping Advice', functionalId: 'SW', direction: 'outbound' },
  '947': { name: 'Warehouse Inventory Adjustment Advice', functionalId: 'IJ', direction: 'outbound' }
};

// EDI Qualifiers
export const ID_QUALIFIERS = {
  '01': 'DUNS',
  '02': 'SCAC',
  '08': 'UCC/EAN',
  '12': 'Phone',
  '14': 'DUNS+4',
  '27': 'NAICS',
  '28': 'SIC',
  '30': 'ISO',
  'ZZ': 'Mutually Defined'
};

export const PRODUCT_ID_QUALIFIERS = {
  'UP': 'UPC',
  'UK': 'UPC/EAN Case Code',
  'EN': 'EAN-13',
  'VP': 'Vendor Part Number',
  'BP': 'Buyer Part Number',
  'SK': 'SKU',
  'IN': 'Buyer Item Number',
  'MG': 'Manufacturer ID',
  'MN': 'Model Number'
};

export const UOM_CODES = {
  'EA': 'Each',
  'CA': 'Case',
  'BX': 'Box',
  'CT': 'Carton',
  'PK': 'Pack',
  'PL': 'Pallet',
  'LB': 'Pound',
  'KG': 'Kilogram',
  'OZ': 'Ounce',
  'GR': 'Gram'
};

// Validation functions
export function validateEDI(parsedEDI) {
  const errors = [];
  const warnings = [];

  // Check for ISA/IEA balance
  if (!parsedEDI.interchanges || parsedEDI.interchanges.length === 0) {
    errors.push('No interchange envelope found (missing ISA segment)');
  }

  for (const interchange of parsedEDI.interchanges || []) {
    // Validate ISA
    if (!interchange.senderId?.trim()) {
      errors.push('ISA sender ID is missing');
    }
    if (!interchange.receiverId?.trim()) {
      errors.push('ISA receiver ID is missing');
    }

    // Check GS/GE balance
    if (!interchange.groups || interchange.groups.length === 0) {
      errors.push('No functional group found (missing GS segment)');
    }

    for (const group of interchange.groups || []) {
      // Validate transactions
      if (!group.transactions || group.transactions.length === 0) {
        errors.push(`Functional group ${group.controlNumber} has no transactions`);
      }

      // Verify transaction count matches trailer
      if (group.trailer && group.transactions.length !== group.trailer.numberOfTransactions) {
        warnings.push(`GE transaction count mismatch: expected ${group.trailer.numberOfTransactions}, found ${group.transactions.length}`);
      }

      for (const transaction of group.transactions || []) {
        // Verify segment count
        const actualCount = (transaction.segments?.length || 0) + 2; // +2 for ST and SE
        if (transaction.trailer && actualCount !== transaction.trailer.segmentCount) {
          warnings.push(`SE segment count mismatch in ${transaction.transactionSetId}: expected ${transaction.trailer.segmentCount}, found ${actualCount}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Helper to convert FlowLogic entities to EDI data structures
export function orderToEDI856(order, shipment, warehouse) {
  return {
    purpose: '00',
    shipmentId: shipment.shipmentNumber,
    shipDate: shipment.shipDate,
    deliveryDate: shipment.estimatedDelivery,
    bolNumber: shipment.bolNumber,
    proNumber: shipment.proNumber,
    carrier: {
      scac: shipment.carrier?.scac,
      name: shipment.carrier?.name,
      method: shipment.carrier?.method || 'M'
    },
    equipment: {
      type: shipment.trailerType,
      number: shipment.trailerNumber,
      sealNumber: shipment.sealNumber
    },
    packaging: {
      code: 'CTN',
      quantity: shipment.cartonCount,
      weight: shipment.totalWeight,
      weightUnit: 'LB'
    },
    shipFrom: {
      name: warehouse.name,
      id: warehouse.code,
      address1: warehouse.address,
      city: warehouse.city,
      state: warehouse.state,
      zip: warehouse.zipCode,
      country: warehouse.country
    },
    shipTo: {
      name: order.customer?.name,
      id: order.customer?.code,
      address1: order.shippingAddress?.address1,
      address2: order.shippingAddress?.address2,
      city: order.shippingAddress?.city,
      state: order.shippingAddress?.state,
      zip: order.shippingAddress?.zipCode,
      country: order.shippingAddress?.country
    },
    poNumber: order.customerPO,
    items: order.lines?.map((line, idx) => ({
      lineNumber: idx + 1,
      upc: line.product?.upc,
      sku: line.product?.sku,
      vendorPart: line.product?.vendorPartNumber,
      description: line.product?.name,
      quantity: line.quantityShipped,
      uom: line.uom || 'EA',
      lotNumber: line.lotNumber,
      sscc: line.sscc
    }))
  };
}

export function purchaseOrderFromEDI850(parsed) {
  const po = parsed.parsed;
  return {
    poNumber: po.header?.poNumber,
    orderDate: parseEDIDate(po.header?.date),
    customerId: po.parties?.find(p => p.qualifier === 'BY')?.id,
    shipToId: po.parties?.find(p => p.qualifier === 'ST')?.id,
    billToId: po.parties?.find(p => p.qualifier === 'BT')?.id,
    currency: po.header?.currency || 'USD',
    requestedDeliveryDate: po.header?.dates?.find(d => d.qualifier === '002')?.date,
    lines: po.items?.map(item => ({
      lineNumber: item.lineNumber,
      productSku: item.productIds?.find(p => p.qualifier === 'SK')?.value,
      productUpc: item.productIds?.find(p => p.qualifier === 'UP')?.value,
      vendorPart: item.productIds?.find(p => p.qualifier === 'VP')?.value,
      quantity: item.quantity,
      uom: item.uom,
      unitPrice: item.unitPrice,
      description: item.description
    }))
  };
}

function parseEDIDate(dateStr) {
  if (!dateStr) return null;
  // YYYYMMDD or YYMMDD format
  if (dateStr.length === 8) {
    return new Date(`${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`);
  } else if (dateStr.length === 6) {
    const year = parseInt(dateStr.slice(0, 2));
    const fullYear = year > 50 ? 1900 + year : 2000 + year;
    return new Date(`${fullYear}-${dateStr.slice(2, 4)}-${dateStr.slice(4, 6)}`);
  }
  return null;
}
