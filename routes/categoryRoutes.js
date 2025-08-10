const express = require('express');
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Route công khai - lấy tất cả thể loại
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Routes cho Admin (CRUD)
router.post('/', protect, authorize('admin'), categoryController.createCategory);
router.patch('/:id', protect, authorize('admin'), categoryController.updateCategory);
router.delete('/:id', protect, authorize('admin'), categoryController.deleteCategory);

module.exports = router;