import { useState, useEffect } from 'react';
import { Clock, Users, Video, Phone, Calendar, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Card, CardContent } from '../components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { getUserMeetings, updateMeetingSlotStatus } from '../services/api';
import { Meeting } from '../types/meeting';
import Head from 'next/head';
import { useToast } from '../components/ui/use-toast';
import { withAuth, useAuth } from '../lib/auth';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { MonthTransition } from '../components/MonthTransition';

type MeetingSlot = Meeting['bookedSlots'][0];
type MeetingStatus = 'completed' | 'missed' | 'pending';
type HistoryStatus = 'completed' | 'missed';
type ViewMode = 'list' | 'calendar';

const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const hebrewMonths = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

const tabVariants: Variants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.15
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.1
    }
  }
};

function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [historyTab, setHistoryTab] = useState<HistoryStatus>('completed');
  const [direction, setDirection] = useState(0);
  const [showAllFutureMeetings, setShowAllFutureMeetings] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Helper function to adjust date for timezone
  const adjustDateForTimezone = (dateStr: string): Date => {
    const date = new Date(dateStr);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  };

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        if (!user) return;
        
        const { meetings } = await getUserMeetings();
        const now = new Date();
        
        // עדכון סטטוס אוטומטי לפגישות ישנות
        const updatedMeetings = meetings.map(meeting => ({
          ...meeting,
          bookedSlots: meeting.bookedSlots?.map(slot => {
            const slotDate = new Date(`${slot.date}T${slot.time}`);
            if (slotDate.getTime() <= now.getTime() && !slot.status) {
              return { ...slot, status: 'completed' as const };
            }
            return slot;
          })
        }));
        
        setMeetings(updatedMeetings);
      } catch (error) {
        console.error('Error fetching meetings:', error);
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: "לא הצלחנו לטעון את הפגישות"
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMeetings();
    }
  }, [toast, user]);

  const handleStatusUpdate = async (meetingId: string, slotId: string, status: HistoryStatus) => {
    try {
      const response = await updateMeetingSlotStatus(meetingId, slotId, status);
      if (response.meeting) {
        const { meetings: updatedMeetings } = await getUserMeetings();
        setMeetings(updatedMeetings);
        setHistoryTab(status);
        toast({
          title: "הצלחה",
          description: status === 'completed' ? "הפגישה סומנה כהתקיימה" : "הפגישה סומנה כלא התקיימה",
        });
      }
    } catch (error) {
      console.error('Error updating meeting status:', error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "לא הצלחנו לעדכן את סטטוס הפגישה",
      });
    }
  };

  const getMeetingsForDate = (date: Date): Meeting[] => {
    return meetings.filter(meeting => {
      if (!meeting.bookedSlots?.length) return false;
      return meeting.bookedSlots.some(slot => {
        const slotDate = adjustDateForTimezone(slot.date);
        return slotDate.getFullYear() === date.getFullYear() &&
               slotDate.getMonth() === date.getMonth() &&
               slotDate.getDate() === date.getDate();
      });
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const getParticipantInitial = (name: string): string => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const getDaysInMonth = (date: Date): { daysInMonth: number; startingDay: number; totalDays: number } => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const totalDays = Math.ceil((daysInMonth + startingDay) / 7) * 7;
    return { daysInMonth, startingDay, totalDays };
  };

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long'
    };
    return date.toLocaleDateString('he-IL', options);
  };

  const getFutureMeetings = (): MeetingSlot[] => {
    const now = new Date();
    const allFutureMeetings = meetings.flatMap(meeting =>
      (meeting.bookedSlots || [])
        .filter(slot => {
          const slotDate = new Date(`${slot.date}T${slot.time}`);
          return slotDate.getTime() > now.getTime();
        })
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`).getTime();
          const dateB = new Date(`${b.date}T${b.time}`).getTime();
          return dateA - dateB;
        })
    );

    return showAllFutureMeetings ? allFutureMeetings : allFutureMeetings.slice(0, 5);
  };

  const getPastMeetings = (status: HistoryStatus): MeetingSlot[] => {
    const now = new Date();
    return meetings.flatMap(meeting =>
      (meeting.bookedSlots || [])
        .filter(slot => {
          const slotDate = new Date(`${slot.date}T${slot.time}`);
          if (slotDate.getTime() <= now.getTime()) {
            const effectiveStatus = slot.status || 'completed';
            return effectiveStatus === status;
          }
          return false;
        })
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`).getTime();
          const dateB = new Date(`${b.date}T${b.time}`).getTime();
          return dateB - dateA;
        })
    );
  };

  const StatusButton = ({ meeting, slot }: { meeting: Meeting; slot: MeetingSlot }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isPastMeeting = new Date(`${slot.date}T${slot.time}`).getTime() < new Date().getTime();
    const currentStatus = slot.status || (isPastMeeting ? 'completed' : 'pending');

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
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
              min-w-[100px] justify-center transition-all duration-200
            `}
          >
            {currentStatus === 'completed' 
              ? 'התקיימה' 
              : currentStatus === 'missed'
              ? 'לא התקיימה'
              : 'עדכן סטטוס'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-2" align="end">
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              className="justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => {
                handleStatusUpdate(meeting._id!, slot._id!, 'completed');
                setIsOpen(false);
              }}
            >
              התקיימה
            </Button>
            <Button
              variant="ghost"
              className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                handleStatusUpdate(meeting._id!, slot._id!, 'missed');
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

  const MeetingCard = ({ meeting, slot, index }: { meeting: Meeting; slot: MeetingSlot; index: number }) => {
    const isPastMeeting = new Date(`${slot.date}T${slot.time}`).getTime() < new Date().getTime();
    
    return (
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex flex-row-reverse gap-4">
            {/* Icon Section */}
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center shadow-md
              ${meeting.type === 'video' ? 'bg-blue-500' : 
                meeting.type === 'phone' ? 'bg-green-500' : 'bg-purple-500'}
            `}>
              {meeting.type === 'video' ? (
                <Video className="h-4 w-4 text-white" />
              ) : meeting.type === 'phone' ? (
                <Phone className="h-4 w-4 text-white" />
              ) : (
                <Users className="h-4 w-4 text-white" />
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1">
              {/* Title and Duration */}
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-gray-900">{meeting.title}</h3>
                <div className="text-sm text-gray-500">
                  {meeting.duration} דקות
                </div>
              </div>

              {/* Participant Section */}
              {slot.participant?.fullName && (
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 
                    flex items-center justify-center text-white text-sm font-semibold">
                    {getParticipantInitial(slot.participant.fullName)}
                  </div>
                  <div className="text-base font-medium text-gray-700">
                    {slot.participant.fullName}
                  </div>
                </div>
              )}

              {/* Date, Time and Status */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                    {formatDate(adjustDateForTimezone(slot.date))}
                  </div>
                  <div className="text-gray-600 text-sm flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {slot.time}
                  </div>
                </div>

                {/* Status Button */}
                {isPastMeeting && <StatusButton meeting={meeting} slot={slot} />}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const SelectedDayMeetings = ({ date, onClose }: { date: Date; onClose: () => void }) => {
    const dayMeetings = getMeetingsForDate(date);

    return (
      <Dialog open onOpenChange={() => onClose()}>
        <DialogContent className="max-w-3xl" dir="rtl" hideCloseButton>
          <DialogHeader className="pb-6 border-b">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-l from-blue-600 to-blue-700 text-transparent bg-clip-text">
              פגישות ליום {formatDate(date)}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4 hover:bg-gray-100 rounded-full"
              onClick={() => onClose()}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            {dayMeetings.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-xl text-gray-500">אין פגישות מתוכננות ליום זה</div>
              </div>
            ) : (
              dayMeetings.map((meeting) =>
                meeting.bookedSlots?.map((slot, index) => (
                  <MeetingCard key={`${meeting._id}-${index}`} meeting={meeting} slot={slot} index={index} />
                ))
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold text-blue-600">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Head>
        <title>הפגישות שלי | Meety</title>
      </Head>
      <div dir="rtl" className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-l from-blue-600 to-blue-700 text-transparent bg-clip-text">
              הפגישות שלי
            </h1>
            <Button
              onClick={() => {
                setDirection(viewMode === 'list' ? 1 : -1);
                setViewMode(viewMode === 'list' ? 'calendar' : 'list');
              }}
              className="bg-gradient-to-l from-blue-600 to-blue-700 text-white hover:opacity-90"
            >
              {viewMode === 'list' ? (
                <>
                  <Calendar className="h-5 w-5 ml-2" />
                  תצוגת יומן
                </>
              ) : (
                <>
                  <Users className="h-5 w-5 ml-2" />
                  תצוגת רשימה
                </>
              )}
            </Button>
          </div>

          {/* Content */}
          <div className="relative" style={{ minHeight: '500px' }}>
            <MonthTransition key={viewMode} direction={direction}>
              {viewMode === 'list' ? (
                <div className="space-y-8">
                  {/* Future Meetings */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900">פגישות מתוכננות</h2>
                    <div className="min-h-[200px]">
                      {getFutureMeetings().length === 0 ? (
                        <Card>
                          <CardContent className="p-12 text-center">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <div className="text-xl text-gray-500">אין פגישות מתוכננות</div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {getFutureMeetings().map((slot, index) => {
                            const meeting = meetings.find(m => m.bookedSlots?.some(s => s._id === slot._id));
                            if (!meeting) return null;
                            return <MeetingCard key={index} meeting={meeting} slot={slot} index={index} />;
                          })}
                          
                          {/* Show More Button */}
                          {meetings.flatMap(m => m.bookedSlots || []).filter(slot => {
                            const slotDate = new Date(`${slot.date}T${slot.time}`);
                            return slotDate.getTime() > new Date().getTime();
                          }).length > 5 && (
                            <Button
                              variant="outline"
                              className="w-full mt-4"
                              onClick={() => setShowAllFutureMeetings(!showAllFutureMeetings)}
                            >
                              <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${showAllFutureMeetings ? 'rotate-180' : ''}`} />
                              {showAllFutureMeetings ? 'הצג פחות' : 'הצג הכל'}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Past Meetings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">היסטוריית פגישות</h2>
                      <div className="flex gap-2">
                        <Button
                          variant={historyTab === 'completed' ? 'default' : 'outline'}
                          onClick={() => setHistoryTab('completed')}
                          className={`
                            transition-all duration-200
                            ${historyTab === 'completed' 
                              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                              : 'hover:bg-blue-50'}
                          `}
                        >
                          פגישות שהתקיימו
                        </Button>
                        <Button
                          variant={historyTab === 'missed' ? 'default' : 'outline'}
                          onClick={() => setHistoryTab('missed')}
                          className={`
                            transition-all duration-200
                            ${historyTab === 'missed' 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'hover:bg-red-50'}
                          `}
                        >
                          פגישות שלא התקיימו
                        </Button>
                      </div>
                    </div>

                    <div className="min-h-[200px]">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={historyTab}
                          variants={tabVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="w-full"
                        >
                          {getPastMeetings(historyTab).length === 0 ? (
                            <Card>
                              <CardContent className="p-12 text-center">
                                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <div className="text-xl text-gray-500">
                                  {historyTab === 'completed' 
                                    ? 'אין פגישות שהתקיימו' 
                                    : 'אין פגישות שלא התקיימו'}
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <div className="space-y-4">
                              {getPastMeetings(historyTab).map((slot, index) => {
                                const meeting = meetings.find(m => m.bookedSlots?.some(s => s._id === slot._id));
                                if (!meeting) return null;
                                return <MeetingCard key={index} meeting={meeting} slot={slot} index={index} />;
                              })}
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    {/* Calendar Header */}
                    <div className="p-6 flex justify-between items-center border-b border-gray-100">
                      <h2 className="text-2xl font-semibold bg-gradient-to-l from-blue-600 to-blue-700 text-transparent bg-clip-text">
                        {hebrewMonths[currentDate.getMonth()]} {currentDate.getFullYear()}
                      </h2>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            const newDate = new Date(currentDate);
                            newDate.setMonth(currentDate.getMonth() - 1);
                            setCurrentDate(newDate);
                          }}
                          className="hover:bg-blue-50 text-blue-600"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            const newDate = new Date(currentDate);
                            newDate.setMonth(currentDate.getMonth() + 1);
                            setCurrentDate(newDate);
                          }}
                          className="hover:bg-blue-50 text-blue-600"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 border-b border-gray-100">
                      {hebrewDays.map((day) => (
                        <div key={day} className="p-4 font-medium text-blue-600 text-center">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-px bg-gray-100">
                      {Array(getDaysInMonth(currentDate).totalDays).fill(null).map((_, index) => {
                        const dayNumber = index - getDaysInMonth(currentDate).startingDay + 1;
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
                        const isCurrentMonth = dayNumber > 0 && dayNumber <= getDaysInMonth(currentDate).daysInMonth;

                        if (!isCurrentMonth) return <div key={index} className="bg-white min-h-32" />;

                        const todayMeetings = getMeetingsForDate(date);
                        const today = isToday(date);

                        return (
                          <div
                            key={index}
                            onClick={() => setSelectedDate(date)}
                            className={`bg-white p-3 min-h-32 cursor-pointer hover:bg-blue-50/50 transition-colors ${
                              today ? 'ring-2 ring-inset ring-blue-500' : ''
                            }`}
                          >
                            <div className={`font-medium mb-2 ${today ? 'text-blue-600' : 'text-gray-600'}`}>
                              {dayNumber}
                            </div>
                            <div className="space-y-1.5">
                              {todayMeetings.map((meeting) =>
                                meeting.bookedSlots?.map((slot, slotIndex) => (
                                  <div
                                    key={`${meeting._id}-${slotIndex}`}
                                    className={`
                                      p-2 rounded-lg hover:opacity-90 transition-opacity text-white
                                      ${meeting.type === 'video' ? 'bg-blue-500' : 
                                        meeting.type === 'phone' ? 'bg-green-500' : 'bg-purple-500'}
                                    `}
                                  >
                                    <div className="font-medium truncate text-sm">{meeting.title}</div>
                                    {slot.participant?.fullName && (
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <div className="w-4 h-4 rounded bg-white/20 flex items-center justify-center text-xs font-semibold">
                                          {getParticipantInitial(slot.participant.fullName)}
                                        </div>
                                        <div className="text-xs truncate font-medium">
                                          {slot.participant.fullName}
                                        </div>
                                      </div>
                                    )}
                                    <div className="text-xs mt-1 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {slot.time}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </MonthTransition>
          </div>

          {selectedDate && (
            <SelectedDayMeetings 
              date={selectedDate} 
              onClose={() => setSelectedDate(null)} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(MeetingsPage);
