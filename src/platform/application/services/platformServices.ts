import { BookingEngine } from '../engines/bookingEngine';
import { ChefAssignmentEngine } from '../engines/chefAssignmentEngine';
import { PaymentEngine } from '../engines/paymentEngine';
import { QuotationEngine } from '../engines/quotationEngine';
import { CreateBookingInput } from '../../domain/workflow';
import { BookingSearchFilters, IBookingRepository, IChefMenuRepository, IUploadedFileRepository } from '../contracts/repositories';

export class CustomerBookingService {
  constructor(
    private readonly bookingEngine: BookingEngine,
    private readonly paymentEngine: PaymentEngine,
    private readonly bookingRepository: IBookingRepository,
  ) {}


  

  async createBooking(input: CreateBookingInput, actorId: string) {
    console.log('Creating booking with input:', input);
    return this.bookingEngine.createBooking(input, actorId);
  }

  async initializeInstantPayment(input: { bookingId: string; customerId: string; customerEmail: string }) {
    return this.paymentEngine.initializeInstantPayment(input);
  }

  async listBookings(filters: BookingSearchFilters) {
    return this.bookingRepository.find(filters);
  }
}

export class AdminBookingService {
  constructor(
    private readonly quotationEngine: QuotationEngine,
    private readonly chefAssignmentEngine: ChefAssignmentEngine,
    private readonly paymentEngine: PaymentEngine,
  ) {}

  async generateQuotation(input: {
    bookingId: string;
    chefFeeMinor: number;
    ingredientCostMinor: number;
    procurementFeeMinor: number;
    additionalChargesMinor: number;
    discountMinor: number;
    taxMinor: number;
    notes?: string;
    generatedBy: string;
  }) {
    return this.quotationEngine.generateQuotation(input);
  }

  async assignChef(bookingId: string, actorId: string) {
    return this.chefAssignmentEngine.autoAssignChef(bookingId, actorId);
  }

  async initializeQuotationPayment(input: {
    bookingId: string;
    quotationId: string;
    customerId: string;
    customerEmail: string;
  }) {
    return this.paymentEngine.initializeQuotationPayment(input);
  }

  async confirmPayment(reference: string, payload: Record<string, unknown>) {
    return this.paymentEngine.confirmPayment(reference, payload);
  }
}

export class MenuService {
  constructor(
    private readonly chefMenuRepository: IChefMenuRepository,
    private readonly uploadedFileRepository: IUploadedFileRepository,
  ) {}

  async createChefMenu(input: {
    chefId: string;
    serviceSubCategoryId: string;
    menuTitle: string;
    menuDescription?: string;
    menuItems: string[];
    estimatedGuestCount?: number;
  }) {
    return this.chefMenuRepository.create({
      chefId: input.chefId,
      serviceSubCategoryId: input.serviceSubCategoryId,
      menuTitle: input.menuTitle,
      menuDescription: input.menuDescription,
      menuItems: input.menuItems,
      estimatedGuestCount: input.estimatedGuestCount,
      status: 'PUBLISHED',
    });
  }

  async registerUploadedMenu(input: {
    ownerUserId: string;
    fileName: string;
    mimeType: string;
    extension: string;
    fileUrl: string;
    sizeBytes: number;
  }) {
    const supported = ['pdf', 'docx', 'jpg', 'png'];
    if (!supported.includes(input.extension.toLowerCase())) {
      throw new Error('Unsupported file format. Allowed: PDF, DOCX, JPG, PNG');
    }

    return this.uploadedFileRepository.create({
      ownerUserId: input.ownerUserId,
      purpose: 'CUSTOMER_MENU_UPLOAD',
      storageProvider: 'S3',
      fileName: input.fileName,
      mimeType: input.mimeType,
      extension: input.extension,
      fileUrl: input.fileUrl,
      sizeBytes: input.sizeBytes,
      approvedByAdmin: false,
    });
  }
}
