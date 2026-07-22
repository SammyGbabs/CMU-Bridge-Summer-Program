/* SafeSeizure Doctor Dashboard - Type Definitions */

export type UserRole = 'doctor' | 'admin' | 'patient' | 'caregiver';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'escalated';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export type PatientStatus = 'stable' | 'monitoring' | 'alert' | 'offline';
export type DeviceStatus = 'online' | 'offline' | 'low-battery' | 'error';

export type SeizureType = 'tonic-clonic' | 'focal' | 'absence' | 'atonic' | 'myoclonic' | 'unknown';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type MessageType = 'text' | 'image' | 'document' | 'alert';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Doctor extends User {
  role: 'doctor';
  licenseNumber: string;
  specialization: string;
  facility: string;
  patientsCount: number;
  isAvailable: boolean;
  availability?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
}

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    country: string;
    city: string;
    state?: string;
    houseAddress: string;
    zipCode?: string;
  };
  emergencyContact?: {
    fullName: string;
    relation: string;
    email?: string;
    phoneCountryCode: string;
    phone: string;
  };
  dateOfBirth: Date;
  gender?: string;
  status: PatientStatus;
  riskLevel: RiskLevel;
  photo?: string;

  /* Medical Information */
  diagnoses: string[];
  medicationAdherence: number; /* 0-100 */
  lastSeizureDate?: Date;
  seizureFrequency: string;
  averageSeizureDuration: number; /* seconds */

  /* Devices & Monitoring */
  devices: Device[];
  locationEnabled: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  /* Relations */
  doctorId: string;
  caregiverIds: string[];

  /* Metadata */
  createdAt: Date;
  updatedAt: Date;
}

export interface Device {
  id: string;
  patientId: string;
  serialNumber?: string;
  name: string;
  type: 'wearable' | 'implant' | 'mobile' | 'sensor';
  status: DeviceStatus;
  batteryLevel?: number;
  lastSyncTime: Date;
  nextScheduledCheck: Date;
}

export interface DeviceInventoryItem {
  id: string;
  serialNumber: string;
  name: string;
  type: 'wearable' | 'implant' | 'mobile' | 'sensor';
  status: 'available' | 'assigned';
  createdAt: Date;
}

export interface SeizureEvent {
  id: string;
  patientId: string;
  type: SeizureType;
  startTime: Date;
  duration: number; /* seconds */
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  severity: AlertSeverity;
  witnesses?: string[];
  notes?: string;
  treatmentProvided?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  id: string;
  patientId: string;
  type: 'seizure' | 'device' | 'medication' | 'appointment' | 'manual';
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  timestamp: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  escalatedTo?: string[];
  metadata?: Record<string, any>;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedDate: Date;
  startDate: Date;
  endDate?: Date;
  sideEffects?: string[];
  adherenceRate: number;
  notes?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  type: MessageType;
  content: string;
  attachmentUrl?: string;
  isRead: boolean;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  patientId: string;
  doctorId: string;
  participantIds: string[];
  participantNames: string[];
  lastMessage?: Message;
  lastMessageTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  type: 'consultation' | 'follow-up' | 'medication-review' | 'emergency';
  status: AppointmentStatus;
  startTime: Date;
  endTime: Date;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalPatients: number;
  activeAlerts: number;
  onlineDevices: number;
  appointmentsToday: number;
  pendingMessages: number;
  seizuresToday: number;
  deviceIssues: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  status: 'success' | 'failure';
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  doctorId: string;
  title: string;
  content: string;
  type: 'observation' | 'assessment' | 'plan' | 'follow-up';
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentRecord {
  id: string;
  patientId: string;
  type: 'location-sharing' | 'data-access' | 'messaging' | 'device-monitoring';
  status: 'granted' | 'denied' | 'revoked';
  grantedAt?: Date;
  revokedAt?: Date;
  consentedBy: string;
}
