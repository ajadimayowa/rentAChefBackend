import { FilterQuery } from 'mongoose';
import {
  IAuditLogRepository,
  IBookingRepository,
  BookingListResult,
  BookingSearchFilters,
  IChefMenuRepository,
  IChefRepository,
  IPaymentRepository,
  IQuotationRepository,
  IServicePricingRepository,
  IServiceRepository,
  IUploadedFileRepository,
} from '../../application/contracts/repositories';
import { BookingStatus, ChefLevel, PaymentStatus } from '../../domain/enums';
import { IAuditLog, IBooking, IChef, IChefMenu, IPayment, IQuotation, IService, IServicePricing, IUploadedFile } from '../../domain/interfaces';
import {
  ChefPlatformAuditLogModel,
  ChefPlatformBookingModel,
  ChefPlatformChefMenuModel,
  ChefPlatformChefModel,
  ChefPlatformPaymentModel,
  ChefPlatformQuotationModel,
  ChefPlatformServiceModel,
  ChefPlatformServicePricingModel,
  ChefPlatformUploadedFileModel,
} from '../database/schemas';
import { ServiceModel } from '../../../models/Service';
import { ServicePricing as LegacyServicePricingModel } from '../../../models/ServicePricing';
import { BookingType } from '../../domain/enums';

const toIdString = (value: unknown): string => String(value);

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class MongoBookingRepository implements IBookingRepository {
  async create(data: Partial<IBooking>): Promise<IBooking> {
    const created = await ChefPlatformBookingModel.create(data);
    const obj = created.toObject() as any;
    return { ...obj, id: toIdString(obj._id) } as IBooking;
  }

  async updateById(bookingId: string, patch: Partial<IBooking>): Promise<IBooking | null> {
    const updated = await ChefPlatformBookingModel.findByIdAndUpdate(bookingId, patch, { new: true });
    if (!updated) return null;
    const obj = updated.toObject() as any;
    return { ...obj, id: toIdString(obj._id) } as IBooking;
  }

  async findById(bookingId: string): Promise<IBooking | null> {
    const found = await ChefPlatformBookingModel.findById(bookingId);
    if (!found) return null;
    const obj = found.toObject() as any;
    return { ...obj, id: toIdString(obj._id) } as IBooking;
  }

  async findByBookingNumber(bookingNumber: string): Promise<IBooking | null> {
    const found = await ChefPlatformBookingModel.findOne({ bookingNumber });
    if (!found) return null;
    const obj = found.toObject() as any;
    return { ...obj, id: toIdString(obj._id) } as IBooking;
  }

  async find(filters: BookingSearchFilters): Promise<BookingListResult> {
    const query: FilterQuery<any> = {};
    if (filters.customerId) query.customerId = filters.customerId;
    if (filters.status) query.status = filters.status;
    if (filters.workflow) query.workflow = filters.workflow;
    if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
    if (filters.bookingNumber) query.bookingNumber = filters.bookingNumber;

    if (filters.search) {
      const pattern = new RegExp(escapeRegex(filters.search), 'i');
      query.$or = [{ bookingNumber: pattern }, { transactnRef: pattern }];
    }

    const page = Math.max(1, Math.floor(filters.page ?? 1));
    const limit = Math.min(100, Math.max(1, Math.floor(filters.limit ?? 10)));
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      ChefPlatformBookingModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ChefPlatformBookingModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: rows.map((row: any) => ({ ...row, id: toIdString(row._id) })) as IBooking[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}

export class MongoServiceRepository implements IServiceRepository {
  async findById(serviceId: string): Promise<IService | null> {
    const found = await ChefPlatformServiceModel.findById(serviceId).lean();
    if (found) {
      const bookingType = (found as any).bookingType || (found as any).paymentModel;
      return { ...(found as any), id: toIdString((found as any)._id), bookingType } as IService;
    }

    const legacyService = await ServiceModel.findById(serviceId).lean();
    if (!legacyService) return null;

    return {
      id: toIdString((legacyService as any)._id),
      categoryId: toIdString((legacyService as any).categoryId),
      serviceId: toIdString((legacyService as any)._id),
      code: `LEGACY_${toIdString((legacyService as any)._id)}`,
      name: String((legacyService as any).name || ''),
      description: (legacyService as any).description,
      bookingType:
        String((legacyService as any).bookingType || (legacyService as any).paymentModel || '').toLowerCase() === 'quotation'
          ? BookingType.QUOTATION
          : BookingType.INSTANT,
      supportsChefMenu: false,
      supportsCustomerMenuUpload: false,
      supportsProcurement: true,
      active: (legacyService as any).isActive !== false,
    } as IService;
  }
}

export class MongoServicePricingRepository implements IServicePricingRepository {
  async findActivePricing(serviceId: string, chefLevel: ChefLevel, effectiveAt: Date): Promise<IServicePricing | null> {
    const found = await ChefPlatformServicePricingModel.findOne({
      serviceId,
      chefLevel,
      isActive: true,
      effectiveFrom: { $lte: effectiveAt },
      $or: [{ effectiveTo: null }, { effectiveTo: { $exists: false } }, { effectiveTo: { $gte: effectiveAt } }],
    })
      .sort({ effectiveFrom: -1 })
      .lean();

    if (found) {
      return { ...(found as any), id: toIdString((found as any)._id) } as IServicePricing;
    }

    const legacyPricing = await LegacyServicePricingModel.findOne({ serviceId }).lean();
    if (!legacyPricing) return null;

    const legacyPrice = Number((legacyPricing as any).price || 0);

    return {
      id: toIdString((legacyPricing as any)._id),
      serviceId: toIdString((legacyPricing as any).serviceId),
      chefLevel,
      basePriceMinor: Math.round(legacyPrice * 100),
      currency: 'NGN',
      effectiveFrom: (legacyPricing as any).createdAt || effectiveAt,
      effectiveTo: undefined,
      isActive: true,
    } as IServicePricing;
  }
}

export class MongoChefRepository implements IChefRepository {
  async findAssignableChefs(input: { chefLevel: ChefLevel; serviceId: string; start?: Date | undefined; end?: Date | undefined; }): Promise<IChef[]> {
    const rows = await ChefPlatformChefModel.find({
      level: input.chefLevel,
      isActive: true,
      servicesOffered: { $in: [input.serviceId] },
    })
      .sort({ 'ratings.average': -1, experienceYears: -1 })
      .lean();

    return rows.map((row: any) => ({ ...row, id: toIdString(row._id) })) as IChef[];
  }

  async findById(chefId: string): Promise<IChef | null> {
    const found = await ChefPlatformChefModel.findById(chefId).lean();
    if (!found) return null;
    return { ...(found as any), id: toIdString((found as any)._id) } as IChef;
  }
}

export class MongoQuotationRepository implements IQuotationRepository {
  async create(data: Partial<IQuotation>): Promise<IQuotation> {
    const created = await ChefPlatformQuotationModel.create(data);
    const obj = created.toObject() as any;
    return { ...obj, id: toIdString(obj._id) } as IQuotation;
  }

  async updateById(quotationId: string, patch: Partial<IQuotation>): Promise<IQuotation | null> {
    const updated = await ChefPlatformQuotationModel.findByIdAndUpdate(quotationId, patch, { new: true }).lean();
    if (!updated) return null;
    return { ...(updated as any), id: toIdString((updated as any)._id) } as IQuotation;
  }

  async findByBookingId(bookingId: string): Promise<IQuotation[]> {
    const rows = await ChefPlatformQuotationModel.find({ bookingId }).sort({ createdAt: -1 }).lean();
    return rows.map((row: any) => ({ ...row, id: toIdString(row._id) })) as IQuotation[];
  }

  async findById(quotationId: string): Promise<IQuotation | null> {
    const found = await ChefPlatformQuotationModel.findById(quotationId).lean();
    if (!found) return null;
    return { ...(found as any), id: toIdString((found as any)._id) } as IQuotation;
  }
}

export class MongoPaymentRepository implements IPaymentRepository {
  async create(data: Partial<IPayment>): Promise<IPayment> {
    const created = await ChefPlatformPaymentModel.create(data);
    const obj = created.toObject() as any;
    return { ...obj, id: toIdString(obj._id) } as IPayment;
  }

  async updateByReference(reference: string, patch: Partial<IPayment>): Promise<IPayment | null> {
    const updated = await ChefPlatformPaymentModel.findOneAndUpdate({ paymentReference: reference }, patch, { new: true }).lean();
    if (!updated) return null;
    return { ...(updated as any), id: toIdString((updated as any)._id) } as IPayment;
  }

  async findByReference(reference: string): Promise<IPayment | null> {
    const found = await ChefPlatformPaymentModel.findOne({ paymentReference: reference }).lean();
    if (!found) return null;
    return { ...(found as any), id: toIdString((found as any)._id) } as IPayment;
  }
}

export class MongoChefMenuRepository implements IChefMenuRepository {
  async findPublishedById(menuId: string): Promise<IChefMenu | null> {
    const found = await ChefPlatformChefMenuModel.findOne({ _id: menuId, status: 'PUBLISHED' }).lean();
    if (!found) return null;
    return { ...(found as any), id: toIdString((found as any)._id) } as IChefMenu;
  }

  async create(data: Partial<IChefMenu>): Promise<IChefMenu> {
    const created = await ChefPlatformChefMenuModel.create(data);
    const obj = created.toObject() as any;
    return { ...obj, id: toIdString(obj._id) } as IChefMenu;
  }
}

export class MongoUploadedFileRepository implements IUploadedFileRepository {
  async create(data: Partial<IUploadedFile>): Promise<IUploadedFile> {
    const created = await ChefPlatformUploadedFileModel.create(data);
    const obj = created.toObject() as any;
    return { ...obj, id: toIdString(obj._id) } as IUploadedFile;
  }

  async findById(fileId: string): Promise<IUploadedFile | null> {
    const found = await ChefPlatformUploadedFileModel.findById(fileId).lean();
    if (!found) return null;
    return { ...(found as any), id: toIdString((found as any)._id) } as IUploadedFile;
  }
}

export class MongoAuditLogRepository implements IAuditLogRepository {
  async create(data: Partial<IAuditLog>): Promise<IAuditLog> {
    const created = await ChefPlatformAuditLogModel.create(data);
    const obj = created.toObject() as any;
    return { ...obj, id: toIdString(obj._id) } as IAuditLog;
  }
}
