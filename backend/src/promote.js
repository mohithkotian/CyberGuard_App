const mongoose = require('mongoose');
const dns = require('dns');
const path = require('path');
const User = require('./models/User');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (_) {}

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const promoteUser = async (email) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: 'admin' },
      { new: true }
    );
    if (user) {
      console.log(`[OK] User ${email} promoted to admin!`);
    } else {
      console.log(`[ERROR] User ${email} not found.`);
    }
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

const email = process.argv[2];
if (!email) {
  console.log('Usage: node promote.js <email>');
  process.exit(1);
}

promoteUser(email);
