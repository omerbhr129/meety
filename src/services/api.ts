import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { Meeting } from '../types/meeting';
import { User, CreateUserDto, UpdateUserDto, LoginUserDto, AuthResponse } from '../types/user';
import { 
  Participant, 
  CreateParticipantDto, 
  CreateParticipantResponse,
  GetParticipantsResponse 
} from '../types/participant';
import { toast } from '../components/ui/use-toast';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Create a public API instance without auth
const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Adding token to request:', {
        url: config.url,
        method: config.method,
        headers: config.headers
      });
    } else {
      console.log('No token found for request:', config.url);
    }
    
    return config;
  } catch (error) {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
});

// Response interceptor for logging and error handling
api.interceptors.response.use(async (response) => {
  try {
    console.log('API Response:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data
    });
    return response;
  } catch (error) {
    console.error('Response interceptor error:', error);
    return Promise.reject(error);
  }
}, async (error) => {
  try {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      if (error.config?.url?.includes('/auth/login')) {
        toast({
          variant: "destructive",
          title: "שגיאת התחברות",
          description: "שם משתמש או סיסמה לא נכונים",
        });
      } else if (typeof window !== 'undefined') {
        console.log('Invalid token, clearing and redirecting to login');
        localStorage.removeItem('token');
        window.location.href = '/';
      }
    } else if (error.response?.status === 400) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error.response?.data?.message || "אירעה שגיאה",
      });
    }

    return Promise.reject(error);
  } catch (error) {
    console.error('Error in error handler:', error);
    return Promise.reject(error);
  }
});

// Meeting APIs
export const getUserMeetings = async () => {
  try {
    console.log('Fetching user meetings');
    const response = await api.get<{ meetings: Meeting[] }>('/meetings');
    console.log('User meetings response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user meetings:', error);
    throw error;
  }
};

export const getMeeting = async (shareableLink: string) => {
  try {
    console.log('Fetching meeting:', shareableLink);
    // Use publicApi for public routes
    const response = await publicApi.get<{ meeting: Meeting }>(`/meetings/${shareableLink}`);
    console.log('Meeting response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching meeting:', error);
    throw error;
  }
};

export const createMeeting = async (meetingData: Partial<Meeting>) => {
  try {
    console.log('Creating meeting with data:', meetingData);
    const response = await api.post<{ meeting: Meeting }>('/meetings', meetingData);
    console.log('Meeting creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }
};

export const updateMeeting = async (meetingId: string, meetingData: Partial<Meeting>) => {
  try {
    console.log('Updating meeting:', { id: meetingId, data: meetingData });
    const response = await api.put<{ meeting: Meeting }>(`/meetings/${meetingId}`, meetingData);
    console.log('Meeting update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating meeting:', error);
    throw error;
  }
};

interface UpdateSlotDto {
  date: string;
  time: string;
  participant: string;
}

export const updateMeetingSlotStatus = async (
  meetingId: string,
  slotId: string,
  status: 'completed' | 'missed' | 'pending',
  updateData?: UpdateSlotDto
) => {
  try {
    console.log('Updating meeting slot:', { meetingId, slotId, status, updateData });
    
    // אם יש נתונים לעדכון, שלח אותם בנפרד מהסטטוס
    if (updateData) {
      const response = await api.patch<{ meeting: Meeting }>(
        `/meetings/${meetingId}/slots/${slotId}`,
        updateData
      );
      console.log('Slot update response:', response.data);
      return response.data;
    }
    
    // אחרת, עדכן רק את הסטטוס
    const response = await api.patch<{ meeting: Meeting }>(
      `/meetings/${meetingId}/slots/${slotId}/status`,
      { status }
    );
    console.log('Slot status update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating meeting slot:', error);
    throw error;
  }
};

export const deleteBookedSlot = async (meetingId: string, slotId: string) => {
  try {
    console.log('Deleting booked slot:', { meetingId, slotId });
    const response = await api.delete<{ meeting: Meeting }>(`/meetings/${meetingId}/slots/${slotId}`);
    console.log('Slot deletion response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting booked slot:', error);
    throw error;
  }
};

export const deleteMeeting = async (meetingId: string) => {
  try {
    console.log('Deleting meeting:', meetingId);
    const response = await api.delete(`/meetings/${meetingId}`);
    console.log('Meeting deletion response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting meeting:', error);
    throw error;
  }
};

// Participant APIs
export const getParticipants = async (): Promise<GetParticipantsResponse> => {
  try {
    console.log('Fetching participants');
    const response = await api.get<GetParticipantsResponse>('/participants');
    console.log('Participants response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching participants:', error);
    throw error;
  }
};

export const createParticipant = async (participantData: CreateParticipantDto): Promise<CreateParticipantResponse> => {
  try {
    console.log('Creating participant with data:', participantData);
    // Use publicApi for public routes
    const response = await publicApi.post<CreateParticipantResponse>('/participants', participantData);
    console.log('Participant creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating participant:', error);
    if (axios.isAxiosError(error)) {
      console.error('Server error response:', error.response?.data);
    }
    throw error;
  }
};

export const updateParticipant = async (participantId: string, participantData: Partial<Participant>) => {
  try {
    console.log('Updating participant:', { id: participantId, data: participantData });
    const response = await api.put<{ participant: Participant }>(
      `/participants/${participantId}`,
      participantData
    );
    console.log('Participant update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating participant:', error);
    throw error;
  }
};

export const deleteParticipant = async (participantId: string) => {
  try {
    console.log('Deleting participant:', participantId);
    const response = await api.delete(`/participants/${participantId}`);
    console.log('Participant deletion response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting participant:', error);
    throw error;
  }
};

// Booking APIs
interface BookMeetingDto {
  date: string;
  time: string;
  participant: string;  // participant ID
}

export const bookMeeting = async (shareableLink: string, bookingData: BookMeetingDto) => {
  try {
    console.log('Booking meeting:', { shareableLink, data: bookingData });
    
    if (!bookingData.participant) {
      throw new Error('Participant ID is required');
    }

    // Use the date as-is without timezone conversion
    const formattedDate = bookingData.date;
    
    console.log('Booking with date:', {
      date: formattedDate,
      time: bookingData.time,
      participant: bookingData.participant
    });
    
    // Use publicApi for public routes
    const response = await publicApi.post<{ booking: Meeting['bookedSlots'][0] }>(
      `/meetings/${shareableLink}/book`,
      {
        ...bookingData,
        date: formattedDate
      }
    );
    
    console.log('Booking response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error booking meeting:', error);
    throw error;
  }
};

// User APIs
export const getCurrentUser = async () => {
  try {
    console.log('Fetching current user');
    const response = await api.get<{ user: User }>('/user');
    console.log('Current user response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

export const updateUserProfile = async (userData: UpdateUserDto) => {
  try {
    console.log('Updating user profile:', userData);
    const response = await api.put<{ user: User }>('/user', userData);
    console.log('Profile update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const uploadProfileImage = async (file: File) => {
  try {
    console.log('Uploading profile image');
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<{ user: User }>('/user/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Image upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

export const deleteUserAccount = async () => {
  try {
    console.log('Deleting user account');
    const response = await api.delete('/user');
    console.log('Account deletion response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
};

// Auth APIs
export const login = async (email: string, password: string) => {
  try {
    console.log('Attempting login:', { email });
    // Use publicApi for auth routes
    const response = await publicApi.post<AuthResponse>('/auth/login', { email, password });
    console.log('Login response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (userData: CreateUserDto) => {
  try {
    console.log('Registering new user:', userData);
    // Use publicApi for auth routes
    const response = await publicApi.post<AuthResponse>('/auth/register', userData);
    console.log('Registration response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};
