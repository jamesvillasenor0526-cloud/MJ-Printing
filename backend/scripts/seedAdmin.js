const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not found in .env');
            process.exit(1);
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        const email = 'admin@mjprint.com';
        const password = 'admin123';

        // Check for existing user
        let admin = await User.findOne({ email });

        if (admin) {
            console.log('Admin user found. Updating role and password...');
            admin.role = 'admin';
            admin.username = 'admin'; // Set username
            admin.password = password; // Will be hashed by pre-save
            await admin.save();
        } else {
            console.log('Creating new admin user...');
            admin = await User.create({
                name: 'System Admin',
                email: email,
                username: 'admin', // Set username
                password: password, // Will be hashed by pre-save
                phone: '0000000000',
                role: 'admin',
                notifications: {
                    orderUpdates: true,
                    paymentUpdates: true
                }
            });
        }

        console.log('-----------------------------------');
        console.log('✅ Admin Setup Complete');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('-----------------------------------');
        console.log('You can now login at /admin-login.html');

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedAdmin();
