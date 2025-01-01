import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Users, Phone, Save, ArrowRight, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { useAuth } from '../../../lib/auth';
import { useRouter } from 'next/router';
import { getUserMeetings, getParticipants, updateMeetingSlotStatus } from '../../../services/api';
import { useToast } from '../../../components/ui/use-toast';
import Head from 'next/head';
import { Meeting, WeekDays, TimeSlot } from '../../../types/meeting';
import { Participant } from '../../../types/participant';
import { motion } from 'framer-motion';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";

const hebrewDays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const hebrewMonths = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

const dayNames: { [key: number]: WeekDays } = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
};

function EditMeetingPage() {
  const router = useRouter();
  const { id: slotId, meetingId } = router.query;
  const { token } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openParticipants, setOpenParticipants] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
   const fetchData = async () => {
  try {
    console.log('Starting to fetch data with:', { slotId, meetingId });

    const [meetingsResponse, participantsResponse] = await Promise.all([
      getUserMeetings(),
      getParticipants()
    ]);

    console.log('Got meetings:', meetingsResponse.meetings);

    // קודם מצא את הפגישה לפי meetingId
    const foundMeeting = meetingsResponse.meetings.find(m => m._id === meetingId);
    let foundSlot;

    if (foundMeeting) {
      console.log('Found meeting by meetingId:', foundMeeting);
      foundSlot = foundMeeting.bookedSlots?.find(slot => slot._id === slotId);
    }

    if (!foundMeeting || !foundSlot) {
      console.error('Meeting or slot not found:', { 
        foundMeeting: !!foundMeeting, 
        foundSlot: !!foundSlot,
        searchedSlotId: slotId,
        searchedMeetingId: meetingId
      });

      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "הפגישה לא נמצאה"
      });
      router.push('/meetings');
      return;
    }

    console.log('Setting up meeting data:', {
      meeting: foundMeeting,
      slot: foundSlot
    });

    setMeetings(meetingsResponse.meetings);
    setParticipants(participantsResponse.participants);
    setSelectedMeeting(foundMeeting);

    // מצא את המשתתף הספציפי
    const participant = participantsResponse.participants.find(p => 
      p._id === (typeof foundSlot.participant === 'string' ? foundSlot.participant : foundSlot.participant?._id)
    );

    if (participant) {
      console.log('Found participant:', participant);
      setSelectedParticipant(participant);
    }

    // הגדר את התאריך והשעה מהסלוט הספציפי
    if (foundSlot.date) {
      const [year, month, day] = foundSlot.date.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      setSelectedDate(date);
      setCurrentDate(date);
      console.log('Set date:', date);
    }

    if (foundSlot.time) {
      setSelectedTime(foundSlot.time);
      console.log('Set time:', foundSlot.time);
    }

  } catch (error) {
    console.error('Error in fetchData:', error);
    toast({
      variant: "destructive",
      title: "שגיאה בטעינת הנתונים",
      description: "אנא נסה שוב מאוחר יותר"
    });
  } finally {
    setLoading(false);
  }
};

    if (slotId && meetingId) {
      fetchData();
    }
  }, [slotId, meetingId, router, toast]);

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const firstDayOfWeek = firstDay.getDay();
    const daysInPrevMonth = firstDayOfWeek;
    
    for (let i = 0; i < daysInPrevMonth; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const generateTimeSlots = (startTime: string, endTime: string, duration: number): string[] => {
    const slots: string[] = [];
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const start = startHours * 60 + startMinutes;
    const end = endHours * 60 + endMinutes;
    
    for (let time = start; time + duration <= end; time += duration) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }
    
    return slots;
  };

  // בדיקת זמינות מקומית - כמו בקישור השיתופי
  const checkLocalAvailability = (date: Date | null): boolean => {
    if (!date || !selectedMeeting) return false;
    
    // בדיקה אם התאריך בעבר
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;
    
    // בדיקת זמינות היום
    const dayName = dayNames[date.getDay()];
    const dayAvailability = selectedMeeting.availability[dayName];
    
    // בדיקה אם היום פעיל ויש בו זמנים
    if (!dayAvailability?.enabled || !dayAvailability.timeSlots?.length) {
      return false;
    }

    // קבלת כל הזמנים התפוסים ליום זה
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const bookedTimes = new Set(
      selectedMeeting.bookedSlots
        .filter(slot => slot.date === dateStr && slot._id !== slotId) // מתעלם מהסלוט הנוכחי
        .map(slot => slot.time)
    );
    
    // בדיקה אם יש זמן פנוי
    let hasAvailableSlot = false;
    for (const slot of dayAvailability.timeSlots) {
      const timeSlots = generateTimeSlots(slot.start, slot.end, selectedMeeting.duration);
      // בדיקה אם יש זמן פנוי
      if (timeSlots.some(time => !bookedTimes.has(time))) {
        hasAvailableSlot = true;
        break;
      }
    }

    return hasAvailableSlot;
  };
  const getAvailableTimesForDate = (date: Date | null): string[] => {
    if (!date || !selectedMeeting) return [];
    
    const dayName = dayNames[date.getDay()];
    const dayAvailability = selectedMeeting.availability[dayName];
    
    if (!dayAvailability?.enabled || !dayAvailability?.timeSlots) return [];
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : 0;
    
    // קבלת כל הזמנים התפוסים ליום זה
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const bookedTimes = new Set(
      selectedMeeting.bookedSlots
        .filter(slot => slot.date === dateStr && slot._id !== slotId) // מתעלם מהסלוט הנוכחי
        .map(slot => slot.time)
    );
    
    const availableSlots: string[] = [];
    
    dayAvailability.timeSlots.forEach((slot: TimeSlot) => {
      const timeSlots = generateTimeSlots(slot.start, slot.end, selectedMeeting.duration);
      
      timeSlots.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const timeMinutes = hours * 60 + minutes;
        
        // מציג רק זמנים שלא עברו ולא תפוסים
        // מאפשר את הזמן הנוכחי של הפגישה גם אם הוא בעבר
        const isCurrentSlotTime = selectedTime === time;
        if (((!isToday || timeMinutes > currentMinutes) || isCurrentSlotTime) && // בודק זמני עבר
            (!bookedTimes.has(time) || isCurrentSlotTime)) { // בודק זמנים תפוסים
          availableSlots.push(time);
        }
      });
    });
    
    return availableSlots.sort();
  };


  const handleSubmit = async () => {
    if (!selectedMeeting || !selectedParticipant || !selectedDate || !selectedTime || !slotId) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "יש למלא את כל השדות"
      });
      return;
    }

    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      // בדיקה אם הפגישה התחילה
      const now = new Date();
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const meetingTime = new Date(year, parseInt(month) - 1, parseInt(day));
      meetingTime.setHours(hours, minutes, 0, 0);
      
      // אם הפגישה התחילה, שולחים completed, אחרת pending
      const status = now >= meetingTime ? 'completed' : 'pending';

      // עדכן את הסלוט הספציפי
      const result = await updateMeetingSlotStatus(
        selectedMeeting._id!,
        slotId as string,
        status,
        {
          date: formattedDate,
          time: selectedTime,
          participant: selectedParticipant._id!
        }
      );

      if (result.meeting) {
        toast({
          title: "הפגישה עודכנה בהצלחה",
          description: "הפגישה עודכנה ביומן שלך"
        });
        
        // רענן את הדף אחרי העדכון
        window.location.href = '/meetings';
      } else {
        throw new Error('Failed to update meeting');
      }
    } catch (error: any) {
      console.error('Error updating meeting:', error);
      toast({
        variant: "destructive",
        title: "שגיאה בעדכון הפגישה",
        description: error.response?.data?.message || "אנא נסה שוב מאוחר יותר"
      });
    }
  };

  const filteredParticipants = participants.filter(participant => 
    participant.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    participant.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold text-blue-600">טוען...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>עריכת פגישה | Meety</title>
      </Head>
      <div className="min-h-screen p-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden bg-white/90 backdrop-blur-lg shadow-xl border-0">
            <div className="relative">
              <div className="p-8 space-y-12">
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-2xl mb-6 shadow-inner bg-blue-50">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    עריכת פגישה
                  </h1>
                  <p className="text-gray-500 text-lg">
                    עדכן משתתף, תאריך ושעה
                  </p>
                </div>

                <div className="space-y-10">
                  {/* Meeting Type Display */}
                  <div className="space-y-3">
                    <label className="block text-right font-medium text-gray-700 text-lg">
                      סוג פגישה
                    </label>
                    <div className="p-6 rounded-xl border-2 border-gray-200 bg-gray-50">
                      <div className="text-right">
                        <div className="font-semibold text-lg mb-1">{selectedMeeting?.title}</div>
                        <div className="text-sm text-gray-500">{selectedMeeting?.duration} דקות</div>
                      </div>
                    </div>
                  </div>

                  {/* Participant Selection */}
                  <div className="space-y-3">
                    <label className="block text-right font-medium text-gray-700 text-lg">
                      משתתף
                    </label>
                    <Popover open={openParticipants} onOpenChange={setOpenParticipants}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openParticipants}
                          className="w-full justify-between text-right hover:bg-blue-50/50 hover:border-blue-300"
                        >
                          <div className="flex items-center gap-2">
                            {selectedParticipant && (
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 
                                flex items-center justify-center text-white text-sm font-semibold">
                                {selectedParticipant.fullName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span>{selectedParticipant ? selectedParticipant.fullName : "בחר משתתף..."}</span>
                          </div>
                          <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg border rounded-lg overflow-hidden" 
                        align="start"
                        sideOffset={8}
                      >
                        <Command className="w-full border-0">
                          <CommandInput 
                            placeholder="חפש משתתף..." 
                            className="h-9 text-right border-0"
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty className="text-right py-6 text-sm text-gray-500">
                              לא נמצאו משתתפים
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredParticipants.map((participant) => (
                                <CommandItem
                                  key={participant._id}
                                  value={participant.fullName}
                                  onSelect={() => {
                                    setSelectedParticipant(participant);
                                    setOpenParticipants(false);
                                  }}
                                  className="flex flex-row-reverse items-center gap-2 px-4 py-3 text-gray-900"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 
                                    flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                                    {participant.fullName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 text-right">
                                    <div className="font-medium text-base">{participant.fullName}</div>
                                    <div className="text-sm text-gray-500">{participant.email}</div>
                                  </div>
                                  {selectedParticipant?._id === participant._id && (
                                    <Check className="h-4 w-4 text-blue-600 mr-auto" />
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Calendar and Time Selection */}
                  {selectedMeeting && selectedParticipant && (
                    <div className="space-y-3">
                      <label className="block text-right font-medium text-gray-700 text-lg">
                        תאריך ושעה
                      </label>
                      <div className={`relative transition-all duration-700 ease-in-out ${selectedDate ? 'h-[580px]' : 'h-[700px]'}`}>
                        {/* Calendar */}
                        <motion.div 
                          className={`
                            absolute top-0 right-0 transition-all duration-700 ease-in-out transform origin-right
                            ${selectedDate ? 'w-[68%] scale-x-100 h-[500px] pl-8' : 'w-full scale-x-100 h-[700px]'}
                          `}
                          layout
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
                              if (!date) return <div key={index} />;
                              
                              const isSelected = selectedDate?.toDateString() === date.toDateString();
                              const hasAvailableTimes = getAvailableTimesForDate(date).length > 0;
                              
                              return (
                                <motion.button
                                  key={index}
                                  onClick={() => hasAvailableTimes && setSelectedDate(date)}
                                  disabled={!hasAvailableTimes}
                                  whileHover={hasAvailableTimes ? { scale: 1.07 } : {}}
                                  whileTap={hasAvailableTimes ? { scale: 0.98 } : {}}
                                  transition={{ duration: 0.08 }}
                                  className={`
                                    aspect-square p-1 rounded-lg flex items-center justify-center relative text-base
                                    transition-colors duration-200
                                    ${!hasAvailableTimes 
                                      ? 'text-gray-300 cursor-default' 
                                      : 'text-gray-700 hover:shadow-sm cursor-pointer'
                                    }
                                    ${isSelected 
                                      ? 'bg-gradient-to-l from-blue-600 to-blue-400 text-white font-medium shadow-sm scale-107' 
                                      : ''
                                    }
                                  `}
                                >
                                  {date.getDate()}
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>

                        {/* Time Slots */}
                        <motion.div 
                          className={`
                            absolute top-0 left-0 w-[32%] border-r border-gray-200 pr-8 pl-4
                            transition-all duration-700 ease-in-out transform origin-left
                            ${selectedDate ? 'translate-x-0 opacity-100 scale-x-100 h-[500px]' : 'translate-x-[-100%] opacity-0 scale-x-95'}
                          `}
                          layout
                        >
                          <h4 className="text-lg font-medium mb-4 text-blue-600">זמנים פנויים</h4>
                          <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[400px] pb-4 px-2">
                            {selectedDate && getAvailableTimesForDate(selectedDate).map((time) => (
                              <motion.button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                transition={{ duration: 0.1, ease: "easeOut" }}
                                className={`
                                  p-4 text-center rounded-lg border text-base relative
                                  transition-all duration-100
                                  hover:shadow-sm hover:border-blue-200
                                  ${selectedTime === time 
                                    ? 'bg-gradient-to-l from-blue-600 to-blue-400 text-white font-medium shadow-sm scale-101' 
                                    : ''
                                  }
                                `}
                              >
                                {time}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>

                        {/* Submit Button */}
                        <motion.div 
                          className={`
                            absolute bottom-0 left-0 right-0 transition-all duration-700 ease-in-out transform
                            ${selectedDate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}
                          `}
                          layout
                        >
                          <div className="flex gap-4">
                            <Button
                              onClick={handleSubmit}
                              disabled={!selectedMeeting || !selectedParticipant || !selectedDate || !selectedTime}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 text-lg
                                hover:from-blue-700 hover:to-blue-800 transition-all duration-300 ease-in-out shadow-lg
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 
                                disabled:hover:to-blue-700 disabled:shadow-none"
                            >
                              <Save className="h-5 w-5 ml-2" />
                              שמור שינויים
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => router.push('/meetings')}
                              className="flex-1 p-6 text-lg hover:bg-gray-50 hover:scale-[1.02] transition-all"
                            >
                              <ArrowRight className="h-5 w-5 ml-2" />
                              חזור
                            </Button>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export default EditMeetingPage;







