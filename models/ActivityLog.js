const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['Product Added', 'Product Updated', 'Product Deleted'],
    required: [true, 'Action is required']
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product' // Note: not required so logs persist when product is deleted
  },
  productName: {
    type: String,
    required: [true, 'Product name is required']
  },
  details: {
    type: String,
    required: false
  },
  tenantId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: -1 // Powers "latest activity first"
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
