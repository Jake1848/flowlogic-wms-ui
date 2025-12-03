/**
 * EDI X12 Generator
 * Generates X12 EDI documents from structured data
 */

// Control number tracking (in production, use database)
let controlNumbers = {
  interchange: 1,
  group: 1,
  transaction: 1
};

/**
 * Generate control numbers (should be persisted in production)
 */
export function getNextControlNumber(type) {
  const num = controlNumbers[type]++;
  return String(num).padStart(9, '0');
}

export function setControlNumbers(numbers) {
  controlNumbers = { ...controlNumbers, ...numbers };
}

/**
 * EDI Document Builder
 */
export class EDIBuilder {
  constructor(options = {}) {
    this.elementSeparator = options.elementSeparator || '*';
    this.segmentTerminator = options.segmentTerminator || '~';
    this.componentSeparator = options.componentSeparator || ':';
    this.segments = [];
    this.segmentCount = 0;
  }

  addSegment(id, ...elements) {
    const segment = [id, ...elements].join(this.elementSeparator);
    this.segments.push(segment);
    this.segmentCount++;
    return this;
  }

  toString() {
    return this.segments.join(this.segmentTerminator) + this.segmentTerminator;
  }

  getSegmentCount() {
    return this.segmentCount;
  }
}

/**
 * Generate ISA segment (Interchange Control Header)
 */
export function generateISA(sender, receiver, options = {}) {
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
  const timeStr = date.toISOString().slice(11, 16).replace(':', '');

  return [
    'ISA',
    options.authQualifier || '00',
    (options.authInfo || '').padEnd(10),
    options.securityQualifier || '00',
    (options.securityInfo || '').padEnd(10),
    sender.qualifier || 'ZZ',
    (sender.id || '').padEnd(15),
    receiver.qualifier || 'ZZ',
    (receiver.id || '').padEnd(15),
    dateStr,
    timeStr,
    '^',
    '00401',
    getNextControlNumber('interchange'),
    options.ackRequested || '0',
    options.usageIndicator || 'P', // P=Production, T=Test
    ':'
  ].join('*');
}

/**
 * Generate IEA segment (Interchange Control Trailer)
 */
export function generateIEA(groupCount, controlNumber) {
  return ['IEA', groupCount, controlNumber].join('*');
}

/**
 * Generate GS segment (Functional Group Header)
 */
export function generateGS(functionalId, sender, receiver, options = {}) {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = date.toISOString().slice(11, 16).replace(':', '');

  return [
    'GS',
    functionalId,
    sender.id,
    receiver.id,
    dateStr,
    timeStr,
    getNextControlNumber('group'),
    'X',
    options.version || '004010'
  ].join('*');
}

/**
 * Generate GE segment (Functional Group Trailer)
 */
export function generateGE(transactionCount, controlNumber) {
  return ['GE', transactionCount, controlNumber].join('*');
}

/**
 * Generate 810 - Invoice
 */
export function generate810(data, sender, receiver) {
  const builder = new EDIBuilder();
  const controlNumber = getNextControlNumber('transaction');

  // Transaction header
  builder.addSegment('ST', '810', controlNumber);

  // Beginning segment
  builder.addSegment(
    'BIG',
    formatDate(data.invoiceDate),
    data.invoiceNumber,
    formatDate(data.poDate),
    data.poNumber
  );

  // Currency
  if (data.currency) {
    builder.addSegment('CUR', 'BY', data.currency);
  }

  // Reference numbers
  for (const ref of data.references || []) {
    builder.addSegment('REF', ref.qualifier, ref.value);
  }

  // Ship To (N1 loop)
  if (data.shipTo) {
    builder.addSegment('N1', 'ST', data.shipTo.name, data.shipTo.idQualifier || '92', data.shipTo.id);
    if (data.shipTo.address1) {
      builder.addSegment('N3', data.shipTo.address1, data.shipTo.address2 || '');
    }
    if (data.shipTo.city) {
      builder.addSegment('N4', data.shipTo.city, data.shipTo.state, data.shipTo.zip, data.shipTo.country || 'US');
    }
  }

  // Bill To
  if (data.billTo) {
    builder.addSegment('N1', 'BT', data.billTo.name, data.billTo.idQualifier || '92', data.billTo.id);
    if (data.billTo.address1) {
      builder.addSegment('N3', data.billTo.address1, data.billTo.address2 || '');
    }
    if (data.billTo.city) {
      builder.addSegment('N4', data.billTo.city, data.billTo.state, data.billTo.zip, data.billTo.country || 'US');
    }
  }

  // Line items
  for (const item of data.items || []) {
    const it1Elements = [
      'IT1',
      item.lineNumber,
      item.quantity,
      item.uom || 'EA',
      item.unitPrice?.toFixed(2) || '0.00',
      '', // Basis of unit price
    ];

    // Add product IDs
    if (item.upc) it1Elements.push('UP', item.upc);
    if (item.sku) it1Elements.push('SK', item.sku);
    if (item.vendorPart) it1Elements.push('VP', item.vendorPart);

    builder.addSegment(...it1Elements);

    // Product description
    if (item.description) {
      builder.addSegment('PID', 'F', '', '', '', item.description);
    }
  }

  // Total monetary value
  const totalAmount = data.items?.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0) || 0;
  builder.addSegment('TDS', Math.round(totalAmount * 100).toString()); // In cents

  // Carrier info
  if (data.carrier) {
    builder.addSegment('CAD', data.carrier.method || 'M', '', '', data.carrier.scac, data.carrier.name);
  }

  // Transaction trailer
  builder.addSegment('SE', builder.getSegmentCount(), controlNumber);

  return wrapInEnvelope(builder.toString(), '810', 'IN', sender, receiver);
}

/**
 * Generate 855 - Purchase Order Acknowledgment
 */
export function generate855(data, sender, receiver) {
  const builder = new EDIBuilder();
  const controlNumber = getNextControlNumber('transaction');

  builder.addSegment('ST', '855', controlNumber);

  // BAK segment
  builder.addSegment(
    'BAK',
    data.purpose || '00',
    data.ackType || 'AC',
    data.poNumber,
    formatDate(data.date),
    data.requestReference || ''
  );

  // Reference numbers
  for (const ref of data.references || []) {
    builder.addSegment('REF', ref.qualifier, ref.value);
  }

  // Line items
  for (const item of data.items || []) {
    const po1Elements = [
      'PO1',
      item.lineNumber,
      item.quantity,
      item.uom || 'EA',
      item.unitPrice?.toFixed(2) || '0.00',
      ''
    ];

    if (item.upc) po1Elements.push('UP', item.upc);
    if (item.sku) po1Elements.push('SK', item.sku);

    builder.addSegment(...po1Elements);

    // Acknowledgment status
    builder.addSegment(
      'ACK',
      item.status || 'IA', // IA=Item Accepted, IR=Item Rejected, IQ=Item Accepted, Quantity Changed
      item.ackQuantity || item.quantity,
      item.uom || 'EA',
      formatDate(item.scheduledDate),
      '', '', '',
      item.status === 'IR' ? (item.rejectReason || '') : ''
    );
  }

  // CTT - Transaction totals
  builder.addSegment('CTT', data.items?.length || 0);

  builder.addSegment('SE', builder.getSegmentCount(), controlNumber);

  return wrapInEnvelope(builder.toString(), '855', 'PR', sender, receiver);
}

/**
 * Generate 856 - Advance Ship Notice
 */
export function generate856(data, sender, receiver) {
  const builder = new EDIBuilder();
  const controlNumber = getNextControlNumber('transaction');
  let hlCounter = 0;

  builder.addSegment('ST', '856', controlNumber);

  // BSN - Beginning Segment
  builder.addSegment(
    'BSN',
    data.purpose || '00',
    data.shipmentId,
    formatDate(data.shipDate),
    formatTime(data.shipDate),
    '0001'
  );

  // Shipment Level (HL)
  hlCounter++;
  const shipmentHL = hlCounter;
  builder.addSegment('HL', shipmentHL, '', 'S');

  // TD1 - Carrier Details (Quantity and Weight)
  if (data.packaging) {
    builder.addSegment(
      'TD1',
      data.packaging.code || 'CTN',
      data.packaging.quantity || 1,
      '', '', '', '',
      data.packaging.weight || '',
      data.packaging.weightUnit || 'LB'
    );
  }

  // TD5 - Carrier Details (Routing Sequence)
  if (data.carrier) {
    builder.addSegment(
      'TD5',
      'B',
      '2',
      data.carrier.scac,
      data.carrier.method || 'M',
      data.carrier.name
    );
  }

  // TD3 - Carrier Details (Equipment)
  if (data.equipment) {
    builder.addSegment(
      'TD3',
      data.equipment.type || 'TL',
      '',
      data.equipment.number,
      '', '', '', '', '',
      data.equipment.sealNumber || ''
    );
  }

  // REF - Reference Numbers
  if (data.bolNumber) {
    builder.addSegment('REF', 'BM', data.bolNumber);
  }
  if (data.proNumber) {
    builder.addSegment('REF', 'CN', data.proNumber);
  }

  // DTM - Date/Time
  builder.addSegment('DTM', '011', formatDate(data.shipDate)); // Ship date
  if (data.deliveryDate) {
    builder.addSegment('DTM', '017', formatDate(data.deliveryDate)); // Estimated delivery
  }

  // N1 - Ship From
  if (data.shipFrom) {
    builder.addSegment('N1', 'SF', data.shipFrom.name, data.shipFrom.idQualifier || '92', data.shipFrom.id);
    if (data.shipFrom.address1) {
      builder.addSegment('N3', data.shipFrom.address1, data.shipFrom.address2 || '');
    }
    if (data.shipFrom.city) {
      builder.addSegment('N4', data.shipFrom.city, data.shipFrom.state, data.shipFrom.zip, data.shipFrom.country || 'US');
    }
  }

  // N1 - Ship To
  if (data.shipTo) {
    builder.addSegment('N1', 'ST', data.shipTo.name, data.shipTo.idQualifier || '92', data.shipTo.id);
    if (data.shipTo.address1) {
      builder.addSegment('N3', data.shipTo.address1, data.shipTo.address2 || '');
    }
    if (data.shipTo.city) {
      builder.addSegment('N4', data.shipTo.city, data.shipTo.state, data.shipTo.zip, data.shipTo.country || 'US');
    }
  }

  // Order Level (for each PO)
  for (const order of data.orders || [{ poNumber: data.poNumber }]) {
    hlCounter++;
    const orderHL = hlCounter;
    builder.addSegment('HL', orderHL, shipmentHL, 'O');

    // PRF - Purchase Order Reference
    builder.addSegment('PRF', order.poNumber, order.releaseNumber || '', '', formatDate(order.date));

    // Item Level
    for (const item of order.items || data.items || []) {
      hlCounter++;
      builder.addSegment('HL', hlCounter, orderHL, 'I');

      // LIN - Item Identification
      const linElements = ['LIN', item.lineNumber || ''];
      if (item.upc) linElements.push('UP', item.upc);
      if (item.sku) linElements.push('SK', item.sku);
      if (item.vendorPart) linElements.push('VP', item.vendorPart);
      builder.addSegment(...linElements);

      // SN1 - Item Detail (Shipment)
      builder.addSegment('SN1', '', item.quantity, item.uom || 'EA');

      // PID - Product Description
      if (item.description) {
        builder.addSegment('PID', 'F', '', '', '', item.description);
      }

      // MAN - Marks and Numbers (for carton/pallet tracking)
      if (item.sscc) {
        builder.addSegment('MAN', 'GM', item.sscc);
      }
      if (item.lotNumber) {
        builder.addSegment('MAN', 'L', item.lotNumber);
      }
    }
  }

  // CTT - Transaction Totals
  builder.addSegment('CTT', hlCounter);

  builder.addSegment('SE', builder.getSegmentCount(), controlNumber);

  return wrapInEnvelope(builder.toString(), '856', 'SH', sender, receiver);
}

/**
 * Generate 940 - Warehouse Shipping Order
 */
export function generate940(data, sender, receiver) {
  const builder = new EDIBuilder();
  const controlNumber = getNextControlNumber('transaction');

  builder.addSegment('ST', '940', controlNumber);

  // W05 - Shipping Order Identification
  builder.addSegment(
    'W05',
    data.orderStatus || 'N', // N=New, R=Replace, C=Cancel
    data.orderNumber,
    data.poNumber || '',
    data.linkSequence || ''
  );

  // Depositor (N1 loop)
  if (data.depositor) {
    builder.addSegment('N1', 'DE', data.depositor.name, '92', data.depositor.id);
  }

  // Ship To
  if (data.shipTo) {
    builder.addSegment('N1', 'ST', data.shipTo.name, data.shipTo.idQualifier || '92', data.shipTo.id);
    if (data.shipTo.address1) {
      builder.addSegment('N3', data.shipTo.address1, data.shipTo.address2 || '');
    }
    if (data.shipTo.city) {
      builder.addSegment('N4', data.shipTo.city, data.shipTo.state, data.shipTo.zip, data.shipTo.country || 'US');
    }
    if (data.shipTo.contact) {
      builder.addSegment('G61', 'CN', data.shipTo.contact.name, 'TE', data.shipTo.contact.phone);
    }
  }

  // Special handling instructions
  for (const note of data.notes || []) {
    builder.addSegment('N9', note.qualifier || 'ZZ', note.value);
  }

  // W66 - Warehouse Carrier Information
  if (data.carrier) {
    builder.addSegment(
      'W66',
      data.carrier.method || 'M',
      '',
      '',
      data.carrier.scac,
      data.carrier.name,
      data.carrier.serviceLevel || ''
    );
  }

  // Line items (LX loop)
  let lineNum = 0;
  for (const item of data.items || []) {
    lineNum++;
    builder.addSegment('LX', lineNum);

    // W01 - Item Detail
    const w01Elements = [
      'W01',
      item.quantity,
      item.uom || 'EA',
      '', '',
      item.weight || ''
    ];
    if (item.upc) w01Elements.push('UP', item.upc);
    if (item.sku) w01Elements.push('SK', item.sku);
    builder.addSegment(...w01Elements);

    // G69 - Line Item Detail Description
    if (item.description) {
      builder.addSegment('G69', item.description);
    }

    // N9 - Extended Reference
    if (item.lotNumber) {
      builder.addSegment('N9', 'LT', item.lotNumber);
    }
    if (item.serialNumber) {
      builder.addSegment('N9', 'SE', item.serialNumber);
    }

    // W20 - Lot Information
    if (item.lot) {
      builder.addSegment('W20', item.lot.number, '', '', formatDate(item.lot.expirationDate), formatDate(item.lot.manufactureDate));
    }
  }

  // W76 - Total Shipping Order
  const totalQty = data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalWeight = data.items?.reduce((sum, item) => sum + (item.weight || 0), 0) || 0;
  builder.addSegment('W76', data.items?.length || 0, totalQty, 'EA', totalWeight, 'LB');

  builder.addSegment('SE', builder.getSegmentCount(), controlNumber);

  return wrapInEnvelope(builder.toString(), '940', 'OW', sender, receiver);
}

/**
 * Generate 945 - Warehouse Shipping Advice
 */
export function generate945(data, sender, receiver) {
  const builder = new EDIBuilder();
  const controlNumber = getNextControlNumber('transaction');

  builder.addSegment('ST', '945', controlNumber);

  // W06 - Warehouse Shipment Identification
  builder.addSegment(
    'W06',
    data.reportType || 'B', // B=Original, N=New, R=Replace
    data.orderNumber,
    formatDate(data.shipDate),
    data.shipmentId || '',
    '',
    data.warehouseOrderNumber || ''
  );

  // Depositor reference
  if (data.depositorRef) {
    builder.addSegment('N9', 'DO', data.depositorRef);
  }

  // W27 - Carrier Detail
  if (data.carrier) {
    builder.addSegment(
      'W27',
      data.carrier.method || 'M',
      '',
      data.carrier.scac,
      data.carrier.name,
      '',
      data.bolNumber || '',
      '',
      data.carrier.scac
    );
  }

  // W28 - Consolidation Information
  if (data.consolidation) {
    builder.addSegment(
      'W28',
      data.consolidation.weight || '',
      data.consolidation.weightQualifier || 'G',
      data.consolidation.quantity || '',
      data.consolidation.description || ''
    );
  }

  // Ship To
  if (data.shipTo) {
    builder.addSegment('N1', 'ST', data.shipTo.name, data.shipTo.idQualifier || '92', data.shipTo.id);
    if (data.shipTo.address1) {
      builder.addSegment('N3', data.shipTo.address1, data.shipTo.address2 || '');
    }
    if (data.shipTo.city) {
      builder.addSegment('N4', data.shipTo.city, data.shipTo.state, data.shipTo.zip, data.shipTo.country || 'US');
    }
  }

  // Line items (LX loop)
  let lineNum = 0;
  for (const item of data.items || []) {
    lineNum++;
    builder.addSegment('LX', lineNum);

    // W12 - Warehouse Item Detail
    const w12Elements = [
      'W12',
      item.shipmentType || 'SH', // SH=Shipped, NC=Not Shipped
      item.quantityShipped,
      item.uom || 'EA',
      ''
    ];
    if (item.upc) w12Elements.push('UP', item.upc);
    if (item.sku) w12Elements.push('SK', item.sku);
    builder.addSegment(...w12Elements);

    // G69 - Description
    if (item.description) {
      builder.addSegment('G69', item.description);
    }

    // N9 - Extended Reference
    if (item.lotNumber) {
      builder.addSegment('N9', 'LT', item.lotNumber);
    }
  }

  // W03 - Total Shipping Order
  const totalQty = data.items?.reduce((sum, item) => sum + (item.quantityShipped || 0), 0) || 0;
  const totalWeight = data.items?.reduce((sum, item) => sum + (item.weight || 0), 0) || 0;
  builder.addSegment('W03', data.items?.length || 0, totalWeight, 'LB', '', '', data.palletCount || '');

  builder.addSegment('SE', builder.getSegmentCount(), controlNumber);

  return wrapInEnvelope(builder.toString(), '945', 'SW', sender, receiver);
}

/**
 * Generate 947 - Warehouse Inventory Adjustment Advice
 */
export function generate947(data, sender, receiver) {
  const builder = new EDIBuilder();
  const controlNumber = getNextControlNumber('transaction');

  builder.addSegment('ST', '947', controlNumber);

  // W15 - Warehouse Adjustment Item Detail (Header)
  builder.addSegment(
    'W15',
    data.transactionType || 'A', // A=Adjustment
    formatDate(data.date),
    formatTime(data.date),
    data.referenceId || ''
  );

  // Depositor
  if (data.depositor) {
    builder.addSegment('N1', 'DE', data.depositor.name, '92', data.depositor.id);
  }

  // Adjustments
  for (const adj of data.adjustments || []) {
    // W07 - Item Detail
    const w07Elements = [
      'W07',
      adj.quantity,
      adj.uom || 'EA',
      '', '', ''
    ];
    if (adj.upc) w07Elements.push('UP', adj.upc);
    if (adj.sku) w07Elements.push('SK', adj.sku);
    builder.addSegment(...w07Elements);

    // W13 - Warehouse Adjustment Detail
    builder.addSegment(
      'W13',
      adj.quantityBefore || '',
      adj.quantityAfter || '',
      adj.uom || 'EA',
      adj.reasonCode || ''
    );

    // W20 - Lot information
    if (adj.lotNumber) {
      builder.addSegment('W20', adj.lotNumber, '', '', formatDate(adj.expirationDate));
    }

    // N9 - Reference
    if (adj.notes) {
      builder.addSegment('N9', 'ZZ', adj.notes);
    }
  }

  // W14 - Total Adjustment
  const totalQty = data.adjustments?.reduce((sum, adj) => sum + Math.abs(adj.quantity || 0), 0) || 0;
  builder.addSegment('W14', totalQty, '', data.adjustments?.length || 0);

  builder.addSegment('SE', builder.getSegmentCount(), controlNumber);

  return wrapInEnvelope(builder.toString(), '947', 'IJ', sender, receiver);
}

/**
 * Wrap transaction in ISA/GS envelope
 */
function wrapInEnvelope(transaction, docType, functionalId, sender, receiver) {
  const isa = generateISA(sender, receiver);
  const gs = generateGS(functionalId, sender, receiver);

  // Extract control numbers
  const isaControlNumber = isa.split('*')[13];
  const gsControlNumber = gs.split('*')[6];

  const ge = generateGE(1, gsControlNumber);
  const iea = generateIEA(1, isaControlNumber);

  return `${isa}~${gs}~${transaction}${ge}~${iea}~`;
}

/**
 * Format date for EDI (YYYYMMDD or YYMMDD)
 */
function formatDate(date, short = false) {
  if (!date) return '';
  const d = new Date(date);
  const year = short ? d.getFullYear().toString().slice(-2) : d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Format time for EDI (HHMM)
 */
function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}${minutes}`;
}

export {
  formatDate,
  formatTime,
  wrapInEnvelope
};
