const express = require('express');
const router = express.Router();
const {
  getCategoryValue,
  getCategoryCount,
  getAvgPrice,
  getCategoryAvgPrice
} = require('../controllers/analyticsController');

router.get('/category-value', getCategoryValue);
router.get('/category-count', getCategoryCount);
router.get('/avg-price', getAvgPrice);
router.get('/category-avg-price', getCategoryAvgPrice);

module.exports = router;
