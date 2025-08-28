// src/models/userModel.js
const { DataTypes, Model, ValidationError } = require('sequelize');
const sequelize = require('../config/sequelize');
const bcrypt = require('bcryptjs');

// Define valid roles in one place for easy maintenance and scalability
const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer' // Read-only access
};
Object.freeze(USER_ROLES); // Prevent accidental changes

class User extends Model {
  // Instance Method: Compare password for login
  async isValidPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Instance Method: Check if user has a specific role
  hasRole(role) {
    return this.role === role;
  }

  // Instance Method: Check if user has at least one of the required roles
  hasAnyRole(roles) {
    return roles.includes(this.role);
  }

  // Instance Method: Strip sensitive data before sending to client
  toSafeObject() {
    const { password, reset_token, reset_token_expiry, ...safeData } = this.toJSON();
    return safeData;
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'users_username_unique',
      msg: 'This username is already taken.'
    },
    validate: {
      notNull: { msg: 'Username is required.' },
      notEmpty: { msg: 'Username cannot be empty.' },
      len: {
        args: [3, 50],
        msg: 'Username must be between 3 and 50 characters long.'
      },
      is: {
        args: /^[a-zA-Z0-9_]+$/, // Alphanumeric and underscores only
        msg: 'Username can only contain letters, numbers, and underscores.'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'users_email_unique',
      msg: 'A user with this email already exists.'
    },
    validate: {
      notNull: { msg: 'Email is required.' },
      notEmpty: { msg: 'Email cannot be empty.' },
      isEmail: { msg: 'Please provide a valid email address.' }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'Password is required.' },
      notEmpty: { msg: 'Password cannot be empty.' },
      len: {
        args: [8, 100],
        msg: 'Password must be at least 8 characters long.'
      }
    }
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: {
        args: [0, 100],
        msg: 'First name cannot exceed 100 characters.'
      }
    }
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: {
        args: [0, 100],
        msg: 'Last name cannot exceed 100 characters.'
      }
    }
  },
  role: {
    type: DataTypes.ENUM,
    values: Object.values(USER_ROLES),
    allowNull: false,
    defaultValue: USER_ROLES.USER,
    validate: {
      isIn: {
        args: [Object.values(USER_ROLES)],
        msg: `Role must be one of: ${Object.values(USER_ROLES).join(', ')}`
      }
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reset_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reset_token_expiry: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true, // Uses createdAt and updatedAt
  underscored: true, // Uses snake_case for fields (e.g., first_name)
  hooks: {
    // Hash password before creating or updating
    beforeSave: async (user) => {
      // Only hash the password if it has been modified (or is new)
      if (user.changed('password')) {
        const saltRounds = 12; // More rounds = more secure but slower
        user.password = await bcrypt.hash(user.password, saltRounds);
      }

      // Lowercase email to ensure uniqueness and case-insensitive login
      if (user.changed('email')) {
        user.email = user.email.toLowerCase();
      }

      // Lowercase username for consistency
      if (user.changed('username')) {
        user.username = user.username.toLowerCase();
      }
    },
    afterCreate: (user) => {
      // Future: Send welcome email
      console.log(`👋 New user registered: ${user.username} (${user.email})`);
    }
  },
  indexes: [
    // Improve query performance for common searches
    {
      name: 'users_email_index',
      fields: ['email'],
      unique: true
    },
    {
      name: 'users_username_index',
      fields: ['username'],
      unique: true
    },
    {
      name: 'users_role_index',
      fields: ['role']
    },
    // Partial index for active users (useful for frequent queries)
    {
      name: 'users_is_active_index',
      fields: ['is_active'],
      where: {
        is_active: true
      }
    }
  ],
  // Define default scopes for safety (automatically applied to queries)
  defaultScope: {
    attributes: { exclude: ['password', 'reset_token', 'reset_token_expiry'] } // Never return password by default
  },
  // Define scopes for specific use cases
  scopes: {
    withSensitiveData: {
      attributes: { include: ['password', 'reset_token', 'reset_token_expiry'] } // Use carefully!
    },
    active: {
      where: { is_active: true }
    }
  }
});

// Export the ROLES enum for use throughout the application
User.USER_ROLES = USER_ROLES;

module.exports = User;