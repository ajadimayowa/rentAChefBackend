import { z } from 'zod';
import { BookingWorkflow } from '../../domain/enums';
import { IBookingWorkflowDefinition } from '../../domain/workflow';
import { start } from 'repl';
import e from 'express';


const proteinSelectionSchema = z.object({
  fullCow: z.number().int().min(0),
  halfCow: z.number().int().min(0),
  ram: z.number().int().min(0),
  chickenCartons: z.number().int().min(0),
  fishCartons: z.number().int().min(0),
});

const alaseServiceSchema = z
  .object({
    acceptTerms: z.literal(true, {
      errorMap: () => ({
        message: 'You must accept the terms and conditions to proceed.',
      }),
    }),
    proteinSelection: proteinSelectionSchema,
    cookingInstructions: z.string().min(10),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    arrivalTime: z.string().min(3),
    serviceTime: z.string().min(3),
    eventAddress: z.string().min(3),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date cannot be earlier than start date',
    path: ['endDate'],
  });

const dailyChefSchema = z.object({
  familySize: z.number().int().positive(),
  durationDays: z.number().int().positive(),
  accommodationAvailable: z.boolean(),
});

const dateNightSchema = z.object({
  eventType: z.string().min(2),
  eventDate: z.coerce.date(),
  numberOfGuests: z.number().int().positive(),
  venue: z.string().min(3),
});

const dinnerPartySchema = z
  .object({
    acceptTerms: z.literal(true, {
      errorMap: () => ({
        message: 'You must accept the terms and conditions to proceed.',
      }),
    }),
    proteinSelection: proteinSelectionSchema,
    cookingInstructions: z.string().min(10),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    arrivalTime: z.string().min(3),
    serviceTime: z.string().min(3),
    eventAddress: z.string().min(3),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date cannot be earlier than start date',
    path: ['endDate'],
  });

  const eventCateringSchema = z
  .object({
    acceptTerms: z.literal(true, {
      errorMap: () => ({
        message: 'You must accept the terms and conditions to proceed.',
      }),
    }),
    proteinSelection: proteinSelectionSchema,
    cookingInstructions: z.string().min(10),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    arrivalTime: z.string().min(3),
    serviceTime: z.string().min(3),
    eventAddress: z.string().min(3),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date cannot be earlier than start date',
    path: ['endDate'],
  });

  const storagePackageSchema = z
  .object({
    acceptTerms: z.literal(true, {
      errorMap: () => ({
        message: 'You must accept the terms and conditions to proceed.',
      }),
    }),
    proteinSelection: proteinSelectionSchema,
    cookingInstructions: z.string().min(10),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    arrivalTime: z.string().min(3),
    serviceTime: z.string().min(3),
    eventAddress: z.string().min(3),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date cannot be earlier than start date',
    path: ['endDate'],
  });

const buildDefinition = (
  code: BookingWorkflow,
  displayName: string,
  screenName: string,
  zodSchema: z.ZodTypeAny,
  supportsMenuSelection = true,
  supportsProcurement = true,
): IBookingWorkflowDefinition => ({
  code,
  displayName,
  screenName,
  zodSchema,
  validateBookingData: (input: Record<string, unknown>) => zodSchema.parse(input),
  supportsMenuSelection,
  supportsProcurement,
});

export const workflowDefinitions: IBookingWorkflowDefinition[] = [
  buildDefinition(BookingWorkflow.ALASE_SERVICE, 'Alase Service', 'AlaseServiceBookingScreen', alaseServiceSchema),
  buildDefinition(
    BookingWorkflow.DAILY_CHEF,
    'Daily Chef',
    'DailyChefBookingScreen',
    dailyChefSchema,
  ),
  buildDefinition(BookingWorkflow.DATE_NIGHT, 'Date Night', 'DateNightBookingScreen', dateNightSchema),
  buildDefinition(BookingWorkflow.DINNER_PARTY, 'Dinner Party', 'DinnerPartyBookingScreen', dinnerPartySchema),
  buildDefinition(BookingWorkflow.EVENT_CATERING, 'Event Catering', 'EventCateringBookingScreen', eventCateringSchema),
  buildDefinition(BookingWorkflow.STORAGE_PACKAGE, 'Storage Package', 'StoragePackageBookingScreen', storagePackageSchema),
  
  
];
