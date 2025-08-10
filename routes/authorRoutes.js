const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// Route để lấy tất cả tác giả (công khai)
router.get('/', userController.getAllAuthors);

module.exports = router;