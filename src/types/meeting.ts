import { User } from './user';
import { Participant } from './participant';

export type WeekDays = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export interface TimeSlot {
  start: string;
  end: string;
}

export interface BookedSlot {
  _id: string;
  date: string;
  time: string;
  notes?: string;
  status?: 'completed' | 'missed' | 'pending' | 'deleted';
  participant: {
    _id?: string;
    fullName: string;
    email: string;
    phone: string;
  };
}

export interface ExtendedBookedSlot extends BookedSlot {
  meetingId: string;
  title: string;
  type: 'video' | 'phone' | 'in-person';
  duration: number;
}

export interface DayAvailability {
  enabled: boolean;
  timeSlots?: TimeSlot[];
}

export type Availability = Record<WeekDays, DayAvailability>;

export interface Meeting {
  _id?: string;
  title: string;
  type: 'video' | 'phone' | 'in-person';
  duration: number;
  shareableLink?: string;
  status?: 'active' | 'inactive';
  availability: Availability;
  bookedSlots: BookedSlot[];
  user?: User;
  participants?: Participant[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MeetingResponse {
  success: boolean;
  message?: string;
  meeting?: Meeting;
  meetings?: Meeting[];
  error?: any;
}

export interface CreateMeetingInput {
  title: string;
  type: 'video' | 'phone' | 'in-person';
  duration: number;
  availability: Availability;
}

export interface UpdateMeetingInput extends Partial<CreateMeetingInput> {
  _id: string;
}

export interface BookMeetingInput {
  meetingId: string;
  date: string;
  time: string;
  participant: {
    fullName: string;
    email: string;
    phone: string;
  };
}

export interface UpdateMeetingStatusInput {
  meetingId: string;
  slotId: string;
  status: 'completed' | 'missed' | 'deleted' | 'pending';
}

export interface UpdateMeetingNotesInput {
  meetingId: string;
  slotId: string;
  notes: string;
}

export const createAvailability = (days: Record<WeekDays, { enabled: boolean; timeSlots: TimeSlot[] }>): Availability => {
  return {
    sunday: { enabled: days.sunday.enabled, timeSlots: days.sunday.timeSlots },
    monday: { enabled: days.monday.enabled, timeSlots: days.monday.timeSlots },
    tuesday: { enabled: days.tuesday.enabled, timeSlots: days.tuesday.timeSlots },
    wednesday: { enabled: days.wednesday.enabled, timeSlots: days.wednesday.timeSlots },
    thursday: { enabled: days.thursday.enabled, timeSlots: days.thursday.timeSlots },
    friday: { enabled: days.friday.enabled, timeSlots: days.friday.timeSlots },
    saturday: { enabled: days.saturday.enabled, timeSlots: days.saturday.timeSlots }
  };
};
