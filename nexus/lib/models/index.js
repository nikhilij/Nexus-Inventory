// Export all models for easy importing
export { default as Company } from './Company.js';
export { default as User } from './User.js';
export { default as Product } from './Product.js';
export { default as Warehouse } from './Warehouse.js';
export { default as InventoryItem } from './InventoryItem.js';
export { default as StockMovement } from './StockMovement.js';
export { default as Supplier } from './Supplier.js';
export { default as PurchaseOrder } from './PurchaseOrder.js';

// Also provide default export with all models
const models = {
  Company: require('./Company.js').default,
  User: require('./User.js').default,
  Product: require('./Product.js').default,
  Warehouse: require('./Warehouse.js').default,
  InventoryItem: require('./InventoryItem.js').default,
  StockMovement: require('./StockMovement.js').default,
  Supplier: require('./Supplier.js').default,
  PurchaseOrder: require('./PurchaseOrder.js').default,
};

export default models;