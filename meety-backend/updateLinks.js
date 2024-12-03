require('dotenv').config();
const mongoose = require('mongoose');
const Meeting = require('./models/Meeting');

async function updateLinks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const meetings = await Meeting.find();
    console.log(`Found ${meetings.length} meetings to update`);

    for (const meeting of meetings) {
      meeting.shareableLink = `http://localhost:3003/book/${meeting._id}`;
      await meeting.save();
      console.log(`Updated meeting ${meeting._id}`);
    }

    console.log('All meetings updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating meetings:', error);
    process.exit(1);
  }
}

updateLinks();
