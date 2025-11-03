import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from '../models/User';

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/veggiefresh';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Default admin credentials (you can change these)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@veggiefresh.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Admin User';

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`Admin user with email ${adminEmail} already exists!`);
      console.log('If you want to reset the password, please delete the existing user first.');
      process.exit(0);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      passwordHash: passwordHash,
      role: 'admin',
      isPhoneVerified: true
    });

    await adminUser.save();
    console.log('\n✅ Admin user created successfully!');
    console.log('\n📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('\n⚠️  Please change the default password after first login!\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.error('A user with this email already exists!');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createAdminUser();

