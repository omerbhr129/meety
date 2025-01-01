import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

interface Stats {
  users: {
    total: number;
    active: number;
    lastRegistered: Date;
    newLastWeek: number;
    weeklyGrowth: number;
  };
  meetings: {
    total: number;
    upcoming: number;
    completed: number;
    totalCreated: number;
  };
  activity: {
    totalLogins: number;
    activeUsers24h: number;
    averageMeetingsPerUser: number;
  };
  notifications: Array<{
    id: string;
    type: 'meeting_created' | 'user_joined' | 'meeting_completed';
    title: string;
    description: string;
    timestamp: Date;
    read: boolean;
  }>;
  usersList: Array<{
    id: string;
    fullName: string;
    email: string;
    lastLogin: string;
    totalMeetings: number;
    upcomingMeetings: number;
  }>;
}

const verifyToken = (token: string): { email: string } | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
  } catch {
    return null;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Stats | { message: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing authorization header' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@meety.com';
    
    if (!decoded || decoded.email !== adminEmail) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const User = mongoose.model('User');
    const Meeting = mongoose.model('Meeting');

    // סטטיסטיקות משתמשים
    const users = await User.find();
    const activeUsers = users.filter(user => user.status === 'active');
    const lastRegistered = users.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]?.createdAt;

    // משתמשים חדשים בשבוע האחרון
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const newUsersLastWeek = users.filter(user => 
      new Date(user.createdAt) > oneWeekAgo
    ).length;

    const newUsersTwoWeeksAgo = users.filter(user => 
      new Date(user.createdAt) > twoWeeksAgo && new Date(user.createdAt) <= oneWeekAgo
    ).length;

    const weeklyGrowth = newUsersTwoWeeksAgo ? 
      Math.round(((newUsersLastWeek - newUsersTwoWeeksAgo) / newUsersTwoWeeksAgo) * 100) : 0;

    // סטטיסטיקות פגישות
    const meetings = await Meeting.find().populate('bookedSlots');
    const now = new Date();
    const upcomingMeetings = meetings.reduce((count: number, meeting: any) => {
      const upcomingSlots = meeting.bookedSlots.filter((slot: any) => {
        const meetingDate = new Date(`${slot.date}T${slot.time}`);
        return meetingDate > now;
      });
      return count + upcomingSlots.length;
    }, 0);

    const completedMeetings = meetings.reduce((count: number, meeting: any) => {
      const completedSlots = meeting.bookedSlots.filter((slot: any) => 
        slot.status === 'completed'
      );
      return count + completedSlots.length;
    }, 0);

    // משתמשים פעילים ב-24 שעות האחרונות
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const activeUsers24h = users.filter(user => 
      user.lastLogin && new Date(user.lastLogin) > last24Hours
    ).length;

    // התראות מערכת
    const notifications = await Promise.all([
      ...meetings.slice(-5).map(meeting => ({
        id: meeting._id.toString(),
        type: 'meeting_created' as const,
        title: 'פגישה חדשה נוצרה',
        description: `נוצרה פגישה חדשה על ידי ${meeting.creator.fullName || meeting.creator.email}`,
        timestamp: meeting.createdAt,
        read: meeting.notificationRead || false
      })),
      ...users.slice(-5).map(user => ({
        id: user._id.toString(),
        type: 'user_joined' as const,
        title: 'משתמש חדש הצטרף',
        description: `${user.fullName || user.email} הצטרף למערכת`,
        timestamp: user.createdAt,
        read: user.notificationRead || false
      }))
    ]).then(notifications => 
      notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    );

    // רשימת משתמשים עם נתונים
    const usersList = await Promise.all(users.map(async (user: any) => {
      const userMeetings = await Meeting.find({ creator: user._id });
      const upcomingMeetingsCount = userMeetings.reduce((count: number, meeting: any) => {
        const upcomingSlots = meeting.bookedSlots.filter((slot: any) => {
          const meetingDate = new Date(`${slot.date}T${slot.time}`);
          return meetingDate > now;
        });
        return count + upcomingSlots.length;
      }, 0);

      return {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        lastLogin: user.lastLogin || user.createdAt,
        totalMeetings: userMeetings.reduce((count: number, meeting: any) => 
          count + meeting.bookedSlots.length, 0
        ),
        upcomingMeetings: upcomingMeetingsCount
      };
    }));

    // חישוב ממוצע פגישות למשתמש
    const totalMeetingsCount = meetings.reduce((count: number, meeting: any) => 
      count + meeting.bookedSlots.length, 0
    );
    const averageMeetingsPerUser = users.length ? 
      parseFloat((totalMeetingsCount / users.length).toFixed(1)) : 0;

    const stats: Stats = {
      users: {
        total: users.length,
        active: activeUsers.length,
        lastRegistered,
        newLastWeek: newUsersLastWeek,
        weeklyGrowth
      },
      meetings: {
        total: totalMeetingsCount,
        upcoming: upcomingMeetings,
        completed: completedMeetings,
        totalCreated: meetings.length
      },
      activity: {
        totalLogins: users.reduce((sum: number, user: any) => 
          sum + (user.totalLogins || 0), 0
        ),
        activeUsers24h,
        averageMeetingsPerUser
      },
      notifications,
      usersList
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
