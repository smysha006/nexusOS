const Product = require('../models/Product');

// Helper for shared aggregation
const getAggregationResult = async (pipeline) => {
  const result = await Product.aggregate(pipeline);
  return result;
};

// @desc    Get category-wise inventory value
// @route   GET /api/analytics/category-value
// @access  Public
exports.getCategoryValue = async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: '$category',
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      },
      { $sort: { totalValue: -1 } }
    ];
    const data = await getAggregationResult(pipeline);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get category-wise product count
// @route   GET /api/analytics/category-count
// @access  Public
exports.getCategoryCount = async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ];
    const data = await getAggregationResult(pipeline);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get average product price
// @route   GET /api/analytics/avg-price
// @access  Public
exports.getAvgPrice = async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$price' }
        }
      },
      { $project: { _id: 0, avgPrice: 1 } }
    ];
    const result = await getAggregationResult(pipeline);
    const data = result.length > 0 ? result[0] : { avgPrice: 0 };
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get average price per category
// @route   GET /api/analytics/category-avg-price
// @access  Public
exports.getCategoryAvgPrice = async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: '$category',
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { avgPrice: -1 } }
    ];
    const data = await getAggregationResult(pipeline);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
