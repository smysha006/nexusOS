require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const ActivityLog = require('./models/ActivityLog');

const sampleProducts = [
  // Laptops
  { name: 'MacBook Pro 16" M3 Max', category: 'Laptops', price: 299000, quantity: 15, lowStockThreshold: 5 },
  { name: 'Dell XPS 15', category: 'Laptops', price: 185000, quantity: 8, lowStockThreshold: 10 },
  { name: 'Lenovo ThinkPad X1 Carbon', category: 'Laptops', price: 160000, quantity: 22, lowStockThreshold: 8 },
  { name: 'ASUS ROG Zephyrus G14', category: 'Laptops', price: 145000, quantity: 0, lowStockThreshold: 5 },
  { name: 'HP Spectre x360', category: 'Laptops', price: 135000, quantity: 12, lowStockThreshold: 5 },
  
  // Smartphones
  { name: 'iPhone 15 Pro Max', category: 'Smartphones', price: 159900, quantity: 45, lowStockThreshold: 15 },
  { name: 'Samsung Galaxy S24 Ultra', category: 'Smartphones', price: 129999, quantity: 38, lowStockThreshold: 10 },
  { name: 'Google Pixel 8 Pro', category: 'Smartphones', price: 106999, quantity: 18, lowStockThreshold: 10 },
  { name: 'OnePlus 12', category: 'Smartphones', price: 64999, quantity: 50, lowStockThreshold: 20 },
  { name: 'Nothing Phone (2)', category: 'Smartphones', price: 44999, quantity: 25, lowStockThreshold: 10 },
  
  // Audio
  { name: 'Sony WH-1000XM5', category: 'Audio', price: 29990, quantity: 60, lowStockThreshold: 15 },
  { name: 'Apple AirPods Pro (2nd Gen)', category: 'Audio', price: 24900, quantity: 85, lowStockThreshold: 20 },
  { name: 'Bose QuietComfort Ultra', category: 'Audio', price: 35900, quantity: 30, lowStockThreshold: 10 },
  { name: 'Sennheiser Momentum 4', category: 'Audio', price: 27990, quantity: 14, lowStockThreshold: 10 },
  { name: 'Marshall Emberton II', category: 'Audio', price: 14999, quantity: 4, lowStockThreshold: 5 }, // Low stock
  
  // Accessories
  { name: 'Logitech MX Master 3S', category: 'Accessories', price: 10995, quantity: 120, lowStockThreshold: 30 },
  { name: 'Keychron K2 Wireless Keyboard', category: 'Accessories', price: 8999, quantity: 45, lowStockThreshold: 15 },
  { name: 'Apple Magic Trackpad', category: 'Accessories', price: 14500, quantity: 0, lowStockThreshold: 5 }, // Out of stock
  { name: 'Anker 737 Power Bank', category: 'Accessories', price: 12999, quantity: 55, lowStockThreshold: 15 },
  { name: 'Samsung T7 Shield 1TB SSD', category: 'Accessories', price: 9499, quantity: 70, lowStockThreshold: 20 },
  
  // Monitors
  { name: 'LG 27" UltraGear OLED', category: 'Monitors', price: 85000, quantity: 15, lowStockThreshold: 5 },
  { name: 'Samsung Odyssey G9', category: 'Monitors', price: 145000, quantity: 7, lowStockThreshold: 4 },
  { name: 'Dell UltraSharp 32" 4K', category: 'Monitors', price: 78000, quantity: 20, lowStockThreshold: 8 },
  { name: 'BenQ DesignVue 27"', category: 'Monitors', price: 45000, quantity: 32, lowStockThreshold: 10 },
  { name: 'ASUS ProArt Display 27"', category: 'Monitors', price: 55000, quantity: 2, lowStockThreshold: 5 } // Low stock
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    console.log('Clearing existing data...');
    await Product.deleteMany();
    await ActivityLog.deleteMany();

    console.log('Seeding products...');
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`Inserted ${createdProducts.length} products.`);

    console.log('Generating activity logs...');
    const logsToInsert = createdProducts.map(product => ({
      action: 'Product Added',
      productId: product._id,
      productName: product.name,
      details: `Initial seed: Added ${product.quantity} units at ₹${product.price}`,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 10000000000)) // Random past dates for timeline variety
    }));

    await ActivityLog.insertMany(logsToInsert);
    console.log(`Inserted ${logsToInsert.length} activity logs.`);

    console.log('Database seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
