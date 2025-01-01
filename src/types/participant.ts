// Types for participant data
export interface Participant {
  _id: string;
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  meetings: string[];  // Array of meeting IDs
  lastMeeting?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Type for creating a new participant
export interface CreateParticipantDto {
  name: string;
  email: string;
  phone: string;
}

// Type for participant in meeting slot
export interface ParticipantInMeeting {
  _id: string;
  id?: string;
  fullName: string;
  email: string;
  phone: string;
}

// Response type for participant creation
export interface CreateParticipantResponse {
  participant: Participant;
}

// Response type for getting participants list
export interface GetParticipantsResponse {
  participants: Participant[];
}

// Type for updating participant
export interface UpdateParticipantDto {
  fullName?: string;
  email?: string;
  phone?: string;
}

// Response type for participant deletion
export interface DeleteParticipantResponse {
  message: string;
  deletedParticipant: Participant;
}
