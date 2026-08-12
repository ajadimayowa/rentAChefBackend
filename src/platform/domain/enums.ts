export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  CHEF = 'CHEF',
  ADMIN = 'ADMIN',
}

export enum ChefLevel {
  JUNIOR = 'JUNIOR',
  SENIOR = 'SENIOR',
  EXECUTIVE = 'EXECUTIVE',
}

export enum BookingStatus {
  SUBMITTED = 'Submitted',
  ADMIN_REVIEW = 'Admin Reviewed',
  QUOTATION_SENT = 'Quotation Sent',
  PAYMENT_PENDING = 'Payment Pending',
  PAID = 'Paid',
  CHEF_ASSIGNED = 'Chef Assigned',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export enum PaymentStatus {
  UNPAID = 'Unpaid',
  PENDING = 'Pending',
  PAID = 'Paid',
  FAILED = 'Failed',
  REFUNDED = 'Refunded',
}

export enum BookingType {
  INSTANT = 'INSTANT',
  QUOTATION = 'QUOTATION',
}

export enum ModeOfPayment {
  PAYSTACK = 'Paystack',
  TRANSFER = 'Transfer',
  CASH = 'Cash',
  UNPAID = 'Unpaid',
}

export enum ProcurementOption {
  CUSTOMER_PURCHASE = 'CUSTOMER_PURCHASE',
  PLATFORM_PROCURE = 'PLATFORM_PROCURE',
}

export enum MenuSelectionType {
  CHEF_MENU = 'CHEF_MENU',
  CUSTOMER_UPLOAD = 'CUSTOMER_UPLOAD',
}

export enum NotificationChannel {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
}

export enum BookingWorkflow {
  ALASE_SERVICE = 'ALASE_SERVICE',
  DAILY_CHEF = 'DAILY_CHEF',
  DATE_NIGHT = 'DATE_NIGHT',
  DINNER_PARTY = 'DINNER_PARTY',
  EVENT_CATERING = 'EVENT_CATERING',
  STORAGE_PACKAGE = 'STORAGE_PACKAGE',
  SPECIAL_SERVICE = 'SPECIAL_SERVICE',
  HOME_RESIDENCE = 'HOME_RESIDENCE'
}
