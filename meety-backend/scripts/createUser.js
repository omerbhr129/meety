const mongoose = require('mongoose');
const User = require('../models/User');

async function updateUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meety', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // List all users
    console.log('Current users in database:');
    const users = await User.find();
    console.log(users.map(u => ({
      id: u._id,
      email: u.email,
      fullName: u.fullName
    })));

    // Find user by email
    console.log('Looking for user with email: omri@gmail.com');
    let user = await User.findOne({ email: 'omri@gmail.com' });

    if (user) {
      console.log('Found existing user:', {
        id: user._id,
        email: user.email,
        fullName: user.fullName
      });

      // Update existing user
      user.fullName = 'עומרי';
      user.status = 'active';
      // Set new password - will be hashed by the pre-save middleware
      user.password = '123456';
      await user.save();
      console.log('User updated successfully:', {
        id: user._id,
        email: user.email,
        fullName: user.fullName
      });
    } else {
      console.log('User not found, creating new user');
      // Create new user if not exists - password will be hashed by the pre-save middleware
      user = new User({
        email: 'omri@gmail.com',
        password: '123456',
        fullName: 'עומרי',
        status: 'active'
      });
      await user.save();
      console.log('User created successfully:', {
        id: user._id,
        email: user.email,
        fullName: user.fullName
      });
    }

    // Verify user was saved
    const savedUser = await User.findOne({ email: 'omri@gmail.com' });
    console.log('Verified user in database:', {
      id: savedUser._id,
      email: savedUser.email,
      fullName: savedUser.fullName
    });

    // Test password verification
    const isValidPassword = await savedUser.comparePassword('123456');
    console.log('Password verification test:', isValidPassword);

    // List all users again
    console.log('Updated users in database:');
    const updatedUsers = await User.find();
    console.log(updatedUsers.map(u => ({
      id: u._id,
      email: u.email,
      fullName: u.fullName
    })));

    process.exit(0);
  } catch (error) {
    console.error('Error updating user:', error);
    process.exit(1);
  }
}

updateUser();
