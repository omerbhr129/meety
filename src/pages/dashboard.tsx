import React from 'react';
import { withAuth } from '../lib/auth';
import { useAuth } from '../lib/auth';
import { useEffect, useState } from 'react';
import { getUserMeetings, deleteMeeting, updateMeetingSlotStatus } from '../services/api';
import { Meeting, BookedSlot } from '../types/meeting';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
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
  Calendar, 
  Trash2, 
  Edit,
  Check,
  X,
  ArrowLeft
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { useToast } from '../components/ui/use-toast';

interface TodayMeeting extends BookedSlot {
  title: string;
  type: 'video' | 'phone' | 'in-person';
  duration: number;
}

type StatisticType = 'planned' | 'today' | 'week' | 'month' | null;

function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedStatistic, setSelectedStatistic] = useState<StatisticType>(null);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      return 'בוקר טוב';
    } else if (hour >= 12 && hour < 17) {
      return 'צהריים טובים';
    } else if (hour >= 17 && hour < 21) {
      return 'אחר הצהריים טובים';
    } else {
      return 'ערב טוב';
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchMeetings = async () => {
      if (!user) return; // רק אם יש משתמש מחובר
      
      try {
        setLoading(true);
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
  }, [user]); // תלוי במשתמש

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

  const handleMeetingStatus = async (slotId: string, status: 'completed' | 'missed') => {
    try {
      // Find the meeting that contains this slot
      const meeting = meetings.find(m => 
        m.bookedSlots.some(slot => slot._id === slotId)
      );

      if (!meeting) {
        throw new Error('Meeting not found');
      }

      await updateMeetingSlotStatus(meeting._id!, slotId, status);
      
      // Update local state
      setMeetings(meetings.map(m => {
        if (m._id === meeting._id) {
          const updatedSlots = m.bookedSlots.map(slot => {
            if (slot._id === slotId) {
              return { ...slot, status };
            }
            return slot;
          });
          return { ...m, bookedSlots: updatedSlots };
        }
        return m;
      }));

      toast({
        title: status === 'completed' ? "הפגישה סומנה כהתקיימה" : "הפגישה סומנה כלא התקיימה",
        description: "סטטוס הפגישה עודכן בהצלחה",
      });
    } catch (err) {
      console.error('Error updating meeting status:', err);
      toast({
        variant: "destructive",
        title: "שגיאה בעדכון סטטוס הפגישה",
        description: "אנא נסה שוב מאוחר יותר",
      });
    }
  };

  const handleUpdateNotes = async (meetingId: string, notes: string) => {
    try {
      // Find the meeting that contains this slot
      const meeting = meetings.find(m => 
        m.bookedSlots.some(slot => slot._id === meetingId)
      );

      if (!meeting) {
        throw new Error('Meeting not found');
      }

      // Update local state
      setMeetings(meetings.map(m => {
        if (m._id === meeting._id) {
          const updatedSlots = m.bookedSlots.map(slot => {
            if (slot._id === meetingId) {
              return { ...slot, notes };
            }
            return slot;
          });
          return { ...m, bookedSlots: updatedSlots };
        }
        return m;
      }));

      // TODO: Add API call to save notes
      toast({
        title: "ההערות נשמרו בהצלחה",
        description: "ההערות עודכנו במערכת",
      });
    } catch (err) {
      console.error('Error updating notes:', err);
      toast({
        title: "שגיאה בשמירת ההערות",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    }
  };

  // Get today's meetings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toLocaleDateString('en-CA');

  // Calculate statistics
  const totalPlannedMeetings = meetings.reduce((acc, meeting) => 
    acc + meeting.bookedSlots.filter(slot => {
      const [year, month, day] = slot.date.split('-').map(Number);
      const [hours, minutes] = slot.time.split(':').map(Number);
      const meetingTime = new Date(year, month - 1, day, hours, minutes);
      const now = new Date();
      return meetingTime > now && (!slot.status || meetingTime > now);
    }).length, 0
  );

  const todayMeetingsCount = meetings.reduce((acc, meeting) => 
    acc + meeting.bookedSlots.filter(slot => slot.date === todayStr).length, 0
  );

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const thisWeekMeetings = meetings.reduce((acc, meeting) => 
    acc + meeting.bookedSlots.filter(slot => {
      const [year, month, day] = slot.date.split('-').map(Number);
      const slotDate = new Date(year, month - 1, day);
      return slotDate >= weekStart && slotDate < weekEnd;
    }).length, 0
  );

  // חישוב תחילת וסוף החודש
  const monthStart = new Date();
  monthStart.setDate(1); // קובע את היום הראשון בחודש
  monthStart.setHours(0, 0, 0, 0); // מאפס את השעה

  const monthEnd = new Date();
  monthEnd.setMonth(monthEnd.getMonth() + 1); // עובר לחודש הבא
  monthEnd.setDate(0); // חוזר ליום האחרון של החודש הנוכחי
  monthEnd.setHours(23, 59, 59, 999); // מגדיר את השעה לסוף היום

  // המרה לפורמט YYYY-MM-DD
  const monthStartStr = monthStart.toLocaleDateString('en-CA');
  const monthEndStr = monthEnd.toLocaleDateString('en-CA');

  // חישוב פגישות החודש - כולל כל הפגישות בחודש, בלי קשר לסטטוס
  const thisMonthMeetings = meetings.reduce((acc, meeting) => 
    acc + meeting.bookedSlots.filter(slot => {
      // בודק אם התאריך של הפגישה בטווח של החודש הנוכחי
      return slot.date >= monthStartStr && slot.date <= monthEndStr;
    }).length, 0
  );

  // Get filtered meetings based on selected statistic
  const getFilteredMeetings = () => {
    if (!selectedStatistic) return [];

    return meetings.flatMap(meeting => {
      return meeting.bookedSlots
        .filter(slot => {
          const [year, month, day] = slot.date.split('-').map(Number);
          const [hours, minutes] = slot.time.split(':').map(Number);
          const slotDate = new Date(year, month - 1, day);
          const meetingTime = new Date(year, month - 1, day, hours, minutes);
          const now = new Date();

          switch (selectedStatistic) {
            case 'planned':
              return meetingTime > now && (!slot.status || meetingTime > now);
            case 'today':
              return slot.date === todayStr;
            case 'week':
              return slotDate >= weekStart && slotDate < weekEnd;
            case 'month':
              return slot.date >= monthStartStr && slot.date <= monthEndStr;
            default:
              return false;
          }
        })
        .map(slot => ({
          ...slot,
          title: meeting.title,
          type: meeting.type,
          duration: meeting.duration
        }));
    }).sort((a, b) => {
      // Sort by date first, then by time
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
    });
  };

  const getStatisticTitle = () => {
    switch (selectedStatistic) {
      case 'planned':
        return 'פגישות מתוכננות';
      case 'today':
        return 'פגישות היום';
      case 'week':
        return 'פגישות השבוע';
      case 'month':
        return 'פגישות החודש';
      default:
        return '';
    }
  };

  const todayMeetings = meetings.flatMap(meeting => {
    const slots = meeting.bookedSlots
      .filter(slot => {
        return slot.date === todayStr;
      })
      .map(slot => ({
        ...slot,
        title: meeting.title,
        type: meeting.type,
        duration: meeting.duration
      }));
    return slots;
  }).sort((a, b) => a.time.localeCompare(b.time));

  // בדיקה חד פעמית של סטטוס פגישות שהסתיימו או מתרחשות כעת
  useEffect(() => {
    todayMeetings.forEach(meeting => {
      if (!meeting.status) {
        const [hours, minutes] = meeting.time.split(':').map(Number);
        const meetingTime = new Date(today);
        meetingTime.setHours(hours, minutes, 0, 0);
        
        const meetingEndTime = new Date(today);
        meetingEndTime.setHours(hours);
        meetingEndTime.setMinutes(minutes + meeting.duration);
        meetingEndTime.setSeconds(0);
        meetingEndTime.setMilliseconds(0);

        const now = new Date();
        
        // אם הפגישה מתרחשת כעת
        if (now >= meetingTime && now < meetingEndTime) {
          handleMeetingStatus(meeting._id, 'completed');
        }
      }
    });
  }, [todayMeetings.length]); // רק כשמספר הפגישות משתנה

  const getMeetingProgress = (meeting: TodayMeeting) => {
    // יצירת תאריך נוכחי
    const now = new Date();
    
    // יצירת תאריך הפגישה
    const [hours, minutes] = meeting.time.split(':').map(Number);
    const meetingTime = new Date(today);
    meetingTime.setHours(hours, minutes, 0, 0);
    
    const meetingEndTime = new Date(today);
    meetingEndTime.setHours(hours);
    meetingEndTime.setMinutes(minutes + meeting.duration);
    meetingEndTime.setSeconds(0);
    meetingEndTime.setMilliseconds(0);
    
    // אם הפגישה מתרחשת כעת
    if (now >= meetingTime && now < meetingEndTime) {
      return 'current';
    }

    // מצא את הפגישה הבאה בתור
    const nextMeeting = todayMeetings.find(nextMeeting => {
      const [nextHours, nextMinutes] = nextMeeting.time.split(':').map(Number);
      const nextMeetingTime = new Date(today);
      nextMeetingTime.setHours(nextHours, nextMinutes, 0, 0);
      return nextMeetingTime > now;
    });

    if (nextMeeting && nextMeeting._id === meeting._id) {
      return 'next';
    }

    return null;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5 text-blue-600" />;
      case 'phone':
        return <Phone className="h-5 w-5 text-blue-600" />;
      default:
        return <Users className="h-5 w-5 text-blue-600" />;
    }
  };
const StatusButton = ({ meetingId, slot }: { meetingId: string; slot: BookedSlot }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // בדיקה אם הפגישה התחילה
  const now = new Date();
  const [year, month, day] = slot.date.split('-').map(Number);
  const [hours, minutes] = slot.time.split(':').map(Number);
  const meetingTime = new Date(year, month - 1, day, hours, minutes);
  
  const hasStarted = now > meetingTime;

  // אם הפגישה לא התחילה, לא מציגים כלום
  if (!hasStarted) {
    return null;
  }

  // אם הפגישה התחילה, מציגים את הסטטוס
  const currentStatus = slot.status || 'completed';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`
            ${currentStatus === 'completed'
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
              : currentStatus === 'missed'
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}
            min-w-[100px] justify-center transition-all duration-200 hover:scale-[1.02]
          `}
        >
          {currentStatus === 'completed'
            ? 'התקיימה' 
            : currentStatus === 'missed'
            ? 'לא התקיימה'
            : 'התקיימה'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2" align="end">
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            className="justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:scale-[1.02] transition-all"
            onClick={() => {
              handleMeetingStatus(slot._id!, 'completed');
              setIsOpen(false);
            }}
          >
            התקיימה
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 hover:scale-[1.02] transition-all"
            onClick={() => {
              handleMeetingStatus(slot._id!, 'missed');
              setIsOpen(false);
            }}
          >
            לא התקיימה
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-96">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <div className="text-2xl font-semibold text-blue-600">
              טוען את לוח הבקרה שלך...
            </div>
            <div className="text-sm text-gray-500">
              אנא המתן בזמן שאנחנו טוענים את כל הנתונים
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

if (error) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-96">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-50 to-red-100 flex items-center justify-center">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-2xl font-semibold text-red-600">
              שגיאה בטעינת הנתונים
            </div>
            <div className="text-sm text-gray-500">
              {error}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

return (
  <div>
    <Head>
        <title>דף הבית | Meety</title>
      </Head>
      <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-transparent bg-clip-text">
            {getGreeting()}, {user?.fullName}
          </h2>
          <Button
            onClick={() => router.push('/new-meeting')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02] transition-all px-6"
          >
            <Plus className="h-5 w-5 ml-2" />
            פגישה חדשה
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card 
            className={`p-6 hover:scale-[1.02] transition-all duration-300 cursor-pointer ${
              selectedStatistic === 'planned' ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedStatistic(selectedStatistic === 'planned' ? null : 'planned')}
          >
            <div className="space-y-2 text-center">
              <h3 className="text-3xl font-bold text-gray-900">{totalPlannedMeetings}</h3>
              <p className="text-sm font-medium text-gray-600">סך הכל פגישות מתוכננות</p>
            </div>
          </Card>

          <Card 
            className={`p-6 hover:scale-[1.02] transition-all duration-300 cursor-pointer ${
              selectedStatistic === 'today' ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedStatistic(selectedStatistic === 'today' ? null : 'today')}
          >
            <div className="space-y-2 text-center">
              <h3 className="text-3xl font-bold text-gray-900">{todayMeetingsCount}</h3>
              <p className="text-sm font-medium text-gray-600">פגישות היום</p>
            </div>
          </Card>

          <Card 
            className={`p-6 hover:scale-[1.02] transition-all duration-300 cursor-pointer ${
              selectedStatistic === 'week' ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedStatistic(selectedStatistic === 'week' ? null : 'week')}
          >
            <div className="space-y-2 text-center">
              <h3 className="text-3xl font-bold text-gray-900">{thisWeekMeetings}</h3>
              <p className="text-sm font-medium text-gray-600">פגישות השבוע</p>
            </div>
          </Card>

          <Card 
            className={`p-6 hover:scale-[1.02] transition-all duration-300 cursor-pointer ${
              selectedStatistic === 'month' ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedStatistic(selectedStatistic === 'month' ? null : 'month')}
          >
            <div className="space-y-2 text-center">
              <h3 className="text-3xl font-bold text-gray-900">{thisMonthMeetings}</h3>
              <p className="text-sm font-medium text-gray-600">פגישות החודש</p>
            </div>
          </Card>
        </div>

        {/* Filtered Meetings */}
        {selectedStatistic && (
          <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
            <div className="p-6 bg-gradient-to-r from-blue-500/85 via-blue-600/85 to-blue-700/85">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{getStatisticTitle()}</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedStatistic(null)}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-5 w-5" />
                  חזרה
                </Button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {getFilteredMeetings().length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">אין פגישות להצגה</p>
                </div>
              ) : (
                getFilteredMeetings().map((meeting) => {
                  // Calculate end time
                  const [hours, minutes] = meeting.time.split(':').map(Number);
                  const endTime = new Date(today);
                  endTime.setHours(hours, minutes + meeting.duration);
                  const endTimeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

                  return (
                    <div key={meeting._id} className="p-6 hover:bg-blue-50/50 transition-all duration-300">
                      <div className="flex items-start gap-6">
                        <div className="w-40">
                          <div className="text-center px-3 py-2 rounded-xl bg-gradient-to-l from-blue-500/5 to-blue-600/5 border border-blue-100">
                            {/* תאריך */}
                            <div className="text-blue-700 font-medium mb-2">
                              {new Date(meeting.date).toLocaleDateString('he-IL', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                            {/* שעה */}
                            <div className="flex items-center justify-center gap-2 text-blue-700 font-medium">
                              <Clock className="h-4 w-4" />
                              <span>{endTimeStr} - {meeting.time}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{meeting.participant.fullName}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                {getTypeIcon(meeting.type)}
                                <span>{meeting.title}</span>
                              </div>
                            </div>
                            <StatusButton meetingId={meeting._id} slot={meeting} />
                          </div>

                          {/* פרטי קשר */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-gradient-to-l from-blue-500/5 to-blue-600/5 border border-blue-100">
                              <span className="text-base text-gray-700 truncate">{meeting.participant.email}</span>
                              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            </div>
                            <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-gradient-to-l from-blue-500/5 to-blue-600/5 border border-blue-100">
                              <span className="text-base text-gray-700 truncate">{meeting.participant.phone}</span>
                              <Phone className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Today's Schedule */}
        {!selectedStatistic && (
          <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
            <div className="p-6 bg-gradient-to-r from-blue-500/85 via-blue-600/85 to-blue-700/85">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">לוח פגישות להיום</h2>
                  <p className="text-blue-100">
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
                todayMeetings.map((meeting) => {
                  // Calculate end time
                  const [hours, minutes] = meeting.time.split(':').map(Number);
                  const endTime = new Date(today);
                  endTime.setHours(hours, minutes + meeting.duration);
                  const endTimeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

                  return (
                    <div key={meeting._id} className="p-6 hover:bg-blue-50/50 transition-all duration-300">
                      <div className="flex items-start gap-6">
                        <div className="w-40">
                          <div className="text-center px-3 py-2 rounded-xl bg-gradient-to-l from-blue-500/5 to-blue-600/5 border border-blue-100">
                            {/* שעה */}
                            <div className="flex items-center justify-center gap-2 text-blue-700 font-medium">
                              <Clock className="h-4 w-4" />
                              <span>{endTimeStr} - {meeting.time}</span>
                            </div>
                          
                            {/* סטטוס התקדמות */}
                            {getMeetingProgress(meeting) && (
                              <div className="mt-2">
                                <span className={`text-sm font-medium ${
                                  getMeetingProgress(meeting) === 'current'
                                  ? 'text-blue-700'
                                  : 'text-green-700'
                              }`}>
                                {getMeetingProgress(meeting) === 'current' ? 'מתרחש כעת' : 'הבא בתור'}
                              </span>
                            </div>
                          )}
                        </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{meeting.participant.fullName}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                {getTypeIcon(meeting.type)}
                                <span>{meeting.title}</span>
                              </div>
                            </div>
                            <StatusButton meetingId={meeting._id} slot={meeting} />
                          </div>

                          {/* פרטי קשר */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-gradient-to-l from-blue-500/5 to-blue-600/5 border border-blue-100">
                              <span className="text-base text-gray-700 truncate">{meeting.participant.email}</span>
                              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            </div>
                            <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-gradient-to-l from-blue-500/5 to-blue-600/5 border border-blue-100">
                              <span className="text-base text-gray-700 truncate">{meeting.participant.phone}</span>
                              <Phone className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            </div>
                          </div>
                        </div>

                        <div className="w-72">
                          <textarea
                            placeholder="הערות לפגישה..."
                            defaultValue={meeting.notes || ''}
                            onBlur={(e) => {
                              const newNotes = e.target.value;
                              if (newNotes !== meeting.notes) {
                                handleUpdateNotes(meeting._id, newNotes);
                              }
                            }}
                            className="w-full h-24 bg-transparent border-0 resize-none text-sm text-gray-600 placeholder-gray-400 focus:ring-0 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

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
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02] transition-all"
                >
                  <Plus className="h-5 w-5 ml-2" />
                  צור סוג פגישה ראשון
                </Button>
              </Card>
            ) : (
              meetings.map((meeting) => (
                <Card
                  key={meeting._id}
                  className={`overflow-hidden bg-white/90 backdrop-blur-sm border-blue-100/50 transition-all duration-300 ${
                    editingStatus === meeting._id 
                      ? 'scale-[1.02] shadow-lg' 
                      : 'hover:scale-[1.02] hover:shadow-lg'
                  } relative group`}
                >
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-center relative">
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
                      <DropdownMenu onOpenChange={(open) => {
                        if (open) {
                          setEditingStatus(meeting._id!);
                        } else {
                          setEditingStatus(null);
                        }
                      }}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-gray-600 rounded-full hover:scale-[1.02] transition-all duration-200 absolute top-2 left-2 focus:outline-none focus:bg-transparent active:bg-transparent focus-visible:ring-0 data-[state=open]:bg-transparent"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end" 
                          side="top"
                          className="min-w-fit"
                        >
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
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02] transition-all py-6 mt-6"
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
