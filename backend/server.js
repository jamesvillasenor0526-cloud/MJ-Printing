const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static HTML files from parent directory (frontend)
app.use(express.static(path.join(__dirname, '..')));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const chatRoutes = require('./routes/chats');
const reviewRoutes = require('./routes/reviews');
const notificationRoutes = require('./routes/notifications');
const categoryRoutes = require('./routes/categories');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories', categoryRoutes);

// API info route
app.get('/api', (req, res) => {
    res.json({
        message: 'MJ Print Services API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            products: '/api/products',
            orders: '/api/orders',
            reviews: '/api/reviews',
            chats: '/api/chats',
            seedAdmin: '/api/seed-admin'
        }
    });
});

// Temporary Admin Auto-Seed Route
const User = require('./models/User');
app.get('/api/seed-admin', async (req, res) => {
    try {
        const email = 'admin@mjprint.com';
        const password = 'admin123';
        let admin = await User.findOne({ email });
        
        if (!admin) {
            admin = await User.create({
                name: 'System Admin',
                email: email,
                username: 'admin',
                password: password,
                phone: '0000000000',
                role: 'admin',
                notifications: {
                    orderUpdates: true,
                    paymentUpdates: true
                }
            });
            return res.send('<h1 style="color:green; font-family:sans-serif; text-align:center; margin-top:50px;">✅ Admin Account Created Successfully!</h1><p style="text-align:center;"><a href="/admin-login.html" style="font-size:20px; text-decoration:none;">Click here to Login</a></p>');
        }
        return res.send('<h1 style="color:blue; font-family:sans-serif; text-align:center; margin-top:50px;">⭐ Admin Already Exists!</h1><p style="text-align:center;"><a href="/admin-login.html" style="font-size:20px; text-decoration:none;">Click here to Login</a></p>');
    } catch (error) {
        return res.status(500).send('<h1 style="color:red; font-family:sans-serif; text-align:center; margin-top:50px;">❌ Error: ' + error.message + '</h1>');
    }
});

// Root route - serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Don't send response if headers already sent
    if (res.headersSent) {
        return next(err);
    }

    // Handle multer errors
    if (err.name === 'MulterError') {
        return res.status(400).json({
            message: err.message || 'File upload failed'
        });
    }

    res.status(err.status || 500).json({
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : undefined
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
