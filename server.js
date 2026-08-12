require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Route files
const products = require('./routes/products');
const dashboard = require('./routes/dashboard');
const analytics = require('./routes/analytics');
const activity = require('./routes/activity');
const auth = require('./routes/auth');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Static folder for frontend
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/products', products);
app.use('/api/dashboard', dashboard);
app.use('/api/analytics', analytics);
app.use('/api/activity', activity);
app.use('/api/auth', auth);

const PORT = process.env.PORT || 3000;

console.log(`Starting server... Attempting to connect to MongoDB at ${process.env.MONGO_URI}`);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB connected...');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
