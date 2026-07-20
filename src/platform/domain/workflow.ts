import { z } from 'zod';
import { BookingWorkflow, ChefLevel, MenuSelectionType, ModeOfPayment, PaymentStatus, ProcurementOption } from './enums';



export interface CreateBookingInput {
  customerId: string;
  serviceId?: string;
  specialServiceId?: string;
  workflow: BookingWorkflow;
  paymentStatus?: PaymentStatus;
  transactnRef?: string;
  modeOfPayment?: ModeOfPayment;
  chefLevel?: ChefLevel;
  menuSelectionType?: MenuSelectionType;
  chefMenuId?: string;
  customerUploadedMenuFileId?: string;
  procurement?: {
    option: ProcurementOption;
    estimatedIngredientCostMinor: number;
    procurementFeeMinor: number;
  };
  bookingData: Record<string, unknown>;
}

export interface WorkflowContext {
  now: Date;
  actorId: string;
}

export interface WorkflowResolvedPricing {
  baseChefFeeMinor: number;
  modifiersMinor: number;
  estimatedTotalMinor: number;
  currency: 'NGN';
}

export interface IBookingWorkflowDefinition {
  code: BookingWorkflow;
  displayName: string;
  screenName: string;
  zodSchema: z.ZodTypeAny;
  validateBookingData: (input: Record<string, unknown>) => Record<string, unknown>;
  supportsMenuSelection: boolean;
  supportsProcurement: boolean;
}

export interface IWorkflowRegistry {
  register(definition: IBookingWorkflowDefinition): void;
  list(): IBookingWorkflowDefinition[];
}
