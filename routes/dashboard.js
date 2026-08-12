const express = require('express');
const router = express.Router();
const {
  getDashboardKPIs,
  getLowStock,
  getOutOfStock,
  getRecent,
  getTopExpensive
} = require('../controllers/dashboardController');

router.get('/', getDashboardKPIs);
router.get('/low-stock', getLowStock);
router.get('/out-of-stock', getOutOfStock);
router.get('/recent', getRecent);
router.get('/top-expensive', getTopExpensive);

module.exports = router;
