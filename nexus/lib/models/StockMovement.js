import mongoose from 'mongoose';

const StockMovementSchema = new mongoose.Schema({
  // Product and location
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  },
  fromWarehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
  },
  toWarehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
  },
  // Movement details
  type: {
    type: String,
    enum: [
      'inbound',       // Receiving inventory
      'outbound',      // Shipping/selling inventory
      'transfer',      // Moving between warehouses
      'adjustment',    // Manual adjustment
      'return',        // Customer/supplier return
      'damaged',       // Marking as damaged
      'expired',       // Marking as expired
      'cycle_count',   // Cycle count adjustment
      'production',    // Manufacturing/assembly
      'consumption',   // Raw material consumption
    ],
    required: true,
    index: true,
  },
  reason: {
    type: String,
    enum: [
      'purchase_order',
      'sales_order',
      'transfer_order',
      'manual_adjustment',
      'customer_return',
      'supplier_return',
      'damaged_goods',
      'expired_goods',
      'cycle_count',
      'production_input',
      'production_output',
      'stock_loss',
      'stock_found',
      'correction',
      'other',
    ],
    required: true,
  },
  // Quantities
  quantity: {
    type: Number,
    required: true,
  },
  beforeQuantity: {
    type: Number,
    required: true,
  },
  afterQuantity: {
    type: Number,
    required: true,
  },
  // Cost information
  unitCost: {
    type: Number,
    min: 0,
  },
  totalCost: {
    type: Number,
    min: 0,
  },
  // Batch/lot tracking
  batch: String,
  lotNumber: String,
  serialNumbers: [String],
  expiryDate: Date,
  // Reference documents
  referenceType: {
    type: String,
    enum: ['purchase_order', 'sales_order', 'transfer_order', 'adjustment', 'return', 'production_order'],
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceType',
  },
  referenceNumber: String,
  // Location details
  fromLocation: {
    zone: String,
    aisle: String,
    shelf: String,
    bin: String,
  },
  toLocation: {
    zone: String,
    aisle: String,
    shelf: String,
    bin: String,
  },
  // Additional information
  notes: String,
  tags: [String],
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'failed'],
    default: 'completed',
  },
  // Workflow
  processedAt: {
    type: Date,
    default: Date.now,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  // Multi-tenancy
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for efficient queries
StockMovementSchema.index({ companyId: 1, productId: 1 });
StockMovementSchema.index({ companyId: 1, type: 1 });
StockMovementSchema.index({ companyId: 1, reason: 1 });
StockMovementSchema.index({ companyId: 1, fromWarehouseId: 1 });
StockMovementSchema.index({ companyId: 1, toWarehouseId: 1 });
StockMovementSchema.index({ companyId: 1, processedAt: -1 });
StockMovementSchema.index({ companyId: 1, referenceType: 1, referenceId: 1 });
StockMovementSchema.index({ companyId: 1, status: 1 });
StockMovementSchema.index({ companyId: 1, batch: 1 });
StockMovementSchema.index({ companyId: 1, lotNumber: 1 });

// Virtual for movement direction
StockMovementSchema.virtual('direction').get(function() {
  if (this.type === 'inbound') return 'in';
  if (this.type === 'outbound') return 'out';
  if (this.type === 'transfer') return 'transfer';
  return 'adjustment';
});

// Virtual for quantity change with sign
StockMovementSchema.virtual('quantityChange').get(function() {
  return this.afterQuantity - this.beforeQuantity;
});

// Virtual for absolute quantity change
StockMovementSchema.virtual('absoluteQuantityChange').get(function() {
  return Math.abs(this.quantityChange);
});

// Virtual for movement summary
StockMovementSchema.virtual('summary').get(function() {
  const action = this.type.replace('_', ' ');
  const qty = this.quantity;
  return `${action}: ${qty} units`;
});

// Virtual for location strings
StockMovementSchema.virtual('fromLocationString').get(function() {
  if (!this.fromLocation) return '';
  const parts = [
    this.fromLocation.zone,
    this.fromLocation.aisle,
    this.fromLocation.shelf,
    this.fromLocation.bin
  ].filter(Boolean);
  return parts.join('-');
});

StockMovementSchema.virtual('toLocationString').get(function() {
  if (!this.toLocation) return '';
  const parts = [
    this.toLocation.zone,
    this.toLocation.aisle,
    this.toLocation.shelf,
    this.toLocation.bin
  ].filter(Boolean);
  return parts.join('-');
});

// Method to check if movement needs approval
StockMovementSchema.methods.needsApproval = function() {
  const approvalRequiredTypes = ['adjustment', 'damaged', 'expired'];
  const approvalRequiredReasons = ['manual_adjustment', 'damaged_goods', 'expired_goods', 'stock_loss'];
  
  return approvalRequiredTypes.includes(this.type) || 
         approvalRequiredReasons.includes(this.reason) ||
         Math.abs(this.quantityChange) > 100; // Large quantity changes
};

// Method to approve movement
StockMovementSchema.methods.approve = function(approvedBy) {
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.status = 'completed';
  return this;
};

// Static method to get movements for a product
StockMovementSchema.statics.getProductMovements = function(companyId, productId, options = {}) {
  const query = { companyId, productId };
  
  if (options.warehouseId) {
    query.$or = [
      { fromWarehouseId: options.warehouseId },
      { toWarehouseId: options.warehouseId }
    ];
  }
  
  if (options.startDate || options.endDate) {
    query.processedAt = {};
    if (options.startDate) query.processedAt.$gte = new Date(options.startDate);
    if (options.endDate) query.processedAt.$lte = new Date(options.endDate);
  }
  
  if (options.type) query.type = options.type;
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .populate('processedBy', 'name email')
    .populate('approvedBy', 'name email')
    .populate('fromWarehouseId', 'name code')
    .populate('toWarehouseId', 'name code')
    .sort({ processedAt: -1 })
    .limit(options.limit || 100);
};

// Pre-save middleware
StockMovementSchema.pre('save', function(next) {
  if (this.unitCost && this.quantity) {
    this.totalCost = this.unitCost * Math.abs(this.quantity);
  }
  next();
});

export default mongoose.models.StockMovement || mongoose.model('StockMovement', StockMovementSchema);