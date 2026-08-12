const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

router.route('/')
  .get(optionalAuth, getProducts)
  .post(createProduct);

router.route('/categories')
  .get(getCategories);

router.route('/:id')
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;
