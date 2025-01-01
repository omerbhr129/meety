import React, { useState } from 'react';
import { Calendar, Clock, Video, Users, Phone, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { useAuth } from '../lib/auth';
import { useRouter } from 'next/router';
import { createMeeting } from '../services/api';
import { useToast } from '../components/ui/use-toast';
import Head from 'next/head';
import { Meeting, TimeSlot, WeekDays, createAvailability } from '../types/meeting';
import { MeetingCreatedDialog } from '../components/MeetingCreatedDialog';

interface Day {
  id: WeekDays;
  label: string;
}

interface Duration {
  value: number;
  label: string;
}

interface MeetingType {
  id: 'video' | 'phone' | 'in-person';
  icon: React.ElementType;
  label: string;
  description: string;
}

interface Hour {
  value: string;
  label: string;
}

interface Settings {
  title: string;
  duration: number;
  type: 'video' | 'phone' | 'in-person';
  days: Record<WeekDays, {
    enabled: boolean;
    timeSlots: TimeSlot[];
  }>;
}

const DAYS: Day[] = [
  { id: 'sunday', label: 'ראשון' },
  { id: 'monday', label: 'שני' },
  { id: 'tuesday', label: 'שלישי' },
  { id: 'wednesday', label: 'רביעי' },
  { id: 'thursday', label: 'חמישי' },
  { id: 'friday', label: 'שישי' },
  { id: 'saturday', label: 'שבת' }
];

const HOURS: Hour[] = Array.from({ length: 24 }, (_, i) => ({
  value: `${i.toString().padStart(2, '0')}:00`,
  label: `${i.toString().padStart(2, '0')}:00`
}));

const DURATIONS: Duration[] = [
  { value: 15, label: '15 דקות' },
  { value: 30, label: '30 דקות' },
  { value: 45, label: '45 דקות' },
  { value: 60, label: 'שעה' },
  { value: 90, label: 'שעה וחצי' }
];

const MEETING_TYPES: MeetingType[] = [
  { id: 'video', icon: Video, label: 'שיחת וידאו', description: 'פגישה באמצעות Zoom או Google Meet' },
  { id: 'phone', icon: Phone, label: 'שיחה טלפונית', description: 'שיחה רגילה בטלפון' },
  { id: 'in-person', icon: Users, label: 'פגישה פרונטלית', description: 'פגישה פנים אל פנים במשרד' }
];

const getTypeStyles = (type: string, isSelected: boolean) => {
  switch (type) {
    case 'video':
      return isSelected 
        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-transparent' 
        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50';
    case 'phone':
      return isSelected 
        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-transparent' 
        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50';
    case 'in-person':
      return isSelected 
        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-transparent' 
        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50';
    default:
      return '';
  }
};

const getButtonGradient = (type: 'video' | 'phone' | 'in-person') => {
  switch (type) {
    case 'video':
      return 'bg-gradient-to-r from-blue-500 to-blue-600';
    case 'phone':
      return 'bg-gradient-to-r from-green-500 to-green-600';
    case 'in-person':
      return 'bg-gradient-to-r from-purple-500 to-purple-600';
    default:
      return 'bg-gradient-to-r from-blue-500 to-blue-600';
  }
};

function NewMeetingPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState('settings');
  const [selectedDay, setSelectedDay] = useState<WeekDays | null>(null);
  const [createdMeeting, setCreatedMeeting] = useState<Meeting | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    title: '',
    duration: 30,
    type: 'video',
    days: DAYS.reduce((acc, day) => ({
      ...acc,
      [day.id]: { 
        enabled: false, 
        timeSlots: [{ start: '09:00', end: '17:00' }]
      }
    }), {} as Record<WeekDays, { enabled: boolean; timeSlots: TimeSlot[] }>)
  });

  const handleDayClick = (dayId: WeekDays) => {
    if (selectedDay === dayId) {
      setSelectedDay(null);
      setSettings(prev => ({
        ...prev,
        days: {
          ...prev.days,
          [dayId]: {
            ...prev.days[dayId],
            enabled: false
          }
        }
      }));
    } else {
      setSelectedDay(dayId);
      setSettings(prev => ({
        ...prev,
        days: {
          ...prev.days,
          [dayId]: {
            ...prev.days[dayId],
            enabled: true
          }
        }
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!settings.title) {
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: "נא להזין כותרת לפגישה"
        });
        return;
      }

      const availability = createAvailability(settings.days);

      const hasEnabledDays = Object.values(availability).some(day => day.enabled);
      if (!hasEnabledDays) {
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: "נא לבחור לפחות יום אחד זמין"
        });
        return;
      }

      const meetingData: Partial<Meeting> = {
        title: settings.title,
        duration: settings.duration,
        type: settings.type,
        availability
      };

      const response = await createMeeting(meetingData);
      
      toast({
        title: "הצלחה!",
        description: "הפגישה נוצרה בהצלחה"
      });

      setCreatedMeeting(response.meeting);
      setShowDialog(true);
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "שגיאה ביצירת פגישה";
      
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: errorMessage
      });
    }
  };

  return (
    <>
      <Head>
        <title>יצירת פגישה | Meety</title>
      </Head>
      <div className="min-h-screen p-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden bg-white/90 backdrop-blur-lg shadow-xl border-0">
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
                <div 
                  className={`h-full transition-all duration-500 ${getButtonGradient(settings.type)}`}
                  style={{ width: step === 'settings' ? '50%' : '100%' }}
                />
              </div>

              <div className="p-8 space-y-12">
                <div className="text-center">
                  <div className={`inline-flex p-4 rounded-2xl mb-6 shadow-inner
                    ${settings.type === 'video' ? 'bg-blue-50' : 
                      settings.type === 'phone' ? 'bg-green-50' : 
                      'bg-purple-50'}`}>
                    {step === 'settings' ? (
                      <Calendar className={`h-8 w-8 
                        ${settings.type === 'video' ? 'text-blue-600' : 
                          settings.type === 'phone' ? 'text-green-600' : 
                          'text-purple-600'}`} />
                    ) : (
                      <Clock className={`h-8 w-8 
                        ${settings.type === 'video' ? 'text-blue-600' : 
                          settings.type === 'phone' ? 'text-green-600' : 
                          'text-purple-600'}`} />
                    )}
                  </div>
                  <h1 className={`text-3xl font-bold mb-3 bg-clip-text text-transparent
                    ${settings.type === 'video' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 
                      settings.type === 'phone' ? 'bg-gradient-to-r from-green-600 to-green-700' : 
                      'bg-gradient-to-r from-purple-600 to-purple-700'}`}>
                    {step === 'settings' ? 'הגדרות פגישה' : 'הגדרת זמינות'}
                  </h1>
                  <p className="text-gray-500 text-lg">
                    {step === 'settings' 
                      ? 'הגדר את פרטי הפגישה הבסיסיים'
                      : 'בחר את הזמנים בהם תהיה זמין לפגישות'
                    }
                  </p>
                </div>

                {step === 'settings' ? (
                  <div className="space-y-10">
                    <div className="space-y-3">
                      <label className="block text-right font-medium text-gray-700 text-lg">
                        שם הפגישה
                      </label>
                      <Input
                        value={settings.title}
                        onChange={(e) => setSettings({...settings, title: e.target.value})}
                        className="p-6 text-lg"
                        placeholder="לדוגמה: פגישת ייעוץ עסקי"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-right font-medium text-gray-700 text-lg">
                        משך הפגישה
                      </label>
                      <div className="grid grid-cols-5 gap-3">
                        {DURATIONS.map(({ value, label }) => (
                          <button
                            key={value}
                            onClick={() => setSettings({...settings, duration: value})}
                            className={`p-4 rounded-xl transition-all text-lg ${
                              settings.duration === value
                                ? getButtonGradient(settings.type) + ' text-white shadow-lg'
                                : 'bg-white border border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-right font-medium text-gray-700 text-lg">
                        סוג הפגישה
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        {MEETING_TYPES.map(({ id, icon: Icon, label, description }) => {
                          const isSelected = settings.type === id;
                          const typeStyles = getTypeStyles(id, isSelected);
                          
                          return (
                            <button
                              key={id}
                              onClick={() => setSettings({...settings, type: id})}
                              className={`
                                p-8 rounded-xl border-2 transition-all group
                                ${typeStyles}
                              `}
                            >
                              <div className="flex flex-col items-center gap-4">
                                <Icon className={`h-8 w-8 transition-colors ${
                                  isSelected ? 'text-white' : 'text-gray-600 group-hover:text-gray-800'
                                }`} />
                                <div className="text-center">
                                  <div className={`font-medium text-lg mb-1 transition-colors ${
                                    isSelected ? 'text-white' : 'text-gray-900'
                                  }`}>{label}</div>
                                  <p className={`text-sm transition-colors ${
                                    isSelected ? 'text-white/75' : 'text-gray-500'
                                  }`}>
                                    {description}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      onClick={() => setStep('availability')}
                      className={`w-full text-white p-6 text-lg transition-all ${getButtonGradient(settings.type)}`}
                    >
                      המשך להגדרת זמינות
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-3">
                      {DAYS.map((day) => (
                        <div key={day.id}>
                          <div 
                            onClick={() => handleDayClick(day.id)}
                            className={`
                              flex items-center justify-between p-5 rounded-xl border transition-all cursor-pointer
                              ${settings.days[day.id].enabled 
                                ? getButtonGradient(settings.type) + ' border-transparent text-white' 
                                : 'bg-white border-gray-200 hover:border-gray-300'
                              }
                            `}
                          >
                            <span className="text-lg font-medium">
                              {day.label}
                            </span>
                            {settings.days[day.id].enabled && (
                              <div className="hover:bg-white/10 p-2 rounded-lg transition-colors">
                                {selectedDay === day.id ? (
                                  <ChevronUp className="h-5 w-5" />
                                ) : (
                                  <ChevronDown className="h-5 w-5" />
                                )}
                              </div>
                            )}
                          </div>

                          {settings.days[day.id].enabled && selectedDay === day.id && (
                            <div className="mt-3 p-6 bg-white rounded-xl border border-gray-200 space-y-4">
                              {settings.days[day.id].timeSlots.map((slot, index) => (
                                <div key={index} className="p-4 rounded-xl bg-gray-50">
                                  <div className="flex items-center gap-4">
                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                      {['start', 'end'].map((timeType) => (
                                        <div key={timeType} className="relative">
                                          <select
                                            className="w-full appearance-none px-4 py-3 bg-white border border-gray-200 
                                                     text-gray-900 rounded-xl focus:outline-none focus:border-blue-500 
                                                     focus:ring-2 focus:ring-blue-100 transition-all text-right pr-4
                                                     hover:border-gray-300"
                                            value={slot[timeType as keyof TimeSlot]}
                                            onChange={(e) => {
                                              const newSlots = [...settings.days[day.id].timeSlots];
                                              newSlots[index] = {
                                                ...newSlots[index],
                                                [timeType]: e.target.value
                                              };
                                              setSettings(prev => ({
                                                ...prev,
                                                days: {
                                                  ...prev.days,
                                                  [day.id]: {
                                                    ...prev.days[day.id],
                                                    timeSlots: newSlots
                                                  }
                                                }
                                              }));
                                            }}
                                          >
                                            {HOURS.map(({ value, label }) => (
                                              <option key={value} value={value}>{label}</option>
                                            ))}
                                          </select>
                                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        </div>
                                      ))}
                                    </div>
                                    <button 
                                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newSlots = settings.days[day.id].timeSlots.filter((_, i) => i !== index);
                                        setSettings(prev => ({
                                          ...prev,
                                          days: {
                                            ...prev.days,
                                            [day.id]: {
                                              ...prev.days[day.id],
                                              timeSlots: newSlots
                                            }
                                          }
                                        }));
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              
                              <Button
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newSlots = [...settings.days[day.id].timeSlots, { start: '09:00', end: '17:00' }];
                                  setSettings(prev => ({
                                    ...prev,
                                    days: {
                                      ...prev.days,
                                      [day.id]: {
                                        ...prev.days[day.id],
                                        timeSlots: newSlots
                                      }
                                    }
                                  }));
                                }}
                                className={`w-full py-6 border-2 border-dashed border-gray-200 
                                       text-gray-500 hover:border-${settings.type === 'video' ? 'blue' : 
                                         settings.type === 'phone' ? 'green' : 
                                         'purple'}-200 hover:text-${settings.type === 'video' ? 'blue' : 
                                         settings.type === 'phone' ? 'green' : 
                                         'purple'}-600 
                                       hover:bg-${settings.type === 'video' ? 'blue' : 
                                         settings.type === 'phone' ? 'green' : 
                                         'purple'}-50/50 font-medium rounded-xl`}
                              >
                                <Plus className="h-5 w-5 ml-2" />
                                הוסף חלון זמן נוסף
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setStep('settings')}
                        className="flex-1 p-6 text-lg"
                      >
                        חזרה
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        className={`flex-1 text-white p-6 text-lg ${getButtonGradient(settings.type)}`}
                      >
                        צור פגישה
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <MeetingCreatedDialog
        meeting={createdMeeting}
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
      />
    </>
  );
}

export default NewMeetingPage;
