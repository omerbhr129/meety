export interface TimeSlot {
  start: string;
  end: string;
}

export interface DayAvailability {
  enabled: boolean;
  timeSlots: TimeSlot[];
}

export type WeekDays = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export type Availability = {
  [key in WeekDays]: DayAvailability;
};

export interface Meeting {
  _id?: string;
  title: string;
  description?: string;
  duration: number;
  type: 'video' | 'phone' | 'in-person';
  userId?: string;
  status?: 'active' | 'deleted' | 'inactive';
  bookedSlots: Array<{
    _id: string;
    date: string;
    time: string;
    status?: 'completed' | 'missed' | 'pending';
    participant: {
      _id?: string;
      fullName: string;
      email: string;
      phone: string;
    };
  }>;
  availability: Availability;
  shareableLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to create a full availability object
export const createAvailability = (partial: Partial<Record<WeekDays, DayAvailability>>): Availability => {
  const days: WeekDays[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const availability = {} as Availability;
  
  days.forEach(day => {
    if (partial[day]) {
      // אם יש נתונים ליום הזה, נשתמש בהם
      availability[day] = {
        enabled: partial[day]!.enabled,
        timeSlots: partial[day]!.timeSlots.length > 0 
          ? partial[day]!.timeSlots 
          : [{ start: '09:00', end: '17:00' }]
      };
    } else {
      // אם אין נתונים, ניצור ברירת מחדל
      availability[day] = {
        enabled: false,
        timeSlots: [{ start: '09:00', end: '17:00' }]
      };
    }
  });
  
  return availability;
};
