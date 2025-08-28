const express = require('express');
const router = express.Router();
const productService = require('../services/productService');

// Import middleware
const authMiddleware = require('../middleware/authMiddleware');
const { validateProduct, validateProductUpdate } = require('../middleware/validateMiddleware');

// GET / - fetch all products (public endpoint)
router.get('/', async (req, res, next) => {
    try {
        // Support filtering by status and category_id
        const filters = {};
        if (req.query.status) filters.status = req.query.status;
        if (req.query.category_id) filters.category_id = parseInt(req.query.category_id);
        
        const products = await productService.getAllProducts(filters);
        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
});

// GET /:id - fetch product by id (public endpoint)
router.get('/:id', async (req, res, next) => {
    try {
        const product = await productService.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
});

// POST / - create new product (protected endpoint with validation)
router.post('/', authMiddleware, validateProduct, async (req, res, next) => {
    try {
        const newProduct = await productService.createProduct(req.body);
        res.status(201).json(newProduct);
    } catch (error) {
        next(error);
    }
});

// PUT /:id - update product (protected endpoint with validation)
router.put('/:id', authMiddleware, validateProductUpdate, async (req, res, next) => {
    try {
        const existingProduct = await productService.getProductById(req.params.id);
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const updatedProduct = await productService.updateProduct(req.params.id, req.body);
        res.status(200).json(updatedProduct);
    } catch (error) {
        next(error);
    }
});

// DELETE /:id - delete product (protected endpoint)
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const existingProduct = await productService.getProductById(req.params.id);
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const deletedProduct = await productService.deleteProduct(req.params.id);
        res.status(200).json(deletedProduct);
    } catch (error) {
        next(error);
    }
});

// PATCH /status - batch update product status (protected endpoint)
router.patch('/status', authMiddleware, async (req, res, next) => {
    try {
        const { productIds, status } = req.body;
        
        // Validate input
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ error: 'productIds must be a non-empty array' });
        }
        
        const validStatuses = ['available', 'booked', 'dispatched', 'in-transit', 'out-of-stock'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: `Status is required and must be one of: ${validStatuses.join(', ')}` 
            });
        }
        
        const updatedProducts = await productService.batchUpdateStatus(productIds, status);
        res.status(200).json({
            message: `Successfully updated ${updatedProducts.length} products`,
            updatedProducts
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
