import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Meeting, TimeSlot, WeekDays } from '../../types/meeting';
import { CreateParticipantResponse } from '../../types/participant';
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

export default function BookMeetingPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { typeId } = router.query;
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

  const fetchMeeting = async () => {
    try {
      if (!typeId) return;
      
      const { meeting } = await getMeeting(typeId as string);
      
      if (!meeting) {
        throw new Error('הפגישה לא נמצאה');
      }

      if (meeting.status !== 'active') {
        throw new Error('הפגישה אינה פעילה');
      }
      
      setMeeting(meeting);
      return meeting;
    } catch (err) {
      console.error('Error fetching meeting:', err);
      setError(err instanceof Error ? err.message : 'Failed to load meeting');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeeting();
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

  const isTimeSlotBooked = (date: Date, time: string): boolean => {
    if (!meeting?.bookedSlots) return false;
    
    const dateStr = formatDateStr(date);
    return meeting.bookedSlots.some(
      slot => slot.date === dateStr && slot.time === time
    );
  };

  const isDateAvailable = (date: Date | null): boolean => {
    if (!date || !meeting) return false;
    
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;
    
    // Get day availability
    const dayNames: WeekDays[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const dayAvailability = meeting.availability[dayName];
    
    // Check if day is enabled and has time slots
    if (!dayAvailability?.enabled || !dayAvailability.timeSlots?.length) {
      return false;
    }

    // Check if there are any available time slots for this day
    const dateStr = formatDateStr(date);
    const bookedTimes = new Set(
      meeting.bookedSlots
        .filter(slot => slot.date === dateStr)
        .map(slot => slot.time)
    );

    // Generate all possible time slots for this day
    const allSlots: string[] = [];
    dayAvailability.timeSlots.forEach(slot => {
      const slotsForRange = generateTimeSlots(slot.start, slot.end, meeting.duration);
      allSlots.push(...slotsForRange);
    });

    // Check if there are any available slots
    return allSlots.some(time => !bookedTimes.has(time));
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

  const handleDateClick = async (date: Date | null) => {
    if (date) {
      // Fetch latest meeting data before checking availability
      const latestMeeting = await fetchMeeting();
      if (latestMeeting && isDateAvailable(date)) {
        setSelectedDate(date);
        setSelectedTime(null);
      }
    }
  };

  const getAvailableTimesForDate = (date: Date | null): string[] => {
    if (!date || !meeting) return [];
    
    // Get day availability
    const dayNames: WeekDays[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const dayAvailability = meeting.availability[dayName];
    
    if (!dayAvailability?.enabled || !dayAvailability?.timeSlots) return [];
    
    // Get current time if the date is today
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : 0;
    
    // Get booked times for this date
    const dateStr = formatDateStr(date);
    const bookedTimes = new Set(
      (meeting.bookedSlots || [])
        .filter(slot => slot.date === dateStr)
        .map(slot => slot.time)
    );
    
    // Generate only available time slots
    const availableSlots: string[] = [];
    dayAvailability.timeSlots.forEach((slot: TimeSlot) => {
      const start = parseTime(slot.start);
      const end = parseTime(slot.end);
      
      for (let time = start; time + meeting.duration <= end; time += meeting.duration) {
        // Skip times that have already passed today
        if (isToday && time <= currentMinutes) {
          continue;
        }
        
        const timeStr = formatTime(time);
        // Only add times that are not booked
        if (!bookedTimes.has(timeStr)) {
          availableSlots.push(timeStr);
        }
      }
    });
    
    return availableSlots;
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
      if (!selectedDate || !selectedTime || !meeting || !typeId) {
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
      
      // Book meeting
      const bookingResponse = await bookMeeting(typeId as string, {
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
      if (error.response?.data?.message === 'השעה המבוקשת כבר תפוסה') {
        await fetchMeeting();
        setSelectedTime(null);
      }
      
      toast({
        variant: "destructive",
        title: "שגיאה בקביעת הפגישה",
        description: error.response?.data?.message || error.message || "אנא נסה שוב מאוחר יותר"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold text-blue-600">טוען...</div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">שגיאה: {error || 'הפגישה לא נמצאה'}</div>
      </div>
    );
  }

  if (bookingState === 'booked' && bookingDetails) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-3 bg-gradient-to-l from-blue-600 to-blue-400 text-transparent bg-clip-text">
              הפגישה נקבעה בהצלחה!
            </h1>
            <p className="text-gray-600">נשלח אליך אימייל עם פרטי הפגישה</p>
          </div>

          <Card className="shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-l from-blue-600 to-blue-400 p-6">
              <h2 className="text-2xl font-bold text-white">פרטי הפגישה</h2>
            </div>
            <CardContent className="p-8 bg-white">
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
                    <div className="text-lg font-medium">{meeting.duration} דקות</div>
                    <div className="text-gray-500">משך הפגישה</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    {meeting.type === 'video' ? (
                      <Video className="w-5 h-5 text-blue-600" />
                    ) : meeting.type === 'phone' ? (
                      <Phone className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Users className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-lg font-medium">
                      {meeting.type === 'video' ? 'שיחת וידאו' : 
                       meeting.type === 'phone' ? 'שיחה טלפונית' : 
                       'פגישה פרונטלית'}
                    </div>
                    <div className="text-gray-500">סוג הפגישה</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl overflow-hidden">
            <div className="bg-gradient-to-l from-blue-600 to-blue-400 p-6">
              <h2 className="text-2xl font-bold text-white">פרטי המשתתף</h2>
            </div>
            <CardContent className="p-8 bg-white">
              <div className="space-y-6">
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Head>
        <title>{meeting?.title || 'טוען...'} | Meety</title>
      </Head>

      <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex items-center justify-center min-h-screen">
        <Card className="w-full shadow-xl" dir="rtl">
          <div className="border-b bg-gradient-to-l from-blue-600 to-blue-400">
            <div className="p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4">
                  <Calendar className="h-10 w-10 text-white" />
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-white">{meeting.title}</h2>
                    <div className="flex items-center justify-center gap-3 text-lg text-blue-50 mt-2">
                      <Clock className="h-5 w-5" />
                      <span>{meeting.duration} דקות</span>
                      <span className="mx-2">|</span>
                      {meeting.type === 'video' ? (
                        <>
                          <Video className="h-5 w-5" />
                          <span>שיחת וידאו</span>
                        </>
                      ) : meeting.type === 'phone' ? (
                        <>
                          <Phone className="h-5 w-5" />
                          <span>שיחה טלפונית</span>
                        </>
                      ) : (
                        <>
                          <Users className="h-5 w-5" />
                          <span>פגישה פרונטלית</span>
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
                      className="w-full max-w-lg p-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg text-white text-center text-lg shadow-md"
                    >
                      {hebrewDaysFull[selectedDate.getDay()]}, {selectedDate.getDate()} {hebrewMonths[selectedDate.getMonth()]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className={`grid ${selectedDate ? 'grid-cols-[3fr,2fr] gap-8' : 'grid-cols-1'}`}>
              <div className={`relative ${!selectedDate ? 'max-w-2xl mx-auto w-full' : ''}`}>
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
                    const isAvailable = date && isDateAvailable(date);
                    const isSelected = date && selectedDate?.toDateString() === date.toDateString();
                    
                    return (
                      <motion.button
                        key={index}
                        onClick={() => handleDateClick(date)}
                        disabled={!isAvailable}
                        whileHover={isAvailable ? { scale: 1.1 } : {}}
                        whileTap={isAvailable ? { scale: 0.95 } : {}}
                        className={`
                          aspect-square p-1 rounded-lg flex items-center justify-center relative text-base
                          transition-all duration-300
                          ${!date ? 'invisible' : ''}
                          ${!isAvailable 
                            ? 'text-gray-300 cursor-default' 
                            : 'text-gray-700 hover:shadow-lg cursor-pointer'
                          }
                          ${isSelected 
                            ? 'bg-gradient-to-l from-blue-600 to-blue-400 text-white font-medium shadow-md scale-105' 
                            : ''
                          }
                        `}
                      >
                        {date?.getDate()}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="border-r pr-8"
                  >
                    <h4 className="text-lg font-medium mb-6 text-blue-600">זמנים פנויים</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {getAvailableTimesForDate(selectedDate).map((time) => (
                        <motion.button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`
                            p-4 text-center rounded-lg border text-base
                            transition-all duration-300
                            hover:shadow-lg
                            ${selectedTime === time 
                              ? 'bg-gradient-to-l from-blue-600 to-blue-400 text-white font-medium shadow-md scale-105' 
                              : ''
                            }
                          `}
                        >
                          {time}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {selectedTime && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
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

                    <div className="flex gap-3 pt-2 flex-row-reverse">
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
