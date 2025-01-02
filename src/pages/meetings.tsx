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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '../components/ui/dialog';
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
  Trash2,
  RotateCcw,
  Mail
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useToast } from '../components/ui/use-toast';
import { AnimatePresence, motion, Variants } from 'framer-motion';

type MeetingStatus = 'completed' | 'missed' | 'pending' | 'deleted';
type HistoryStatus = 'completed' | 'missed' | 'deleted' | 'pending';
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
  const currentStatus = slot.status || 'completed';

  return (
    <div className="relative z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`
              ${currentStatus === 'missed' 
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}
              min-w-[100px] justify-center transition-all duration-200 hover:scale-[1.02]
              shadow-sm hover:shadow-md
            `}
          >
            {currentStatus === 'missed' ? 'לא התקיימה' : 'התקיימה'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-2" align="end">
          <div className="flex flex-col gap-2">
            {currentStatus === 'missed' ? (
              <Button
                variant="ghost"
                className="justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:scale-[1.02] transition-all"
                onClick={() => {
                  onStatusUpdate(meetingId, slot._id!, 'completed');
                  setIsOpen(false);
                }}
              >
                סמן כהתקיימה
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 hover:scale-[1.02] transition-all"
                onClick={() => {
                  onStatusUpdate(meetingId, slot._id!, 'missed');
                  setIsOpen(false);
                }}
              >
                סמן כלא התקיימה
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
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
  const isPastMeeting = React.useMemo(() => {
    const now = new Date();
    const [year, month, day] = slot.date.split('-').map(Number);
    const [hours, minutes] = slot.time.split(':').map(Number);
    const slotDateTime = new Date(year, month - 1, day, hours, minutes);
    const slotEndDateTime = new Date(slotDateTime.getTime() + (slot.duration * 60 * 1000));
    const isEnded = slotEndDateTime <= now;
    
    // אם הפגישה הסתיימה ואין לה סטטוס, נסמן אותה כהתקיימה
    if (isEnded && !slot.status) {
      onStatusUpdate(slot.meetingId, slot._id!, 'completed');
    }
    
    return isEnded;
  }, [slot, onStatusUpdate]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  return (
    <>
      <Card className={`hover:shadow-lg hover:scale-[1.02] ${isDropdownOpen ? 'shadow-lg scale-[1.02]' : ''} transition-all duration-300`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Date and Time Badge */}
            <div className="w-40">
              <div className="text-center px-3 py-2 rounded-xl bg-gradient-to-l from-blue-500/5 to-blue-600/5 border border-blue-100">
                {/* תאריך */}
                <div className="text-blue-700 font-medium mb-2">
                  {new Date(slot.date).toLocaleDateString('he-IL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
                {/* שעה */}
                <div className="flex items-center justify-center gap-2 text-blue-700 font-medium">
                  <Clock className="h-4 w-4" />
                  <span>{slot.time}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
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
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{slot.participant?.fullName || "אין משתתף"}</h3>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {slot.title}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    {slot.duration} דקות
                  </div>
                  {isPastMeeting && (
                    <StatusButton 
                      meetingId={slot.meetingId} 
                      slot={slot} 
                      onStatusUpdate={onStatusUpdate}
                    />
                  )}
                  <DropdownMenu onOpenChange={setIsDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-transparent rounded-full hover:scale-[1.02] transition-all focus:outline-none focus:bg-transparent active:bg-transparent focus-visible:ring-0 data-[state=open]:bg-transparent"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="text-right">
                      <DropdownMenuItem
                        onClick={() => router.push(`/meeting/edit/${slot._id}?meetingId=${slot.meetingId}`)}
                                                  className="flex items-center justify-end gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                        <span>ערוך</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                                                  className="flex items-center justify-end gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>מחק</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-gradient-to-l from-blue-500/5 to-blue-600/5 border border-blue-100">
                  <span className="text-base text-gray-700 truncate">{slot.participant?.email}</span>
                  <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
                </div>
                <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-gradient-to-l from-blue-500/5 to-blue-600/5 border border-blue-100">
                  <span className="text-base text-gray-700 truncate">{slot.participant?.phone}</span>
                  <Phone className="h-5 w-5 text-blue-600 flex-shrink-0" />
                </div>
              </div>
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
              onClick={async () => {
                await onDelete(slot.meetingId, slot._id!);
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
  const router = useRouter();
  const dayMeetings = meetings.filter(meeting => {
    if (!meeting.bookedSlots?.length) return false;
    return meeting.bookedSlots.some(slot => {
      if (slot.status === 'deleted') return false;
      
      const [year, month, day] = slot.date.split('-').map(Number);
      const slotDate = new Date(year, month - 1, day);
      return slotDate.getFullYear() === date.getFullYear() &&
             slotDate.getMonth() === date.getMonth() &&
             slotDate.getDate() === date.getDate();
    });
  });

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
        <DialogContent className="bg-white overflow-hidden animate-in fade-in-0 shadow-2xl rounded-2xl w-[800px] max-h-[90vh]" dir="rtl" hideCloseButton>
          {/* Header */}
          <div className="bg-white border-b border-gray-100">
            <DialogHeader className="py-6 px-6">
              <div className="flex flex-col items-center text-center relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-4 shadow-inner">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <DialogTitle className="text-center text-[2.5rem] font-bold bg-gradient-to-l from-blue-600 to-blue-700 text-transparent bg-clip-text tracking-tight leading-tight mb-3">
                  פגישות ליום {hebrewDays[date.getDay()]}
                </DialogTitle>
                <div className="text-gray-600 flex items-center gap-2 text-xl font-medium">
                  {date.getDate()} ב{hebrewMonths[date.getMonth()]} {date.getFullYear()}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 left-0 hover:bg-gray-100 rounded-full hover:scale-[1.02] transition-all w-12 h-12"
                  onClick={() => onClose()}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
            <div className="py-6 px-6">
              {/* Empty State */}
              {dayMeetings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-inner">
                    <Calendar className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="text-2xl font-semibold text-gray-700 mb-2">אין פגישות מתוכננות ליום זה</div>
                  <div className="text-base text-gray-500">נסה לבחור תאריך אחר או צור פגישה חדשה</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Timeline */}
                  {dayMeetings.flatMap(meeting =>
                    meeting.bookedSlots
                      ?.filter(slot => slot.status !== 'deleted')
                      .map(slot => ({
                        slot,
                        meeting,
                        time: slot.time
                      }))
                  )
                  .filter(item => {
                    const [year, month, day] = item.slot.date.split('-').map(Number);
                    const slotDate = new Date(year, month - 1, day);
                    return slotDate.getDate() === date.getDate();
                  })
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((item, index) => (
                    <motion.div
                      key={`${item.meeting._id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Time Badge */}
                        <div className="flex-shrink-0 w-24">
                          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-3 py-2 rounded-lg text-center">
                            <div className="text-lg font-bold">{item.time}</div>
                            <div className="text-[11px] font-medium mt-0.5 opacity-80">
                              {(() => {
                                const [hours, minutes] = item.time.split(':').map(Number);
                                const totalMinutes = hours * 60 + minutes + item.meeting.duration;
                                const endHours = Math.floor(totalMinutes / 60) % 24;
                                const endMinutes = totalMinutes % 60;
                                return `עד ${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Meeting Card */}
                        <div className="flex-1 bg-white rounded-xl shadow-md hover:shadow-lg transition-all">
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`
                                  w-8 h-8 rounded-lg flex items-center justify-center shadow-md
                                  ${item.meeting.type === 'video' ? 'bg-blue-500' : 
                                    item.meeting.type === 'phone' ? 'bg-green-500' : 'bg-purple-500'}
                                `}>
                                  {item.meeting.type === 'video' ? (
                                    <Video className="h-4 w-4 text-white" />
                                  ) : item.meeting.type === 'phone' ? (
                                    <Phone className="h-4 w-4 text-white" />
                                  ) : (
                                    <Users className="h-4 w-4 text-white" />
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-900">
                                    {item.slot.participant?.fullName || "אין משתתף"}
                                  </h3>
                                  <div className="text-sm text-gray-500 mt-0.5">
                                    {item.meeting.title}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {(() => {
                                  const [year, month, day] = item.slot.date.split('-').map(Number);
                                  const [hours, minutes] = item.slot.time.split(':').map(Number);
                                  const slotDateTime = new Date(year, month - 1, day, hours, minutes);
                                  const slotEndDateTime = new Date(slotDateTime.getTime() + (item.meeting.duration * 60 * 1000));
                                  const isEnded = slotEndDateTime <= new Date();
                                  
                                  // אם הפגישה הסתיימה ואין לה סטטוס, נסמן אותה כהתקיימה
                                  if (isEnded && !item.slot.status && item.slot.status !== 'missed') {
                                    onStatusUpdate(item.meeting._id!, item.slot._id!, 'completed');
                                  }
                                  
                                  return isEnded && (
                                    <div className="scale-90">
                                      <StatusButton 
                                        meetingId={item.meeting._id!}
                                        slot={item.slot}
                                        onStatusUpdate={onStatusUpdate}
                                      />
                                    </div>
                                  );
                                })()}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-transparent rounded-full hover:scale-[1.02] transition-all focus:bg-transparent"
                      >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" side="top" className="text-right">
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/meeting/edit/${item.slot._id}?meetingId=${item.meeting._id}`)}
                                      className="flex justify-end gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer w-full"
                                    >
                                      <Pencil className="h-4 w-4" />
                                      <span>ערוך</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={async () => {
                                        await onDelete(item.meeting._id!, item.slot._id!);
                                        onClose();
                                      }}
                                      className="flex justify-end gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer w-full"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span>מחק</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
};

const MeetingsPage: React.FC = () => {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showDeletedMeetings, setShowDeletedMeetings] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [historyTab, setHistoryTab] = useState<HistoryStatus>('completed');
  const [showAllFutureMeetings, setShowAllFutureMeetings] = useState(false);
  const [showAllPastMeetings, setShowAllPastMeetings] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const adjustDateForTimezone = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const isToday = (date: Date): boolean => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return compareDate.getTime() === today.getTime();
  };

  const getDaysInMonth = (date: Date): { daysInMonth: number; startingDay: number; totalDays: number } => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    // בישראל השבוע מתחיל ביום ראשון, אז אין צורך בהתאמה
    const startingDay = firstDay.getDay(); // 0 = יום ראשון, 1 = יום שני, וכו'
    const totalDays = Math.ceil((daysInMonth + startingDay) / 7) * 7;
    return { daysInMonth, startingDay, totalDays };
  };

  const fetchMeetings = React.useCallback(async () => {
    if (!user) return;
    
    try {
      const { meetings: fetchedMeetings } = await getUserMeetings();
      
      // מיון הפגישות לפי תאריך ושעה
      const sortedMeetings = fetchedMeetings.map(meeting => ({
        ...meeting,
        bookedSlots: [...(meeting.bookedSlots || [])].sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
        })
      }));

      setMeetings(sortedMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      let errorMessage = "לא הצלחנו לטעון את הפגישות";
      
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage = "בעיית תקשורת. אנא בדוק את החיבור לאינטרנט";
        } else if (error.message.includes('Unauthorized')) {
          errorMessage = "אין לך הרשאה לצפות בפגישות";
        }
      }
      
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: errorMessage
      });
    }
  }, [user]);

  const handleStatusUpdate = React.useCallback(async (meetingId: string, slotId: string, status: HistoryStatus) => {
    try {
      setIsUpdating(true);
      await updateMeetingSlotStatus(meetingId, slotId, status);
      
      const statusMessages: Record<HistoryStatus, string> = {
        completed: "הפגישה סומנה כהתקיימה",
        missed: "הפגישה סומנה כלא התקיימה",
        deleted: "הפגישה הועברה לפח",
        pending: "הפגישה שוחזרה והועברה לפגישות המתוכננות"
      };
      
      toast({
        title: "הצלחה",
        description: statusMessages[status]
      });

      setMeetings(prevMeetings => 
        prevMeetings.map(meeting => 
          meeting._id === meetingId 
            ? {
                ...meeting,
                bookedSlots: meeting.bookedSlots.map(slot => 
                  slot._id === slotId 
                    ? { ...slot, status: status as MeetingStatus }
                    : slot
                )
              }
            : meeting
        )
      );
    } catch (error) {
      console.error('Error updating meeting status:', error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "לא הצלחנו לעדכן את סטטוס הפגישה",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [toast, setMeetings]);

  const handleDeleteSlot = React.useCallback(async (meetingId: string, slotId: string) => {
    try {
      setIsUpdating(true);
      await updateMeetingSlotStatus(meetingId, slotId, 'deleted');
      
      toast({
        title: "הצלחה",
        description: "הפגישה הועברה לפח הזבל",
      });

      // רענון מלא של הדף
      window.location.reload();

    } catch (error) {
      console.error('Error moving meeting to trash:', error);
      toast({
        variant: "destructive",
        title: "שגיאה בהעברה לפח",
        description: "אנא נסה שוב מאוחר יותר",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [toast, fetchMeetings]);

  const getDeletedMeetings = React.useCallback((): ExtendedBookedSlot[] => {
    return meetings.flatMap(meeting =>
      (meeting.bookedSlots || [])
        .filter(slot => slot.status === 'deleted')
        .map(slot => ({
          ...slot,
          meetingId: meeting._id!,
          title: meeting.title,
          type: meeting.type,
          duration: meeting.duration
        }))
    ).sort((a, b) => {
      const [yearA, monthA, dayA] = a.date.split('-').map(Number);
      const [yearB, monthB, dayB] = b.date.split('-').map(Number);
      const dateA = new Date(Date.UTC(yearA, monthA - 1, dayA));
      const dateB = new Date(Date.UTC(yearB, monthB - 1, dayB));
      return dateB.getTime() - dateA.getTime();
    });
  }, [meetings]);

  const getFutureMeetings = React.useCallback((): ExtendedBookedSlot[] => {
    const now = new Date();
    const allFutureMeetings = meetings.flatMap(meeting =>
      (meeting.bookedSlots || [])
        .filter(slot => {
          if (slot.status === 'deleted' || slot.status === 'completed' || slot.status === 'missed') return false;

          const [year, month, day] = slot.date.split('-').map(Number);
          const [hours, minutes] = slot.time.split(':').map(Number);
          const slotDateTime = new Date(year, month - 1, day, hours, minutes);
          const slotEndDateTime = new Date(slotDateTime.getTime() + (meeting.duration * 60 * 1000));
          
          // בדיקה אם הפגישה עדיין לא הסתיימה
          return slotEndDateTime > now;
        })
        .map(slot => ({
          ...slot,
          meetingId: meeting._id!,
          title: meeting.title,
          type: meeting.type,
          duration: meeting.duration
        }))
    ).sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
    });

    return showAllFutureMeetings ? allFutureMeetings : allFutureMeetings.slice(0, 3);
  }, [meetings, showAllFutureMeetings]);

  const getPastMeetings = React.useCallback((status: HistoryStatus): ExtendedBookedSlot[] => {
    const now = new Date();
    const allPastMeetings = meetings.flatMap(meeting => 
      (meeting.bookedSlots || [])
        .filter(slot => {
          // בדיקה אם הפגישה התחילה
          const [year, month, day] = slot.date.split('-').map(Number);
          const [hours, minutes] = slot.time.split(':').map(Number);
          const slotDateTime = new Date(year, month - 1, day, hours, minutes);
          const slotEndDateTime = new Date(slotDateTime.getTime() + (meeting.duration * 60 * 1000));
          const isEnded = slotEndDateTime <= now;
          
          // לא להציג פגישות שנמחקו
          if (slot.status === 'deleted') return false;
          
          // אם זו פגישה שלא התקיימה
          if (slot.status === 'missed') return status === 'missed';
          
          // אם זו פגישה שהתקיימה או שעדיין לא קיבלה סטטוס
          if (status === 'completed') {
            return isEnded && (slot.status === 'completed' || !slot.status);
          }
          
          return false;
        })
        .map(slot => ({
          ...slot,
          meetingId: meeting._id!,
          title: meeting.title,
          type: meeting.type,
          duration: meeting.duration,
          status: slot.status || 'completed'
        }))
    ).sort((a, b) => {
      const [yearA, monthA, dayA] = a.date.split('-').map(Number);
      const [hoursA, minutesA] = a.time.split(':').map(Number);
      const [yearB, monthB, dayB] = b.date.split('-').map(Number);
      const [hoursB, minutesB] = b.time.split(':').map(Number);
      
      const dateTimeA = new Date(Date.UTC(yearA, monthA - 1, dayA, hoursA, minutesA));
      const dateTimeB = new Date(Date.UTC(yearB, monthB - 1, dayB, hoursB, minutesB));
      
      return dateTimeB.getTime() - dateTimeA.getTime();
    });

    return showAllPastMeetings ? allPastMeetings : allPastMeetings.slice(0, 3);
  }, [meetings, showAllPastMeetings]);

  // טעינת פגישות בטעינה הראשונית
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setIsRefreshing(true);
    fetchMeetings()
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  }, [user, fetchMeetings]);

  // עדכון סטטוס אוטומטי לפגישות שעברו
  useEffect(() => {
    if (!meetings.length) return;

    const updatePastMeetings = async () => {
      const now = new Date();
      const meetingsToUpdate = meetings.flatMap(meeting => 
        meeting.bookedSlots
          .filter(slot => {
            if (slot.status === 'deleted' || slot.status === 'missed' || slot.status === 'completed') return false;
            const [year, month, day] = slot.date.split('-').map(Number);
            const [hours, minutes] = slot.time.split(':').map(Number);
            const slotDateTime = new Date(year, month - 1, day, hours, minutes);
            const slotEndDateTime = new Date(slotDateTime.getTime() + (meeting.duration * 60 * 1000));
            return slotEndDateTime <= now;
          })
          .map(slot => ({ meetingId: meeting._id!, slotId: slot._id! }))
      );

      if (meetingsToUpdate.length === 0) return;

      try {
        setIsUpdating(true);
        await Promise.all(
          meetingsToUpdate.map(({ meetingId, slotId }) => 
            handleStatusUpdate(meetingId, slotId, 'completed')
          )
        );
      } catch (error) {
        console.error('Error updating past meetings:', error);
      } finally {
        setIsUpdating(false);
      }
    };

    updatePastMeetings();
  }, [meetings, handleStatusUpdate]); // תלוי ב-meetings ו-handleStatusUpdate

  if (loading || isUpdating || isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              <div className="text-2xl font-semibold text-blue-600">
                {loading ? 'טוען את הפגישות שלך...' : 
                 isUpdating ? 'מעדכן את הפגישות...' : 
                 'מרענן את הנתונים...'}
              </div>
              <div className="text-sm text-gray-500">
                {loading ? 'אנא המתן בזמן שאנחנו טוענים את כל הפגישות' :
                 isUpdating ? 'מעדכן את הסטטוס של הפגישות' :
                 'מרענן את הנתונים המוצגים'}
              </div>
            </div>
          </CardContent>
        </Card>
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
                <>
                  <Button
                    onClick={() => setShowDeletedMeetings(!showDeletedMeetings)}
                    variant="outline"
                    className={`
                      bg-white hover:scale-[1.02] transition-all
                      ${showDeletedMeetings 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'hover:bg-red-50 text-gray-600'}
                    `}
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    פח זבל
                  </Button>
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
                </>
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
                {showDeletedMeetings ? (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">פגישות שנמחקו</h2>
                    </div>
                    {getDeletedMeetings().length === 0 ? (
                      <Card className="hover:scale-[1.02] transition-all duration-300">
                        <CardContent className="p-12 text-center">
                          <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <div className="text-xl text-gray-500">אין פגישות שנמחקו</div>
                          <div className="text-sm text-gray-400 mt-2">פגישות שנמחקו יופיעו כאן</div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-8">
                        {getDeletedMeetings().map((slot, index) => (
                          <Card key={index} className="hover:scale-[1.02] transition-all duration-300">
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
                                        {slot.participant?.fullName || "אין משתתף"}
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
  
                                    {/* Date and Time */}
                                    <div className="flex items-center gap-3 mt-3">
                                      <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                                        {(() => {
                                          const [year, month, day] = slot.date.split('-').map(Number);
                                          const date = new Date(Date.UTC(year, month - 1, day));
                                          return `יום ${hebrewDays[date.getDay()]}, ${day} ב${hebrewMonths[month - 1]}`;
                                        })()}
                                      </div>
                                      <div className="text-gray-600 text-sm flex items-center gap-1.5">
                                        <Clock className="h-4 w-4" />
                                        {slot.time}
                                      </div>
                                    </div>
                                  </div>
                                </div>
  
                                {/* Left Side: Restore Button */}
                                <div className="mr-4">
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleStatusUpdate(slot.meetingId, slot._id!, 'pending')}
                                    className="hover:bg-green-50 text-green-600 hover:scale-[1.02] transition-all"
                                  >
                                    <div className="flex items-center gap-2">
                                      <RotateCcw className="h-4 w-4 ml-2" />
                                      שחזר פגישה
                                    </div>
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                ) : viewMode === 'list' ? (
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
                              <div className="text-sm text-gray-400 mt-2">
                                לחץ על "פגישה חדשה" כדי ליצור את הפגישה הראשונה שלך
                              </div>
                              <Button
                                onClick={() => router.push('/new-single-meeting')}
                                className="mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02] transition-all"
                              >
                                <Plus className="h-5 w-5 ml-2" />
                                צור פגישה חדשה
                              </Button>
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
                              const [year, month, day] = slot.date.split('-').map(Number);
                              const [hours, minutes] = slot.time.split(':').map(Number);
                              const slotDateTime = new Date(year, month - 1, day, hours, minutes);
                              if (slot.status === 'deleted' || slot.status === 'completed' || slot.status === 'missed') return false;
                              const meeting = meetings.find(m => m.bookedSlots.some(s => s._id === slot._id));
                              if (!meeting) return false;
                              const slotEndDateTime = new Date(slotDateTime.getTime() + (meeting.duration * 60 * 1000));
                              return slotEndDateTime > new Date();
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
                                  <div className="text-sm text-gray-400 mt-2">
                                    {historyTab === 'completed' 
                                      ? 'פגישות שהתקיימו יופיעו כאן' 
                                      : 'פגישות שלא התקיימו יופיעו כאן'}
                                  </div>
                                  <div className="text-sm text-gray-400 mt-1">
                                    {historyTab === 'completed' 
                                      ? 'תוכל לסמן פגישות כ"התקיימו" לאחר שיעבור מועד הפגישה' 
                                      : 'תוכל לסמן פגישות כ"לא התקיימו" לאחר שיעבור מועד הפגישה'}
                                  </div>
                                </CardContent>
                              </Card>
                            ) : (
                              <div className="space-y-8">
                                {getPastMeetings(historyTab).map((slot, index) => (
                                  <MeetingCard 
                                    key={index} 
                                    slot={slot} 
                                    index={index} 
                                    onStatusUpdate={handleStatusUpdate}
                                    onDelete={handleDeleteSlot}
                                  />
                                ))}
  
                                {/* Show More Button for Past Meetings */}
                                {meetings.flatMap(m => m.bookedSlots || []).filter(slot => {
                                  const [year, month, day] = slot.date.split('-').map(Number);
                                  const [hours, minutes] = slot.time.split(':').map(Number);
                                  const slotDateTime = new Date(year, month - 1, day, hours, minutes);
                                  const meeting = meetings.find(m => m.bookedSlots.some(s => s._id === slot._id));
                                  if (!meeting) return false;
                                  const slotEndDateTime = new Date(slotDateTime.getTime() + (meeting.duration * 60 * 1000));
                                  const isEnded = slotEndDateTime <= new Date();
                                  if (!isEnded) return false;
                                  if (slot.status === 'deleted') return false;
                                  if (slot.status === 'missed') return historyTab === 'missed';
                                  return historyTab === 'completed' && (slot.status === 'completed' || !slot.status);
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
                              const newDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
                              setCurrentDate(newDate);
                            }}
                            className="hover:bg-blue-50 text-blue-600 hover:scale-[1.02] transition-all"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              const newDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
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
                            const date = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), dayNumber));
                            const isCurrentMonth = dayNumber > 0 && dayNumber <= getDaysInMonth(currentDate).daysInMonth;
  
                            if (!isCurrentMonth) return <div key={index} className="bg-white min-h-32" />;
  
                            const todayMeetings = meetings.filter(meeting => {
                              if (!meeting.bookedSlots?.length) return false;
                              return meeting.bookedSlots.some(slot => {
                                // לא להציג פגישות שנמחקו
                                if (slot.status === 'deleted') return false;
                                
                                const [year, month, day] = slot.date.split('-').map(Number);
                                const slotDate = new Date(Date.UTC(year, month - 1, day));
                                return slotDate.getFullYear() === date.getFullYear() &&
                                       slotDate.getMonth() === date.getMonth() &&
                                       slotDate.getDate() === date.getDate();
                              });
                            });
                            const today = isToday(date);
              
                            return (
                              <div
                                key={index}
                                onClick={() => {
                                  const newDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                                  setSelectedDate(newDate);
                                }}
                                className={`bg-white p-3 min-h-32 cursor-pointer hover:bg-blue-50/50 transition-colors ${
                                  today ? 'ring-2 ring-inset ring-blue-500' : ''
                                }`}
                              >
                                <div className={`font-medium mb-2 ${today ? 'text-blue-600' : 'text-gray-600'}`}>
                                  {dayNumber}
                                </div>
                                <div className="space-y-1.5">
    {todayMeetings.map((meeting) =>
      meeting.bookedSlots?.filter(slot => slot.status !== 'deleted').map((slot, slotIndex) => {
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
