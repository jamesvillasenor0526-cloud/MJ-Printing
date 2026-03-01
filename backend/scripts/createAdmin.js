const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
    try {
        console.log('Loading .env from:', path.join(__dirname, '../.env'));
        // const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
        const mongoURI = 'mongodb://localhost:27017/mjprint';
        console.log('Using Hardcoded Mongo URI:', mongoURI);

        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        const adminUser = {
            name: 'Admin User',
            email: 'admin@mjprint.com',
            password: 'admin123',
            role: 'admin',
            username: 'admin'
        };

        // Check if admin exists
        let user = await User.findOne({ email: adminUser.email });
        if (user) {
            console.log('Admin user already exists');
            user.role = 'admin'; // Ensure role
            user.username = 'admin';
            user.password = adminUser.password; // Update password
            await user.save();
            console.log('Admin user updated');
        } else {
            user = await User.create(adminUser);
            console.log('Admin user created');
        }

        console.log('Email: admin@mjprint.com');
        console.log('Password: adminpassword123');

        await mongoose.disconnect();
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        const fs = require('fs');
        fs.writeFileSync('error_details.txt', error.stack || error.message);
        process.exit(1);
    }
};

createAdmin();
