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
exports.MenuService = exports.AdminBookingService = exports.CustomerBookingService = void 0;
class CustomerBookingService {
    constructor(bookingEngine, paymentEngine, bookingRepository) {
        this.bookingEngine = bookingEngine;
        this.paymentEngine = paymentEngine;
        this.bookingRepository = bookingRepository;
    }
    createBooking(input, actorId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Creating booking with input:', input);
            return this.bookingEngine.createBooking(input, actorId);
        });
    }
    initializeInstantPayment(input) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.paymentEngine.initializeInstantPayment(input);
        });
    }
    listBookings(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bookingRepository.find(filters);
        });
    }
}
exports.CustomerBookingService = CustomerBookingService;
class AdminBookingService {
    constructor(quotationEngine, chefAssignmentEngine, paymentEngine) {
        this.quotationEngine = quotationEngine;
        this.chefAssignmentEngine = chefAssignmentEngine;
        this.paymentEngine = paymentEngine;
    }
    generateQuotation(input) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.quotationEngine.generateQuotation(input);
        });
    }
    assignChef(bookingId, actorId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.chefAssignmentEngine.autoAssignChef(bookingId, actorId);
        });
    }
    initializeQuotationPayment(input) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.paymentEngine.initializeQuotationPayment(input);
        });
    }
    confirmPayment(reference, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.paymentEngine.confirmPayment(reference, payload);
        });
    }
}
exports.AdminBookingService = AdminBookingService;
class MenuService {
    constructor(chefMenuRepository, uploadedFileRepository) {
        this.chefMenuRepository = chefMenuRepository;
        this.uploadedFileRepository = uploadedFileRepository;
    }
    createChefMenu(input) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.chefMenuRepository.create({
                chefId: input.chefId,
                serviceSubCategoryId: input.serviceSubCategoryId,
                menuTitle: input.menuTitle,
                menuDescription: input.menuDescription,
                menuItems: input.menuItems,
                estimatedGuestCount: input.estimatedGuestCount,
                status: 'PUBLISHED',
            });
        });
    }
    registerUploadedMenu(input) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
}
exports.MenuService = MenuService;
