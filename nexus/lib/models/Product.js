import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: 'text',
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  barcode: {
    type: String,
    trim: true,
    sparse: true, // Allow null values but ensure uniqueness when present
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    trim: true,
    index: true,
  },
  brand: {
    type: String,
    trim: true,
    index: true,
  },
  // Pricing
  cost: {
    type: Number,
    min: 0,
    default: 0,
  },
  price: {
    type: Number,
    min: 0,
    default: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  // Inventory settings
  minStock: {
    type: Number,
    min: 0,
    default: 0,
  },
  maxStock: {
    type: Number,
    min: 0,
  },
  reorderPoint: {
    type: Number,
    min: 0,
    default: 0,
  },
  reorderQuantity: {
    type: Number,
    min: 0,
    default: 0,
  },
  // Physical attributes
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['kg', 'g', 'lb', 'oz'],
      default: 'kg',
    },
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'm', 'in', 'ft'],
      default: 'cm',
    },
  },
  // Product variants
  variants: [{
    name: String,
    sku: String,
    barcode: String,
    attributes: Map, // e.g., { color: 'red', size: 'M' }
    cost: Number,
    price: Number,
    minStock: Number,
  }],
  // Attributes for custom fields
  attributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  // Media
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false,
    },
  }],
  // Suppliers
  suppliers: [{
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    supplierSku: String,
    cost: Number,
    leadTime: Number, // in days
    minimumOrderQuantity: Number,
    isPreferred: {
      type: Boolean,
      default: false,
    },
  }],
  // Status and flags
  isActive: {
    type: Boolean,
    default: true,
  },
  isTrackable: {
    type: Boolean,
    default: true,
  },
  isSerialized: {
    type: Boolean,
    default: false,
  },
  allowBackorder: {
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

// Compound indexes for multi-tenancy and performance
ProductSchema.index({ companyId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ companyId: 1, barcode: 1 }, { sparse: true });
ProductSchema.index({ companyId: 1, category: 1 });
ProductSchema.index({ companyId: 1, brand: 1 });
ProductSchema.index({ companyId: 1, isActive: 1 });
ProductSchema.index({ companyId: 1, name: 'text', description: 'text' });

// Virtual for margin
ProductSchema.virtual('margin').get(function() {
  if (this.price && this.cost) {
    return ((this.price - this.cost) / this.price) * 100;
  }
  return 0;
});

// Virtual for primary image
ProductSchema.virtual('primaryImage').get(function() {
  return this.images.find(img => img.isPrimary) || this.images[0] || null;
});

// Virtual for preferred supplier
ProductSchema.virtual('preferredSupplier').get(function() {
  return this.suppliers.find(supplier => supplier.isPreferred) || this.suppliers[0] || null;
});

// Method to check if product is low stock
ProductSchema.methods.isLowStock = function(currentStock) {
  return currentStock <= this.minStock;
};

// Method to check if reorder needed
ProductSchema.methods.needsReorder = function(currentStock) {
  return currentStock <= this.reorderPoint;
};

// Pre-save middleware
ProductSchema.pre('save', function(next) {
  // Ensure only one primary image
  const primaryImages = this.images.filter(img => img.isPrimary);
  if (primaryImages.length > 1) {
    this.images.forEach((img, index) => {
      img.isPrimary = index === 0;
    });
  }
  
  // Ensure only one preferred supplier
  const preferredSuppliers = this.suppliers.filter(supplier => supplier.isPreferred);
  if (preferredSuppliers.length > 1) {
    this.suppliers.forEach((supplier, index) => {
      supplier.isPreferred = index === 0;
    });
  }
  
  next();
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);