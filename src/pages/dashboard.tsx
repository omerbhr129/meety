import { withAuth } from '../lib/auth';
import { useAuth } from '../lib/auth';
import { useEffect, useState } from 'react';
import { getUserMeetings, deleteMeeting } from '../services/api';
import { Meeting } from '../types/meeting';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  Clock, 
  Users, 
  Video, 
  Phone, 
  Mail, 
  Plus, 
  Share2, 
  MoreVertical, 
  PhoneCall, 
  CalendarIcon, 
  Trash2, 
  Edit, 
  CheckCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useToast } from '../components/ui/use-toast';

interface TodayMeeting {
  _id: string;
  title: string;
  type: 'video' | 'phone' | 'in-person';
  duration: number;
  date: string;
  time: string;
  status?: 'completed' | 'missed' | 'pending';
  participant: {
    _id?: string;
    fullName: string;
    email: string;
    phone: string;
  };
}

function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await getUserMeetings();
        console.log('Fetched meetings:', response.meetings);
        setMeetings(response.meetings || []);
      } catch (err) {
        console.error('Error fetching meetings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load meetings');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      await deleteMeeting(meetingId);
      setMeetings(meetings.filter(m => m._id !== meetingId));
      toast({
        title: "הפגישה נמחקה בהצלחה",
        description: "סוג הפגישה הוסר מהמערכת",
      });
    } catch (err) {
      console.error('Error deleting meeting:', err);
      toast({
        title: "שגיאה במחיקת הפגישה",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    }
  };

  const handleEditMeeting = (meeting: Meeting) => {
    router.push(`/meeting/${meeting._id}`);
  };

  const handleShareMeeting = (meeting: Meeting) => {
    const shareUrl = `${window.location.origin}/book/${meeting.shareableLink}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "הקישור הועתק",
      description: "הקישור הועתק ללוח",
    });
  };

  // Get today's meetings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toLocaleDateString('en-CA');
  
  // Calculate statistics
  const totalPlannedMeetings = meetings.reduce((acc, meeting) => 
    acc + meeting.bookedSlots.filter(slot => slot.status === 'pending').length, 0
  );

  const todayMeetingsCount = meetings.reduce((acc, meeting) => 
    acc + meeting.bookedSlots.filter(slot => 
      slot.date === todayStr && slot.status === 'pending'
    ).length, 0
  );

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const thisWeekMeetings = meetings.reduce((acc, meeting) => 
    acc + meeting.bookedSlots.filter(slot => {
      const slotDate = new Date(slot.date);
      return slotDate >= weekStart && slotDate < weekEnd && slot.status === 'pending';
    }).length, 0
  );

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const thisMonthMeetings = meetings.reduce((acc, meeting) => 
    acc + meeting.bookedSlots.filter(slot => {
      const slotDate = new Date(slot.date);
      return slotDate >= monthStart && slotDate <= monthEnd && slot.status === 'pending';
    }).length, 0
  );
  
  const todayMeetings = meetings.flatMap(meeting => {
    const slots = meeting.bookedSlots
      .filter(slot => {
        return slot.date === todayStr && slot.status === 'pending';
      })
      .map(slot => ({
        ...slot,
        _id: slot._id || Math.random().toString(),
        title: meeting.title,
        type: meeting.type,
        duration: meeting.duration
      }));
    return slots;
  }).sort((a, b) => a.time.localeCompare(b.time));

  // בדיקה האם פגישה מתרחשת כרגע או הבאה בתור
  const getMeetingStatus = (meeting: TodayMeeting) => {
    const [hours, minutes] = meeting.time.split(':').map(Number);
    const meetingTime = new Date();
    meetingTime.setHours(hours, minutes, 0, 0);
    
    const meetingEndTime = new Date(meetingTime);
    meetingEndTime.setMinutes(meetingEndTime.getMinutes() + meeting.duration);

    const now = currentTime;
    
    if (now >= meetingTime && now < meetingEndTime) {
      return 'מתרחש';
    }

    // מצא את הפגישה הבאה בתור
    const nextMeeting = todayMeetings.find(nextMeeting => {
      const [nextHours, nextMinutes] = nextMeeting.time.split(':').map(Number);
      const nextMeetingTime = new Date();
      nextMeetingTime.setHours(nextHours, nextMinutes, 0, 0);
      return nextMeetingTime > now;
    });

    if (nextMeeting && nextMeeting._id === meeting._id) {
      return 'הבא בתור';
    }

    return '';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-2xl font-semibold text-blue-600">טוען...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl text-red-600">שגיאה: {error}</div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>לוח בקרה | Meety</title>
      </Head>
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-transparent bg-clip-text">
              {user?.fullName}, ברוך הבא
            </h2>
            <Button
              onClick={() => router.push('/new-meeting')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:opacity-90 shadow-sm hover:shadow transition-all px-6"
            >
              <Plus className="h-5 w-5 ml-2" />
              פגישה חדשה
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">סך הכל פגישות</p>
                  <h3 className="text-2xl font-semibold text-gray-900">{totalPlannedMeetings}</h3>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">פגישות היום</p>
                  <h3 className="text-2xl font-semibold text-gray-900">{todayMeetingsCount}</h3>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">פגישות השבוע</p>
                  <h3 className="text-2xl font-semibold text-gray-900">{thisWeekMeetings}</h3>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">פגישות החודש</p>
                  <h3 className="text-2xl font-semibold text-gray-900">{thisMonthMeetings}</h3>
                </div>
              </div>
            </Card>
          </div>

          {/* Today's Schedule */}
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 
                  flex items-center justify-center text-white">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">פגישות להיום</h2>
                  <p className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {todayMeetings.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">אין פגישות מתוכננות להיום</p>
                </div>
              ) : (
                todayMeetings.map((meeting) => (
                  <div key={meeting._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center gap-6">
                      <div className="w-20 text-center">
                        <div className="text-lg font-semibold text-gray-900">{meeting.time}</div>
                        <div className="text-sm text-gray-500">{meeting.duration} דקות</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium
                            ${meeting.type === 'video' ? 'bg-blue-100 text-blue-700' :
                              meeting.type === 'phone' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'}`}>
                            {meeting.type === 'video' ? 'וידאו' :
                             meeting.type === 'phone' ? 'טלפון' : 'פרונטלי'}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            {meeting.participant.fullName}
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {meeting.participant.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {meeting.participant.phone}
                          </div>
                        </div>
                      </div>
                      {getMeetingStatus(meeting) && (
                        <div className={`px-4 py-2 rounded-full text-sm font-medium
                          ${getMeetingStatus(meeting) === 'מתרחש' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {getMeetingStatus(meeting)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Meeting Types */}
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-transparent bg-clip-text mb-6">
              סוגי הפגישות שלך
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings.length === 0 ? (
                <Card className="col-span-full p-8 text-center">
                  <h4 className="text-lg text-gray-600 mb-2">אין לך סוגי פגישות עדיין</h4>
                  <p className="text-gray-500 mb-6">צור סוג פגישה ושתף אותו עם הלקוחות שלך</p>
                  <Button
                    onClick={() => router.push('/new-meeting')}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                  >
                    <Plus className="h-5 w-5 ml-2" />
                    צור סוג פגישה ראשון
                  </Button>
                </Card>
              ) : (
                meetings.map((meeting) => (
                  <Card
                    key={meeting._id}
                    className="overflow-hidden bg-white/90 backdrop-blur-sm border-blue-100/50 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-3 rounded-lg">
                            {meeting.type === 'video' ? (
                              <Video className="h-6 w-6 text-blue-600" />
                            ) : meeting.type === 'phone' ? (
                              <Phone className="h-6 w-6 text-blue-600" />
                            ) : (
                              <Users className="h-6 w-6 text-blue-600" />
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditMeeting(meeting)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              ערוך פגישה
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteMeeting(meeting._id!)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              מחק פגישה
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>משך הפגישה: {meeting.duration} דקות</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {meeting.type === 'video' ? (
                            <>
                              <Video className="h-4 w-4 text-gray-500" />
                              <span>פגישת וידאו בזום</span>
                            </>
                          ) : meeting.type === 'phone' ? (
                            <>
                              <PhoneCall className="h-4 w-4 text-gray-500" />
                              <span>שיחה טלפונית</span>
                            </>
                          ) : (
                            <>
                              <Users className="h-4 w-4 text-gray-500" />
                              <span>פגישה פרונטלית</span>
                            </>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleShareMeeting(meeting)}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:opacity-90 shadow-sm hover:shadow transition-all py-6 mt-6"
                      >
                        שתף קישור
                        <Share2 className="h-4 w-4 mr-2" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(DashboardPage);
