const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });
const User = require('../models/User');

const demoUsers = [
  {
    name: 'Citizen Demo',
    email: 'citizen@test.com',
    password: 'Citizen@123',
    role: 'user',
    isVerified: true,
    isActive: true,
    phone: '9876543210'
  },
  {
    name: 'Cyber Inspector',
    email: 'officer@cyberguard.gov',
    password: 'Officer@123',
    role: 'officer',
    isVerified: true,
    isActive: true,
    phone: '9876543211'
  },
  {
    name: 'Cyber Admin',
    email: 'admin@cyberguard.gov',
    password: 'Admin@12345',
    role: 'admin',
    isVerified: true,
    isActive: true,
    phone: '9876543212'
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding demo users...');

    for (const u of demoUsers) {
      await User.deleteOne({ email: u.email });
      const created = new User(u);
      await created.save();
      console.log(`Seeded user: ${u.email} (${u.role})`);
    }

    console.log('All demo users seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();

