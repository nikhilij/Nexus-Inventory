import mongoose from 'mongoose';

const SupplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: 'text',
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  description: String,
  // Contact information
  contact: {
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: String,
    website: String,
    contactPerson: {
      name: String,
      title: String,
      email: String,
      phone: String,
    },
  },
  // Address information
  addresses: [{
    type: {
      type: String,
      enum: ['billing', 'shipping', 'primary'],
      default: 'primary',
    },
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    isPrimary: {
      type: Boolean,
      default: false,
    },
  }],
  // Business information
  taxId: String,
  businessLicense: String,
  // Financial terms
  paymentTerms: {
    type: String,
    enum: ['net_15', 'net_30', 'net_45', 'net_60', 'cod', 'prepaid'],
    default: 'net_30',
  },
  creditLimit: {
    type: Number,
    min: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  // Performance metrics
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  leadTimeAverage: {
    type: Number, // in days
    min: 0,
  },
  qualityRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  onTimeDeliveryRate: {
    type: Number,
    min: 0,
    max: 100,
  },
  // Categories and capabilities
  categories: [String],
  certifications: [String],
  capabilities: [String],
  // Status and flags
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_approval'],
    default: 'active',
  },
  isPreferred: {
    type: Boolean,
    default: false,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  // Integration settings
  integrations: {
    edi: {
      enabled: {
        type: Boolean,
        default: false,
      },
      config: mongoose.Schema.Types.Mixed,
    },
    api: {
      enabled: {
        type: Boolean,
        default: false,
      },
      endpoint: String,
      apiKey: String,
    },
  },
  // Documents and attachments
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Notes and history
  notes: String,
  tags: [String],
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

// Compound indexes
SupplierSchema.index({ companyId: 1, code: 1 }, { unique: true });
SupplierSchema.index({ companyId: 1, status: 1 });
SupplierSchema.index({ companyId: 1, isPreferred: 1 });
SupplierSchema.index({ companyId: 1, categories: 1 });
SupplierSchema.index({ companyId: 1, name: 'text' });

// Virtual for primary address
SupplierSchema.virtual('primaryAddress').get(function() {
  return this.addresses.find(addr => addr.isPrimary) || this.addresses[0] || null;
});

// Virtual for full primary address
SupplierSchema.virtual('fullPrimaryAddress').get(function() {
  const addr = this.primaryAddress;
  if (!addr) return '';
  const parts = [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean);
  return parts.join(', ');
});

// Virtual for contact display
SupplierSchema.virtual('displayContact').get(function() {
  if (this.contact.contactPerson?.name) {
    return `${this.contact.contactPerson.name} (${this.contact.contactPerson.title || 'Contact'})`;
  }
  return this.contact.email || this.contact.phone || 'No contact information';
});

// Virtual for overall score
SupplierSchema.virtual('overallScore').get(function() {
  const scores = [this.rating, this.qualityRating].filter(score => score != null);
  if (scores.length === 0) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
});

// Method to check if supplier can fulfill order
SupplierSchema.methods.canFulfillOrder = function(orderValue) {
  if (this.status !== 'active') return false;
  if (!this.isApproved) return false;
  if (this.creditLimit && orderValue > this.creditLimit) return false;
  return true;
};

// Method to add document
SupplierSchema.methods.addDocument = function(name, type, url) {
  this.documents.push({
    name,
    type,
    url,
    uploadedAt: new Date()
  });
  return this;
};

// Method to update performance metrics
SupplierSchema.methods.updatePerformance = function(metrics) {
  if (metrics.onTimeDeliveryRate !== undefined) {
    this.onTimeDeliveryRate = metrics.onTimeDeliveryRate;
  }
  if (metrics.qualityRating !== undefined) {
    this.qualityRating = metrics.qualityRating;
  }
  if (metrics.leadTimeAverage !== undefined) {
    this.leadTimeAverage = metrics.leadTimeAverage;
  }
  return this;
};

// Static method to find suppliers by category
SupplierSchema.statics.findByCategory = function(companyId, category, options = {}) {
  const query = {
    companyId,
    categories: category,
    status: 'active',
    isApproved: true
  };
  
  if (options.isPreferred) {
    query.isPreferred = true;
  }
  
  return this.find(query).sort({ isPreferred: -1, rating: -1 });
};

// Static method to find suppliers for product
SupplierSchema.statics.findForProduct = function(companyId, productId) {
  return mongoose.model('Product').findById(productId)
    .then(product => {
      if (!product) return [];
      const supplierIds = product.suppliers.map(s => s.supplierId);
      return this.find({
        _id: { $in: supplierIds },
        companyId,
        status: 'active'
      }).sort({ isPreferred: -1 });
    });
};

// Pre-save middleware to ensure only one primary address
SupplierSchema.pre('save', function(next) {
  const primaryAddresses = this.addresses.filter(addr => addr.isPrimary);
  if (primaryAddresses.length > 1) {
    this.addresses.forEach((addr, index) => {
      addr.isPrimary = index === 0;
    });
  } else if (primaryAddresses.length === 0 && this.addresses.length > 0) {
    this.addresses[0].isPrimary = true;
  }
  next();
});

export default mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);