export type PortalKind = 'EAP' | 'ECP' | 'ERP';
export type GroupStatus = 'ACTIVE' | 'DISABLED';
export type PortalRole = 'ADMIN' | 'CLIENT_HR';
export type EventStatus = 'DRAFT' | 'RELEASED' | 'DISABLED' | 'CLOSED';
export type FieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'EMAIL'
  | 'MOBILE'
  | 'NUMBER'
  | 'DATE'
  | 'SELECT'
  | 'CHECKBOX'
  | 'RADIO';
export type CommunicationPreference = 'EMAIL' | 'SMS';
export type AppointmentStatus = 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
export type NotificationType = 'REGISTRATION' | 'ANNOUNCEMENT' | 'EVENT_UPDATE';
export type NotificationChannel = 'EMAIL' | 'SMS';
export type NoticeStatus = 'PENDING' | 'SENT' | 'FAILED';
export type LanguageCode = 'EN' | 'ZH';
export type FormLayoutMode = 'SINGLE_COLUMN' | 'TWO_COLUMN' | 'SPLIT';

export interface MediaAssetDTO {
  documentId?: string;
  name: string;
  url: string;
  alternativeText?: string | null;
  width?: number;
  height?: number;
}

export interface UserPartitionDTO {
  documentId: string;
  code: string;
  description: string;
  slug: string;
  status: GroupStatus;
  remarks?: string;
  groupCompanyName?: string;
  userGroupCodes: string[];
  userGroupDocumentIds?: string[];
  templateDocumentId?: string;
  templateName?: string;
  logo?: MediaAssetDTO;
  banners: MediaAssetDTO[];
}

export interface UserGroupDTO {
  documentId: string;
  code: string;
  description: string;
  companyName?: string;
  remarks?: string;
  status: GroupStatus;
  logo?: MediaAssetDTO;
  partitionCodes: string[];
  partitionDocumentIds?: string[];
  portalUserDocumentIds?: string[];
  portalUsers?: Array<{
    documentId: string;
    username: string;
    email: string;
    status: GroupStatus;
    portalRole: PortalRole;
  }>;
}

export interface UserAccountDTO {
  documentId: string;
  username: string;
  email: string;
  status: GroupStatus;
  portalRole: PortalRole;
  confirmed?: boolean;
  provider?: string;
  roleName?: string;
  roleType?: string;
  lastLoginAt?: string;
  userGroupCodes: string[];
  userGroupDocumentIds?: string[];
}

export interface FormFieldConfigDTO {
  fieldKey: string;
  labelEn: string;
  labelZh?: string;
  fieldType: FieldType;
  required: boolean;
  visibleInERP: boolean;
  visibleInECP: boolean;
  visibleInEAP: boolean;
  sortOrder: number;
  isSystem: boolean;
  placeholderEn?: string;
  placeholderZh?: string;
  options?: string[];
}

export interface EventTemplateDTO {
  documentId: string;
  name: string;
  description?: string;
  partitionCodes: string[];
  partitionDocumentIds?: string[];
  fieldCount: number;
  fields: FormFieldConfigDTO[];
}

export interface EventSlotDTO {
  documentId: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
  quota: number;
  usedCount: number;
  holdCount: number;
  remaining: number;
}

export interface EventDateDTO {
  documentId: string;
  date: string;
  enabled: boolean;
  slots: EventSlotDTO[];
}

export interface NotificationTemplateDTO {
  type: NotificationType;
  templateDocumentId?: string;
  templateName?: string;
  channel?: NotificationChannel;
  subject?: string;
  enabled: boolean;
}

export interface NoticeTemplateDTO {
  documentId: string;
  name: string;
  description?: string;
  channel: NotificationChannel;
  subject?: string;
  plainTextBody: string;
  htmlBody?: string;
  active: boolean;
  sortOrder: number;
}

export interface NoticeDTO {
  documentId: string;
  templateDocumentId?: string;
  templateName?: string;
  appointmentDocumentId?: string;
  bookingReference?: string;
  eventDocumentId?: string;
  eventName?: string;
  participantName?: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  plainTextBody: string;
  htmlBody?: string;
  status: NoticeStatus;
  errorMessage?: string;
  sentAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventListItemDTO {
  documentId: string;
  eventCode: string;
  companyName: string;
  location: string;
  eventName: string;
  description?: string;
  notes?: string;
  partitionCode: string;
  partitionDocumentId?: string;
  templateDocumentId?: string;
  status: EventStatus;
  registrationStartDate: string;
  registrationEndDate: string;
  eventStartDate: string;
  eventEndDate: string;
  dayStartTime: string;
  dayEndTime: string;
  showInRegistrationPeriod?: boolean;
  showInEventPeriod?: boolean;
  showInExpired?: boolean;
  reminderOffsetDays: number;
  publishedToPortals?: boolean;
  publicUrl: string;
  qrPayload: string;
  layoutMode?: FormLayoutMode;
  customCss?: string;
}

export interface EventDetailDTO {
  event: EventListItemDTO & {
    fields: FormFieldConfigDTO[];
    dates: EventDateDTO[];
    notifications: NotificationTemplateDTO[];
  };
}

export interface AppointmentDTO {
  documentId: string;
  bookingReference: string;
  eventDocumentId: string;
  eventName: string;
  companyName: string;
  participantName: string;
  staffNumber?: string;
  medicalCardNumber?: string;
  hkidPrefix?: string;
  registeredEmail?: string;
  mobileNumber?: string;
  communicationPreference: CommunicationPreference;
  status: AppointmentStatus;
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  quota: number;
  remainingAfterBooking?: number;
  cancelToken?: string;
  portalSource: PortalKind;
}

export interface PortalDocumentDTO {
  documentId: string;
  titleEn: string;
  titleZh?: string;
  descriptionEn?: string;
  descriptionZh?: string;
  portalTargets: PortalKind[];
  sortOrder?: number;
  active?: boolean;
  fileName: string;
  downloadUrl?: string;
  partitionDocumentId?: string;
  partitionCode?: string;
}

export interface ContactInfoDTO {
  documentId: string;
  titleEn: string;
  titleZh?: string;
  descriptionEn?: string;
  descriptionZh?: string;
  email?: string;
  phone?: string;
  addressEn?: string;
  addressZh?: string;
  portalTargets: PortalKind[];
  sortOrder?: number;
  active?: boolean;
  partitionDocumentId?: string;
  partitionCode?: string;
}

export interface DashboardDTO {
  headline: string;
  stats: Array<{
    label: string;
    value: string;
    helper?: string;
  }>;
}

export interface PartitionLandingDTO {
  partition: UserPartitionDTO;
  events: EventListItemDTO[];
  documents: PortalDocumentDTO[];
  contacts: ContactInfoDTO[];
}

export interface CreateHoldInput {
  eventDocumentId: string;
  eventSlotDocumentId: string;
  partitionCode: string;
}

export interface HoldResponseDTO {
  holdToken: string;
  expiresAt: string;
  remaining: number;
  slotDocumentId: string;
}

export interface CreateBookingInput {
  eventDocumentId: string;
  eventSlotDocumentId: string;
  partitionCode: string;
  holdToken: string;
  participantName: string;
  staffNumber?: string;
  medicalCardNumber?: string;
  hkidPrefix?: string;
  registeredEmail?: string;
  mobileNumber?: string;
  communicationPreference: CommunicationPreference;
  termsAccepted: boolean;
  formValues?: Record<string, string>;
}

export interface EnquiryInput {
  registeredEmail?: string;
  mobileNumber?: string;
}

export interface EnquiryResponseDTO {
  accepted: boolean;
  message: string;
}

export * from './fixtures';
