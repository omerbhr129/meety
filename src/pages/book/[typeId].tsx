import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Meeting, TimeSlot, WeekDays } from '../../types/meeting';
import Head from 'next/head';
import { Card, CardContent } from '../../components/ui/card';
import { ChevronLeft, ChevronRight, Clock, Calendar, Video, Users, Phone, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMeeting, bookMeeting, createParticipant } from '../../services/api';
import { useToast } from '../../components/ui/use-toast';

type BookingState = 'selecting' | 'form' | 'booked';

interface BookingDetails {
  date: Date;
  time: string;
  name: string;
  email: string;
  phone: string;
}

interface UserDetails {
  name: string;
  email: string;
  phone: string;
}

interface BookedSlot {
  date: string;
  time: string;
}

export default function BookMeetingPage() {
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const typeId = router.query.typeId;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingState, setBookingState] = useState<BookingState>('selecting');
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails>({ name: '', email: '', phone: '' });

  const hebrewDays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const hebrewDaysFull = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  // Check if device is mobile
  useEffect(() => {
    const checkDevice = () => {
      if (typeof window !== 'undefined') {
        const userAgent = window.navigator.userAgent.toLowerCase();
        const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
        setIsMobile(mobileKeywords.some(keyword => userAgent.includes(keyword)));
      }
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Improved cache for booked slots
  const meetingCache = useMemo(() => {
    if (!meeting) return null;
    
    // Create a Map of booked slots for efficient lookup
    const bookedSlotsMap = new Map<string, Set<string>>();
    
    meeting.bookedSlots.forEach(slot => {
      const dateKey = slot.date;
      if (!bookedSlotsMap.has(dateKey)) {
        bookedSlotsMap.set(dateKey, new Set());
      }
      bookedSlotsMap.get(dateKey)?.add(slot.time);
    });
    
    return {
      bookedSlots: bookedSlotsMap,
      availability: meeting.availability,
      duration: meeting.duration
    };
  }, [meeting]);

  const fetchMeeting = async () => {
    try {
      if (!typeId) {
        router.push('/404');
        return;
      }

      let id = Array.isArray(typeId) ? typeId[0] : typeId;
      // Get the last part of the URL (the ID)
      const parts = id.split('/');
      id = parts[parts.length - 1];
      
      const { meeting } = await getMeeting(id);
      
      if (!meeting) {
        router.push('/404');
        return;
      }
      
      if (!meeting) {
        throw new Error('הפגישה לא נמצאה');
      }

      if (meeting.status !== 'active') {
        throw new Error('הפגישה אינה פעילה');
      }
      
      setMeeting(meeting);
      setError('');
      return meeting;
    } catch (err) {
      console.error('Error fetching meeting:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeId) {
      fetchMeeting();
    }
  }, [typeId]);

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const generateTimeSlots = (startTime: string, endTime: string, duration: number): string[] => {
    const slots: string[] = [];
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    for (let time = start; time + duration <= end; time += duration) {
      slots.push(formatTime(time));
    }
    
    return slots;
  };

  const formatDateStr = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Improved local availability check
  const checkLocalAvailability = (date: Date | null): boolean => {
    if (!date || !meetingCache) return false;
    
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;
    
    // Get day availability
    const dayNames: WeekDays[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const dayAvailability = meetingCache.availability[dayName];
    
    // Check if day is enabled and has time slots
    if (!dayAvailability?.enabled || !dayAvailability.timeSlots?.length) {
      return false;
    }

    // Get all possible time slots for this day
    const dateStr = formatDateStr(date);
    const bookedTimes = meetingCache.bookedSlots.get(dateStr) || new Set();
    
    // Generate all possible time slots for this day
    let hasAvailableSlot = false;
    for (const slot of dayAvailability.timeSlots) {
      const timeSlots = generateTimeSlots(slot.start, slot.end, meetingCache.duration);
      // Check if any time slot is available
      if (timeSlots.some(time => !bookedTimes.has(time))) {
        hasAvailableSlot = true;
        break;
      }
    }

    return hasAvailableSlot;
  };

  const handleDateClick = (date: Date | null) => {
    if (date && checkLocalAvailability(date)) {
      setSelectedDate(date);
      setSelectedTime(null);
    }
  };

  // Improved getAvailableTimesForDate function
  const getAvailableTimesForDate = (date: Date | null): string[] => {
    if (!date || !meetingCache) return [];
    
    // Get day availability
    const dayNames: WeekDays[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const dayAvailability = meetingCache.availability[dayName];
    
    if (!dayAvailability?.enabled || !dayAvailability?.timeSlots) return [];
    
    // Get current time if the date is today
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : 0;
    
    // Get booked times for this date
    const dateStr = formatDateStr(date);
    const bookedTimes = meetingCache.bookedSlots.get(dateStr) || new Set();
    
    // Generate only available time slots
    const availableSlots: string[] = [];
    
    dayAvailability.timeSlots.forEach((slot: TimeSlot) => {
      const timeSlots = generateTimeSlots(slot.start, slot.end, meetingCache.duration);
      
      timeSlots.forEach(time => {
        const timeMinutes = parseTime(time);
        
        // Skip times that:
        // 1. Have already passed today
        // 2. Are already booked
        if ((!isToday || timeMinutes > currentMinutes) && !bookedTimes.has(time)) {
          availableSlots.push(time);
        }
      });
    });
    
    return availableSlots.sort();
  };

  const validateUserDetails = (details: UserDetails): boolean => {
    if (!details.name.trim()) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "נא להזין שם מלא"
      });
      return false;
    }

    if (!details.email.trim() || !/^\S+@\S+\.\S+$/.test(details.email)) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "נא להזין כתובת דוא״ל תקינה"
      });
      return false;
    }

    if (!details.phone.trim() || !/^\d{9,15}$/.test(details.phone.replace(/\D/g, ''))) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "נא להזין מספר טלפון תקין"
      });
      return false;
    }

    return true;
  };

  const handleBooking = async () => {
    try {
      if (!selectedDate || !selectedTime || !meeting) {
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: "נא לבחור תאריך ושעה"
        });
        return;
      }

      if (!validateUserDetails(userDetails)) {
        return;
      }

      // Create participant
      const participantResponse = await createParticipant({
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.phone
      });

      if (!participantResponse?.participant?._id) {
        throw new Error('Failed to create participant');
      }

      // Format date as YYYY-MM-DD
      const formattedDate = formatDateStr(selectedDate);
      
      // Verify time slot is still available
      const dateStr = formatDateStr(selectedDate);
      const bookedTimes = meetingCache?.bookedSlots.get(dateStr) || new Set();
      if (bookedTimes.has(selectedTime)) {
        throw new Error('השעה המבוקשת כבר תפוסה');
      }
      
      // Book meeting
      if (!typeId || Array.isArray(typeId)) {
        throw new Error('Invalid meeting ID');
      }
      
      const bookingResponse = await bookMeeting(typeId, {
        date: formattedDate,
        time: selectedTime,
        participant: participantResponse.participant._id
      });

      if (!bookingResponse?.booking) {
        throw new Error('Failed to book meeting');
      }

      // Update meeting data immediately
      await fetchMeeting();

      toast({
        title: "הפגישה נקבעה בהצלחה!",
        description: "פרטי הפגישה נשלחו למייל שלך"
      });

      setBookingDetails({
        date: selectedDate,
        time: selectedTime,
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.phone
      });
      setBookingState('booked');

    } catch (error: any) {
      console.error('Booking error:', error);
      
      // If the slot was already booked, refresh the meeting data
      if (error.message === 'השעה המבוקשת כבר תפוסה') {
        await fetchMeeting();
        setSelectedTime(null);
      }
      
      toast({
        variant: "destructive",
        title: "שגיאה בקביעת הפגישה",
        description: error.message || "אנא נסה שוב מאוחר יותר"
      });
    }
  };

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const firstDayOfWeek = firstDay.getDay();
    const daysInPrevMonth = firstDayOfWeek;
    
    // Add empty slots for days before the first of the month
    for (let i = 0; i < daysInPrevMonth; i++) {
      days.push(null);
    }
    
    // Add all days in the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // Show loading state until we have meeting data
  if (loading || !meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-2xl font-semibold text-blue-600">טוען...</div>
      </div>
    );
  }

  const { title, duration, type } = meeting;

  if (bookingState === 'booked' && bookingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="max-w-3xl w-full mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 via-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-100">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 bg-clip-text text-transparent">
              הפגישה נקבעה בהצלחה!
            </h1>
            <p className="text-gray-600">נשלח אליך אימייל עם פרטי הפגישה</p>
          </div>

          <Card className="shadow-xl overflow-hidden">
            <div className="bg-gradient-to-l from-blue-600 to-blue-400 p-6">
              <h2 className="text-2xl font-bold text-white">פרטי הפגישה</h2>
            </div>
            <CardContent className="p-6 bg-white space-y-6">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-lg font-medium">
                      {hebrewDaysFull[bookingDetails.date.getDay()]}, {bookingDetails.date.getDate()} {hebrewMonths[bookingDetails.date.getMonth()]} {bookingDetails.date.getFullYear()}
                    </div>
                    <div className="text-gray-500">{bookingDetails.time}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-lg font-medium">{duration} דקות</div>
                    <div className="text-gray-500">משך הפגישה</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    {type === 'video' ? (
                      <Video className="w-5 h-5 text-blue-600" />
                    ) : type === 'phone' ? (
                      <Phone className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Users className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-lg font-medium">
                      {type === 'video' ? 'שיחת וידאו' : 
                       type === 'phone' ? 'שיחה טלפונית' : 
                       'פגישה פרונטלית'}
                    </div>
                    <div className="text-gray-500">סוג הפגישה</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 bg-clip-text text-transparent">פרטי המשתתף</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">שם מלא</div>
                    <div className="text-lg font-medium">{bookingDetails.name}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">דוא״ל</div>
                    <div className="text-lg font-medium">{bookingDetails.email}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">טלפון</div>
                    <div className="text-lg font-medium dir-ltr text-right">{bookingDetails.phone}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8">
      <Head>
        <title>{title || 'טוען...'} | Meety</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
      </Head>

      <div className={`w-full max-w-4xl mx-auto ${isMobile ? 'p-2' : 'p-8'} flex items-center justify-center`}>
        <Card className="w-full shadow-xl overflow-hidden" dir="rtl">
          <div className="border-b bg-gradient-to-l from-blue-600 to-blue-400">
            <div className={`${isMobile ? 'p-4' : 'p-8'}`}>
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Calendar className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />
                    <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-white`}>
                      {title}
                    </h2>
                  </div>
                  <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-center justify-center gap-2`}>
                    <div className="flex items-center gap-2">
                      <Clock className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-50`} />
                      <span className={`${isMobile ? 'text-base' : 'text-lg'} text-blue-50`}>{duration} דקות</span>
                    </div>
                    {!isMobile && <span className="text-blue-50 mx-2">|</span>}
                    <div className="flex items-center gap-2">
                      {type === 'video' ? (
                        <>
                          <Video className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-50`} />
                          <span className={`${isMobile ? 'text-base' : 'text-lg'} text-blue-50`}>שיחת וידאו</span>
                        </>
                      ) : type === 'phone' ? (
                        <>
                          <Phone className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-50`} />
                          <span className={`${isMobile ? 'text-base' : 'text-lg'} text-blue-50`}>שיחה טלפונית</span>
                        </>
                      ) : (
                        <>
                          <Users className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-50`} />
                          <span className={`${isMobile ? 'text-base' : 'text-lg'} text-blue-50`}>פגישה פרונטלית</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {selectedDate && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className={`w-full max-w-lg ${isMobile ? 'p-3 text-base' : 'p-4 text-lg'} bg-white bg-opacity-10 backdrop-blur-sm rounded-lg text-white text-center shadow-md`}
                    >
                      {hebrewDaysFull[selectedDate.getDay()]}, {selectedDate.getDate()} {hebrewMonths[selectedDate.getMonth()]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className={`${isMobile ? 'p-4' : 'p-8'}`}>
            <motion.div 
              className="grid gap-8"
              style={{
                gridTemplateColumns: selectedDate && !isMobile ? '3fr 2fr' : '1fr',
                height: 'auto'
              }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              {/* Calendar section */}
              <motion.div 
                className={`relative w-full mx-auto ${selectedDate && !isMobile ? 'max-w-3xl' : ''}`}
                transition={{
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
                <div className="flex justify-between items-center mb-6">
                  <button 
                    onClick={() => setCurrentDate(prev => {
                      const newDate = new Date(prev);
                      newDate.setMonth(prev.getMonth() - 1);
                      return newDate;
                    })}
                    className="p-2 hover:bg-gray-50/50 rounded-full transition-colors duration-300"
                  >
                    <ChevronRight className="h-5 w-5 text-blue-600" />
                  </button>
                  <h3 className="text-xl font-medium text-blue-600">
                    {hebrewMonths[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <button 
                    onClick={() => setCurrentDate(prev => {
                      const newDate = new Date(prev);
                      newDate.setMonth(prev.getMonth() + 1);
                      return newDate;
                    })}
                    className="p-2 hover:bg-gray-50/50 rounded-full transition-colors duration-300"
                  >
                    <ChevronLeft className="h-5 w-5 text-blue-600" />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {hebrewDays.map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-blue-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentDate).map((date, index) => {
                    const isAvailable = date && checkLocalAvailability(date);
                    const isSelected = date && selectedDate?.toDateString() === date.toDateString();
                    
                    return (
                      <motion.button
                        key={index}
                        onClick={() => handleDateClick(date)}
                        disabled={!isAvailable}
                        whileHover={isAvailable ? { scale: 1.03 } : {}}
                        whileTap={isAvailable ? { scale: 0.99 } : {}}
                        transition={{ duration: 0.08 }}
                        className={`
                          aspect-square p-1 rounded-lg flex items-center justify-center relative text-base
                          transition-colors duration-200
                          ${!date ? 'invisible' : ''}
                          ${!isAvailable 
                            ? 'text-gray-300 cursor-default' 
                            : 'text-gray-700 hover:shadow-sm cursor-pointer'
                          }
                          ${isSelected 
                            ? 'bg-gradient-to-l from-blue-600 to-blue-400 text-white font-medium shadow-sm scale-107' 
                            : ''
                          }
                        `}
                      >
                        {date?.getDate()}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              <AnimatePresence mode="wait">
                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, y: isMobile ? 20 : 0, x: isMobile ? 0 : 20 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, y: isMobile ? 20 : 0, x: isMobile ? 0 : 20 }}
                    transition={{ 
                      duration: 0.5,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                    className={`
                      ${isMobile ? 'border-t pt-4 mt-4' : 'border-r pr-8'}
                    `}
                  >
                    <h4 className={`text-lg font-medium ${isMobile ? 'mb-4' : 'mb-6'} text-blue-600`}>
                      זמנים פנויים
                    </h4>
                    <div className="overflow-y-auto max-h-[500px] px-2">
                      <div className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-1'} gap-3`}>
                      {getAvailableTimesForDate(selectedDate).map((time) => (
                        <motion.button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.99 }}
                          transition={{ duration: 0.08 }}
                          className={`
                            ${isMobile ? 'p-3 text-sm' : 'p-4 text-base'}
                            text-center rounded-lg border mx-2
                            transition-all duration-100
                            hover:shadow-sm
                            ${selectedTime === time 
                              ? 'bg-gradient-to-l from-blue-600 to-blue-400 text-white font-medium shadow-sm scale-107' 
                              : ''
                            }
                          `}
                        >
                          {time}
                        </motion.button>
                      ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {selectedTime && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg"
            >
              <Card className="shadow-xl">
                <CardContent className="p-8">
                  <div className="flex flex-col gap-6">
                    <div className="bg-gradient-to-l from-blue-600 to-blue-400 p-4 rounded-lg">
                      <p className="text-center font-medium text-white text-lg">
                        {hebrewDaysFull[selectedDate!.getDay()]}, {selectedDate!.getDate()} {hebrewMonths[selectedDate!.getMonth()]}
                        <br />
                        {selectedTime}
                      </p>
                    </div>

                    <div className="text-right">
                      <h3 className="text-2xl font-bold bg-gradient-to-l from-blue-600 to-blue-400 text-transparent bg-clip-text">
                        אישור פגישה
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2 text-right font-bold text-gray-700">שם מלא</label>
                        <input
                          type="text"
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all text-right"
                          onChange={(e) => setUserDetails({...userDetails, name: e.target.value})}
                          value={userDetails.name}
                          required
                        />
                      </div>
                      <div>
                      <label className="block mb-2 text-right font-bold text-gray-700">דוא״ל</label>
                      <input
                        type="email"
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all text-right"
                        onChange={(e) => setUserDetails({...userDetails, email: e.target.value})}
                        value={userDetails.email}
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-right font-bold text-gray-700">טלפון</label>
                      <input
                        type="tel"
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all text-right"
                        onChange={(e) => setUserDetails({...userDetails, phone: e.target.value})}
                        value={userDetails.phone}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      className="flex-1 bg-gradient-to-l from-blue-600 to-blue-400 text-white p-3 rounded-lg hover:from-blue-700 hover:to-blue-500 transition-colors shadow-md"
                      onClick={handleBooking}
                    >
                      אישור
                    </button>
                    <button
                      onClick={() => setSelectedTime(null)}
                      className="flex-1 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
}
