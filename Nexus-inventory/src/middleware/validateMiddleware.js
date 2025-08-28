// Product validation middleware for creating new products
const validateProduct = (req, res, next) => {
  const { name, quantity, price, status } = req.body;
  
  // Required fields validation
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Product name is required and must be a string' });
  }
  
  if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
    return res.status(400).json({ error: 'Quantity is required, must be a number, and cannot be negative' });
  }
  
  if (price === undefined || typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'Price is required, must be a number, and cannot be negative' });
  }
  
  // Status validation (if provided)
  const validStatuses = ['available', 'booked', 'dispatched', 'in-transit', 'out-of-stock'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: `Invalid status value. Must be one of: ${validStatuses.join(', ')}` 
    });
  }
  
  next();
};

// Product update validation middleware (more flexible)
const validateProductUpdate = (req, res, next) => {
  const { name, quantity, price, status } = req.body;
  
  // Check if at least one field is provided
  if (!name && quantity === undefined && price === undefined && !status) {
    return res.status(400).json({ error: 'At least one field must be provided for update' });
  }
  
  // Validate provided fields
  if (name && typeof name !== 'string') {
    return res.status(400).json({ error: 'Product name must be a string' });
  }
  
  if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) {
    return res.status(400).json({ error: 'Quantity must be a number and cannot be negative' });
  }
  
  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    return res.status(400).json({ error: 'Price must be a number and cannot be negative' });
  }
  
  const validStatuses = ['available', 'booked', 'dispatched', 'in-transit', 'out-of-stock'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: `Invalid status value. Must be one of: ${validStatuses.join(', ')}` 
    });
  }
  
  next();
};

module.exports = {
  validateProduct,
  validateProductUpdate
};
