"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildChefPlatformModule = void 0;
const bookingEngine_1 = require("./application/engines/bookingEngine");
const bookingStateMachine_1 = require("./application/engines/bookingStateMachine");
const chefAssignmentEngine_1 = require("./application/engines/chefAssignmentEngine");
const paymentEngine_1 = require("./application/engines/paymentEngine");
const quotationEngine_1 = require("./application/engines/quotationEngine");
const platformServices_1 = require("./application/services/platformServices");
const paymentStrategies_1 = require("./application/strategies/paymentStrategies");
const pricingStrategies_1 = require("./application/strategies/pricingStrategies");
const definitions_1 = require("./application/workflows/definitions");
const registry_1 = require("./application/workflows/registry");
const mongoRepositories_1 = require("./infrastructure/repositories/mongoRepositories");
const buildChefPlatformModule = () => {
    const workflowRegistry = new registry_1.WorkflowRegistry();
    definitions_1.workflowDefinitions.forEach((definition) => workflowRegistry.register(definition));
    const bookingRepository = new mongoRepositories_1.MongoBookingRepository();
    const chefMenuRepository = new mongoRepositories_1.MongoChefMenuRepository();
    const uploadedFileRepository = new mongoRepositories_1.MongoUploadedFileRepository();
    const auditLogRepository = new mongoRepositories_1.MongoAuditLogRepository();
    const quotationRepository = new mongoRepositories_1.MongoQuotationRepository();
    const paymentRepository = new mongoRepositories_1.MongoPaymentRepository();
    const chefRepository = new mongoRepositories_1.MongoChefRepository();
    const pricingStrategy = new pricingStrategies_1.StandardPricingStrategy();
    const paymentStrategy = new paymentStrategies_1.PaystackInstantPaymentStrategy();
    const bookingEngine = new bookingEngine_1.BookingEngine(pricingStrategy, bookingRepository, auditLogRepository);
    const quotationEngine = new quotationEngine_1.QuotationEngine(bookingRepository, quotationRepository);
    const paymentEngine = new paymentEngine_1.PaymentEngine(paymentStrategy, bookingRepository, quotationRepository, paymentRepository);
    const chefAssignmentEngine = new chefAssignmentEngine_1.ChefAssignmentEngine(bookingRepository, chefRepository);
    return {
        workflowRegistry,
        bookingStateMachine: new bookingStateMachine_1.BookingStateMachine(),
        customerBookingService: new platformServices_1.CustomerBookingService(bookingEngine, paymentEngine, bookingRepository),
        adminBookingService: new platformServices_1.AdminBookingService(quotationEngine, chefAssignmentEngine, paymentEngine),
        menuService: new platformServices_1.MenuService(chefMenuRepository, uploadedFileRepository),
    };
};
exports.buildChefPlatformModule = buildChefPlatformModule;
