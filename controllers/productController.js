const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all products (with search, filter, sort, pagination)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { search, category, lowStock, outOfStock, sortBy, order } = req.query;

    let query = {};

    // Search by product name (using regex for partial, case-insensitive match)
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by stock status
    // Combos: outOfStock OR lowStock
    if (outOfStock === 'true') {
      query.quantity = { $lte: 0 };
    } else if (lowStock === 'true') {
      // Need a way to check quantity <= lowStockThreshold. 
      // Since lowStockThreshold is a field in the document, we must use $expr.
      query.$expr = {
        $and: [
          { $gt: ['$quantity', 0] },
          { $lte: ['$quantity', '$lowStockThreshold'] }
        ]
      };
    }

    let sortQuery = {};
    if (sortBy) {
      const sortOrder = order === 'desc' ? -1 : 1;
      sortQuery[sortBy] = sortOrder;
    } else {
      sortQuery = { createdAt: -1 }; // default sort
    }

    const products = await Product.find(query).sort(sortQuery);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get distinct product categories
// @route   GET /api/products/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Public
exports.createProduct = async (req, res) => {
  try {
    const { name, category, price, quantity, lowStockThreshold } = req.body;
    
    // Server-side validation is also handled by Mongoose Schema
    if (!name || !category || price === undefined || quantity === undefined) {
      return res.status(400).json({ success: false, error: 'Please provide all required fields' });
    }
    
    if (price < 0 || quantity < 0) {
      return res.status(400).json({ success: false, error: 'Price and quantity cannot be negative' });
    }

    const product = await Product.create(req.body);

    // Create Activity Log
    await ActivityLog.create({
      action: 'Product Added',
      productId: product._id,
      productName: product.name,
      details: `Added ${quantity} units at ₹${price}`
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Public
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const oldProduct = { ...product.toObject() };
    const newValues = req.body;

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Determine details for Activity Log
    let changes = [];
    ['price', 'quantity', 'category', 'lowStockThreshold', 'name'].forEach(key => {
      if (newValues[key] !== undefined && newValues[key] !== oldProduct[key]) {
        changes.push(`${key} ${oldProduct[key]} → ${newValues[key]}`);
      }
    });
    
    const details = changes.length > 0 ? changes.join(', ') : 'No changes recorded';

    // Create Activity Log
    await ActivityLog.create({
      action: 'Product Updated',
      productId: product._id,
      productName: product.name,
      details: details
    });

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
     if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Public
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
       return res.status(404).json({ success: false, error: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    // Create Activity Log
    await ActivityLog.create({
      action: 'Product Deleted',
      productId: product._id, // Will persist despite deletion
      productName: product.name,
      details: `Product removed from inventory`
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
