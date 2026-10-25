const mongoose = require('mongoose');
const dns = require('dns');
const path = require('path');
const bcrypt = require('bcryptjs');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (_) {}

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/User');

async function upsertUser(email, password, name, role = 'admin') {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
    console.log('✅ Connected to MongoDB Atlas');

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log(`User ${email} not found. Creating new ${role} user...`);
      user = new User({
        name: name || 'Pruthvi Shetty',
        email: email.toLowerCase(),
        password: password,
        role: role,
        isVerified: true,
        isActive: true,
        phone: '9876543210'
      });
      await user.save();
      console.log(`✅ User ${email} created successfully with role: ${role}!`);
    } else {
      console.log(`User ${email} exists. Updating password & role...`);
      user.password = password;
      user.role = role;
      user.isActive = true;
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
      console.log(`✅ User ${email} updated successfully with password: ${password} and role: ${role}!`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating user:', err.message);
    process.exit(1);
  }
}

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || 'Admin User';
const role = process.argv[5] || 'admin';

if (!email || !password) {
  console.log('Usage: node upsertUser.js <email> <password> [name] [role]');
  process.exit(1);
}

upsertUser(email, password, name, role);
