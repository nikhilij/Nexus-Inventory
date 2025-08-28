const express = require('express');

const router = express.Router();

// Mock database (replace with real DB integration)
let categories = [
    { id: 1, name: 'Electronics', description: 'Electronic items' },
    { id: 2, name: 'Furniture', description: 'Home and office furniture' },
];

// Get all categories
router.get('/', (req, res) => {
    res.json(categories);
});

// Get a single category by ID
router.get('/:id', (req, res) => {
    const category = categories.find(c => c.id === parseInt(req.params.id));
    if (!category) {
        return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
});

// Create a new category
router.post('/', (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    const newCategory = {
        id: categories.length ? categories[categories.length - 1].id + 1 : 1,
        name,
        description: description || ''
    };
    categories.push(newCategory);
    res.status(201).json(newCategory);
});

// Update a category
router.put('/:id', (req, res) => {
    const category = categories.find(c => c.id === parseInt(req.params.id));
    if (!category) {
        return res.status(404).json({ error: 'Category not found' });
    }
    const { name, description } = req.body;
    if (name) category.name = name;
    if (description) category.description = description;
    res.json(category);
});

// Delete a category
router.delete('/:id', (req, res) => {
    const index = categories.findIndex(c => c.id === parseInt(req.params.id));
    if (index === -1) {
        return res.status(404).json({ error: 'Category not found' });
    }
    const deleted = categories.splice(index, 1);
    res.json(deleted[0]);
});

module.exports = router;