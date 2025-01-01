import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Users, Phone, Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useAuth } from '../lib/auth';
import { useRouter } from 'next/router';
import { getUserMeetings, getParticipants, bookMeeting } from '../services/api';
import { useToast } from '../components/ui/use-toast';
import Head from 'next/head';
import { Meeting, WeekDays, TimeSlot } from '../types/meeting';
import { Participant } from '../types/participant';
import { motion } from 'framer-motion';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";

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

function NewSingleMeetingPage() {
  const router = useRouter();
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
        const [meetingsResponse, participantsResponse] = await Promise.all([
          getUserMeetings(),
          getParticipants()
        ]);

        setMeetings(meetingsResponse.meetings);
        setParticipants(participantsResponse.participants);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "שגיאה בטעינת הנתונים",
          description: "אנא נסה שוב מאוחר יותר"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const formatDateStr = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  const getAvailableTimesForDate = (date: Date | null): string[] => {
    if (!date || !selectedMeeting) return [];
    
    // בדיקה אם התאריך מהעבר
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return [];
    }
    
    const dayName = dayNames[date.getDay()];
    const dayAvailability = selectedMeeting.availability[dayName];
    
    if (!dayAvailability?.enabled || !dayAvailability?.timeSlots) return [];
    
    // Get current time if the date is today
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : 0;
    
    // Get booked times for this date
    const dateStr = formatDateStr(date);
    const bookedTimes = new Set(
      selectedMeeting.bookedSlots
        .filter(slot => slot.date === dateStr)
        .map(slot => slot.time)
    );
    
    // Generate only available time slots
    const availableSlots: string[] = [];
    
    dayAvailability.timeSlots.forEach((slot: TimeSlot) => {
      const timeSlots = generateTimeSlots(slot.start, slot.end, selectedMeeting.duration);
      
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

  const handleSubmit = async () => {
    if (!selectedMeeting || !selectedParticipant || !selectedDate || !selectedTime) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "יש למלא את כל השדות"
      });
      return;
    }

    try {
      // Format date as YYYY-MM-DD
      const formattedDate = formatDateStr(selectedDate);
      
      // Book the meeting
      await bookMeeting(selectedMeeting._id!, {
        date: formattedDate,
        time: selectedTime,
        participant: selectedParticipant._id!
      });

      toast({
        title: "הפגישה נקבעה בהצלחה",
        description: "הפגישה נוספה ליומן שלך"
      });
      
      router.push('/meetings');
    } catch (error: any) {
      console.error('Error booking meeting:', error);
      toast({
        variant: "destructive",
        title: "שגיאה בקביעת הפגישה",
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
        <title>פגישה חדשה | Meety</title>
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
                    פגישה חדשה
                  </h1>
                  <p className="text-gray-500 text-lg">
                    בחר סוג פגישה, משתתף, תאריך ושעה
                  </p>
                </div>

                <div className="space-y-10">
                  {/* Meeting Type Selection */}
                  <div className="space-y-3">
                    <label className="block text-right font-medium text-gray-700 text-lg">
                      סוג פגישה
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {meetings.map((meeting) => (
                        <button
                          key={meeting._id}
                          onClick={() => setSelectedMeeting(meeting)}
                          className={`
                            p-6 rounded-xl border-2 transition-all
                            ${selectedMeeting?._id === meeting._id
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-transparent'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                            }
                          `}
                        >
                          <div className="text-right">
                            <div className="font-semibold text-lg mb-1">{meeting.title}</div>
                            <div className="text-sm opacity-80">{meeting.duration} דקות</div>
                          </div>
                        </button>
                      ))}
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
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 
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
                                  className="flex flex-row-reverse items-center gap-2 px-4 py-3 text-gray-900 hover:bg-blue-50/50"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 
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
                            ${selectedDate ? 'w-2/3 scale-x-100 h-[500px]' : 'w-full scale-x-100 h-[700px]'}
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
                            absolute top-0 left-0 w-1/3 border-r pr-10 pl-4
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
                          <Button
                            onClick={handleSubmit}
                            disabled={!selectedMeeting || !selectedParticipant || !selectedDate || !selectedTime}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 text-lg
                              hover:from-blue-700 hover:to-blue-800 transition-all duration-300 ease-in-out shadow-lg
                              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 
                              disabled:hover:to-blue-700 disabled:shadow-none"
                          >
                            קבע פגישה
                          </Button>
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

export default NewSingleMeetingPage;
