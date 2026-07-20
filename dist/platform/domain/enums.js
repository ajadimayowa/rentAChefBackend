"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingWorkflow = exports.NotificationChannel = exports.MenuSelectionType = exports.ProcurementOption = exports.ModeOfPayment = exports.BookingType = exports.PaymentStatus = exports.BookingStatus = exports.ChefLevel = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "CUSTOMER";
    UserRole["CHEF"] = "CHEF";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var ChefLevel;
(function (ChefLevel) {
    ChefLevel["JUNIOR"] = "JUNIOR";
    ChefLevel["SENIOR"] = "SENIOR";
    ChefLevel["EXECUTIVE"] = "EXECUTIVE";
})(ChefLevel || (exports.ChefLevel = ChefLevel = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["SUBMITTED"] = "Submitted";
    BookingStatus["ADMIN_REVIEW"] = "Admin Reviewed";
    BookingStatus["QUOTATION_SENT"] = "Quotation Sent";
    BookingStatus["PAYMENT_PENDING"] = "Payment Pending";
    BookingStatus["PAID"] = "Paid";
    BookingStatus["CHEF_ASSIGNED"] = "Chef Assigned";
    BookingStatus["IN_PROGRESS"] = "In Progress";
    BookingStatus["COMPLETED"] = "Completed";
    BookingStatus["CANCELLED"] = "Cancelled";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["UNPAID"] = "Unpaid";
    PaymentStatus["PENDING"] = "Pending";
    PaymentStatus["PAID"] = "Paid";
    PaymentStatus["FAILED"] = "Failed";
    PaymentStatus["REFUNDED"] = "Refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var BookingType;
(function (BookingType) {
    BookingType["INSTANT"] = "INSTANT";
    BookingType["QUOTATION"] = "QUOTATION";
})(BookingType || (exports.BookingType = BookingType = {}));
var ModeOfPayment;
(function (ModeOfPayment) {
    ModeOfPayment["PAYSTACK"] = "Paystack";
    ModeOfPayment["TRANSFER"] = "Transfer";
    ModeOfPayment["UNPAID"] = "Unpaid";
})(ModeOfPayment || (exports.ModeOfPayment = ModeOfPayment = {}));
var ProcurementOption;
(function (ProcurementOption) {
    ProcurementOption["CUSTOMER_PURCHASE"] = "CUSTOMER_PURCHASE";
    ProcurementOption["PLATFORM_PROCURE"] = "PLATFORM_PROCURE";
})(ProcurementOption || (exports.ProcurementOption = ProcurementOption = {}));
var MenuSelectionType;
(function (MenuSelectionType) {
    MenuSelectionType["CHEF_MENU"] = "CHEF_MENU";
    MenuSelectionType["CUSTOMER_UPLOAD"] = "CUSTOMER_UPLOAD";
})(MenuSelectionType || (exports.MenuSelectionType = MenuSelectionType = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["PUSH"] = "PUSH";
    NotificationChannel["EMAIL"] = "EMAIL";
    NotificationChannel["SMS"] = "SMS";
    NotificationChannel["IN_APP"] = "IN_APP";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
var BookingWorkflow;
(function (BookingWorkflow) {
    BookingWorkflow["ALASE_SERVICE"] = "ALASE_SERVICE";
    BookingWorkflow["DAILY_CHEF"] = "DAILY_CHEF";
    BookingWorkflow["DATE_NIGHT"] = "DATE_NIGHT";
    BookingWorkflow["DINNER_PARTY"] = "DINNER_PARTY";
    BookingWorkflow["EVENT_CATERING"] = "EVENT_CATERING";
    BookingWorkflow["STORAGE_PACKAGE"] = "STORAGE_PACKAGE";
    BookingWorkflow["SPECIAL_SERVICE"] = "SPECIAL_SERVICE";
    BookingWorkflow["HOME_RESIDENCE"] = "HOME_RESIDENCE";
})(BookingWorkflow || (exports.BookingWorkflow = BookingWorkflow = {}));
