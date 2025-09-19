import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: function() {
      return !this.oauthProvider;
    },
    minlength: 6,
  },
  avatar: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'operator', 'viewer'],
    default: 'operator',
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  permissions: [{
    type: String,
    enum: [
      'products.read',
      'products.write',
      'products.delete',
      'inventory.read',
      'inventory.write',
      'orders.read',
      'orders.write',
      'orders.delete',
      'suppliers.read',
      'suppliers.write',
      'suppliers.delete',
      'reports.read',
      'settings.read',
      'settings.write',
      'users.read',
      'users.write',
      'users.delete',
    ],
  }],
  preferences: {
    language: {
      type: String,
      default: 'en',
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      lowStock: {
        type: Boolean,
        default: true,
      },
      newOrders: {
        type: Boolean,
        default: true,
      },
    },
  },
  // OAuth fields
  oauthProvider: {
    type: String,
    enum: ['google', 'github', 'microsoft'],
  },
  oauthId: String,
  // Session management
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLoginAt: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.emailVerificationToken;
      return ret;
    }
  },
  toObject: { virtuals: true },
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ companyId: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

// Virtual for full name
UserSchema.virtual('initials').get(function() {
  return this.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check permission
UserSchema.methods.hasPermission = function(permission) {
  if (this.role === 'admin') return true;
  return this.permissions.includes(permission);
};

// Method to get role-based permissions
UserSchema.methods.getRolePermissions = function() {
  const rolePermissions = {
    admin: [
      'products.read', 'products.write', 'products.delete',
      'inventory.read', 'inventory.write',
      'orders.read', 'orders.write', 'orders.delete',
      'suppliers.read', 'suppliers.write', 'suppliers.delete',
      'reports.read',
      'settings.read', 'settings.write',
      'users.read', 'users.write', 'users.delete',
    ],
    manager: [
      'products.read', 'products.write',
      'inventory.read', 'inventory.write',
      'orders.read', 'orders.write',
      'suppliers.read', 'suppliers.write',
      'reports.read',
      'users.read',
    ],
    operator: [
      'products.read',
      'inventory.read', 'inventory.write',
      'orders.read', 'orders.write',
      'suppliers.read',
    ],
    viewer: [
      'products.read',
      'inventory.read',
      'orders.read',
      'suppliers.read',
      'reports.read',
    ],
  };

  return rolePermissions[this.role] || [];
};

export default mongoose.models.User || mongoose.model('User', UserSchema);