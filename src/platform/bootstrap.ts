import { BookingEngine } from './application/engines/bookingEngine';
import { BookingStateMachine } from './application/engines/bookingStateMachine';
import { ChefAssignmentEngine } from './application/engines/chefAssignmentEngine';
import { PaymentEngine } from './application/engines/paymentEngine';
import { QuotationEngine } from './application/engines/quotationEngine';
import { AdminBookingService, CustomerBookingService, MenuService } from './application/services/platformServices';
import { PaystackInstantPaymentStrategy } from './application/strategies/paymentStrategies';
import { StandardPricingStrategy } from './application/strategies/pricingStrategies';
import { workflowDefinitions } from './application/workflows/definitions';
import { WorkflowRegistry } from './application/workflows/registry';
import {
  MongoAuditLogRepository,
  MongoBookingRepository,
  MongoChefMenuRepository,
  MongoChefRepository,
  MongoPaymentRepository,
  MongoQuotationRepository,
  MongoUploadedFileRepository,
} from './infrastructure/repositories/mongoRepositories';

export const buildChefPlatformModule = () => {
  const workflowRegistry = new WorkflowRegistry();
  workflowDefinitions.forEach((definition) => workflowRegistry.register(definition));

  const bookingRepository = new MongoBookingRepository();
  const chefMenuRepository = new MongoChefMenuRepository();
  const uploadedFileRepository = new MongoUploadedFileRepository();
  const auditLogRepository = new MongoAuditLogRepository();
  const quotationRepository = new MongoQuotationRepository();
  const paymentRepository = new MongoPaymentRepository();
  const chefRepository = new MongoChefRepository();

  const pricingStrategy = new StandardPricingStrategy();
  const paymentStrategy = new PaystackInstantPaymentStrategy();

  const bookingEngine = new BookingEngine(
    pricingStrategy,
    bookingRepository,
    auditLogRepository,
  );

  const quotationEngine = new QuotationEngine(bookingRepository, quotationRepository);
  const paymentEngine = new PaymentEngine(paymentStrategy, bookingRepository, quotationRepository, paymentRepository);
  const chefAssignmentEngine = new ChefAssignmentEngine(bookingRepository, chefRepository);

  return {
    workflowRegistry,
    bookingStateMachine: new BookingStateMachine(),
    customerBookingService: new CustomerBookingService(bookingEngine, paymentEngine, bookingRepository),
    adminBookingService: new AdminBookingService(quotationEngine, chefAssignmentEngine, paymentEngine),
    menuService: new MenuService(chefMenuRepository, uploadedFileRepository),
  };
};

export type ChefPlatformModule = ReturnType<typeof buildChefPlatformModule>;
