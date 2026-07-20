"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowDefinitions = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../domain/enums");
const proteinSelectionSchema = zod_1.z.object({
    fullCow: zod_1.z.number().int().min(0),
    halfCow: zod_1.z.number().int().min(0),
    ram: zod_1.z.number().int().min(0),
    chickenCartons: zod_1.z.number().int().min(0),
    fishCartons: zod_1.z.number().int().min(0),
});
const alaseServiceSchema = zod_1.z
    .object({
    acceptTerms: zod_1.z.literal(true, {
        errorMap: () => ({
            message: 'You must accept the terms and conditions to proceed.',
        }),
    }),
    proteinSelection: proteinSelectionSchema,
    cookingInstructions: zod_1.z.string().min(10),
    startDate: zod_1.z.coerce.date(),
    endDate: zod_1.z.coerce.date(),
    arrivalTime: zod_1.z.string().min(3),
    serviceTime: zod_1.z.string().min(3),
    eventAddress: zod_1.z.string().min(3),
})
    .refine((data) => data.endDate >= data.startDate, {
    message: 'End date cannot be earlier than start date',
    path: ['endDate'],
});
const dailyChefSchema = zod_1.z.object({
    familySize: zod_1.z.number().int().positive(),
    durationDays: zod_1.z.number().int().positive(),
    accommodationAvailable: zod_1.z.boolean(),
});
const dateNightSchema = zod_1.z.object({
    eventType: zod_1.z.string().min(2),
    eventDate: zod_1.z.coerce.date(),
    numberOfGuests: zod_1.z.number().int().positive(),
    venue: zod_1.z.string().min(3),
});
const dinnerPartySchema = zod_1.z
    .object({
    acceptTerms: zod_1.z.literal(true, {
        errorMap: () => ({
            message: 'You must accept the terms and conditions to proceed.',
        }),
    }),
    proteinSelection: proteinSelectionSchema,
    cookingInstructions: zod_1.z.string().min(10),
    startDate: zod_1.z.coerce.date(),
    endDate: zod_1.z.coerce.date(),
    arrivalTime: zod_1.z.string().min(3),
    serviceTime: zod_1.z.string().min(3),
    eventAddress: zod_1.z.string().min(3),
})
    .refine((data) => data.endDate >= data.startDate, {
    message: 'End date cannot be earlier than start date',
    path: ['endDate'],
});
const eventCateringSchema = zod_1.z
    .object({
    acceptTerms: zod_1.z.literal(true, {
        errorMap: () => ({
            message: 'You must accept the terms and conditions to proceed.',
        }),
    }),
    proteinSelection: proteinSelectionSchema,
    cookingInstructions: zod_1.z.string().min(10),
    startDate: zod_1.z.coerce.date(),
    endDate: zod_1.z.coerce.date(),
    arrivalTime: zod_1.z.string().min(3),
    serviceTime: zod_1.z.string().min(3),
    eventAddress: zod_1.z.string().min(3),
})
    .refine((data) => data.endDate >= data.startDate, {
    message: 'End date cannot be earlier than start date',
    path: ['endDate'],
});
const storagePackageSchema = zod_1.z
    .object({
    acceptTerms: zod_1.z.literal(true, {
        errorMap: () => ({
            message: 'You must accept the terms and conditions to proceed.',
        }),
    }),
    proteinSelection: proteinSelectionSchema,
    cookingInstructions: zod_1.z.string().min(10),
    startDate: zod_1.z.coerce.date(),
    endDate: zod_1.z.coerce.date(),
    arrivalTime: zod_1.z.string().min(3),
    serviceTime: zod_1.z.string().min(3),
    eventAddress: zod_1.z.string().min(3),
})
    .refine((data) => data.endDate >= data.startDate, {
    message: 'End date cannot be earlier than start date',
    path: ['endDate'],
});
const buildDefinition = (code, displayName, screenName, zodSchema, supportsMenuSelection = true, supportsProcurement = true) => ({
    code,
    displayName,
    screenName,
    zodSchema,
    validateBookingData: (input) => zodSchema.parse(input),
    supportsMenuSelection,
    supportsProcurement,
});
exports.workflowDefinitions = [
    buildDefinition(enums_1.BookingWorkflow.ALASE_SERVICE, 'Alase Service', 'AlaseServiceBookingScreen', alaseServiceSchema),
    buildDefinition(enums_1.BookingWorkflow.DAILY_CHEF, 'Daily Chef', 'DailyChefBookingScreen', dailyChefSchema),
    buildDefinition(enums_1.BookingWorkflow.DATE_NIGHT, 'Date Night', 'DateNightBookingScreen', dateNightSchema),
    buildDefinition(enums_1.BookingWorkflow.DINNER_PARTY, 'Dinner Party', 'DinnerPartyBookingScreen', dinnerPartySchema),
    buildDefinition(enums_1.BookingWorkflow.EVENT_CATERING, 'Event Catering', 'EventCateringBookingScreen', eventCateringSchema),
    buildDefinition(enums_1.BookingWorkflow.STORAGE_PACKAGE, 'Storage Package', 'StoragePackageBookingScreen', storagePackageSchema),
];
