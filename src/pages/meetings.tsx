import React from 'react';
import { withAuth } from '../lib/auth';
import { useAuth } from '../lib/auth';
import { useEffect, useState } from 'react';
import { getUserMeetings, updateMeetingSlotStatus, deleteBookedSlot } from '../services/api';
import { Meeting, BookedSlot, ExtendedBookedSlot } from '../types/meeting';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { 
  Clock, 
  Users, 
  Video, 
  Phone, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ChevronDown, 
  Plus, 
  MoreVertical, 
  Pencil,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useToast } from '../components/ui/use-toast';
import { AnimatePresence, motion, Variants } from 'framer-motion';

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
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

interface StatusButtonProps {
  meetingId: string;
  slot: BookedSlot;
  onStatusUpdate: (meetingId: string, slotId: string, status: HistoryStatus) => Promise<void>;
}

const StatusButton: React.FC<StatusButtonProps> = ({ meetingId, slot, onStatusUpdate }) => {
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
            min-w-[100px] justify-center transition-all duration-200 hover:scale-[1.02]
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
            className="justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:scale-[1.02] transition-all"
            onClick={() => {
              onStatusUpdate(meetingId, slot._id!, 'completed');
              setIsOpen(false);
            }}
          >
            התקיימה
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 hover:scale-[1.02] transition-all"
            onClick={() => {
              onStatusUpdate(meetingId, slot._id!, 'missed');
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

interface MeetingCardProps {
  slot: ExtendedBookedSlot;
  index: number;
  onStatusUpdate: (meetingId: string, slotId: string, status: HistoryStatus) => Promise<void>;
  onDelete: (meetingId: string, slotId: string) => Promise<void>;
}

const MeetingCard: React.FC<MeetingCardProps> = ({ slot, index, onStatusUpdate, onDelete }) => {
  const router = useRouter();
  const isPastMeeting = new Date(`${slot.date}T${slot.time}`).getTime() < new Date().getTime();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  return (
    <>
      <Card className={`${isDropdownOpen ? 'shadow-lg scale-[1.02]' : 'hover:shadow-lg hover:scale-[1.02]'} transition-all duration-300`}>
        <CardContent className="p-6">
          <div className="flex justify-between">
            {/* Right Side: Icon and Content */}
            <div className="flex gap-4 flex-1">
              {/* Icon Section */}
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center shadow-md
                ${slot.type === 'video' ? 'bg-blue-500' : 
                  slot.type === 'phone' ? 'bg-green-500' : 'bg-purple-500'}
              `}>
                {slot.type === 'video' ? (
                  <Video className="h-4 w-4 text-white" />
                ) : slot.type === 'phone' ? (
                  <Phone className="h-4 w-4 text-white" />
                ) : (
                  <Users className="h-4 w-4 text-white" />
                )}
              </div>

              {/* Content Section */}
              <div className="flex-1">
                {/* Title and Duration */}
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-900">
                    {slot.participant?.fullName || "No participant"}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {slot.duration} דקות
                  </div>
                </div>

                {/* Meeting Type Section */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                    {slot.title}
                  </div>
                </div>

                {/* Date, Time and Status */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                      {new Date(slot.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <div className="text-gray-600 text-sm flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {slot.time}
                    </div>
                  </div>

                  {/* Status Button */}
                  {isPastMeeting && (
                    <StatusButton 
                      meetingId={slot.meetingId} 
                      slot={slot} 
                      onStatusUpdate={onStatusUpdate}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Left Side: Actions Menu */}
            <div className="mr-4">
              <DropdownMenu onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-gray-100 rounded-full hover:scale-[1.02] transition-all"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => router.push(`/meeting/edit/${slot._id}?meetingId=${slot.meetingId}`)}
                    className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                    <span>ערוך</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>מחק</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-r from-red-50 to-red-100 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              מחיקת פגישה
            </DialogTitle>
            <DialogDescription className="text-center mt-2">
              האם אתה בטוח שברצונך למחוק את הפגישה?
              <br />
              פעולה זו לא ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 pt-4">
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(slot.meetingId, slot._id!);
                setShowDeleteDialog(false);
              }}
              className="flex-1 p-6 text-lg hover:scale-[1.02] transition-all"
            >
              מחק
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1 p-6 text-lg hover:bg-gray-50 hover:scale-[1.02] transition-all"
            >
              ביטול
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface SelectedDayMeetingsProps {
  date: Date;
  onClose: () => void;
  meetings: Meeting[];
  onStatusUpdate: (meetingId: string, slotId: string, status: HistoryStatus) => Promise<void>;
  onDelete: (meetingId: string, slotId: string) => Promise<void>;
}

const SelectedDayMeetings: React.FC<SelectedDayMeetingsProps> = ({ 
  date, 
  onClose, 
  meetings, 
  onStatusUpdate,
  onDelete 
}) => {
  const dayMeetings = meetings.filter(meeting => {
    if (!meeting.bookedSlots?.length) return false;
    return meeting.bookedSlots.some(slot => {
      const slotDate = new Date(slot.date);
      return slotDate.getFullYear() === date.getFullYear() &&
             slotDate.getMonth() === date.getMonth() &&
             slotDate.getDate() === date.getDate();
    });
  });

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl" dir="rtl" hideCloseButton>
        <DialogHeader className="pb-6 border-b">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-l from-blue-600 to-blue-700 text-transparent bg-clip-text">
            פגישות ליום {date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4 hover:bg-gray-100 rounded-full hover:scale-[1.02] transition-all"
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
              meeting.bookedSlots?.map((slot, index) => {
                const slotDate = new Date(slot.date);
                if (slotDate.getDate() !== date.getDate()) return null;

                return (
                  <MeetingCard 
                    key={`${meeting._id}-${index}`} 
                    slot={{
                      ...slot,
                      meetingId: meeting._id!,
                      title: meeting.title,
                      type: meeting.type,
                      duration: meeting.duration
                    }} 
                    index={index} 
                    onStatusUpdate={onStatusUpdate}
                    onDelete={onDelete}
                  />
                );
              })
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [historyTab, setHistoryTab] = useState<HistoryStatus>('completed');
  const [showAllFutureMeetings, setShowAllFutureMeetings] = useState(false);
  const [showAllPastMeetings, setShowAllPastMeetings] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const adjustDateForTimezone = (dateStr: string): Date => {
    const date = new Date(dateStr);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  };

  const getParticipantInitial = (name: string): string => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
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

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        if (!user) return;
        
        const { meetings: fetchedMeetings } = await getUserMeetings();
        
        // מיון הפגישות לפי תאריך ושעה כבר בטעינה
        const sortedMeetings = fetchedMeetings.map(meeting => ({
          ...meeting,
          bookedSlots: [...(meeting.bookedSlots || [])].sort((a, b) => {
            // Sort by date first, then by time
            const dateCompare = a.date.localeCompare(b.date);
            return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
          })
        }));

        setMeetings(sortedMeetings);
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
        // עדכון מיידי של הסטטוס
        setMeetings(meetings.map(m => {
          if (m._id === meetingId) {
            const updatedSlots = m.bookedSlots.map(slot => {
              if (slot._id === slotId) {
                return { ...slot, status };
              }
              return slot;
            }).sort((a, b) => {
              // Sort by date first, then by time
              const dateCompare = a.date.localeCompare(b.date);
              return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
            });
            return { ...m, bookedSlots: updatedSlots };
          }
          return m;
        }));

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

  const handleDeleteSlot = async (meetingId: string, slotId: string) => {
    try {
      await deleteBookedSlot(meetingId, slotId);
      toast({
        title: "הפגישה נמחקה בהצלחה",
        description: "הפגישה הוסרה מהמערכת",
      });
      // רענון הדף לאחר מחיקה
      window.location.reload();
    } catch (error) {
      console.error('Error deleting meeting slot:', error);
      toast({
        variant: "destructive",
        title: "שגיאה במחיקת הפגישה",
        description: "אנא נסה שוב מאוחר יותר",
      });
    }
  };

  const getFutureMeetings = (): ExtendedBookedSlot[] => {
    const now = new Date();
    
    const allFutureMeetings = meetings.flatMap(meeting =>
      (meeting.bookedSlots || [])
        .filter(slot => {
          const [year, month, day] = slot.date.split('-').map(Number);
          const [hours, minutes] = slot.time.split(':').map(Number);
          const slotDateTime = new Date(year, month - 1, day, hours, minutes);
          
          return slotDateTime > now && (!slot.status || slotDateTime > now);
        })
        .map(slot => ({
          ...slot,
          status: undefined,
          meetingId: meeting._id!,
          title: meeting.title,
          type: meeting.type,
          duration: meeting.duration
        }))
    ).sort((a, b) => {
      // Sort by date first, then by time
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
    });

    return showAllFutureMeetings ? allFutureMeetings : allFutureMeetings.slice(0, 3);
  };

  const getPastMeetings = (status: HistoryStatus): ExtendedBookedSlot[] => {
    const now = new Date();
    
    const allPastMeetings = meetings.flatMap(meeting =>
      (meeting.bookedSlots || [])
        .filter(slot => {
          const [year, month, day] = slot.date.split('-').map(Number);
          const [hours, minutes] = slot.time.split(':').map(Number);
          const slotDateTime = new Date(year, month - 1, day, hours, minutes);
          
          if (slotDateTime <= now) {
            if (slot.status) {
              return slot.status === status;
            }
            return status === 'completed';
          }
          return false;
        })
        .map(slot => ({
          ...slot,
          status: slot.status || 'completed',
          meetingId: meeting._id!,
          title: meeting.title,
          type: meeting.type,
          duration: meeting.duration
        }))
    ).sort((a, b) => {
      // Sort by date first, then by time
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
    });

    return showAllPastMeetings ? allPastMeetings : allPastMeetings.slice(0, 3);
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
      <div dir="rtl" className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-l from-blue-600 to-blue-700 text-transparent bg-clip-text">
              הפגישות שלי
            </h1>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setViewMode(viewMode === 'list' ? 'calendar' : 'list');
                }}
                variant="outline"
                className="bg-white hover:bg-blue-50 hover:scale-[1.02] transition-all"
              >
                {viewMode === 'list' ? (
                  <>
                    <Calendar className="h-4 w-4 ml-2" />
                    תצוגת יומן
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 ml-2" />
                    תצוגת רשימה
                  </>
                )}
              </Button>
              <Button
                onClick={() => router.push('/new-single-meeting')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02] transition-all"
              >
                <Plus className="h-5 w-5 ml-2" />
                פגישה חדשה
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="relative" style={{ minHeight: '500px' }}>
            <div className="w-full">
              {viewMode === 'list' ? (
                <div className="space-y-16">
                  {/* Future Meetings */}
                  <div className="space-y-8">
                    <h2 className="text-xl font-semibold text-gray-900">פגישות מתוכננות</h2>
                    <div className="min-h-[200px]">
                      {getFutureMeetings().length === 0 ? (
                        <Card className="hover:scale-[1.02] transition-all duration-300">
                          <CardContent className="p-12 text-center">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <div className="text-xl text-gray-500">אין פגישות מתוכננות</div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-8">
                          {getFutureMeetings().map((slot, index) => (
                            <MeetingCard 
                              key={index} 
                              slot={slot} 
                              index={index} 
                              onStatusUpdate={handleStatusUpdate}
                              onDelete={handleDeleteSlot}
                            />
                          ))}
                          
                          {/* Show More Button for Future Meetings */}
                          {meetings.flatMap(m => m.bookedSlots || []).filter(slot => {
                            const slotDate = new Date(`${slot.date}T${slot.time}`);
                            return slotDate.getTime() > new Date().getTime();
                          }).length > 3 && (
                            <Button
                              variant="outline"
                              className="w-full mt-8 hover:scale-[1.02] transition-all"
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
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">היסטוריית פגישות</h2>
                      <div className="flex gap-2">
                        <Button
                          variant={historyTab === 'completed' ? 'default' : 'outline'}
                          onClick={() => setHistoryTab('completed')}
                          className={`
                            transition-all duration-200 hover:scale-[1.02]
                            ${historyTab === 'completed' 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' 
                              : 'hover:bg-blue-50'}
                          `}
                        >
                          פגישות שהתקיימו
                        </Button>
                        <Button
                          variant={historyTab === 'missed' ? 'default' : 'outline'}
                          onClick={() => setHistoryTab('missed')}
                          className={`
                            transition-all duration-200 hover:scale-[1.02]
                            ${historyTab === 'missed' 
                              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white' 
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
                            <Card className="hover:scale-[1.02] transition-all duration-300">
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
                            <div className="space-y-8">{getPastMeetings(historyTab).map((slot, index) => (
  <MeetingCard 
    key={index} 
    slot={slot} 
    index={index} 
    onStatusUpdate={handleStatusUpdate}
    onDelete={handleDeleteSlot}  // Add this line
  />
))}

                              {/* Show More Button for Past Meetings */}
                              {meetings.flatMap(m => m.bookedSlots || []).filter(slot => {
                                const slotDate = new Date(`${slot.date}T${slot.time}`);
                                return slotDate.getTime() <= new Date().getTime() && 
                                  (slot.status === historyTab || (!slot.status && historyTab === 'completed'));
                              }).length > 3 && (
                                <Button
                                  variant="outline"
                                  className="w-full mt-8 hover:scale-[1.02] transition-all"
                                  onClick={() => setShowAllPastMeetings(!showAllPastMeetings)}
                                >
                                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${showAllPastMeetings ? 'rotate-180' : ''}`} />
                                  {showAllPastMeetings ? 'הצג פחות' : 'הצג הכל'}
                                </Button>
                              )}
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              ) : (
                <Card className="overflow-hidden">
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
                          className="hover:bg-blue-50 text-blue-600 hover:scale-[1.02] transition-all"
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
                          className="hover:bg-blue-50 text-blue-600 hover:scale-[1.02] transition-all"
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

                          const todayMeetings = meetings.filter(meeting => {
                            if (!meeting.bookedSlots?.length) return false;
                            return meeting.bookedSlots.some(slot => {
                              const slotDate = new Date(slot.date);
                              return slotDate.getFullYear() === date.getFullYear() &&
                                     slotDate.getMonth() === date.getMonth() &&
                                     slotDate.getDate() === date.getDate();
                            });
                          });
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
                              </div><div className="space-y-1.5">
  {todayMeetings.map((meeting) =>
    meeting.bookedSlots?.map((slot, slotIndex) => {
      const slotDate = adjustDateForTimezone(slot.date);
      if (slotDate.getDate() !== date.getDate()) return null;
      
      return (
        <div
          key={`${meeting._id}-${slotIndex}`}
          className={`
            p-2 rounded-lg hover:opacity-90 transition-opacity text-white
            ${meeting.type === 'video' ? 'bg-blue-500' : 
              meeting.type === 'phone' ? 'bg-green-500' : 'bg-purple-500'}
          `}
        >
          {slot.participant?.fullName && (
            <div className="font-medium truncate text-sm">
              {slot.participant.fullName}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <div className="bg-white/20 text-white px-2 py-0.5 rounded text-xs font-medium">
              {meeting.title}
            </div>
          </div>
          <div className="text-xs mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {slot.time}
          </div>
        </div>
      );
    })
  )}
</div>

</div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

            </div>
          </div>
{selectedDate && (
  <SelectedDayMeetings 
    date={selectedDate} 
    onClose={() => setSelectedDate(null)}
    meetings={meetings}
    onStatusUpdate={handleStatusUpdate}
    onDelete={handleDeleteSlot}  // Add this line
  />
)}

</div>
      </div>
    </div>
  );
}

export default withAuth(MeetingsPage);




