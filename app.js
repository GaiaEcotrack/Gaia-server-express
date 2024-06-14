const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Import routes
// const userRoutes = require('./routes/userRoutes');
// const productRoutes = require('./routes/productRoutes');
const apiRoutes = require('./routes/device');

// // Use routes
// app.use('/api/users', userRoutes);
// app.use('/api/products', productRoutes);
app.use('/api', apiRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
