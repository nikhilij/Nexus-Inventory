const Category = require('../models/categoryModel');

/**
 * Get all categories
 */
async function getAllCategories() {
    return await Category.find();
}

/**
 * Get category by ID
 * @param {String} id
 */
async function getCategoryById(id) {
    return await Category.findById(id);
}

/**
 * Create a new category
 * @param {Object} categoryData
 */
async function createCategory(categoryData) {
    const category = new Category(categoryData);
    return await category.save();
}

/**
 * Update a category by ID
 * @param {String} id
 * @param {Object} updateData
 */
async function updateCategory(id, updateData) {
    return await Category.findByIdAndUpdate(id, updateData, { new: true });
}

/**
 * Delete a category by ID
 * @param {String} id
 */
async function deleteCategory(id) {
    return await Category.findByIdAndDelete(id);
}

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};