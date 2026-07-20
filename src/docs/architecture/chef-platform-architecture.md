# Chef Service Rental Platform Architecture

## 1) High-Level System Architecture Diagram (Text)

```text
[React Native Customer App] -----> [API Gateway / Express API] <----- [React Admin Portal]
                                         |
                                         |-- Auth + RBAC
                                         |-- Booking Engine
                                         |-- Workflow Registry
                                         |-- Quotation Engine
                                         |-- Payment Engine (Paystack)
                                         |-- Chef Assignment Engine
                                         |-- Notification Service
                                         |
                                      [MongoDB Cluster]
                                         |
                                         |-- Users
                                         |-- Chefs
                                         |-- Service Catalog
                                         |-- ServicePricing
                                         |-- Bookings
                                         |-- Quotations
                                         |-- Payments
                                         |-- ChefMenus
                                         |-- UploadedFiles
                                         |-- Notifications
                                         |-- AuditLogs
```

## 2) Clean Architecture Folder Structure

```text
src/modules/chef-platform/
  domain/
    enums.ts
    interfaces.ts
    workflow.ts
  application/
    contracts/
      repositories.ts
      strategies.ts
    workflows/
      registry.ts
      definitions.ts
    strategies/
      pricingStrategies.ts
      paymentStrategies.ts
    engines/
      bookingStateMachine.ts
      bookingEngine.ts
      quotationEngine.ts
      paymentEngine.ts
      chefAssignmentEngine.ts
    services/
      platformServices.ts
  infrastructure/
    database/schemas/
    repositories/mongoRepositories.ts
  presentation/
    controllers/platform.controller.ts
    routes/platform.routes.ts
  bootstrap.ts
```

## 3) MongoDB Collection Design

- `CPUser`: identity + role
- `CPChef`: chef profile + level + availability + rating snapshot
- `CPServiceCategory`, `CPServiceSubCategory`, `CPService`: catalog with workflow linkage
- `CPServicePricing`: configurable pricing by `serviceId + chefLevel + effective period`
- `CPBooking`: common booking fields + dynamic `bookingData` + procurement + menu choice + timeline
- `CPQuotation`: structured quote line components and final amount
- `CPPayment`: Paystack references and transaction details
- `CPChefMenu`: chef menu inventory by service subcategory
- `CPUploadedFile`: customer menu uploads metadata and URL
- `CPNotification`: message records for channels
- `CPAuditLog`: immutable audit trail

## 4) Mongoose Schemas

Implemented under `src/modules/chef-platform/infrastructure/database/schemas/`:

- `user.schema.ts`
- `chef.schema.ts`
- `service.schema.ts`
- `menu-and-file.schema.ts`
- `booking.schema.ts`
- `quotation-payment.schema.ts`
- `notification-audit.schema.ts`

## 5) TypeScript Interfaces

Implemented in `domain/interfaces.ts` and `domain/workflow.ts`:

- Strongly typed entities for all required collections
- `CreateBookingInput` for unified booking command
- `IBookingWorkflowDefinition` and registry contracts

## 6) Repository Layer Design

Repository contracts: `application/contracts/repositories.ts`

Mongo implementations: `infrastructure/repositories/mongoRepositories.ts`

Key interfaces:

- `IBookingRepository`
- `IServiceRepository`
- `IServicePricingRepository`
- `IChefRepository`
- `IQuotationRepository`
- `IPaymentRepository`
- `IChefMenuRepository`
- `IUploadedFileRepository`
- `IAuditLogRepository`

## 7) Service Layer Design

Application services in `application/services/platformServices.ts`:

- `CustomerBookingService`
- `AdminBookingService`
- `MenuService`

These orchestrate engines and repositories, keeping controllers thin.

## 8) Workflow Registry Design

`WorkflowRegistry` maps:

`workflowCode -> { screenName, zodSchema, validation, flags }`

Definitions in `application/workflows/definitions.ts`:

- `HOME_CHEF` → `HomeChefBookingScreen`
- `RESIDENTIAL_CHEF` → `ResidentialChefBookingScreen`
- `EVENT_CHEF` → `EventChefBookingScreen`

## 9) Strategy Pattern Implementation

- Pricing strategy: `StandardPricingStrategy`
- Payment strategy: `PaystackInstantPaymentStrategy`

Plugged into engines through interfaces (`IPricingStrategy`, `IPaymentStrategy`), allowing future alternative strategies without engine rewrites.

## 10) Booking Engine Design

`BookingEngine` responsibilities:

- Resolve and validate workflow-specific booking schema
- Validate menu option branch (chef menu vs uploaded file)
- Load active pricing by service + chef level
- Apply pricing strategy and procurement influence
- Persist booking with `bookingData` dynamic object
- Seed timeline and audit logs

## 11) Quotation Engine Design

`QuotationEngine`:

- Validates booking existence
- Computes:

$$
\text{finalAmount} = \text{chefFee} + \text{ingredientCost} + \text{procurementFee} + \text{additionalCharges} + \text{tax} - \text{discount}
$$

- Creates quotation
- Updates booking status to `QUOTATION_SENT`

## 12) Payment Engine Design

`PaymentEngine` supports:

- Instant payment initialization from booking estimate
- Quotation payment initialization from selected quote
- Payment confirmation callback (webhook-like endpoint)
- Booking state/payment state synchronization

## 13) Chef Assignment Engine Design

`ChefAssignmentEngine`:

- Finds candidate chefs by level + service compatibility
- Chooses best candidate (rating/experience ordered)
- Assigns chef and updates booking status/timeline

## 14) API Endpoint Design

Mounted under `/api/v1`:

- `GET /cp/workflows`
- `POST /cp/bookings`
- `GET /cp/bookings`
- `POST /cp/quotations`
- `POST /cp/payments/instant/init`
- `POST /cp/payments/quotation/init`
- `POST /cp/payments/webhook/:reference`
- `POST /cp/bookings/:bookingId/assign-chef`
- `POST /cp/menus/chef`
- `POST /cp/menus/uploaded`

## 15) Admin Portal Flow (React)

```text
Login -> Dashboard
  -> Service Catalog Management
     -> Category -> Subcategory -> Service -> Pricing Rules
  -> Workflow Configuration
  -> Booking Queue (Admin Review)
  -> Quotation Builder
  -> Payment Monitor
  -> Chef Assignment Board
  -> Menu Moderation (chef/customer uploaded)
  -> Reports + Audit Logs
```

## 16) React Native Navigation Flow

```text
Auth Stack
  -> Customer Home
     -> Categories -> Services -> Service Detail
     -> Select Chef Level
     -> Open Workflow-specific Booking Screen
     -> Menu Choice (Chef Menu or Upload)
     -> Procurement Choice
     -> Review + Submit
     -> Payment/Quotation Screen
     -> Booking Tracking
     -> Booking History
     -> Support Chat (future module)
```

## 17) Validation Architecture Using Zod

Per workflow schema in `definitions.ts`:

- Home Chef: `bookingDate`, `numberOfGuests`, `location`
- Residential Chef: `familySize`, `durationDays`, `accommodationAvailable`
- Event Chef: `eventType`, `eventDate`, `numberOfGuests`, `venue`

Pipeline:

`workflowCode -> registry.resolve -> zodSchema.parse -> engine`

## 18) Sequence Diagrams

### Instant Payment Booking

```text
Customer App -> API: POST /cp/bookings (modeOfPayment=Paystack, transactnRef present)
API -> Workflow Registry: validate bookingData
API -> Pricing Repo: get active price
API -> Booking Repo: create booking (PAYMENT_PENDING)
Customer App -> API: POST /cp/payments/instant/init
API -> Paystack Strategy: initialize transaction
API -> Payment Repo: save payment reference (PENDING)
Paystack -> API: webhook/confirm
API -> Payment Repo: mark PAID
API -> Booking Repo: mark booking PAID
```

### Quotation Booking

```text
Customer App -> API: POST /cp/bookings (modeOfPayment=Unpaid, no transactnRef)
API -> Booking Repo: create booking (SUBMITTED)
Admin Portal -> API: POST /cp/quotations
API -> Quotation Repo: create quotation
API -> Booking Repo: QUOTATION_SENT
Customer App -> API: POST /cp/payments/quotation/init
API -> Paystack Strategy: init with quotation amount
Paystack -> API: webhook/confirm
API -> Payment + Booking: mark PAID
```

### Menu Upload Flow

```text
Customer App -> File Service: upload PDF/DOCX/JPG/PNG
Customer App -> API: POST /cp/menus/uploaded (metadata + URL)
API -> UploadedFile Repo: persist upload metadata
Admin Portal -> Approval Screen: approve file
Booking Form -> reference uploaded file in booking
```

### Chef Menu Selection Flow

```text
Customer App -> API: list service menus (future read endpoint)
Customer selects menuId
Customer App -> API: POST /cp/bookings with menuSelectionType=CHEF_MENU
API -> ChefMenu Repo: validate menu is PUBLISHED
API -> Booking Repo: persist chefMenuId
```

### Procurement Flow

```text
Customer -> Booking Form: choose procurement option
If CUSTOMER_PURCHASE: procurementFee=0 (or policy)
If PLATFORM_PROCURE: estimatedIngredientCost + procurementFee included
API -> Pricing Strategy: compute estimate
Admin -> Quotation Engine: adjust final ingredient/procurement values
Final payment uses adjusted quotation amount
```

## 19) Database Indexing Strategy

- Bookings: `bookingNumber`, `(customerId, createdAt)`, `(status, paymentStatus, createdAt)`, `(serviceId, chefLevel, status)`
- Pricing: `(serviceId, chefLevel, effectiveFrom, isActive)`
- Payments: `paymentReference`, `(bookingId, status)`, `(customerId, createdAt)`
- Menus: `(chefId, serviceSubCategoryId, status)`
- Files: `(ownerUserId, purpose, createdAt)`
- Chefs: `(level, isActive)`, `(servicesOffered, level)`
- Audit: `(entityType, entityId, createdAt)`

## 20) Future Scalability Recommendations

- Split module into microservices when traffic grows: booking, payment, notification, catalog
- Introduce event bus (Kafka/SQS) for async workflows and retries
- Add read models with CQRS for dashboards and reports
- Use Redis for workflow caching and idempotency keys
- Add distributed lock for chef assignment collisions
- Add versioned workflow definitions and schema migrations
- Implement outbox pattern for reliable external integrations
- Enable multi-region Mongo replica sets and PITR backups
- Add feature-flag driven rollout for new workflows
- Add observability: OpenTelemetry traces + metric SLIs/SLOs
