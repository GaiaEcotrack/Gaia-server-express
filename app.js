const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware to parse JSON
app.use(express.json());

app.get("/",(req, res) => {
    res.json({ message: "Welcome to the Gaia-Ecotrack server" });
  });

  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
  });

// Import routes
// const userRoutes = require('./routes/userRoutes');
// const productRoutes = require('./routes/productRoutes');
const apiRoutes = require('./routes/device');

// // Use routes
// app.use('/api/users', userRoutes);
// app.use('/api/products', productRoutes);
app.use('/api', apiRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
