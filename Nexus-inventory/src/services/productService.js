const Product = require('../models/productModel');

const getAllProducts = (filters = {}) => {
    return Product.getAll(filters);
};

const getProductById = (id) => {
    return Product.getById(id);
};

const createProduct = (productData) => {
    return Product.create(productData);
};

const updateProduct = (id, productData) => {
    return Product.update(id, productData);
};

const deleteProduct = (id) => {
    return Product.remove(id);
};

const batchUpdateStatus = async (productIds, status) => {
    // Update multiple products' status
    const updatePromises = productIds.map(id => 
        Product.update(id, { status })
    );
    
    const results = await Promise.all(updatePromises);
    return results.filter(result => result !== null); // Filter out failed updates
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    batchUpdateStatus
};
