import { BookingStatus, BookingWorkflow,ChefLevel, PaymentStatus } from '../../domain/enums';
import { IAuditLog, IBooking, IChef, IChefMenu, IPayment, IQuotation, IService, IServicePricing, IUploadedFile } from '../../domain/interfaces';

export interface BookingSearchFilters {
  customerId?: string;
  status?: BookingStatus;
  workflow?: BookingWorkflow;
  paymentStatus?: PaymentStatus;
  bookingNumber?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BookingListResult {
  items: IBooking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface IBookingRepository {
  create(data: Partial<IBooking>): Promise<IBooking>;
  updateById(bookingId: string, patch: Partial<IBooking>): Promise<IBooking | null>;
  findById(bookingId: string): Promise<IBooking | null>;
  findByBookingNumber(bookingNumber: string): Promise<IBooking | null>;
  find(filters: BookingSearchFilters): Promise<BookingListResult>;
}

export interface IServiceRepository {
  findById(serviceId: string): Promise<IService | null>;
}

export interface IServicePricingRepository {
  findActivePricing(serviceId: string, chefLevel: ChefLevel, effectiveAt: Date): Promise<IServicePricing | null>;
}

export interface IChefRepository {
  findAssignableChefs(input: {
    chefLevel: ChefLevel;
    serviceId: string;
    start?: Date;
    end?: Date;
  }): Promise<IChef[]>;
  findById(chefId: string): Promise<IChef | null>;
}

export interface IQuotationRepository {
  create(data: Partial<IQuotation>): Promise<IQuotation>;
  updateById(quotationId: string, patch: Partial<IQuotation>): Promise<IQuotation | null>;
  findByBookingId(bookingId: string): Promise<IQuotation[]>;
  findById(quotationId: string): Promise<IQuotation | null>;
}

export interface IPaymentRepository {
  create(data: Partial<IPayment>): Promise<IPayment>;
  updateByReference(reference: string, patch: Partial<IPayment>): Promise<IPayment | null>;
  findByReference(reference: string): Promise<IPayment | null>;
}

export interface IChefMenuRepository {
  findPublishedById(menuId: string): Promise<IChefMenu | null>;
  create(data: Partial<IChefMenu>): Promise<IChefMenu>;
}

export interface IUploadedFileRepository {
  create(data: Partial<IUploadedFile>): Promise<IUploadedFile>;
  findById(fileId: string): Promise<IUploadedFile | null>;
}

export interface IAuditLogRepository {
  create(data: Partial<IAuditLog>): Promise<IAuditLog>;
}
