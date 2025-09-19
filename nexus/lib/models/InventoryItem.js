import mongoose from 'mongoose';

const InventoryItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
    index: true,
  },
  // Stock quantities
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  availableQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Location within warehouse
  location: {
    zone: String,
    aisle: String,
    shelf: String,
    bin: String,
  },
  // Batch/lot tracking
  batch: {
    type: String,
    trim: true,
  },
  lotNumber: {
    type: String,
    trim: true,
  },
  serialNumbers: [String],
  // Dates
  expiryDate: Date,
  manufacturedDate: Date,
  receivedDate: {
    type: Date,
    default: Date.now,
  },
  // Cost tracking
  unitCost: {
    type: Number,
    min: 0,
  },
  totalCost: {
    type: Number,
    min: 0,
  },
  // Quality control
  qualityStatus: {
    type: String,
    enum: ['good', 'damaged', 'expired', 'quarantine', 'returned'],
    default: 'good',
  },
  qualityNotes: String,
  // Cycle count
  lastCountDate: Date,
  lastCountedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  cycleCountVariance: {
    type: Number,
    default: 0,
  },
  // Flags
  isActive: {
    type: Boolean,
    default: true,
  },
  isTrackingSerial: {
    type: Boolean,
    default: false,
  },
  isTrackingBatch: {
    type: Boolean,
    default: false,
  },
  // Multi-tenancy
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  // Audit fields
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound indexes for efficient queries
InventoryItemSchema.index({ companyId: 1, productId: 1, warehouseId: 1 }, { unique: true });
InventoryItemSchema.index({ companyId: 1, warehouseId: 1 });
InventoryItemSchema.index({ companyId: 1, qualityStatus: 1 });
InventoryItemSchema.index({ companyId: 1, expiryDate: 1 });
InventoryItemSchema.index({ companyId: 1, batch: 1 });
InventoryItemSchema.index({ companyId: 1, lotNumber: 1 });

// Virtual for total value
InventoryItemSchema.virtual('totalValue').get(function() {
  return this.quantity * (this.unitCost || 0);
});

// Virtual for available value
InventoryItemSchema.virtual('availableValue').get(function() {
  return this.availableQuantity * (this.unitCost || 0);
});

// Virtual for location string
InventoryItemSchema.virtual('locationString').get(function() {
  if (!this.location) return '';
  const parts = [
    this.location.zone,
    this.location.aisle,
    this.location.shelf,
    this.location.bin
  ].filter(Boolean);
  return parts.join('-');
});

// Virtual for days until expiry
InventoryItemSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for aging in days
InventoryItemSchema.virtual('agingDays').get(function() {
  const today = new Date();
  const received = new Date(this.receivedDate);
  const diffTime = today - received;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Method to check if item is expired
InventoryItemSchema.methods.isExpired = function() {
  if (!this.expiryDate) return false;
  return new Date() > new Date(this.expiryDate);
};

// Method to check if item is expiring soon
InventoryItemSchema.methods.isExpiringSoon = function(daysThreshold = 30) {
  if (!this.expiryDate) return false;
  const daysUntilExpiry = this.daysUntilExpiry;
  return daysUntilExpiry !== null && daysUntilExpiry <= daysThreshold && daysUntilExpiry >= 0;
};

// Method to reserve quantity
InventoryItemSchema.methods.reserve = function(quantity) {
  if (quantity > this.availableQuantity) {
    throw new Error('Cannot reserve more than available quantity');
  }
  this.reservedQuantity += quantity;
  this.availableQuantity -= quantity;
  return this;
};

// Method to release reservation
InventoryItemSchema.methods.releaseReservation = function(quantity) {
  if (quantity > this.reservedQuantity) {
    throw new Error('Cannot release more than reserved quantity');
  }
  this.reservedQuantity -= quantity;
  this.availableQuantity += quantity;
  return this;
};

// Method to adjust quantity
InventoryItemSchema.methods.adjustQuantity = function(newQuantity, reason = 'adjustment') {
  const oldQuantity = this.quantity;
  const adjustment = newQuantity - oldQuantity;
  
  this.quantity = newQuantity;
  this.availableQuantity = Math.max(0, newQuantity - this.reservedQuantity);
  
  return {
    oldQuantity,
    newQuantity,
    adjustment,
    reason
  };
};

// Pre-save middleware to update available quantity
InventoryItemSchema.pre('save', function(next) {
  if (this.isModified('quantity') || this.isModified('reservedQuantity')) {
    this.availableQuantity = Math.max(0, this.quantity - this.reservedQuantity);
  }
  
  if (this.isModified('quantity') && this.unitCost) {
    this.totalCost = this.quantity * this.unitCost;
  }
  
  next();
});

export default mongoose.models.InventoryItem || mongoose.model('InventoryItem', InventoryItemSchema);