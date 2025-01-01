const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './api/.env' });

async function createAdminUser() {
  let client;
  try {
    client = new MongoClient(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    await client.connect();
    console.log('Connected to MongoDB successfully');

    const db = client.db('test');
    const users = db.collection('users');

    // בדיקה אם המשתמש כבר קיים
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@meety.com';
    const existingUser = await users.findOne({ email: adminEmail });

    if (existingUser) {
      console.log('Admin user already exists');
      return;
    }

    // יצירת משתמש חדש
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123!@#', 10);
    
    const adminUser = {
      email: adminEmail,
      password: hashedPassword,
      fullName: 'System Admin',
      status: 'active',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await users.insertOne(adminUser);
    console.log('Admin user created successfully');

    // יצירת טוקן JWT
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { email: adminEmail },
      process.env.JWT_SECRET || 'development-secret-key',
      { expiresIn: '1y' }
    );

    console.log('\nAdmin user details:');
    console.log('Email:', adminEmail);
    console.log('Password:', process.env.ADMIN_PASSWORD || 'admin123!@#');
    console.log('\nAccess token:');
    console.log(token);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    if (client) {
      await client.close();
    }
    process.exit();
  }
}

createAdminUser();
