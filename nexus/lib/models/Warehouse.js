import mongoose from 'mongoose';

const WarehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['warehouse', 'store', 'distribution_center', 'factory', 'other'],
    default: 'warehouse',
  },
  // Location information
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    latitude: Number,
    longitude: Number,
  },
  contact: {
    phone: String,
    email: String,
    manager: String,
  },
  // Operational settings
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  allowNegativeStock: {
    type: Boolean,
    default: false,
  },
  // Capacity management
  capacity: {
    maxItems: Number,
    maxWeight: Number,
    maxVolume: Number,
    unit: {
      type: String,
      enum: ['cubic_meters', 'cubic_feet'],
      default: 'cubic_meters',
    },
  },
  // Zones within the warehouse
  zones: [{
    name: String,
    code: String,
    type: {
      type: String,
      enum: ['receiving', 'storage', 'picking', 'shipping', 'quality_control'],
      default: 'storage',
    },
    description: String,
    capacity: {
      maxItems: Number,
      maxWeight: Number,
      maxVolume: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  }],
  // Operating hours
  operatingHours: [{
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6, // 0 = Sunday, 6 = Saturday
    },
    openTime: String, // HH:MM format
    closeTime: String, // HH:MM format
    isClosed: {
      type: Boolean,
      default: false,
    },
  }],
  // Integration settings
  integrations: {
    wms: {
      provider: String,
      config: mongoose.Schema.Types.Mixed,
    },
    shipping: {
      providers: [String],
      config: mongoose.Schema.Types.Mixed,
    },
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

// Compound indexes
WarehouseSchema.index({ companyId: 1, code: 1 }, { unique: true });
WarehouseSchema.index({ companyId: 1, isActive: 1 });
WarehouseSchema.index({ companyId: 1, isDefault: 1 });

// Virtual for full address
WarehouseSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.zipCode,
    this.address.country
  ].filter(Boolean);
  return parts.join(', ');
});

// Virtual for total zones
WarehouseSchema.virtual('activeZonesCount').get(function() {
  return this.zones.filter(zone => zone.isActive).length;
});

// Method to check if warehouse is operating
WarehouseSchema.methods.isOperating = function(date = new Date()) {
  const dayOfWeek = date.getDay();
  const currentTime = date.toTimeString().slice(0, 5); // HH:MM format
  
  const todayHours = this.operatingHours.find(hours => hours.dayOfWeek === dayOfWeek);
  if (!todayHours || todayHours.isClosed) return false;
  
  return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
};

// Method to get zone by code
WarehouseSchema.methods.getZone = function(zoneCode) {
  return this.zones.find(zone => zone.code === zoneCode && zone.isActive);
};

// Pre-save middleware to ensure only one default warehouse per company
WarehouseSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.model('Warehouse').updateMany(
      { companyId: this.companyId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

export default mongoose.models.Warehouse || mongoose.model('Warehouse', WarehouseSchema);