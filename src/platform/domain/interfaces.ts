import { BookingStatus, BookingType, BookingWorkflow, ChefLevel, MenuSelectionType, ModeOfPayment, NotificationChannel, PaymentStatus, ProcurementOption, UserRole } from './enums';

export interface IUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChef {
  id: string;
  userId: string;
  level: ChefLevel;
  servicesOffered: string[];
  availability: IChefAvailability[];
  ratings: IChefRatingSnapshot;
  experienceYears: number;
  certifications: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChefAvailability {
  start: Date;
  end: Date;
  isBooked: boolean;
  zone?: string;
}

export interface IChefRatingSnapshot {
  average: number;
  totalReviews: number;
}

export interface IServiceCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface IService {
  id: string;
  categoryId: string;
  serviceId: string;
  code: string;
  name: string;
  description?: string;
  bookingType: BookingType;
  supportsChefMenu: boolean;
  supportsCustomerMenuUpload: boolean;
  supportsProcurement: boolean;
  active: boolean;
}

export interface IServicePricing {
  id: string;
  serviceId: string;
  chefLevel: ChefLevel;
  basePriceMinor: number;
  currency: 'NGN';
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
}

export interface IUploadedFile {
  id: string;
  ownerUserId: string;
  purpose: string;
  storageProvider: string;
  fileName: string;
  mimeType: string;
  extension: string;
  fileUrl: string;
  sizeBytes: number;
  metadata?: Record<string, unknown>;
  approvedByAdmin: boolean;
  createdAt: Date;
}

export interface IChefMenu {
  id: string;
  chefId: string;
  serviceSubCategoryId: string;
  menuTitle: string;
  menuDescription?: string;
  menuItems: string[];
  estimatedGuestCount?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface IBookingProcurement {
  option: ProcurementOption;
  estimatedIngredientCostMinor: number;
  finalIngredientCostMinor?: number;
  procurementFeeMinor: number;
}

export interface IBookingModifier {
  code: string;
  label: string;
  amountMinor: number;
  source: 'SYSTEM' | 'ADMIN' | 'WORKFLOW';
}

export interface IBooking {
  id: string;
  bookingNumber: string;
  customerId: string;
  serviceId?: string;
  specialServiceId?: string;
  workflow: BookingWorkflow;
  chefLevel?: ChefLevel;
  assignedChefId?: string;
  modeOfPayment: ModeOfPayment;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  transactnRef?: string;
  menuSelectionType?: MenuSelectionType;
  chefMenuId?: string;
  customerUploadedMenuFileId?: string;
  procurement?: IBookingProcurement;
  modifiers?: IBookingModifier[];
  bookingData: Record<string, unknown>;
  pricingSnapshot: {
    baseChefFeeMinor: number;
    estimatedTotalMinor: number;
    currency: 'NGN';
  };
  timeline: Array<{
    status: BookingStatus;
    changedBy: string;
    changedAt: Date;
    reason?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuotation {
  id: string;
  bookingId: string;
  chefFeeMinor: number;
  ingredientCostMinor: number;
  procurementFeeMinor: number;
  additionalChargesMinor: number;
  discountMinor: number;
  taxMinor: number;
  finalAmountMinor: number;
  currency: 'NGN';
  generatedBy: string;
  notes?: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment {
  id: string;
  bookingId: string;
  quotationId?: string;
  customerId: string;
  provider: 'PAYSTACK';
  amountMinor: number;
  currency: 'NGN';
  paymentReference: string;
  providerTransactionId?: string;
  status: PaymentStatus;
  transactionDetails?: Record<string, unknown>;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  id: string;
  recipientUserId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  sentAt?: Date;
  readAt?: Date;
}

export interface IAuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
