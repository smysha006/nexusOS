const ActivityLog = require('../models/ActivityLog');

// @desc    Get recent activity logs
// @route   GET /api/activity
// @access  Public
exports.getActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const activities = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
