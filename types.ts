export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface UserRegistration {
  id: string;
  fullName: string;
  phone: string;
  organization: string;
  status: UserStatus;
  timestamp: number;
}