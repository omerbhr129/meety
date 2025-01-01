require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('./models/User');
const Meeting = require('./models/Meeting');
const Participant = require('./models/Participant');
const auth = require('./middlewares/auth');

const app = express();
const PORT = process.env.PORT || 5004;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper functions
const getUTCDayOfWeek = (dateStr) => {
  const date = new Date(dateStr);
  const localDay = date.getDay();
  
  console.log('Getting day of week:', {
    dateStr,
    localDay,
    localDayName: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][localDay],
    date: date.toISOString(),
    localDate: date.toString()
  });
  
  return localDay;
};

const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const generateTimeSlots = (startTime, endTime, duration) => {
  const slots = [];
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  for (let time = start; time + duration <= end; time += duration) {
    slots.push(formatTime(time));
  }
  
  return slots;
};

const isTimeSlotAvailable = (time, dayAvailability, duration) => {
  if (!dayAvailability?.enabled || !Array.isArray(dayAvailability?.timeSlots)) {
    console.log('Basic availability check failed:', {
      enabled: dayAvailability?.enabled,
      hasTimeSlots: Array.isArray(dayAvailability?.timeSlots)
    });
    return false;
  }

  if (dayAvailability.timeSlots.length === 0) {
    console.log('No time slots available');
    return false;
  }

  const requestedTime = parseTime(time);
  
  const isAvailable = dayAvailability.timeSlots.some(slot => {
    const startTime = parseTime(slot.start);
    const endTime = parseTime(slot.end);
    
    const isWithinSlot = requestedTime >= startTime && (requestedTime + duration) <= endTime;
    console.log('Time slot check:', {
      requestedTime,
      startTime,
      endTime,
      duration,
      isWithinSlot,
      slot
    });
    
    return isWithinSlot;
  });

  console.log('Final availability check:', {
    time,
    requestedTime,
    duration,
    isAvailable,
    dayAvailability
  });

  return isAvailable;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error('Invalid file type');
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }
    cb(null, true);
  }
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    }
  }
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5004',
  'https://meetyil.com',
  'https://www.meetyil.com',
  'https://meety-3pp6abz8d-omerbhr129s-projects.vercel.app',
  'https://meety-git-main-omerbhr129s-projects.vercel.app',
  'https://meety.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('Blocked origin:', origin);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    console.log('Allowed origin:', origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Options pre-flight
app.options('*', cors());

// Body parser middleware
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    express.json()(req, res, next);
  } else {
    next();
  }
});

// Log all requests
app.use((req, res, next) => {
  try {
    console.log('\n=== New Request ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', {
      ...req.headers,
      authorization: req.headers.authorization ? '[PRESENT]' : '[MISSING]'
    });
    if (req.method !== 'GET') {
      console.log('Body:', req.body);
    }
    console.log('Query:', req.query);
    console.log('==================\n');
    next();
  } catch (error) {
    console.error('Error in logging middleware:', error);
    next();
  }
});

// Public routes
app.get('/meetings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('\nFetching meeting:', id);
    
    let meeting = await Meeting.findOne({ shareableLink: id });
    
    if (!meeting) {
      meeting = await Meeting.findById(id);
    }
    
    console.log('Found meeting:', meeting);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json({ meeting });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ message: 'Error fetching meeting' });
  }
});

// Create participant
app.post('/participants', express.json(), async (req, res) => {
  try {
    console.log('\nCreating participant with data:', req.body);
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
      console.log('Missing required fields:', { name, email, phone });
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['name', 'email', 'phone'],
        received: req.body
      });
    }

    let participant = await Participant.findOne({ email });
    console.log('Existing participant:', participant);
    
    if (participant) {
      participant.fullName = name;
      participant.phone = phone;
      try {
        await participant.save();
        console.log('Updated existing participant:', participant);
        return res.json({ participant });
      } catch (error) {
        console.error('Error updating participant:', error);
        return res.status(400).json({ 
          message: 'Error updating participant',
          error: error.message
        });
      }
    }

    participant = new Participant({
      fullName: name,
      email,
      phone,
      meetings: []
    });

    try {
      await participant.save();
      console.log('Created new participant:', participant);
      res.status(201).json({ participant: {
        _id: participant._id.toString(),
        fullName: participant.fullName,
        email: participant.email,
        phone: participant.phone,
        meetings: participant.meetings.map(id => id.toString()),
        lastMeeting: participant.lastMeeting,
        createdAt: participant.createdAt,
        updatedAt: participant.updatedAt
      }});
    } catch (error) {
      console.error('Error saving participant:', error);
      res.status(400).json({ 
        message: 'Error creating participant',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Error in participant creation:', error);
    res.status(500).json({ 
      message: 'Error creating participant',
      error: error.message
    });
  }
});

// Protected routes
app.get('/meetings', auth, async (req, res) => {
  try {
    console.log('Fetching meetings for user:', req.userId);
    const meetings = await Meeting.find({ 
      userId: new mongoose.Types.ObjectId(req.userId),
      status: 'active'
    }).populate('bookedSlots.participant', 'fullName email phone');
    
    // הדפסת המידע המלא של הפגישות
    console.log('Found meetings with full details:', JSON.stringify(meetings, null, 2));
    res.json({ meetings });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ message: 'Error fetching meetings' });
  }
});

app.post('/meetings', auth, express.json(), async (req, res) => {
  try {
    console.log('Creating meeting with data:', req.body);
    const { title, duration, type, availability } = req.body;

    if (!title || !duration || !type || !availability) {
      console.log('Missing required fields:', { title, duration, type, availability });
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['title', 'duration', 'type', 'availability'],
        received: req.body
      });
    }

    const meeting = new Meeting({
      title,
      duration,
      type,
      userId: new mongoose.Types.ObjectId(req.userId),
      availability,
      bookedSlots: []
    });

    await meeting.save();
    console.log('Created meeting:', meeting);
    res.status(201).json({ meeting });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ 
      message: 'Error creating meeting',
      error: error.message,
      stack: error.stack
    });
  }
});

app.put('/meetings/:id', auth, express.json(), async (req, res) => {
  try {
    console.log('Updating meeting:', {
      id: req.params.id,
      userId: req.userId,
      body: req.body
    });

    const { id } = req.params;
    const { title, duration, type, availability } = req.body;

    if (!title || !duration || !type || !availability) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['title', 'duration', 'type', 'availability'],
        received: req.body
      });
    }

    const meeting = await Meeting.findById(id);
    console.log('Found meeting:', meeting);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.userId.toString() !== req.userId.toString()) {
      console.log('Authorization failed:', {
        meetingUserId: meeting.userId,
        requestUserId: req.userId
      });
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedAvailability = {};
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    days.forEach(day => {
      updatedAvailability[day] = {
        enabled: availability[day]?.enabled ?? false,
        timeSlots: availability[day]?.timeSlots ?? []
      };
    });

    meeting.title = title;
    meeting.duration = duration;
    meeting.type = type;
    meeting.availability = updatedAvailability;

    await meeting.save();
    console.log('Updated meeting:', meeting);
    
    res.json({ meeting });
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ 
      message: 'Error updating meeting',
      error: error.message
    });
  }
});

// Update meeting slot
app.patch('/meetings/:meetingId/slots/:slotId', auth, async (req, res) => {
  try {
    const { meetingId, slotId } = req.params;
    const { date, time, participant } = req.body;

    console.log('Updating meeting slot:', {
      meetingId,
      slotId,
      date,
      time,
      participant,
      userId: req.userId
    });

    const meeting = await Meeting.findOne({ 
      _id: meetingId,
      userId: req.userId
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Find the specific slot
    const slot = meeting.bookedSlots.id(slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    // Update the slot
    if (date) slot.date = date;
    if (time) slot.time = time;
    if (participant) slot.participant = participant;

    await meeting.save();

    // Return the updated meeting with populated participant data
    const updatedMeeting = await Meeting.findById(meetingId)
      .populate('bookedSlots.participant', 'fullName email phone');

    console.log('Updated meeting:', updatedMeeting);
    res.json({ meeting: updatedMeeting });
  } catch (error) {
    console.error('Error updating meeting slot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update meeting slot status
app.patch('/meetings/:meetingId/slots/:slotId/status', auth, async (req, res) => {
  try {
    const { meetingId, slotId } = req.params;
    const { status } = req.body;

    console.log('Updating meeting slot status:', {
      meetingId,
      slotId,
      status,
      userId: req.userId
    });

    if (!['completed', 'missed', 'pending', 'deleted'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const meeting = await Meeting.findOne({ 
      _id: meetingId,
      userId: req.userId
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Find the specific slot
    const slot = meeting.bookedSlots.id(slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    // Update the status
    slot.status = status;
    await meeting.save();

    // Return the updated meeting with populated participant data
    const updatedMeeting = await Meeting.findById(meetingId)
      .populate('bookedSlots.participant', 'fullName email phone');

    console.log('Updated meeting:', updatedMeeting);
    res.json({ meeting: updatedMeeting });
  } catch (error) {
    console.error('Error updating meeting slot status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete meeting slot
app.delete('/meetings/:meetingId/slots/:slotId', auth, async (req, res) => {
  try {
    const { meetingId, slotId } = req.params;
    
    console.log('Deleting meeting slot:', {
      meetingId,
      slotId,
      userId: req.userId
    });

    const meeting = await Meeting.findOne({ 
      _id: meetingId,
      userId: req.userId
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Find and remove the specific slot
    const slotIndex = meeting.bookedSlots.findIndex(slot => slot._id.toString() === slotId);
    if (slotIndex === -1) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    meeting.bookedSlots.splice(slotIndex, 1);
    await meeting.save();

    // Return the updated meeting with populated participant data
    const updatedMeeting = await Meeting.findById(meetingId)
      .populate('bookedSlots.participant', 'fullName email phone');

    console.log('Updated meeting after slot deletion:', updatedMeeting);
    res.json({ meeting: updatedMeeting });
  } catch (error) {
    console.error('Error deleting meeting slot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/meetings/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting meeting:', id);
    
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.userId.toString() !== req.userId.toString()) {
      console.log('Authorization failed:', {
        meetingUserId: meeting.userId,
        requestUserId: req.userId
      });
      return res.status(403).json({ message: 'Not authorized' });
    }

    await meeting.deleteOne();
    console.log('Meeting deleted successfully');
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ message: 'Error deleting meeting' });
  }
});

app.get('/participants', auth, async (req, res) => {
  try {
    console.log('Fetching participants for user:', req.userId);
    
    const meetings = await Meeting.find({ 
      userId: new mongoose.Types.ObjectId(req.userId),
      status: 'active'
    });
    
    const meetingIds = meetings.map(meeting => meeting._id);
    
    const participants = await Participant.find({
      $or: [
        { 'meetings': { $in: meetingIds } },
        { 'meetings': { $size: 0 } }
      ]
    });
    
    console.log('Found participants:', participants);
    res.json({participants});
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ message: 'Error fetching participants' });
  }
});

app.put('/participants/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone } = req.body;
    console.log('\nUpdating participant:', { id, fullName, email, phone });

    const participant = await Participant.findById(id);
    if (!participant) {
      console.log('Participant not found:', id);
      return res.status(404).json({ message: 'Participant not found' });
    }

    if (fullName) participant.fullName = fullName;
    if (email) participant.email = email;
    if (phone) participant.phone = phone;

    await participant.save();
    console.log('Updated participant:', participant);

    res.json({ 
      participant: {
        _id: participant._id.toString(),
        fullName: participant.fullName,
        email: participant.email,
        phone: participant.phone,
        meetings: participant.meetings.map(id => id.toString()),
        lastMeeting: participant.lastMeeting,
        createdAt: participant.createdAt,
        updatedAt: participant.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(500).json({ 
      message: 'Error updating participant',
      error: error.message
    });
  }
});

app.delete('/participants/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('\nDeleting participant:', {
      id,
      userId: req.userId,
      headers: req.headers
    });

    const participant = await Participant.findById(id);
    if (!participant) {
      console.log('Participant not found:', id);
      return res.status(404).json({ message: 'Participant not found' });
    }

    console.log('Found participant:', participant);

    const updateResult = await Meeting.updateMany(
      { 'bookedSlots.participant': id },
      { $pull: { bookedSlots: { participant: id } } }
    );
    console.log('Updated meetings:', updateResult);

    const deleteResult = await participant.deleteOne();
    console.log('Delete result:', deleteResult);
    
    console.log('Participant deleted successfully');
    res.json({ message: 'Participant deleted successfully' });
  } catch (error) {
    console.error('Error deleting participant:', error);
    res.status(500).json({ message: 'Error deleting participant' });
  }
});

// Book meeting
app.post('/meetings/:id/book', express.json(), async (req, res) => {
  try {
    console.log('\n=== Booking Meeting Request ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    
    const { id } = req.params;
    const { date, time, participant } = req.body;

    if (!date || !time || !participant) {
      console.log('Missing required fields:', { date, time, participant });
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['date', 'time', 'participant'],
        received: req.body
      });
    }

    let meeting = await Meeting.findOne({ shareableLink: id });
    if (!meeting) {
      meeting = await Meeting.findById(id);
    }
    console.log('Found meeting:', meeting);

    if (!meeting) {
      console.log('Meeting not found:', id);
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const participantDoc = await Participant.findById(participant);
    if (!participantDoc) {
      console.log('Participant not found:', participant);
      return res.status(404).json({ message: 'Participant not found' });
    }
    console.log('Found participant:', participantDoc);

    const dayOfWeek = new Date(date).getDay();
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    const dayAvailability = meeting.availability[dayName];

    if (!dayAvailability?.enabled) {
      return res.status(400).json({ message: 'היום הנבחר אינו זמין' });
    }

    const isTimeAvailable = dayAvailability.timeSlots.some(slot => {
      const [slotStartHour, slotStartMinute] = slot.start.split(':').map(Number);
      const [slotEndHour, slotEndMinute] = slot.end.split(':').map(Number);
      const [bookingHour, bookingMinute] = time.split(':').map(Number);

      const slotStartMinutes = slotStartHour * 60 + slotStartMinute;
      const slotEndMinutes = slotEndHour * 60 + slotEndMinute;
      const bookingMinutes = bookingHour * 60 + bookingMinute;

      return bookingMinutes >= slotStartMinutes && 
             (bookingMinutes + meeting.duration) <= slotEndMinutes;
    });

    if (!isTimeAvailable) {
      return res.status(400).json({ message: 'השעה הנבחרת אינה זמינה' });
    }

    const isSlotBooked = meeting.bookedSlots.some(slot => 
      slot.date === date && slot.time === time
    );

    if (isSlotBooked) {
      return res.status(400).json({ message: 'השעה הנבחרת כבר תפוסה' });
    }

    // Check if meeting time has passed
    const meetingDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    
    const booking = {
      date,
      time,
      participant,
      status: meetingDateTime < now ? 'completed' : 'pending'
    };

    if (!meeting.bookedSlots) {
      meeting.bookedSlots = [];
    }

    meeting.bookedSlots.push(booking);
    await meeting.save();
    console.log('Added new booking:', booking);

    participantDoc.meetings.push(meeting._id);
    participantDoc.lastMeeting = new Date();
    await participantDoc.save();
    console.log('Updated participant:', participantDoc);

    res.json({ booking });
  } catch (error) {
    console.error('=== Error booking meeting ===');
    console.error('Full error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Error booking meeting',
      error: error.message,
      details: error.errors
    });
  }
});

// Book single meeting
app.post('/meetings/:id/book-single', express.json(), async (req, res) => {
  try {
    console.log('\n=== Booking Single Meeting Request ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    
    const { id } = req.params;
    const { date, time, participant } = req.body;

    if (!date || !time || !participant) {
      console.log('Missing required fields:', { date, time, participant });
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['date', 'time', 'participant'],
        received: req.body
      });
    }

    let meeting = await Meeting.findOne({ shareableLink: id });
    if (!meeting) {
      meeting = await Meeting.findById(id);
    }
    console.log('Found meeting:', meeting);

    if (!meeting) {
      console.log('Meeting not found:', id);
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const participantDoc = await Participant.findById(participant);
    if (!participantDoc) {
      console.log('Participant not found:', participant);
      return res.status(404).json({ message: 'Participant not found' });
    }
    console.log('Found participant:', participantDoc);

    const dayOfWeek = new Date(date).getDay();
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    const dayAvailability = meeting.availability[dayName];

    if (!dayAvailability?.enabled) {
      return res.status(400).json({ message: 'היום הנבחר אינו זמין' });
    }

    const isTimeAvailable = dayAvailability.timeSlots.some(slot => {
      const [slotStartHour, slotStartMinute] = slot.start.split(':').map(Number);
      const [slotEndHour, slotEndMinute] = slot.end.split(':').map(Number);
      const [bookingHour, bookingMinute] = time.split(':').map(Number);

      const slotStartMinutes = slotStartHour * 60 + slotStartMinute;
      const slotEndMinutes = slotEndHour * 60 + slotEndMinute;
      const bookingMinutes = bookingHour * 60 + bookingMinute;

      return bookingMinutes >= slotStartMinutes && 
             (bookingMinutes + meeting.duration) <= slotEndMinutes;
    });

    if (!isTimeAvailable) {
      return res.status(400).json({ message: 'השעה הנבחרת אינה זמינה' });
    }

    const isSlotBooked = meeting.bookedSlots.some(slot => 
      slot.date === date && slot.time === time
    );

    if (isSlotBooked) {
      return res.status(400).json({ message: 'השעה הנבחרת כבר תפוסה' });
    }

    // Check if meeting time has passed
    const meetingDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    
    const booking = {
      date,
      time,
      participant,
      status: meetingDateTime < now ? 'completed' : 'pending'
    };

    if (!meeting.bookedSlots) {
      meeting.bookedSlots = [];
    }

    meeting.bookedSlots.push(booking);
    await meeting.save();
    console.log('Added new booking:', booking);

    participantDoc.meetings.push(meeting._id);
    participantDoc.lastMeeting = new Date();
    await participantDoc.save();
    console.log('Updated participant:', participantDoc);

    res.json({ booking });
  } catch (error) {
    console.error('=== Error booking meeting ===');
    console.error('Full error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Error booking meeting',
      error: error.message,
      details: error.errors
    });
  }
});

// Auth routes
app.post('/auth/register', express.json(), async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    console.log('Registration attempt:', { email, fullName });

    if (!email || !password || !fullName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      email,
      password,
      fullName,
      role: 'user',
      status: 'active'
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
  });
  
  app.post('/auth/login', express.json(), async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });
  
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  
    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
  });
  
  // User routes
  app.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    res.json({
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
  });
  
  app.put('/user', auth, async (req, res) => {
  try {
    const { fullName, email, currentPassword, newPassword } = req.body;
  
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
  
    if (currentPassword && newPassword) {
      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }
  
    await user.save();
  
    res.json({
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
  });
  
  app.post('/user/profile-image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
  
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    // Delete old profile image if exists
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
  
    // Update user with new profile image path and return updated user
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { profileImage: `/uploads/profiles/${req.file.filename}` },
      { new: true }
    );
  
    res.json({
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        profileImage: updatedUser.profileImage,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ message: 'Error uploading profile image' });
  }
  });
  
  app.delete('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    // Delete user's profile image if exists
    if (user.profileImage) {
      const imagePath = path.join(__dirname, user.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
  
    // Delete user's meetings
    await Meeting.deleteMany({ userId: req.userId });
  
    // Delete user
    await user.deleteOne();
  
    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
  });
  // Connect to MongoDB
  mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
