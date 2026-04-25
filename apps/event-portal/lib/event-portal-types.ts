export type EventPortalJsonPrimitive = string | number | boolean | null;
export type EventPortalJsonValue =
  | EventPortalJsonPrimitive
  | EventPortalJsonValue[]
  | { [key: string]: EventPortalJsonValue };

export interface StrapiDocumentIdentity {
  id?: number;
  documentId: string;
}

export interface StrapiDocumentBase extends StrapiDocumentIdentity {
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  locale?: string | null;
}

export type StrapiRelation<T extends StrapiDocumentIdentity> = T | StrapiDocumentIdentity;
export type StrapiOneRelation<T extends StrapiDocumentIdentity> = StrapiRelation<T> | null;
export type StrapiManyRelation<T extends StrapiDocumentIdentity> = Array<StrapiRelation<T>>;
export type StrapiRelationInput = string | { documentId: string } | null;
export type StrapiManyRelationInput = Array<string | { documentId: string }>;
export type StrapiMediaInput = number | string | { id: number } | { documentId: string } | null;
export type StrapiManyMediaInput = Array<number | string | { id: number } | { documentId: string }>;

export interface StrapiUploadFile extends StrapiDocumentBase {
  name: string;
  alternativeText?: string | null;
  caption?: string | null;
  width?: number;
  height?: number;
  formats?: { [key: string]: EventPortalJsonValue };
  hash: string;
  ext?: string;
  mime: string;
  size: number;
  url: string;
  previewUrl?: string | null;
  provider?: string;
  providerMetadata?: { [key: string]: EventPortalJsonValue } | null;
}

export type EventPortalGroupStatus = 'ACTIVE' | 'DISABLED';
export type EventPortalPortalRole = 'ADMIN' | 'CLIENT_HR';
export type EventPortalKind = 'ERP' | 'EAP' | 'ECP';
export type EventPortalFieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'EMAIL'
  | 'MOBILE'
  | 'NUMBER'
  | 'DATE'
  | 'SELECT'
  | 'CHECKBOX'
  | 'RADIO';
export type EventPortalNotificationType = 'REGISTRATION' | 'ANNOUNCEMENT' | 'EVENT_UPDATE';
export type EventPortalNotificationChannel = 'EMAIL' | 'SMS';
export type EventPortalEventStatus = 'DRAFT' | 'RELEASED' | 'DISABLED' | 'CLOSED';
export type EventPortalTemplateStatus = 'ACTIVE' | 'ARCHIVED';
export type EventPortalNoticeStatus = 'PENDING' | 'SENT' | 'FAILED';
export type EventPortalAppointmentStatus = 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
export type EventPortalAppointmentHoldStatus = 'ACTIVE' | 'CONSUMED' | 'EXPIRED' | 'CANCELLED';
export type EventPortalCommunicationPreference = 'EMAIL' | 'SMS';

export interface EventPortalFieldConfigComponent {
  id?: number;
  fieldKey: string;
  labelEn: string;
  labelZh?: string;
  fieldType: EventPortalFieldType;
  required?: boolean;
  visibleInErp?: boolean;
  visibleInEcp?: boolean;
  visibleInEap?: boolean;
  sortOrder?: number;
  isSystem?: boolean;
  placeholderEn?: string;
  placeholderZh?: string;
  optionsJson?: EventPortalJsonValue;
  validationJson?: EventPortalJsonValue;
}

export interface EventPortalTemplateMessageComponent {
  id?: number;
  templateType: EventPortalNotificationType;
  noticeTemplate?: StrapiOneRelation<EventPortalNoticeTemplateEntity>;
  enabled?: boolean;
}

export interface EventPortalAppointmentHoldEntity extends StrapiDocumentBase {
  holdToken: string;
  expiresAt: string;
  appointmentHoldStatus?: EventPortalAppointmentHoldStatus;
  participantIdentityHash?: string;
  payload?: EventPortalJsonValue;
  event?: StrapiOneRelation<EventPortalEventEntity>;
  eventSlot?: StrapiOneRelation<EventPortalEventSlotEntity>;
}

export interface EventPortalAppointmentEntity extends StrapiDocumentBase {
  bookingReference: string;
  participantName: string;
  staffNumber?: string;
  medicalCardNumber?: string;
  hkidPrefix?: string;
  registeredEmail?: string;
  mobileNumber?: string;
  communicationPreference: EventPortalCommunicationPreference;
  appointmentStatus?: EventPortalAppointmentStatus;
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  quotaSnapshot?: number;
  cancelToken?: string;
  cancelledAt?: string;
  cancelledByEmail?: string;
  cancellationReason?: string;
  submittedAt?: string;
  portalSource?: EventPortalKind;
  termsAccepted?: boolean;
  participantIdentityHash?: string;
  payload?: EventPortalJsonValue;
  event?: StrapiOneRelation<EventPortalEventEntity>;
  eventSlot?: StrapiOneRelation<EventPortalEventSlotEntity>;
  auditLogs?: StrapiManyRelation<EventPortalAuditLogEntity>;
}

export interface EventPortalAuditLogEntity extends StrapiDocumentBase {
  entityType: string;
  entityDocumentId?: string;
  action: string;
  actorEmail?: string;
  actorRole?: string;
  details?: EventPortalJsonValue;
  appointment?: StrapiOneRelation<EventPortalAppointmentEntity>;
  event?: StrapiOneRelation<EventPortalEventEntity>;
}

export interface EventPortalContactInfoEntity extends StrapiDocumentBase {
  titleEn: string;
  titleZh?: string;
  descriptionEn?: string;
  descriptionZh?: string;
  email?: string;
  phone?: string;
  addressEn?: string;
  addressZh?: string;
  portalTargets: EventPortalKind[];
  sortOrder?: number;
  active?: boolean;
  userPartition?: StrapiOneRelation<EventPortalUserPartitionEntity>;
}

export interface EventPortalMandatoryFieldEntity extends StrapiDocumentBase {
  key: string;
  labelEn: string;
  labelZh?: string;
  fieldType: EventPortalFieldType;
  required?: boolean;
  placeholderEn?: string;
  placeholderZh?: string;
  helpTextEn?: string;
  helpTextZh?: string;
  validationJson?: EventPortalJsonValue;
  optionsJson?: EventPortalJsonValue;
  isActive?: boolean;
  sortOrder?: number;
}

export interface EventPortalEventSlotEntity extends StrapiDocumentBase {
  eventDate: string;
  startTime: string;
  endTime: string;
  enabled?: boolean;
  quota: number;
  usedCount?: number;
  holdCount?: number;
  sortOrder?: number;
  event?: StrapiOneRelation<EventPortalEventEntity>;
  appointments?: StrapiManyRelation<EventPortalAppointmentEntity>;
  holds?: StrapiManyRelation<EventPortalAppointmentHoldEntity>;
}

export interface EventPortalEventTemplateEntity extends StrapiDocumentBase {
  name: string;
  description?: string;
  eventTemplateStatus?: EventPortalTemplateStatus;
  userPartitions?: StrapiManyRelation<EventPortalUserPartitionEntity>;
  formFields?: EventPortalFieldConfigComponent[];
  events?: StrapiManyRelation<EventPortalEventEntity>;
}

export interface EventPortalEventEntity extends StrapiDocumentBase {
  companyName: string;
  companyNameZh?: string;
  location: string;
  locationZh?: string;
  eventName: string;
  eventNameZh?: string;
  eventDescription?: string;
  eventDescriptionZh?: string;
  eventNotes?: string;
  eventNotesZh?: string;
  eventStatus?: EventPortalEventStatus;
  eventStartDate: string;
  eventEndDate: string;
  dayStartTime: string;
  dayEndTime: string;
  registrationStartDate: string;
  registrationEndDate: string;
  reminderOffsetDays?: number;
  publicSlug?: string;
  publishedToPortals?: boolean;
  showInRegistrationPeriod?: boolean;
  showInEventPeriod?: boolean;
  showInExpired?: boolean;
  releasedAt?: string;
  publicBaseUrl?: string;
  registrationNoticeTemplate?: StrapiOneRelation<EventPortalNoticeTemplateEntity>;
  announcementNoticeTemplate?: StrapiOneRelation<EventPortalNoticeTemplateEntity>;
  eventUpdateNoticeTemplate?: StrapiOneRelation<EventPortalNoticeTemplateEntity>;
  userPartition?: StrapiOneRelation<EventPortalUserPartitionEntity>;
  template?: StrapiOneRelation<EventPortalEventTemplateEntity>;
  slots?: StrapiManyRelation<EventPortalEventSlotEntity>;
  appointments?: StrapiManyRelation<EventPortalAppointmentEntity>;
  holds?: StrapiManyRelation<EventPortalAppointmentHoldEntity>;
  auditLogs?: StrapiManyRelation<EventPortalAuditLogEntity>;
}

export interface EventPortalNoticeTemplateEntity extends StrapiDocumentBase {
  name: string;
  description?: string;
  channel: EventPortalNotificationChannel;
  subject?: string;
  plainTextBody: string;
  htmlBody?: string;
  active?: boolean;
  sortOrder?: number;
  notices?: StrapiManyRelation<EventPortalNoticeEntity>;
}

export interface EventPortalNoticeEntity extends StrapiDocumentBase {
  channel: EventPortalNotificationChannel;
  recipient: string;
  subject?: string;
  plainTextBody: string;
  htmlBody?: string;
  noticeStatus?: EventPortalNoticeStatus;
  errorMessage?: string;
  sentAt?: string;
  noticeTemplate?: StrapiOneRelation<EventPortalNoticeTemplateEntity>;
  appointment?: StrapiOneRelation<EventPortalAppointmentEntity>;
  event?: StrapiOneRelation<EventPortalEventEntity>;
}

export interface EventPortalPortalDocumentEntity extends StrapiDocumentBase {
  titleEn: string;
  titleZh?: string;
  descriptionEn?: string;
  descriptionZh?: string;
  portalTargets: EventPortalKind[];
  sortOrder?: number;
  active?: boolean;
  file: StrapiUploadFile | StrapiDocumentIdentity | null;
  userPartition?: StrapiOneRelation<EventPortalUserPartitionEntity>;
}

export interface StrapiUsersPermissionsRoleEntity extends StrapiDocumentBase {
  name: string;
  description?: string;
  type?: string;
}

export interface UsersPermissionsUserEntity extends StrapiDocumentBase {
  username: string;
  email: string;
  provider?: string;
  confirmed?: boolean;
  blocked?: boolean;
  portalRole?: EventPortalPortalRole;
  lastLoginAt?: string;
  role?: StrapiOneRelation<StrapiUsersPermissionsRoleEntity>;
  userGroups?: StrapiManyRelation<EventPortalUserGroupEntity>;
}

export interface EventPortalUserGroupEntity extends StrapiDocumentBase {
  code: string;
  description: string;
  remarks?: string;
  logo?: StrapiUploadFile | StrapiDocumentIdentity | null;
  userGroupStatus?: EventPortalGroupStatus;
  companyName?: string;
  partitions?: StrapiManyRelation<EventPortalUserPartitionEntity>;
  portalUsers?: StrapiManyRelation<UsersPermissionsUserEntity>;
}

export interface EventPortalUserPartitionEntity extends StrapiDocumentBase {
  code: string;
  description: string;
  slug: string;
  userPartitionStatus?: EventPortalGroupStatus;
  remarks?: string;
  logo?: StrapiUploadFile | StrapiDocumentIdentity | null;
  banners?: Array<StrapiUploadFile | StrapiDocumentIdentity>;
  userGroup?: StrapiOneRelation<EventPortalUserGroupEntity>;
  events?: StrapiManyRelation<EventPortalEventEntity>;
  template?: StrapiOneRelation<EventPortalEventTemplateEntity>;
  portalDocuments?: StrapiManyRelation<EventPortalPortalDocumentEntity>;
  contactInfos?: StrapiManyRelation<EventPortalContactInfoEntity>;
}

export interface EventPortalAppointmentHoldCreateInput {
  holdToken: string;
  expiresAt: string;
  appointmentHoldStatus?: EventPortalAppointmentHoldStatus;
  participantIdentityHash?: string;
  payload?: EventPortalJsonValue;
  event?: StrapiRelationInput;
  eventSlot?: StrapiRelationInput;
}

export type EventPortalAppointmentHoldUpdateInput = Partial<EventPortalAppointmentHoldCreateInput>;

export interface EventPortalAppointmentCreateInput {
  bookingReference: string;
  participantName: string;
  staffNumber?: string;
  medicalCardNumber?: string;
  hkidPrefix?: string;
  registeredEmail?: string;
  mobileNumber?: string;
  communicationPreference: EventPortalCommunicationPreference;
  appointmentStatus?: EventPortalAppointmentStatus;
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  quotaSnapshot?: number;
  cancelToken?: string;
  cancelledAt?: string;
  cancelledByEmail?: string;
  cancellationReason?: string;
  submittedAt?: string;
  portalSource?: EventPortalKind;
  termsAccepted?: boolean;
  participantIdentityHash?: string;
  payload?: EventPortalJsonValue;
  event?: StrapiRelationInput;
  eventSlot?: StrapiRelationInput;
  auditLogs?: StrapiManyRelationInput;
}

export type EventPortalAppointmentUpdateInput = Partial<EventPortalAppointmentCreateInput>;

export interface EventPortalAuditLogCreateInput {
  entityType: string;
  entityDocumentId?: string;
  action: string;
  actorEmail?: string;
  actorRole?: string;
  details?: EventPortalJsonValue;
  appointment?: StrapiRelationInput;
  event?: StrapiRelationInput;
}

export type EventPortalAuditLogUpdateInput = Partial<EventPortalAuditLogCreateInput>;

export interface EventPortalContactInfoCreateInput {
  titleEn: string;
  titleZh?: string;
  descriptionEn?: string;
  descriptionZh?: string;
  email?: string;
  phone?: string;
  addressEn?: string;
  addressZh?: string;
  portalTargets: EventPortalKind[];
  sortOrder?: number;
  active?: boolean;
  userPartition?: StrapiRelationInput;
}

export type EventPortalContactInfoUpdateInput = Partial<EventPortalContactInfoCreateInput>;

export interface EventPortalMandatoryFieldCreateInput {
  key: string;
  labelEn: string;
  labelZh?: string;
  fieldType: EventPortalFieldType;
  required?: boolean;
  placeholderEn?: string;
  placeholderZh?: string;
  helpTextEn?: string;
  helpTextZh?: string;
  validationJson?: EventPortalJsonValue;
  optionsJson?: EventPortalJsonValue;
  isActive?: boolean;
  sortOrder?: number;
}

export type EventPortalMandatoryFieldUpdateInput = Partial<EventPortalMandatoryFieldCreateInput>;

export interface EventPortalEventSlotCreateInput {
  eventDate: string;
  startTime: string;
  endTime: string;
  enabled?: boolean;
  quota: number;
  usedCount?: number;
  holdCount?: number;
  sortOrder?: number;
  event?: StrapiRelationInput;
  appointments?: StrapiManyRelationInput;
  holds?: StrapiManyRelationInput;
}

export type EventPortalEventSlotUpdateInput = Partial<EventPortalEventSlotCreateInput>;

export interface EventPortalEventSlotPayload {
  documentId?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  enabled?: boolean;
  quota: number;
  usedCount?: number;
  holdCount?: number;
  sortOrder?: number;
}

export interface EventPortalEventTemplateCreateInput {
  name: string;
  description?: string;
  eventTemplateStatus?: EventPortalTemplateStatus;
  userPartitions?: StrapiManyRelationInput;
  formFields?: EventPortalFieldConfigComponent[];
  events?: StrapiManyRelationInput;
}

export type EventPortalEventTemplateUpdateInput = Partial<EventPortalEventTemplateCreateInput>;

export interface EventPortalEventCreateInput {
  companyName: string;
  companyNameZh?: string;
  location: string;
  locationZh?: string;
  eventName: string;
  eventNameZh?: string;
  eventDescription?: string;
  eventDescriptionZh?: string;
  eventNotes?: string;
  eventNotesZh?: string;
  eventStatus?: EventPortalEventStatus;
  eventStartDate: string;
  eventEndDate: string;
  dayStartTime: string;
  dayEndTime: string;
  registrationStartDate: string;
  registrationEndDate: string;
  reminderOffsetDays?: number;
  publicSlug?: string;
  publishedToPortals?: boolean;
  showInRegistrationPeriod?: boolean;
  showInEventPeriod?: boolean;
  showInExpired?: boolean;
  releasedAt?: string;
  publicBaseUrl?: string;
  registrationNoticeTemplate?: StrapiRelationInput;
  announcementNoticeTemplate?: StrapiRelationInput;
  eventUpdateNoticeTemplate?: StrapiRelationInput;
  eventSlots?: EventPortalEventSlotPayload[];
  userPartition?: StrapiRelationInput;
  template?: StrapiRelationInput;
  slots?: StrapiManyRelationInput;
  appointments?: StrapiManyRelationInput;
  holds?: StrapiManyRelationInput;
  auditLogs?: StrapiManyRelationInput;
}

export type EventPortalEventUpdateInput = Partial<EventPortalEventCreateInput>;

export interface EventPortalNoticeTemplateCreateInput {
  name: string;
  description?: string;
  channel: EventPortalNotificationChannel;
  subject?: string;
  plainTextBody: string;
  htmlBody?: string;
  active?: boolean;
  sortOrder?: number;
  notices?: StrapiManyRelationInput;
}

export type EventPortalNoticeTemplateUpdateInput = Partial<EventPortalNoticeTemplateCreateInput>;

export interface EventPortalNoticeCreateInput {
  channel: EventPortalNotificationChannel;
  recipient: string;
  subject?: string;
  plainTextBody: string;
  htmlBody?: string;
  noticeStatus?: EventPortalNoticeStatus;
  errorMessage?: string;
  sentAt?: string;
  noticeTemplate?: StrapiRelationInput;
  appointment?: StrapiRelationInput;
  event?: StrapiRelationInput;
}

export type EventPortalNoticeUpdateInput = Partial<EventPortalNoticeCreateInput>;

export interface EventPortalPortalDocumentCreateInput {
  titleEn: string;
  titleZh?: string;
  descriptionEn?: string;
  descriptionZh?: string;
  portalTargets: EventPortalKind[];
  sortOrder?: number;
  active?: boolean;
  file: StrapiMediaInput;
  userPartition?: StrapiRelationInput;
}

export type EventPortalPortalDocumentUpdateInput = Partial<EventPortalPortalDocumentCreateInput>;

export interface UsersPermissionsUserCreateInput {
  username?: string;
  email: string;
  password?: string;
  confirmed?: boolean;
  blocked?: boolean;
  portalRole?: EventPortalPortalRole;
  lastLoginAt?: string;
  userGroups?: StrapiManyRelationInput;
}

export type UsersPermissionsUserUpdateInput = Partial<UsersPermissionsUserCreateInput>;

export interface StrapiAuthLoginInput {
  identifier: string;
  password: string;
}

export interface StrapiAuthRegisterInput {
  username: string;
  email: string;
  password: string;
  portalRole?: EventPortalPortalRole;
  userGroups?: StrapiManyRelationInput;
}

export interface StrapiAuthForgotPasswordInput {
  email: string;
}

export interface StrapiAuthResetPasswordInput {
  code: string;
  password: string;
  passwordConfirmation: string;
}

export interface StrapiAuthResponse {
  jwt: string;
  user: UsersPermissionsUserEntity;
}

export interface EventPortalUserGroupCreateInput {
  code: string;
  description: string;
  remarks?: string;
  logo?: StrapiMediaInput;
  userGroupStatus?: EventPortalGroupStatus;
  companyName?: string;
  partitions?: StrapiManyRelationInput;
  portalUsers?: StrapiManyRelationInput;
}

export type EventPortalUserGroupUpdateInput = Partial<EventPortalUserGroupCreateInput>;

export interface EventPortalUserPartitionCreateInput {
  code: string;
  description: string;
  slug: string;
  userPartitionStatus?: EventPortalGroupStatus;
  remarks?: string;
  logo?: StrapiMediaInput;
  banners?: StrapiManyMediaInput;
  userGroup?: StrapiRelationInput;
  events?: StrapiManyRelationInput;
  template?: StrapiRelationInput;
  portalDocuments?: StrapiManyRelationInput;
  contactInfos?: StrapiManyRelationInput;
}

export type EventPortalUserPartitionUpdateInput = Partial<EventPortalUserPartitionCreateInput>;
