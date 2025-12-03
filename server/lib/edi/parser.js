/**
 * EDI X12 Parser
 * Parses and generates X12 EDI documents for warehouse management
 * Supports: 810, 850, 855, 856, 940, 943, 944, 945, 947
 */

// EDI Delimiters (standard X12)
const DEFAULT_DELIMITERS = {
  element: '*',      // Element separator
  segment: '~',      // Segment terminator
  component: ':',    // Component separator (sub-element)
  repetition: '^'    // Repetition separator
};

/**
 * Parse raw EDI X12 string into structured object
 */
export function parseEDI(rawEdi, customDelimiters = {}) {
  const delimiters = { ...DEFAULT_DELIMITERS, ...customDelimiters };

  // Auto-detect delimiters from ISA segment if present
  if (rawEdi.startsWith('ISA')) {
    delimiters.element = rawEdi[3];
    delimiters.component = rawEdi[104] || ':';
    delimiters.segment = rawEdi[105] || '~';
  }

  const result = {
    delimiters,
    interchanges: [],
    errors: [],
    raw: rawEdi
  };

  try {
    // Clean and split into segments
    const cleanedEdi = rawEdi.replace(/\r\n|\r|\n/g, '');
    const segments = cleanedEdi.split(delimiters.segment).filter(s => s.trim());

    let currentInterchange = null;
    let currentGroup = null;
    let currentTransaction = null;

    for (const segment of segments) {
      const elements = segment.split(delimiters.element);
      const segmentId = elements[0].trim();

      switch (segmentId) {
        case 'ISA':
          currentInterchange = parseISA(elements);
          result.interchanges.push(currentInterchange);
          break;

        case 'IEA':
          if (currentInterchange) {
            currentInterchange.trailer = parseIEA(elements);
          }
          currentInterchange = null;
          break;

        case 'GS':
          currentGroup = parseGS(elements);
          if (currentInterchange) {
            currentInterchange.groups = currentInterchange.groups || [];
            currentInterchange.groups.push(currentGroup);
          }
          break;

        case 'GE':
          if (currentGroup) {
            currentGroup.trailer = parseGE(elements);
          }
          currentGroup = null;
          break;

        case 'ST':
          currentTransaction = parseST(elements);
          if (currentGroup) {
            currentGroup.transactions = currentGroup.transactions || [];
            currentGroup.transactions.push(currentTransaction);
          }
          break;

        case 'SE':
          if (currentTransaction) {
            currentTransaction.trailer = parseSE(elements);
          }
          currentTransaction = null;
          break;

        default:
          // Add segment to current transaction
          if (currentTransaction) {
            currentTransaction.segments = currentTransaction.segments || [];
            currentTransaction.segments.push({
              id: segmentId,
              elements: elements.slice(1)
            });
          }
          break;
      }
    }

    // Parse transaction-specific data
    for (const interchange of result.interchanges) {
      for (const group of interchange.groups || []) {
        for (const transaction of group.transactions || []) {
          transaction.parsed = parseTransactionData(transaction, group.functionalId);
        }
      }
    }

  } catch (error) {
    result.errors.push({
      message: error.message,
      stack: error.stack
    });
  }

  return result;
}

/**
 * Parse ISA (Interchange Control Header)
 */
function parseISA(elements) {
  return {
    authInfoQualifier: elements[1]?.trim(),
    authInfo: elements[2]?.trim(),
    securityInfoQualifier: elements[3]?.trim(),
    securityInfo: elements[4]?.trim(),
    senderIdQualifier: elements[5]?.trim(),
    senderId: elements[6]?.trim(),
    receiverIdQualifier: elements[7]?.trim(),
    receiverId: elements[8]?.trim(),
    date: elements[9]?.trim(),
    time: elements[10]?.trim(),
    repetitionSeparator: elements[11]?.trim(),
    controlVersionNumber: elements[12]?.trim(),
    controlNumber: elements[13]?.trim(),
    ackRequested: elements[14]?.trim(),
    usageIndicator: elements[15]?.trim(), // P=Production, T=Test
    componentSeparator: elements[16]?.trim()
  };
}

/**
 * Parse IEA (Interchange Control Trailer)
 */
function parseIEA(elements) {
  return {
    numberOfGroups: parseInt(elements[1]) || 0,
    controlNumber: elements[2]?.trim()
  };
}

/**
 * Parse GS (Functional Group Header)
 */
function parseGS(elements) {
  return {
    functionalId: elements[1]?.trim(), // PO, SH, IN, etc.
    senderCode: elements[2]?.trim(),
    receiverCode: elements[3]?.trim(),
    date: elements[4]?.trim(),
    time: elements[5]?.trim(),
    controlNumber: elements[6]?.trim(),
    responsibleAgency: elements[7]?.trim(),
    version: elements[8]?.trim()
  };
}

/**
 * Parse GE (Functional Group Trailer)
 */
function parseGE(elements) {
  return {
    numberOfTransactions: parseInt(elements[1]) || 0,
    controlNumber: elements[2]?.trim()
  };
}

/**
 * Parse ST (Transaction Set Header)
 */
function parseST(elements) {
  return {
    transactionSetId: elements[1]?.trim(), // 850, 856, etc.
    controlNumber: elements[2]?.trim(),
    implementationConvention: elements[3]?.trim()
  };
}

/**
 * Parse SE (Transaction Set Trailer)
 */
function parseSE(elements) {
  return {
    segmentCount: parseInt(elements[1]) || 0,
    controlNumber: elements[2]?.trim()
  };
}

/**
 * Parse transaction-specific data based on document type
 */
function parseTransactionData(transaction, functionalId) {
  const docType = transaction.transactionSetId;
  const segments = transaction.segments || [];

  switch (docType) {
    case '850':
      return parse850(segments);
    case '855':
      return parse855(segments);
    case '856':
      return parse856(segments);
    case '810':
      return parse810(segments);
    case '940':
      return parse940(segments);
    case '945':
      return parse945(segments);
    case '943':
      return parse943(segments);
    case '944':
      return parse944(segments);
    case '947':
      return parse947(segments);
    default:
      return { type: docType, segments };
  }
}

/**
 * Parse 850 - Purchase Order
 */
function parse850(segments) {
  const result = {
    type: 'PURCHASE_ORDER',
    header: {},
    parties: [],
    items: [],
    totals: {}
  };

  let currentItem = null;

  for (const seg of segments) {
    switch (seg.id) {
      case 'BEG':
        result.header = {
          purpose: seg.elements[0], // 00=Original, 01=Cancel, 05=Replace
          orderType: seg.elements[1], // NE=New, RO=Rush
          poNumber: seg.elements[2],
          releaseNumber: seg.elements[3],
          date: seg.elements[4]
        };
        break;

      case 'CUR':
        result.header.currency = seg.elements[1];
        break;

      case 'REF':
        result.header.references = result.header.references || [];
        result.header.references.push({
          qualifier: seg.elements[0],
          value: seg.elements[1],
          description: seg.elements[2]
        });
        break;

      case 'DTM':
        result.header.dates = result.header.dates || [];
        result.header.dates.push({
          qualifier: seg.elements[0], // 002=Delivery, 010=Requested Ship
          date: seg.elements[1]
        });
        break;

      case 'N1':
        result.parties.push({
          qualifier: seg.elements[0], // ST=Ship To, BT=Bill To, VN=Vendor
          name: seg.elements[1],
          idQualifier: seg.elements[2],
          id: seg.elements[3]
        });
        break;

      case 'N3':
        if (result.parties.length > 0) {
          const party = result.parties[result.parties.length - 1];
          party.address1 = seg.elements[0];
          party.address2 = seg.elements[1];
        }
        break;

      case 'N4':
        if (result.parties.length > 0) {
          const party = result.parties[result.parties.length - 1];
          party.city = seg.elements[0];
          party.state = seg.elements[1];
          party.zip = seg.elements[2];
          party.country = seg.elements[3];
        }
        break;

      case 'PO1':
        currentItem = {
          lineNumber: seg.elements[0],
          quantity: parseFloat(seg.elements[1]) || 0,
          uom: seg.elements[2],
          unitPrice: parseFloat(seg.elements[3]) || 0,
          productIds: []
        };
        // Parse product ID qualifiers (elements 5-onwards come in pairs)
        for (let i = 5; i < seg.elements.length; i += 2) {
          if (seg.elements[i] && seg.elements[i + 1]) {
            currentItem.productIds.push({
              qualifier: seg.elements[i], // UP=UPC, VP=Vendor Part, SK=SKU
              value: seg.elements[i + 1]
            });
          }
        }
        result.items.push(currentItem);
        break;

      case 'PID':
        if (currentItem) {
          currentItem.description = seg.elements[4];
        }
        break;

      case 'CTT':
        result.totals.lineItems = parseInt(seg.elements[0]) || 0;
        result.totals.hashTotal = parseFloat(seg.elements[1]) || 0;
        break;

      case 'AMT':
        result.totals.amount = parseFloat(seg.elements[1]) || 0;
        break;
    }
  }

  return result;
}

/**
 * Parse 855 - Purchase Order Acknowledgment
 */
function parse855(segments) {
  const result = {
    type: 'PO_ACKNOWLEDGMENT',
    header: {},
    items: []
  };

  let currentItem = null;

  for (const seg of segments) {
    switch (seg.id) {
      case 'BAK':
        result.header = {
          purpose: seg.elements[0],
          ackType: seg.elements[1], // AC=Acknowledge, AD=Acknowledge with Detail
          poNumber: seg.elements[2],
          date: seg.elements[3],
          requestRef: seg.elements[4]
        };
        break;

      case 'PO1':
        currentItem = {
          lineNumber: seg.elements[0],
          quantity: parseFloat(seg.elements[1]) || 0,
          uom: seg.elements[2],
          unitPrice: parseFloat(seg.elements[3]) || 0
        };
        result.items.push(currentItem);
        break;

      case 'ACK':
        if (currentItem) {
          currentItem.ackStatus = seg.elements[0]; // IA=Item Accepted, IR=Item Rejected
          currentItem.ackQuantity = parseFloat(seg.elements[1]) || 0;
          currentItem.ackUom = seg.elements[2];
          currentItem.scheduledDate = seg.elements[3];
        }
        break;
    }
  }

  return result;
}

/**
 * Parse 856 - Advance Ship Notice (ASN)
 */
function parse856(segments) {
  const result = {
    type: 'ASN',
    header: {},
    shipment: {},
    orders: [],
    items: []
  };

  let currentLevel = null;
  let currentOrder = null;
  let currentItem = null;

  for (const seg of segments) {
    switch (seg.id) {
      case 'BSN':
        result.header = {
          purpose: seg.elements[0], // 00=Original, 01=Cancel
          shipmentId: seg.elements[1],
          date: seg.elements[2],
          time: seg.elements[3]
        };
        break;

      case 'HL':
        currentLevel = {
          id: seg.elements[0],
          parentId: seg.elements[1],
          levelCode: seg.elements[2] // S=Shipment, O=Order, P=Pack, I=Item
        };
        break;

      case 'TD1':
        result.shipment.packaging = {
          packagingCode: seg.elements[0],
          ladingQuantity: parseInt(seg.elements[1]) || 0,
          weight: parseFloat(seg.elements[6]) || 0,
          weightUnit: seg.elements[7]
        };
        break;

      case 'TD5':
        result.shipment.carrier = {
          routingSeq: seg.elements[0],
          idQualifier: seg.elements[1],
          carrierId: seg.elements[2],
          transportMethod: seg.elements[3],
          carrierName: seg.elements[4]
        };
        break;

      case 'TD3':
        result.shipment.equipment = {
          equipmentType: seg.elements[0],
          equipmentNumber: seg.elements[2],
          sealNumber: seg.elements[8]
        };
        break;

      case 'REF':
        if (seg.elements[0] === 'BM') {
          result.shipment.bolNumber = seg.elements[1];
        } else if (seg.elements[0] === 'CN') {
          result.shipment.proNumber = seg.elements[1];
        }
        break;

      case 'DTM':
        if (seg.elements[0] === '011') {
          result.shipment.shipDate = seg.elements[1];
        } else if (seg.elements[0] === '017') {
          result.shipment.deliveryDate = seg.elements[1];
        }
        break;

      case 'PRF':
        currentOrder = {
          poNumber: seg.elements[0],
          releaseNumber: seg.elements[1],
          date: seg.elements[3]
        };
        result.orders.push(currentOrder);
        break;

      case 'LIN':
        currentItem = {
          lineNumber: seg.elements[0],
          productIds: []
        };
        for (let i = 1; i < seg.elements.length; i += 2) {
          if (seg.elements[i] && seg.elements[i + 1]) {
            currentItem.productIds.push({
              qualifier: seg.elements[i],
              value: seg.elements[i + 1]
            });
          }
        }
        result.items.push(currentItem);
        break;

      case 'SN1':
        if (currentItem) {
          currentItem.quantity = parseFloat(seg.elements[1]) || 0;
          currentItem.uom = seg.elements[2];
        }
        break;

      case 'MAN':
        if (currentItem) {
          currentItem.marks = currentItem.marks || [];
          currentItem.marks.push({
            qualifier: seg.elements[0],
            value: seg.elements[1]
          });
        }
        break;
    }
  }

  return result;
}

/**
 * Parse 810 - Invoice
 */
function parse810(segments) {
  const result = {
    type: 'INVOICE',
    header: {},
    parties: [],
    items: [],
    totals: {}
  };

  let currentItem = null;

  for (const seg of segments) {
    switch (seg.id) {
      case 'BIG':
        result.header = {
          invoiceDate: seg.elements[0],
          invoiceNumber: seg.elements[1],
          poDate: seg.elements[2],
          poNumber: seg.elements[3]
        };
        break;

      case 'N1':
        result.parties.push({
          qualifier: seg.elements[0],
          name: seg.elements[1],
          idQualifier: seg.elements[2],
          id: seg.elements[3]
        });
        break;

      case 'IT1':
        currentItem = {
          lineNumber: seg.elements[0],
          quantity: parseFloat(seg.elements[1]) || 0,
          uom: seg.elements[2],
          unitPrice: parseFloat(seg.elements[3]) || 0,
          productIds: []
        };
        for (let i = 5; i < seg.elements.length; i += 2) {
          if (seg.elements[i] && seg.elements[i + 1]) {
            currentItem.productIds.push({
              qualifier: seg.elements[i],
              value: seg.elements[i + 1]
            });
          }
        }
        result.items.push(currentItem);
        break;

      case 'TDS':
        result.totals.totalAmount = parseFloat(seg.elements[0]) / 100; // Cents to dollars
        break;

      case 'CAD':
        result.carrier = {
          transportMethod: seg.elements[0],
          carrierId: seg.elements[3],
          carrierName: seg.elements[4]
        };
        break;
    }
  }

  return result;
}

/**
 * Parse 940 - Warehouse Shipping Order
 */
function parse940(segments) {
  const result = {
    type: 'WAREHOUSE_SHIPPING_ORDER',
    header: {},
    shipTo: {},
    items: []
  };

  let currentItem = null;

  for (const seg of segments) {
    switch (seg.id) {
      case 'W05':
        result.header = {
          orderStatus: seg.elements[0],
          depositorOrderNumber: seg.elements[1],
          purchaseOrderNumber: seg.elements[2],
          linkSeq: seg.elements[3]
        };
        break;

      case 'N1':
        if (seg.elements[0] === 'ST') {
          result.shipTo.name = seg.elements[1];
          result.shipTo.idQualifier = seg.elements[2];
          result.shipTo.id = seg.elements[3];
        } else if (seg.elements[0] === 'DE') {
          result.depositor = {
            name: seg.elements[1],
            id: seg.elements[3]
          };
        }
        break;

      case 'N3':
        result.shipTo.address1 = seg.elements[0];
        result.shipTo.address2 = seg.elements[1];
        break;

      case 'N4':
        result.shipTo.city = seg.elements[0];
        result.shipTo.state = seg.elements[1];
        result.shipTo.zip = seg.elements[2];
        result.shipTo.country = seg.elements[3];
        break;

      case 'W66':
        result.shipping = {
          transportMethod: seg.elements[0],
          carrierCode: seg.elements[3],
          carrierName: seg.elements[4],
          serviceLevel: seg.elements[5]
        };
        break;

      case 'LX':
        currentItem = { lineNumber: seg.elements[0] };
        result.items.push(currentItem);
        break;

      case 'W01':
        if (currentItem) {
          currentItem.quantity = parseFloat(seg.elements[0]) || 0;
          currentItem.uom = seg.elements[1];
          currentItem.weight = parseFloat(seg.elements[4]) || 0;
          currentItem.productIds = [];
          for (let i = 5; i < seg.elements.length; i += 2) {
            if (seg.elements[i] && seg.elements[i + 1]) {
              currentItem.productIds.push({
                qualifier: seg.elements[i],
                value: seg.elements[i + 1]
              });
            }
          }
        }
        break;

      case 'G69':
        if (currentItem) {
          currentItem.description = seg.elements[0];
        }
        break;

      case 'N9':
        if (currentItem) {
          currentItem.references = currentItem.references || [];
          currentItem.references.push({
            qualifier: seg.elements[0],
            value: seg.elements[1]
          });
        }
        break;
    }
  }

  return result;
}

/**
 * Parse 945 - Warehouse Shipping Advice
 */
function parse945(segments) {
  const result = {
    type: 'WAREHOUSE_SHIPPING_ADVICE',
    header: {},
    shipment: {},
    items: []
  };

  let currentItem = null;

  for (const seg of segments) {
    switch (seg.id) {
      case 'W06':
        result.header = {
          reportType: seg.elements[0],
          depositorOrderNumber: seg.elements[1],
          date: seg.elements[2],
          shipmentId: seg.elements[3],
          warehouseOrderNumber: seg.elements[5]
        };
        break;

      case 'W27':
        result.shipment = {
          transportMethod: seg.elements[0],
          carrierCode: seg.elements[2],
          carrierName: seg.elements[3],
          bolNumber: seg.elements[5],
          scac: seg.elements[7]
        };
        break;

      case 'W28':
        result.shipment.consolidation = {
          weight: parseFloat(seg.elements[0]) || 0,
          weightQualifier: seg.elements[1],
          ladingQuantity: parseInt(seg.elements[2]) || 0,
          ladingDescription: seg.elements[3]
        };
        break;

      case 'LX':
        currentItem = { lineNumber: seg.elements[0] };
        result.items.push(currentItem);
        break;

      case 'W12':
        if (currentItem) {
          currentItem.shipmentType = seg.elements[0];
          currentItem.quantityShipped = parseFloat(seg.elements[1]) || 0;
          currentItem.uom = seg.elements[2];
          currentItem.productIds = [];
          for (let i = 4; i < seg.elements.length; i += 2) {
            if (seg.elements[i] && seg.elements[i + 1]) {
              currentItem.productIds.push({
                qualifier: seg.elements[i],
                value: seg.elements[i + 1]
              });
            }
          }
        }
        break;

      case 'G69':
        if (currentItem) {
          currentItem.description = seg.elements[0];
        }
        break;

      case 'W03':
        result.totals = {
          records: parseInt(seg.elements[0]) || 0,
          weight: parseFloat(seg.elements[1]) || 0,
          weightUnit: seg.elements[2],
          volume: parseFloat(seg.elements[3]) || 0,
          volumeUnit: seg.elements[4],
          ladingQuantity: parseInt(seg.elements[5]) || 0
        };
        break;
    }
  }

  return result;
}

/**
 * Parse 943 - Warehouse Stock Transfer Shipment Advice
 */
function parse943(segments) {
  const result = {
    type: 'STOCK_TRANSFER_SHIPMENT',
    header: {},
    items: []
  };

  let currentItem = null;

  for (const seg of segments) {
    switch (seg.id) {
      case 'W06':
        result.header = {
          reportType: seg.elements[0],
          depositorOrderNumber: seg.elements[1],
          date: seg.elements[2]
        };
        break;

      case 'W07':
        currentItem = {
          quantity: parseFloat(seg.elements[0]) || 0,
          uom: seg.elements[1],
          weight: parseFloat(seg.elements[4]) || 0,
          productIds: []
        };
        for (let i = 5; i < seg.elements.length; i += 2) {
          if (seg.elements[i] && seg.elements[i + 1]) {
            currentItem.productIds.push({
              qualifier: seg.elements[i],
              value: seg.elements[i + 1]
            });
          }
        }
        result.items.push(currentItem);
        break;

      case 'W20':
        if (currentItem) {
          currentItem.lot = {
            lotNumber: seg.elements[0],
            expirationDate: seg.elements[3],
            manufactureDate: seg.elements[4]
          };
        }
        break;
    }
  }

  return result;
}

/**
 * Parse 944 - Warehouse Stock Transfer Receipt Advice
 */
function parse944(segments) {
  const result = {
    type: 'STOCK_TRANSFER_RECEIPT',
    header: {},
    items: []
  };

  let currentItem = null;

  for (const seg of segments) {
    switch (seg.id) {
      case 'W17':
        result.header = {
          reportType: seg.elements[0],
          reportingCode: seg.elements[1],
          date: seg.elements[2],
          warehouseReceiptNumber: seg.elements[3],
          depositorOrderNumber: seg.elements[4]
        };
        break;

      case 'W07':
        currentItem = {
          quantityReceived: parseFloat(seg.elements[0]) || 0,
          uom: seg.elements[1],
          weight: parseFloat(seg.elements[4]) || 0,
          productIds: []
        };
        for (let i = 5; i < seg.elements.length; i += 2) {
          if (seg.elements[i] && seg.elements[i + 1]) {
            currentItem.productIds.push({
              qualifier: seg.elements[i],
              value: seg.elements[i + 1]
            });
          }
        }
        result.items.push(currentItem);
        break;

      case 'W14':
        result.totals = {
          quantityReceived: parseFloat(seg.elements[0]) || 0,
          quantityDamaged: parseFloat(seg.elements[1]) || 0,
          records: parseInt(seg.elements[2]) || 0
        };
        break;
    }
  }

  return result;
}

/**
 * Parse 947 - Warehouse Inventory Adjustment Advice
 */
function parse947(segments) {
  const result = {
    type: 'INVENTORY_ADJUSTMENT',
    header: {},
    adjustments: []
  };

  let currentAdj = null;

  for (const seg of segments) {
    switch (seg.id) {
      case 'W15':
        result.header = {
          transactionType: seg.elements[0],
          date: seg.elements[1],
          time: seg.elements[2],
          referenceId: seg.elements[3]
        };
        break;

      case 'W07':
        currentAdj = {
          quantity: parseFloat(seg.elements[0]) || 0,
          uom: seg.elements[1],
          productIds: []
        };
        for (let i = 5; i < seg.elements.length; i += 2) {
          if (seg.elements[i] && seg.elements[i + 1]) {
            currentAdj.productIds.push({
              qualifier: seg.elements[i],
              value: seg.elements[i + 1]
            });
          }
        }
        result.adjustments.push(currentAdj);
        break;

      case 'W13':
        if (currentAdj) {
          currentAdj.adjustmentDetail = {
            quantityBefore: parseFloat(seg.elements[0]) || 0,
            quantityAfter: parseFloat(seg.elements[1]) || 0,
            uom: seg.elements[2],
            adjustmentReason: seg.elements[3]
          };
        }
        break;

      case 'W20':
        if (currentAdj) {
          currentAdj.lot = {
            lotNumber: seg.elements[0],
            expirationDate: seg.elements[3]
          };
        }
        break;

      case 'W14':
        result.totals = {
          totalQuantity: parseFloat(seg.elements[0]) || 0,
          recordCount: parseInt(seg.elements[2]) || 0
        };
        break;
    }
  }

  return result;
}

export {
  parse850,
  parse855,
  parse856,
  parse810,
  parse940,
  parse945,
  parse943,
  parse944,
  parse947
};
