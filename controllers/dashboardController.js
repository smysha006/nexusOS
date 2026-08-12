const Product = require('../models/Product');

// @desc    Get dashboard KPIs
// @route   GET /api/dashboard
// @access  Public
exports.getDashboardKPIs = async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStockItems: { $sum: '$quantity' },
          categories: { $addToSet: '$category' },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          outOfStock: {
            $sum: { $cond: [{ $lte: ['$quantity', 0] }, 1, 0] }
          },
          lowStock: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$quantity', 0] },
                    { $lte: ['$quantity', '$lowStockThreshold'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalProducts: 1,
          totalStockItems: 1,
          totalCategories: { $size: '$categories' },
          totalValue: 1,
          outOfStock: 1,
          lowStock: 1
        }
      }
    ];

    const result = await Product.aggregate(pipeline);
    
    // If no products, aggregate returns empty array
    const data = result.length > 0 ? result[0] : {
      totalProducts: 0,
      totalStockItems: 0,
      totalCategories: 0,
      totalValue: 0,
      outOfStock: 0,
      lowStock: 0
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get low stock products
// @route   GET /api/dashboard/low-stock
// @access  Public
exports.getLowStock = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: {
        $and: [
          { $gt: ['$quantity', 0] },
          { $lte: ['$quantity', '$lowStockThreshold'] }
        ]
      }
    }).limit(10);
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get out of stock products
// @route   GET /api/dashboard/out-of-stock
// @access  Public
exports.getOutOfStock = async (req, res) => {
  try {
    const products = await Product.find({ quantity: { $lte: 0 } }).limit(10);
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get recently added products
// @route   GET /api/dashboard/recent
// @access  Public
exports.getRecent = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).limit(5);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get top expensive products
// @route   GET /api/dashboard/top-expensive
// @access  Public
exports.getTopExpensive = async (req, res) => {
  try {
    const products = await Product.find().sort({ price: -1 }).limit(5);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
