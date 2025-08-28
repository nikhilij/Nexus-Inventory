// src/models/productModel.js
const { DataTypes, Model, ValidationError } = require('sequelize');
const sequelize = require('../config/sequelize');

// Define valid statuses in one place for easy maintenance
const PRODUCT_STATUS = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  DISPATCHED: 'dispatched',
  IN_TRANSIT: 'in-transit',
  OUT_OF_STOCK: 'out-of-stock'
};
Object.freeze(PRODUCT_STATUS); // Prevent accidental changes

class Product extends Model {
  // Custom Instance Method: Check if product is in stock
  isInStock() {
    return this.quantity > 0 && this.status === PRODUCT_STATUS.AVAILABLE;
  }

  // Custom Instance Method: Reserve stock for an order
  async reserveStock(amount) {
    if (!this.isInStock() || this.quantity < amount) {
      throw new ValidationError(`Cannot reserve ${amount} units. Insufficient stock.`);
    }
    this.quantity -= amount;
    // Optional: Change status to 'booked' if all stock is reserved
    if (this.quantity === 0) {
      this.status = PRODUCT_STATUS.OUT_OF_STOCK;
    }
    return await this.save();
  }

  // Custom Instance Method: Restock the product
  async restock(amount) {
    if (amount <= 0) {
      throw new ValidationError('Restock amount must be positive.');
    }
    this.quantity += amount;
    
    // Automatically set status back to 'available' if it was out-of-stock
    if (this.status === PRODUCT_STATUS.OUT_OF_STOCK && this.quantity > 0) {
      this.status = PRODUCT_STATUS.AVAILABLE;
    }
    return await this.save();
  }
}

Product.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'Product name is required.' },
      notEmpty: { msg: 'Product name cannot be empty.' },
      len: {
        args: [2, 255],
        msg: 'Product name must be between 2 and 255 characters long.'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 2000],
        msg: 'Description cannot exceed 2000 characters.'
      }
    }
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isAlphanumeric: {
        msg: 'SKU can only contain letters and numbers.'
      }
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isInt: { msg: 'Quantity must be an integer.' },
      min: {
        args: [0],
        msg: 'Quantity cannot be negative.'
      }
    }
  },
  price: {
    type: DataTypes.DECIMAL(12, 2), // 10 digits total, 2 decimal places (e.g., 99999999.99)
    allowNull: false,
    validate: {
      isDecimal: { msg: 'Price must be a decimal number.' },
      min: {
        args: [0.01],
        msg: 'Price must be at least 0.01.'
      }
    }
  },
  cost_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    validate: {
      isDecimal: { msg: 'Cost price must be a decimal number.' },
      min: {
        args: [0],
        msg: 'Cost price cannot be negative.'
      }
    }
  },
  status: {
    type: DataTypes.ENUM,
    values: Object.values(PRODUCT_STATUS),
    allowNull: false,
    defaultValue: PRODUCT_STATUS.AVAILABLE,
    validate: {
      isIn: {
        args: [Object.values(PRODUCT_STATUS)],
        msg: `Status must be one of: ${Object.values(PRODUCT_STATUS).join(', ')}`
      }
    }
  },
  low_stock_threshold: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 5,
    validate: {
      isInt: { msg: 'Low stock threshold must be an integer.' },
      min: {
        args: [0],
        msg: 'Low stock threshold cannot be negative.'
      }
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories', // This references the `categories` table
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  metadata: {
    type: DataTypes.JSONB, // Perfect for storing flexible data like size, color, weight, etc.
    allowNull: true,
    defaultValue: {}
  }
}, {
  sequelize,
  modelName: 'Product',
  tableName: 'products',
  timestamps: true, // Uses Sequelize's default `createdAt` and `updatedAt`
  underscored: true, // Uses snake_case for automatic added fields (created_at, updated_at)
  hooks: {
    // Auto-set status based on quantity before saving
    beforeSave: (product) => {
      // If quantity is zero, set status to 'out-of-stock' (unless already dispatched/in-transit)
      if (product.quantity <= 0 && 
          product.status !== PRODUCT_STATUS.DISPATCHED &&
          product.status !== PRODUCT_STATUS.IN_TRANSIT) {
        product.status = PRODUCT_STATUS.OUT_OF_STOCK;
      }
      // If quantity is restocked and status was 'out-of-stock', set to 'available'
      if (product.quantity > 0 && product.status === PRODUCT_STATUS.OUT_OF_STOCK) {
        product.status = PRODUCT_STATUS.AVAILABLE;
      }
    },
    // Validation after creating or updating
    afterSave: (product) => {
      // Here you could add logic to send low stock alerts, etc.
      if (product.quantity <= product.low_stock_threshold) {
        console.log(`⚠️  Low stock alert for product: ${product.name} (ID: ${product.id})`);
        // In future: Integrate with a notification service (Email, Slack)
      }
    }
  },
  indexes: [
    // Improve query performance for common searches
    {
      name: 'products_name_index',
      fields: ['name']
    },
    {
      name: 'products_status_index',
      fields: ['status']
    },
    {
      name: 'products_category_id_index',
      fields: ['category_id']
    },
    {
      name: 'products_sku_index',
      fields: ['sku'],
      unique: true
    }
  ]
});

// Export the STATUS enum for use in services, controllers, etc.
Product.PRODUCT_STATUS = PRODUCT_STATUS;

module.exports = Product;