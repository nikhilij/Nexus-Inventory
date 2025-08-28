const db = require('../config/database');


const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Product = sequelize.define('Product', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('available', 'booked', 'dispatched', 'in-transit', 'out-of-stock'),
    allowNull: false,
    defaultValue: 'available',
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: true, // adds createdAt and updatedAt
  tableName: 'products',
});

module.exports = Product;

const create = async ({ name, description, quantity, price, status = 'available', category_id }) => {
    const { rows } = await db.query(
        'INSERT INTO products (name, description, quantity, price, status, category_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, description, quantity, price, status, category_id]
    );
    return rows[0];
};


const getAll = async (filters = {}) => {
    let query = 'SELECT * FROM products';
    const conditions = [];
    const values = [];
    if (filters.status) {
        values.push(filters.status);
        conditions.push(`status = $${values.length}`);
    }
    if (filters.category_id) {
        values.push(filters.category_id);
        conditions.push(`category_id = $${values.length}`);
    }
    if (conditions.length) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    const { rows } = await db.query(query, values);
    return rows;
};


const getById = async (id) => {
    const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    return rows[0];
};


const update = async (id, { name, description, quantity, price, status, category_id }) => {
    const fields = [];
    const values = [];
    if (name !== undefined) {
        values.push(name);
        fields.push(`name = $${values.length}`);
    }
    if (description !== undefined) {
        values.push(description);
        fields.push(`description = $${values.length}`);
    }
    if (quantity !== undefined) {
        values.push(quantity);
        fields.push(`quantity = $${values.length}`);
    }
    if (price !== undefined) {
        values.push(price);
        fields.push(`price = $${values.length}`);
    }
    if (status !== undefined) {
        values.push(status);
        fields.push(`status = $${values.length}`);
    }
    if (category_id !== undefined) {
        values.push(category_id);
        fields.push(`category_id = $${values.length}`);
    }
    // Always update updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const { rows } = await db.query(query, values);
    return rows[0];
};


const remove = async (id) => {
    const { rows } = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    return rows[0];
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove
};