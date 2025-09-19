import mongoose from 'mongoose';

const PurchaseOrderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  supplierOrderNumber: String, // Supplier's reference number
  
  // Supplier information
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
    index: true,
  },
  supplierDetails: {
    name: String,
    email: String,
    phone: String,
    address: String,
  },
  
  // Delivery information
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  
  // Order items
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: String,
    name: String,
    description: String,
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    // Receiving tracking
    receivedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Product details at time of order
    supplierSku: String,
    notes: String,
  }],
  
  // Financial totals
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  
  // Dates
  orderDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  closedDate: Date,
  
  // Status tracking
  status: {
    type: String,
    enum: [
      'draft',
      'pending_approval',
      'approved',
      'sent',
      'acknowledged',
      'partially_received',
      'received',
      'closed',
      'cancelled'
    ],
    default: 'draft',
    index: true,
  },
  
  // Approval workflow
  approvalRequired: {
    type: Boolean,
    default: false,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  approvalNotes: String,
  
  // Payment terms
  paymentTerms: {
    type: String,
    enum: ['net_15', 'net_30', 'net_45', 'net_60', 'cod', 'prepaid'],
    default: 'net_30',
  },
  paymentDueDate: Date,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending',
  },
  
  // Shipping information
  shippingMethod: String,
  trackingNumber: String,
  carrier: String,
  
  // Communication
  notes: String,
  internalNotes: String,
  supplierNotes: String,
  
  // Attachments
  attachments: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Multi-tenancy
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
PurchaseOrderSchema.index({ companyId: 1, orderNumber: 1 }, { unique: true });
PurchaseOrderSchema.index({ companyId: 1, supplierId: 1 });
PurchaseOrderSchema.index({ companyId: 1, status: 1 });
PurchaseOrderSchema.index({ companyId: 1, orderDate: -1 });
PurchaseOrderSchema.index({ companyId: 1, expectedDeliveryDate: 1 });

// Virtual for completion percentage
PurchaseOrderSchema.virtual('completionPercentage').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  
  const totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const receivedQuantity = this.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
  
  return totalQuantity > 0 ? Math.round((receivedQuantity / totalQuantity) * 100) : 0;
});

// Virtual for is overdue
PurchaseOrderSchema.virtual('isOverdue').get(function() {
  if (!this.expectedDeliveryDate || this.status === 'received' || this.status === 'closed') return false;
  return new Date() > new Date(this.expectedDeliveryDate);
});

// Virtual for days until delivery
PurchaseOrderSchema.virtual('daysUntilDelivery').get(function() {
  if (!this.expectedDeliveryDate) return null;
  const today = new Date();
  const deliveryDate = new Date(this.expectedDeliveryDate);
  const diffTime = deliveryDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total items count
PurchaseOrderSchema.virtual('totalItemsCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for received items count
PurchaseOrderSchema.virtual('receivedItemsCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
});

// Virtual for pending items count
PurchaseOrderSchema.virtual('pendingItemsCount').get(function() {
  return this.items.reduce((sum, item) => sum + (item.quantity - item.receivedQuantity), 0);
});

// Method to check if order is fully received
PurchaseOrderSchema.methods.isFullyReceived = function() {
  return this.items.every(item => item.receivedQuantity >= item.quantity);
};

// Method to check if order is partially received
PurchaseOrderSchema.methods.isPartiallyReceived = function() {
  return this.items.some(item => item.receivedQuantity > 0) && !this.isFullyReceived();
};

// Method to receive items
PurchaseOrderSchema.methods.receiveItems = function(receivedItems, receivedBy) {
  let hasChanges = false;
  
  receivedItems.forEach(received => {
    const item = this.items.id(received.itemId);
    if (item && received.quantity > 0) {
      const maxReceivable = item.quantity - item.receivedQuantity;
      const actualReceived = Math.min(received.quantity, maxReceivable);
      
      if (actualReceived > 0) {
        item.receivedQuantity += actualReceived;
        hasChanges = true;
      }
    }
  });
  
  if (hasChanges) {
    this.updatedBy = receivedBy;
    this.updateStatus();
  }
  
  return hasChanges;
};

// Method to update status based on received quantities
PurchaseOrderSchema.methods.updateStatus = function() {
  if (this.isFullyReceived()) {
    this.status = 'received';
    this.actualDeliveryDate = new Date();
  } else if (this.isPartiallyReceived()) {
    this.status = 'partially_received';
  }
};

// Method to approve order
PurchaseOrderSchema.methods.approve = function(approvedBy, notes = '') {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.approvalNotes = notes;
  return this;
};

// Method to calculate payment due date
PurchaseOrderSchema.methods.calculatePaymentDueDate = function() {
  if (!this.orderDate || !this.paymentTerms) return null;
  
  const orderDate = new Date(this.orderDate);
  const termsDays = {
    'net_15': 15,
    'net_30': 30,
    'net_45': 45,
    'net_60': 60,
    'cod': 0,
    'prepaid': 0,
  };
  
  const days = termsDays[this.paymentTerms] || 30;
  const dueDate = new Date(orderDate);
  dueDate.setDate(dueDate.getDate() + days);
  
  return dueDate;
};

// Pre-save middleware
PurchaseOrderSchema.pre('save', function(next) {
  // Calculate totals
  if (this.isModified('items')) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.totalCost, 0);
    this.totalAmount = this.subtotal + this.taxAmount + this.shippingCost - this.discountAmount;
    
    // Update pending quantities
    this.items.forEach(item => {
      item.pendingQuantity = item.quantity - item.receivedQuantity;
    });
  }
  
  // Calculate payment due date
  if (this.isModified('paymentTerms') || this.isModified('orderDate')) {
    this.paymentDueDate = this.calculatePaymentDueDate();
  }
  
  // Auto-generate order number if not provided
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `PO${year}${month}${day}${random}`;
  }
  
  next();
});

export default mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', PurchaseOrderSchema);