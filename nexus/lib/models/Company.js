import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  website: {
    type: String,
    trim: true,
  },
  logo: {
    type: String,
    trim: true,
  },
  settings: {
    currency: {
      type: String,
      default: 'USD',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY',
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
  },
  subscription: {
    plan: {
      type: String,
      enum: ['starter', 'growth', 'enterprise'],
      default: 'starter',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'trial', 'suspended'],
      default: 'trial',
    },
    trialEndsAt: Date,
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
CompanySchema.index({ slug: 1 });
CompanySchema.index({ email: 1 });
CompanySchema.index({ 'subscription.status': 1 });

// Virtual for full address
CompanySchema.virtual('fullAddress').get(function() {
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

// Pre-save middleware to generate slug
CompanySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

export default mongoose.models.Company || mongoose.model('Company', CompanySchema);