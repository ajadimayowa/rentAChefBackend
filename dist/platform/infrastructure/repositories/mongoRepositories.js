"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoAuditLogRepository = exports.MongoUploadedFileRepository = exports.MongoChefMenuRepository = exports.MongoPaymentRepository = exports.MongoQuotationRepository = exports.MongoChefRepository = exports.MongoServicePricingRepository = exports.MongoServiceRepository = exports.MongoBookingRepository = void 0;
const schemas_1 = require("../database/schemas");
const Service_1 = require("../../../models/Service");
const ServicePricing_1 = require("../../../models/ServicePricing");
const enums_1 = require("../../domain/enums");
const toIdString = (value) => String(value);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
class MongoBookingRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const created = yield schemas_1.ChefPlatformBookingModel.create(data);
            const obj = created.toObject();
            return Object.assign(Object.assign({}, obj), { id: toIdString(obj._id) });
        });
    }
    updateById(bookingId, patch) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield schemas_1.ChefPlatformBookingModel.findByIdAndUpdate(bookingId, patch, { new: true });
            if (!updated)
                return null;
            const obj = updated.toObject();
            return Object.assign(Object.assign({}, obj), { id: toIdString(obj._id) });
        });
    }
    findById(bookingId) {
        return __awaiter(this, void 0, void 0, function* () {
            const found = yield schemas_1.ChefPlatformBookingModel.findById(bookingId);
            if (!found)
                return null;
            const obj = found.toObject();
            return Object.assign(Object.assign({}, obj), { id: toIdString(obj._id) });
        });
    }
    findByBookingNumber(bookingNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const found = yield schemas_1.ChefPlatformBookingModel.findOne({ bookingNumber });
            if (!found)
                return null;
            const obj = found.toObject();
            return Object.assign(Object.assign({}, obj), { id: toIdString(obj._id) });
        });
    }
    find(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const query = {};
            if (filters.customerId)
                query.customerId = filters.customerId;
            if (filters.status)
                query.status = filters.status;
            if (filters.workflow)
                query.workflow = filters.workflow;
            if (filters.paymentStatus)
                query.paymentStatus = filters.paymentStatus;
            if (filters.bookingNumber)
                query.bookingNumber = filters.bookingNumber;
            if (filters.search) {
                const pattern = new RegExp(escapeRegex(filters.search), 'i');
                query.$or = [{ bookingNumber: pattern }, { transactnRef: pattern }];
            }
            const page = Math.max(1, Math.floor((_a = filters.page) !== null && _a !== void 0 ? _a : 1));
            const limit = Math.min(100, Math.max(1, Math.floor((_b = filters.limit) !== null && _b !== void 0 ? _b : 10)));
            const skip = (page - 1) * limit;
            const [rows, total] = yield Promise.all([
                schemas_1.ChefPlatformBookingModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
                schemas_1.ChefPlatformBookingModel.countDocuments(query),
            ]);
            const totalPages = Math.ceil(total / limit) || 1;
            return {
                items: rows.map((row) => (Object.assign(Object.assign({}, row), { id: toIdString(row._id) }))),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                },
            };
        });
    }
}
exports.MongoBookingRepository = MongoBookingRepository;
class MongoServiceRepository {
    findById(serviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const found = yield schemas_1.ChefPlatformServiceModel.findById(serviceId).lean();
            if (found) {
                const bookingType = found.bookingType || found.paymentModel;
                return Object.assign(Object.assign({}, found), { id: toIdString(found._id), bookingType });
            }
            const legacyService = yield Service_1.ServiceModel.findById(serviceId).lean();
            if (!legacyService)
                return null;
            return {
                id: toIdString(legacyService._id),
                categoryId: toIdString(legacyService.categoryId),
                serviceId: toIdString(legacyService._id),
                code: `LEGACY_${toIdString(legacyService._id)}`,
                name: String(legacyService.name || ''),
                description: legacyService.description,
                bookingType: String(legacyService.bookingType || legacyService.paymentModel || '').toLowerCase() === 'quotation'
                    ? enums_1.BookingType.QUOTATION
                    : enums_1.BookingType.INSTANT,
                supportsChefMenu: false,
                supportsCustomerMenuUpload: false,
                supportsProcurement: true,
                active: legacyService.isActive !== false,
            };
        });
    }
}
exports.MongoServiceRepository = MongoServiceRepository;
class MongoServicePricingRepository {
    findActivePricing(serviceId, chefLevel, effectiveAt) {
        return __awaiter(this, void 0, void 0, function* () {
            const found = yield schemas_1.ChefPlatformServicePricingModel.findOne({
                serviceId,
                chefLevel,
                isActive: true,
                effectiveFrom: { $lte: effectiveAt },
                $or: [{ effectiveTo: null }, { effectiveTo: { $exists: false } }, { effectiveTo: { $gte: effectiveAt } }],
            })
                .sort({ effectiveFrom: -1 })
                .lean();
            if (found) {
                return Object.assign(Object.assign({}, found), { id: toIdString(found._id) });
            }
            const legacyPricing = yield ServicePricing_1.ServicePricing.findOne({ serviceId }).lean();
            if (!legacyPricing)
                return null;
            const legacyPrice = Number(legacyPricing.price || 0);
            return {
                id: toIdString(legacyPricing._id),
                serviceId: toIdString(legacyPricing.serviceId),
                chefLevel,
                basePriceMinor: Math.round(legacyPrice * 100),
                currency: 'NGN',
                effectiveFrom: legacyPricing.createdAt || effectiveAt,
                effectiveTo: undefined,
                isActive: true,
            };
        });
    }
}
exports.MongoServicePricingRepository = MongoServicePricingRepository;
class MongoChefRepository {
    findAssignableChefs(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield schemas_1.ChefPlatformChefModel.find({
                level: input.chefLevel,
                isActive: true,
                servicesOffered: { $in: [input.serviceId] },
            })
                .sort({ 'ratings.average': -1, experienceYears: -1 })
                .lean();
            return rows.map((row) => (Object.assign(Object.assign({}, row), { id: toIdString(row._id) })));
        });
    }
    findById(chefId) {
        return __awaiter(this, void 0, void 0, function* () {
            const found = yield schemas_1.ChefPlatformChefModel.findById(chefId).lean();
            if (!found)
                return null;
            return Object.assign(Object.assign({}, found), { id: toIdString(found._id) });
        });
    }
}
exports.MongoChefRepository = MongoChefRepository;
class MongoQuotationRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const created = yield schemas_1.ChefPlatformQuotationModel.create(data);
            const obj = created.toObject();
            return Object.assign(Object.assign({}, obj), { id: toIdString(obj._id) });
        });
    }
    updateById(quotationId, patch) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield schemas_1.ChefPlatformQuotationModel.findByIdAndUpdate(quotationId, patch, { new: true }).lean();
            if (!updated)
                return null;
            return Object.assign(Object.assign({}, updated), { id: toIdString(updated._id) });
        });
    }
    findByBookingId(bookingId) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield schemas_1.ChefPlatformQuotationModel.find({ bookingId }).sort({ createdAt: -1 }).lean();
            return rows.map((row) => (Object.assign(Object.assign({}, row), { id: toIdString(row._id) })));
        });
    }
    findById(quotationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const found = yield schemas_1.ChefPlatformQuotationModel.findById(quotationId).lean();
            if (!found)
                return null;
            return Object.assign(Object.assign({}, found), { id: toIdString(found._id) });
        });
    }
}
exports.MongoQuotationRepository = MongoQuotationRepository;
class MongoPaymentRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const created = yield schemas_1.ChefPlatformPaymentModel.create(data);
            const obj = created.toObject();
            return Object.assign(Object.assign({}, obj), { id: toIdString(obj._id) });
        });
    }
    updateByReference(reference, patch) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield schemas_1.ChefPlatformPaymentModel.findOneAndUpdate({ paymentReference: reference }, patch, { new: true }).lean();
            if (!updated)
                return null;
            return Object.assign(Object.assign({}, updated), { id: toIdString(updated._id) });
        });
    }
    findByReference(reference) {
        return __awaiter(this, void 0, void 0, function* () {
            const found = yield schemas_1.ChefPlatformPaymentModel.findOne({ paymentReference: reference }).lean();
            if (!found)
                return null;
            return Object.assign(Object.assign({}, found), { id: toIdString(found._id) });
        });
    }
}
exports.MongoPaymentRepository = MongoPaymentRepository;
class MongoChefMenuRepository {
    findPublishedById(menuId) {
        return __awaiter(this, void 0, void 0, function* () {
            const found = yield schemas_1.ChefPlatformChefMenuModel.findOne({ _id: menuId, status: 'PUBLISHED' }).lean();
            if (!found)
                return null;
            return Object.assign(Object.assign({}, found), { id: toIdString(found._id) });
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const created = yield schemas_1.ChefPlatformChefMenuModel.create(data);
            const obj = created.toObject();
            return Object.assign(Object.assign({}, obj), { id: toIdString(obj._id) });
        });
    }
}
exports.MongoChefMenuRepository = MongoChefMenuRepository;
class MongoUploadedFileRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const created = yield schemas_1.ChefPlatformUploadedFileModel.create(data);
            const obj = created.toObject();
            return Object.assign(Object.assign({}, obj), { id: toIdString(obj._id) });
        });
    }
    findById(fileId) {
        return __awaiter(this, void 0, void 0, function* () {
            const found = yield schemas_1.ChefPlatformUploadedFileModel.findById(fileId).lean();
            if (!found)
                return null;
            return Object.assign(Object.assign({}, found), { id: toIdString(found._id) });
        });
    }
}
exports.MongoUploadedFileRepository = MongoUploadedFileRepository;
class MongoAuditLogRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const created = yield schemas_1.ChefPlatformAuditLogModel.create(data);
            const obj = created.toObject();
            return Object.assign(Object.assign({}, obj), { id: toIdString(obj._id) });
        });
    }
}
exports.MongoAuditLogRepository = MongoAuditLogRepository;
