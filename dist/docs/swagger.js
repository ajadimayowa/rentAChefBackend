"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const apiPrefix = "/api/v1";
const swaggerDefinition = {
    openapi: "3.0.3",
    info: {
        title: "RentAChef API",
        version: "1.0.0",
        description: "API documentation for RentAChef backend services.",
    },
    servers: [
        {
            url: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}${apiPrefix}`,
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
        schemas: {
            ErrorResponse: {
                type: "object",
                properties: {
                    message: { type: "string" },
                    error: { type: "string" },
                },
            },
            AuthRegisterRequest: {
                type: "object",
                properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", format: "password" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    phone: { type: "string" },
                },
            },
            AuthVerifyEmailRequest: {
                type: "object",
                properties: {
                    email: { type: "string", format: "email" },
                    otp: { type: "string" },
                },
            },
            AuthLoginRequest: {
                type: "object",
                properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", format: "password" },
                },
            },
            AuthVerifyLoginOtpRequest: {
                type: "object",
                properties: {
                    email: { type: "string", format: "email" },
                    otp: { type: "string" },
                },
            },
            AuthPasswordResetRequest: {
                type: "object",
                properties: {
                    email: { type: "string", format: "email" },
                },
            },
            AuthResetWithOtpRequest: {
                type: "object",
                properties: {
                    email: { type: "string", format: "email" },
                    otp: { type: "string" },
                    newPassword: { type: "string", format: "password" },
                },
            },
            AuthResendOtpRequest: {
                type: "object",
                properties: {
                    email: { type: "string", format: "email" },
                },
            },
            AuthResponse: {
                type: "object",
                properties: {
                    token: { type: "string" },
                    user: { $ref: "#/components/schemas/UserProfile" },
                },
            },
            AdminLoginRequest: {
                type: "object",
                properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", format: "password" },
                },
            },
            AdminCreateRequest: {
                type: "object",
                properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", format: "password" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    role: { type: "string" },
                },
            },
            AdminProfile: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    email: { type: "string", format: "email" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    role: { type: "string" },
                },
            },
            AdminDashboard: {
                type: "object",
                properties: {
                    totalUsers: { type: "number" },
                    totalChefs: { type: "number" },
                    totalBookings: { type: "number" },
                    totalRevenue: { type: "number" },
                },
            },
            UserProfile: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    email: { type: "string", format: "email" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    phone: { type: "string" },
                    role: { type: "string" },
                },
            },
            Chef: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    email: { type: "string", format: "email" },
                    phone: { type: "string" },
                    bio: { type: "string" },
                    chefPic: { type: "string" },
                    isActive: { type: "boolean" },
                },
            },
            ChefLoginRequest: {
                type: "object",
                properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", format: "password" },
                },
            },
            ChefCreateRequest: {
                type: "object",
                properties: {
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    email: { type: "string", format: "email" },
                    phone: { type: "string" },
                    bio: { type: "string" },
                    chefPic: { type: "string", format: "binary" },
                },
            },
            ChefUpdateRequest: {
                type: "object",
                properties: {
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    phone: { type: "string" },
                    bio: { type: "string" },
                    chefPic: { type: "string", format: "binary" },
                },
            },
            Category: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    description: { type: "string" },
                    slug: { type: "string" },
                    image: { type: "string" },
                    tasks: {
                        type: "array",
                        items: { type: "string" },
                    },
                    services: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                label: { type: "string" },
                                price: { type: "number" },
                            },
                        },
                    },
                    isActive: { type: "boolean" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            CategoryCreateRequest: {
                type: "object",
                required: ["name", "description"],
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    tasks: {
                        type: "array",
                        items: { type: "string" },
                    },
                    isActive: { type: "boolean" },
                    catPic: { type: "string", format: "binary" },
                },
            },
            CategoryUpdateRequest: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    tasks: {
                        type: "array",
                        items: { type: "string" },
                    },
                    isActive: { type: "boolean" },
                    catPic: { type: "string", format: "binary" },
                },
            },
            CategoryAddServiceRequest: {
                type: "object",
                required: ["label", "price"],
                properties: {
                    label: { type: "string" },
                    price: { type: "number" },
                },
            },
            CategoryTaskRequest: {
                type: "object",
                required: ["task"],
                properties: {
                    task: { type: "string", example: "Plan weekly family menu" },
                },
            },
            Service: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    categoryId: { type: "string" },
                    name: { type: "string" },
                    workflow: { type: "string" },
                    allowedChefLevels: {
                        type: "array",
                        items: { type: "string", enum: ["junior", "senior", "executive"] },
                    },
                    bookingType: { type: "string", enum: ["instant", "quotation"] },
                    isActive: { type: "boolean" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            ServiceCreateRequest: {
                type: "object",
                properties: {
                    categoryId: { type: "string" },
                    name: { type: "string" },
                    workflow: { type: "string" },
                    allowedChefLevels: {
                        type: "array",
                        items: { type: "string", enum: ["junior", "senior", "executive"] },
                    },
                    bookingType: { type: "string", enum: ["instant", "quotation"] },
                    isActive: { type: "boolean" },
                },
                required: ["categoryId", "name", "workflow", "bookingType"],
            },
            ServiceUpdateRequest: {
                type: "object",
                properties: {
                    categoryId: { type: "string" },
                    name: { type: "string" },
                    workflow: { type: "string" },
                    allowedChefLevels: {
                        type: "array",
                        items: { type: "string", enum: ["junior", "senior", "executive"] },
                    },
                    bookingType: { type: "string", enum: ["instant", "quotation"] },
                    isActive: { type: "boolean" },
                },
            },
            ServiceResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    payload: { $ref: "#/components/schemas/Service" },
                },
            },
            ServicesResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    payload: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Service" },
                    },
                    meta: {
                        type: "object",
                        properties: {
                            total: { type: "number", example: 20 },
                            page: { type: "number", example: 1 },
                            limit: { type: "number", example: 20 },
                            totalPages: { type: "number", example: 1 },
                        },
                    },
                },
            },
            ServiceDeleteResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Service deleted successfully" },
                },
            },
            TermsAndCon: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    description: { type: "string" },
                    serviceId: { type: "string", nullable: true },
                    categoryId: { type: "string", nullable: true },
                    specialMenuId: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            TermsAndConCreateRequest: {
                type: "object",
                required: ["description"],
                properties: {
                    description: { type: "string", example: "Payments are non-refundable after confirmation." },
                    serviceId: { type: "string", example: "686d53adf9f59b20d4b9da01" },
                    categoryId: { type: "string", example: "686d53adf9f59b20d4b9da02" },
                    specialMenuId: { type: "string", example: "687f1c8c7e3f2c0012ab9001" },
                },
            },
            TermsAndConUpdateRequest: {
                type: "object",
                properties: {
                    description: { type: "string", example: "Reschedule requests require 48 hours notice." },
                    serviceId: { type: "string", nullable: true, example: "686d53adf9f59b20d4b9da01" },
                    categoryId: { type: "string", nullable: true, example: "686d53adf9f59b20d4b9da02" },
                    specialMenuId: { type: "string", nullable: true, example: "687f1c8c7e3f2c0012ab9001" },
                },
            },
            TermsAndConResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    payload: { $ref: "#/components/schemas/TermsAndCon" },
                },
            },
            TermsAndConsResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    payload: {
                        type: "array",
                        items: { $ref: "#/components/schemas/TermsAndCon" },
                    },
                    meta: {
                        type: "object",
                        properties: {
                            total: { type: "number", example: 10 },
                            page: { type: "number", example: 1 },
                            limit: { type: "number", example: 20 },
                            totalPages: { type: "number", example: 1 },
                        },
                    },
                },
            },
            TermsAndConDeleteResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "TermsAndCon deleted successfully" },
                },
            },
            ServiceCategory: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    description: { type: "string" },
                    slug: { type: "string" },
                    isActive: { type: "boolean" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            ServiceCategoryCreateRequest: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    isActive: { type: "boolean" },
                },
            },
            ServiceCategoryUpdateRequest: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    isActive: { type: "boolean" },
                },
            },
            ServiceCategoryResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    payload: { $ref: "#/components/schemas/ServiceCategory" },
                },
            },
            ServiceCategoriesResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    payload: {
                        type: "array",
                        items: { $ref: "#/components/schemas/ServiceCategory" },
                    },
                    meta: {
                        type: "object",
                        properties: {
                            total: { type: "number", example: 42 },
                            page: { type: "number", example: 1 },
                            limit: { type: "number", example: 20 },
                            totalPages: { type: "number", example: 3 },
                        },
                    },
                },
            },
            ServiceCategoryDeleteResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Service category deleted successfully" },
                },
            },
            ChefService: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    chefId: { type: "string" },
                    serviceId: { type: "string" },
                    price: { type: "number" },
                    isAvailable: { type: "boolean" },
                    notes: { type: "string" },
                },
            },
            ChefServiceCreateRequest: {
                type: "object",
                properties: {
                    chefId: { type: "string" },
                    serviceId: { type: "string" },
                    price: { type: "number" },
                    isAvailable: { type: "boolean" },
                    notes: { type: "string" },
                },
            },
            ChefServiceUpdateRequest: {
                type: "object",
                properties: {
                    price: { type: "number" },
                    isAvailable: { type: "boolean" },
                    notes: { type: "string" },
                },
            },
            ServicePricing: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    serviceId: {
                        type: "string",
                        description: "Target a specific service. Provide this OR specialServiceId.",
                    },
                    specialServiceId: {
                        type: "string",
                        description: "Target a specific special service. Provide this OR serviceId.",
                    },
                    serviceCategoryId: {
                        type: "string",
                        nullable: true,
                        description: "Legacy category-level target when applicable.",
                    },
                    chefCategoryId: { type: "string", description: "Chef category/level for this pricing" },
                    pricingType: {
                        type: "string",
                        enum: ["daybased", "levelbased"],
                        example: "daybased",
                        description: "Pricing model. Use daybased for fixed-duration services, levelbased for chef-level pricing.",
                    },
                    numberOfDays: {
                        type: "integer",
                        minimum: 1,
                        nullable: true,
                        example: 3,
                        description: "Required when pricingType is daybased. Ignored for levelbased pricing.",
                    },
                    monthlySubFee: {
                        type: "number",
                        minimum: 0,
                        nullable: true,
                        example: 25000,
                        description: "Required when pricingType is daybased. Ignored for levelbased pricing.",
                    },
                    description: { type: "string", nullable: true, example: "3-day intensive meal prep package" },
                    basePriceMinor: { type: "number", example: 150000 },
                    currency: { type: "string", enum: ["NGN"], example: "NGN" },
                    servicePricingOptions: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string", example: "Extra Sauce" },
                                price: { type: "number", example: 10000 },
                                description: { type: "string", example: "Optional add-on" },
                            },
                        },
                    },
                    effectiveFrom: { type: "string", format: "date-time" },
                    effectiveTo: { type: "string", format: "date-time", nullable: true },
                    isActive: { type: "boolean", example: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            ServicePricingCreateRequest: {
                type: "object",
                required: ["basePriceMinor", "chefCategoryId"],
                anyOf: [{ required: ["serviceId"] }, { required: ["specialServiceId"] }],
                not: { required: ["serviceId", "specialServiceId"] },
                properties: {
                    serviceId: {
                        type: "string",
                        description: "Creates pricing for a specific service. Must exist.",
                    },
                    specialServiceId: {
                        type: "string",
                        description: "Creates pricing for a specific special service. Must exist.",
                    },
                    chefCategoryId: { type: "string", description: "Chef category/level id (required)" },
                    pricingType: {
                        type: "string",
                        enum: ["daybased", "levelbased"],
                        default: "levelbased",
                        description: "Defaults to levelbased when omitted.",
                    },
                    numberOfDays: {
                        type: "integer",
                        minimum: 1,
                        nullable: true,
                        description: "Required when pricingType is daybased. Ignored for levelbased pricing.",
                    },
                    monthlySubFee: {
                        type: "number",
                        minimum: 0,
                        nullable: true,
                        description: "Required when pricingType is daybased. Ignored for levelbased pricing.",
                    },
                    description: { type: "string" },
                    basePriceMinor: { type: "number", example: 150000 },
                    currency: { type: "string", enum: ["NGN"], default: "NGN" },
                    servicePricingOptions: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                price: { type: "number" },
                                description: { type: "string" },
                            },
                        },
                    },
                    effectiveFrom: { type: "string", format: "date-time" },
                    effectiveTo: { type: "string", format: "date-time" },
                    isActive: { type: "boolean" },
                },
                example: {
                    specialServiceId: "686d53adf9f59b20d4b9da02",
                    chefCategoryId: "686d53adf9f59b20d4b9cf99",
                    pricingType: "daybased",
                    numberOfDays: 2,
                    monthlySubFee: 25000,
                    description: "2-day special menu service",
                    basePriceMinor: 120000,
                    currency: "NGN",
                    servicePricingOptions: [
                        {
                            name: "Weekend surcharge",
                            price: 20000,
                            description: "Applies on Saturday and Sunday",
                        },
                    ],
                },
            },
            ServicePricingUpdateRequest: {
                type: "object",
                properties: {
                    serviceId: {
                        type: "string",
                        description: "Set or clear service-level target. Must exist when provided.",
                    },
                    specialServiceId: {
                        type: "string",
                        description: "Set or clear special-service-level target. Must exist when provided.",
                    },
                    chefCategoryId: { type: "string", description: "Chef category/level id. Required for a valid pricing target." },
                    pricingType: {
                        type: "string",
                        enum: ["daybased", "levelbased"],
                        description: "If changed to daybased, numberOfDays must also be provided.",
                    },
                    numberOfDays: {
                        type: "integer",
                        minimum: 1,
                        nullable: true,
                        description: "Required when pricingType resolves to daybased. Ignored for levelbased pricing.",
                    },
                    monthlySubFee: {
                        type: "number",
                        minimum: 0,
                        nullable: true,
                        description: "Required when pricingType resolves to daybased. Ignored for levelbased pricing.",
                    },
                    description: { type: "string", nullable: true },
                    basePriceMinor: { type: "number" },
                    currency: { type: "string", enum: ["NGN"] },
                    servicePricingOptions: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                price: { type: "number" },
                                description: { type: "string" },
                            },
                        },
                    },
                    effectiveFrom: { type: "string", format: "date-time" },
                    effectiveTo: { type: "string", format: "date-time", nullable: true },
                    isActive: { type: "boolean" },
                },
                example: {
                    specialServiceId: "686d53adf9f59b20d4b9da01",
                    chefCategoryId: "686d53adf9f59b20d4b9cf99",
                    pricingType: "daybased",
                    numberOfDays: 3,
                    monthlySubFee: 30000,
                    description: "Updated 3-day premium package",
                    basePriceMinor: 175000,
                    isActive: true,
                },
            },
            MenuGroceryItem: {
                type: "object",
                required: ["item", "price"],
                properties: {
                    item: { type: "string", example: "Tomatoes" },
                    quantity: { type: "string", example: "5kg" },
                    price: { type: "number", example: 15000 },
                },
            },
            MenuMealSection: {
                type: "object",
                required: ["title"],
                properties: {
                    title: { type: "string", example: "Breakfast" },
                    groceryList: {
                        type: "array",
                        items: { $ref: "#/components/schemas/MenuGroceryItem" },
                    },
                    ingredientTotal: { type: "number", example: 50000 },
                },
                example: {
                    title: "Breakfast",
                    groceryList: [
                        { item: "Yam", quantity: "10 tubers", price: 20000 },
                        { item: "Eggs", quantity: "2 crates", price: 12000 },
                        { item: "Vegetable oil", quantity: "5L", price: 8000 },
                    ],
                    ingredientTotal: 40000,
                },
            },
            Menu: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    chefId: { type: "string" },
                    serviceCategoryId: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    breakfast: { $ref: "#/components/schemas/MenuMealSection" },
                    lunch: { $ref: "#/components/schemas/MenuMealSection" },
                    dinner: { $ref: "#/components/schemas/MenuMealSection" },
                    grandTotal: { type: "number", example: 180000 },
                    isActive: { type: "boolean", example: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
                example: {
                    id: "687f1c8c7e3f2c0012ab9001",
                    chefId: "687f1c8c7e3f2c0012ab8111",
                    serviceCategoryId: "687f1c8c7e3f2c0012ab8222",
                    title: "Weekend Family Menu",
                    description: "Balanced breakfast, lunch and dinner options for a family of 6.",
                    breakfast: {
                        title: "Breakfast",
                        groceryList: [
                            { item: "Yam", quantity: "10 tubers", price: 20000 },
                            { item: "Eggs", quantity: "2 crates", price: 12000 },
                        ],
                        ingredientTotal: 32000,
                    },
                    lunch: {
                        title: "Lunch",
                        groceryList: [
                            { item: "Rice", quantity: "15kg", price: 28000 },
                            { item: "Chicken", quantity: "8 whole", price: 36000 },
                        ],
                        ingredientTotal: 64000,
                    },
                    dinner: {
                        title: "Dinner",
                        groceryList: [
                            { item: "Spaghetti", quantity: "12 packs", price: 9000 },
                            { item: "Turkey", quantity: "5kg", price: 25000 },
                        ],
                        ingredientTotal: 34000,
                    },
                    grandTotal: 130000,
                    isActive: true,
                    createdAt: "2026-06-17T10:30:00.000Z",
                    updatedAt: "2026-06-17T10:30:00.000Z",
                },
            },
            MenuCreateRequest: {
                type: "object",
                required: ["chefId", "serviceCategoryId", "title"],
                properties: {
                    chefId: { type: "string" },
                    serviceCategoryId: { type: "string" },
                    title: { type: "string", example: "Weekend Family Menu" },
                    description: { type: "string", example: "Balanced breakfast, lunch and dinner options." },
                    breakfast: { $ref: "#/components/schemas/MenuMealSection" },
                    lunch: { $ref: "#/components/schemas/MenuMealSection" },
                    dinner: { $ref: "#/components/schemas/MenuMealSection" },
                    isActive: { type: "boolean", example: true },
                },
                example: {
                    chefId: "687f1c8c7e3f2c0012ab8111",
                    serviceCategoryId: "687f1c8c7e3f2c0012ab8222",
                    title: "Weekend Family Menu",
                    description: "Balanced breakfast, lunch and dinner options for a family of 6.",
                    breakfast: {
                        title: "Breakfast",
                        groceryList: [
                            { item: "Yam", quantity: "10 tubers", price: 20000 },
                            { item: "Eggs", quantity: "2 crates", price: 12000 },
                        ],
                    },
                    lunch: {
                        title: "Lunch",
                        groceryList: [
                            { item: "Rice", quantity: "15kg", price: 28000 },
                            { item: "Chicken", quantity: "8 whole", price: 36000 },
                        ],
                    },
                    dinner: {
                        title: "Dinner",
                        groceryList: [
                            { item: "Spaghetti", quantity: "12 packs", price: 9000 },
                            { item: "Turkey", quantity: "5kg", price: 25000 },
                        ],
                    },
                    isActive: true,
                },
            },
            MenuUpdateRequest: {
                type: "object",
                properties: {
                    chefId: { type: "string" },
                    serviceCategoryId: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    breakfast: { $ref: "#/components/schemas/MenuMealSection" },
                    lunch: { $ref: "#/components/schemas/MenuMealSection" },
                    dinner: { $ref: "#/components/schemas/MenuMealSection" },
                    isActive: { type: "boolean" },
                },
                example: {
                    title: "Weekend Family Menu - Updated",
                    description: "Updated menu with improved dinner options.",
                    dinner: {
                        title: "Dinner",
                        groceryList: [
                            { item: "Basmati Rice", quantity: "10kg", price: 30000 },
                            { item: "Turkey", quantity: "6kg", price: 30000 },
                        ],
                    },
                    isActive: true,
                },
            },
            MenuResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Menu" },
                },
            },
            MenusResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Menu" },
                    },
                },
            },
            MenuDeleteResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Menu deleted successfully" },
                },
            },
            SpecialMenuProcurementItem: {
                type: "object",
                required: ["title", "price"],
                properties: {
                    title: { type: "string", example: "Fresh vegetables" },
                    description: { type: "string", example: "Mixed greens and peppers" },
                    price: { type: "number", example: 15000 },
                },
            },
            SpecialMenu: {
                type: "object",
                properties: {
                    id: { type: "string", example: "687f1c8c7e3f2c0012ab9001" },
                    title: { type: "string", example: "Anniversary Dinner" },
                    description: { type: "string", example: "Premium 3-course experience." },
                    minimumGuests: { type: "number", example: 2 },
                    numberOfDishes: { type: "number", example: 6 },
                    image: { type: "string", example: "https://cdn.rentachef.com/special-menu.jpg" },
                    procurements: {
                        type: "array",
                        items: { $ref: "#/components/schemas/SpecialMenuProcurementItem" },
                    },
                    price: { type: "number", example: 180000 },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            SpecialMenuCreateRequest: {
                type: "object",
                required: ["title", "minimumGuests", "numberOfDishes", "price"],
                properties: {
                    title: { type: "string", example: "Date Night Package" },
                    description: { type: "string", example: "Romantic setup with chef service." },
                    minimumGuests: { type: "number", example: 2 },
                    numberOfDishes: { type: "number", example: 5 },
                    menuPic: { type: "string", format: "binary" },
                    price: { type: "number", example: 120000 },
                },
            },
            SpecialMenuUpdateRequest: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    minimumGuests: { type: "number" },
                    numberOfDishes: { type: "number" },
                    menuPic: { type: "string", format: "binary" },
                    price: { type: "number" },
                },
            },
            SpecialMenuAddProcurementsRequest: {
                type: "object",
                required: ["procurements"],
                properties: {
                    procurements: {
                        type: "array",
                        items: { $ref: "#/components/schemas/SpecialMenuProcurementItem" },
                    },
                },
                example: {
                    procurements: [
                        {
                            title: "Fresh vegetables",
                            description: "Mixed greens and peppers",
                            price: 15000,
                        },
                    ],
                },
            },
            SpecialMenuResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/SpecialMenu" },
                },
            },
            SpecialMenusResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/SpecialMenu" },
                    },
                    payload: {
                        type: "array",
                        items: { $ref: "#/components/schemas/SpecialMenu" },
                    },
                    meta: {
                        type: "object",
                        properties: {
                            total: { type: "number", example: 25 },
                            page: { type: "number", example: 1 },
                            limit: { type: "number", example: 10 },
                            totalPages: { type: "number", example: 3 },
                        },
                    },
                },
            },
            SpecialMenuDeleteResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Special menu deleted successfully" },
                },
            },
            CPWorkflowDefinition: {
                type: "object",
                required: ["code", "displayName", "screenName", "supportsMenuSelection", "supportsProcurement"],
                properties: {
                    code: {
                        type: "string",
                        enum: ["ALASE_SERVICE", "DAILY_CHEF", "DATE_NIGHT", "DINNER_PARTY", "EVENT_CATERING", "STORAGE_PACKAGE"],
                        example: "DAILY_CHEF",
                    },
                    displayName: { type: "string", example: "Home Chef Service" },
                    screenName: { type: "string", example: "HomeChefBookingScreen" },
                    supportsMenuSelection: { type: "boolean", example: true },
                    supportsProcurement: { type: "boolean", example: true },
                },
            },
            CPBookingCreateRequest: {
                type: "object",
                required: [
                    "customerId",
                    "workflow",
                    "bookingData",
                ],
                oneOf: [
                    { required: ["serviceId"] },
                    { required: ["specialServiceId"] },
                    { required: ["specialMenuId"] },
                ],
                properties: {
                    customerId: { type: "string", example: "686d53adf9f59b20d4b9db11" },
                    serviceId: { type: "string", example: "686d53adf9f59b20d4b9da01" },
                    assignedBookingNumberId: {
                        type: "string",
                        description: "Optional. If provided, this assigned queue number record will be linked to the created booking.",
                        example: "687f1c8c7e3f2c0012ab9333",
                    },
                    specialServiceId: { type: "string", example: "686d53adf9f59b20d4b9da02" },
                    specialMenuId: { type: "string", example: "686d53adf9f59b20d4b9da02" },
                    workflow: {
                        type: "string",
                        enum: ["ALASE_SERVICE", "DAILY_CHEF", "DATE_NIGHT", "DINNER_PARTY", "EVENT_CATERING", "STORAGE_PACKAGE"],
                    },
                    chefLevel: { type: "string", enum: ["JUNIOR", "SENIOR", "EXECUTIVE"] },
                    menuSelectionType: { type: "string", enum: ["CHEF_MENU", "CUSTOMER_UPLOAD"] },
                    chefMenuId: { type: "string" },
                    customerUploadedMenuFileId: { type: "string" },
                    procurement: {
                        type: "object",
                        properties: {
                            option: { type: "string", enum: ["CUSTOMER_PURCHASE", "PLATFORM_PROCURE"] },
                            estimatedIngredientCostMinor: { type: "number", example: 2500000 },
                            procurementFeeMinor: { type: "number", example: 300000 },
                        },
                    },
                    bookingData: {
                        type: "object",
                        additionalProperties: true,
                        description: "Workflow-specific dynamic booking fields.",
                        example: {
                            modeOfPayment: "Unpaid",
                            bookingDate: "2026-07-15",
                            numberOfGuests: 30,
                            location: "Lekki, Lagos"
                        },
                    },
                },
            },
            CPBooking: {
                type: "object",
                properties: {
                    id: { type: "string", example: "686d53adf9f59b20d4b9db99" },
                    bookingNumber: { type: "string", example: "BK-1718200000000-321" },
                    customerId: { type: "string", example: "686d53adf9f59b20d4b9db11" },
                    serviceId: { type: "string", example: "686d53adf9f59b20d4b9da01" },
                    specialServiceId: { type: "string", example: "686d53adf9f59b20d4b9da02" },
                    serviceSubCategoryId: { type: "string", example: "686d53adf9f59b20d4b9da03" },
                    workflow: { type: "string", example: "DAILY_CHEF" },
                    chefLevel: { type: "string", example: "SENIOR" },
                    modeOfPayment: { type: "string", enum: ["Paystack", "Transfer", "Unpaid"], example: "Unpaid" },
                    status: { type: "string", example: "PAYMENT_PENDING" },
                    paymentStatus: { type: "string", example: "UNPAID" },
                    bookingData: { type: "object", additionalProperties: true },
                    pricingSnapshot: {
                        type: "object",
                        properties: {
                            baseChefFeeMinor: { type: "number", example: 20000000 },
                            estimatedTotalMinor: { type: "number", example: 22800000 },
                            currency: { type: "string", example: "NGN" },
                        },
                    },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            CPQuotationCreateRequest: {
                type: "object",
                required: [
                    "bookingId",
                    "chefFeeMinor",
                    "ingredientCostMinor",
                    "procurementFeeMinor",
                    "additionalChargesMinor",
                    "discountMinor",
                    "taxMinor",
                ],
                properties: {
                    bookingId: { type: "string", example: "686d53adf9f59b20d4b9db99" },
                    chefFeeMinor: { type: "number", example: 20000000 },
                    ingredientCostMinor: { type: "number", example: 2500000 },
                    procurementFeeMinor: { type: "number", example: 300000 },
                    additionalChargesMinor: { type: "number", example: 150000 },
                    discountMinor: { type: "number", example: 100000 },
                    taxMinor: { type: "number", example: 500000 },
                    notes: { type: "string", example: "Weekend surcharge applied." },
                },
            },
            CPQuotation: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    bookingId: { type: "string" },
                    chefFeeMinor: { type: "number" },
                    ingredientCostMinor: { type: "number" },
                    procurementFeeMinor: { type: "number" },
                    additionalChargesMinor: { type: "number" },
                    discountMinor: { type: "number" },
                    taxMinor: { type: "number" },
                    finalAmountMinor: { type: "number" },
                    currency: { type: "string", example: "NGN" },
                    status: { type: "string" },
                },
            },
            CPPaymentInitRequest: {
                type: "object",
                required: ["bookingId", "customerId", "customerEmail"],
                properties: {
                    bookingId: { type: "string", example: "686d53adf9f59b20d4b9db99" },
                    customerId: { type: "string" },
                    customerEmail: { type: "string", format: "email" },
                },
            },
            CPQuotationPaymentInitRequest: {
                type: "object",
                required: ["bookingId", "quotationId", "customerId", "customerEmail"],
                properties: {
                    bookingId: { type: "string", example: "686d53adf9f59b20d4b9db99" },
                    quotationId: { type: "string", example: "686d53adf9f59b20d4b9dc21" },
                    customerId: { type: "string", example: "686d53adf9f59b20d4b9db11" },
                    customerEmail: { type: "string", format: "email", example: "customer@example.com" },
                },
            },
            CPPaymentInitResponse: {
                type: "object",
                properties: {
                    payment: {
                        type: "object",
                        properties: {
                            id: { type: "string", example: "686d53adf9f59b20d4b9dd50" },
                            paymentReference: { type: "string", example: "rac_686d53adf9f59b20d4b9db99_a1b2c3d4e5f6" },
                            status: { type: "string", example: "PENDING" },
                            amountMinor: { type: "number", example: 22800000 },
                            currency: { type: "string", example: "NGN" },
                        },
                    },
                    gateway: {
                        type: "object",
                        properties: {
                            paymentReference: { type: "string", example: "rac_686d53adf9f59b20d4b9db99_a1b2c3d4e5f6" },
                            authorizationUrl: { type: "string", example: "https://checkout.paystack.com/rac_686d53adf9f59b20d4b9db99_a1b2c3d4e5f6" },
                            amountMinor: { type: "number", example: 22800000 },
                            currency: { type: "string", example: "NGN" },
                        },
                    },
                },
            },
            CPChefMenuCreateRequest: {
                type: "object",
                required: ["chefId", "serviceSubCategoryId", "menuTitle", "menuItems"],
                properties: {
                    chefId: { type: "string", example: "686d53adf9f59b20d4b9de20" },
                    serviceSubCategoryId: { type: "string", example: "686d53adf9f59b20d4b9da03" },
                    menuTitle: { type: "string", example: "Premium Event Package" },
                    menuDescription: { type: "string", example: "3-course buffet options." },
                    menuItems: { type: "array", items: { type: "string" }, example: ["Jollof Rice", "Grilled Chicken", "Moin Moin"] },
                    estimatedGuestCount: { type: "number", example: 100 },
                },
            },
            CPChefMenu: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    chefId: { type: "string" },
                    serviceSubCategoryId: { type: "string" },
                    menuTitle: { type: "string" },
                    menuDescription: { type: "string" },
                    menuItems: { type: "array", items: { type: "string" } },
                    estimatedGuestCount: { type: "number" },
                    status: { type: "string" },
                },
            },
            CPUploadedMenuRequest: {
                type: "object",
                required: ["ownerUserId", "fileName", "mimeType", "extension", "fileUrl", "sizeBytes"],
                properties: {
                    ownerUserId: { type: "string", example: "686d53adf9f59b20d4b9db11" },
                    fileName: { type: "string", example: "wedding-menu.pdf" },
                    mimeType: { type: "string", example: "application/pdf" },
                    extension: { type: "string", enum: ["pdf", "docx", "jpg", "png"] },
                    fileUrl: { type: "string", example: "https://bucket.s3.amazonaws.com/uploads/wedding-menu.pdf" },
                    sizeBytes: { type: "number", example: 245760 },
                },
            },
            CPUploadedFile: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    ownerUserId: { type: "string" },
                    purpose: { type: "string" },
                    fileName: { type: "string" },
                    extension: { type: "string" },
                    fileUrl: { type: "string" },
                    approvedByAdmin: { type: "boolean" },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            CPWorkflowsResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/CPWorkflowDefinition" },
                    },
                },
            },
            CPBookingResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/CPBooking" },
                },
            },
            CPPaginationMeta: {
                type: "object",
                properties: {
                    page: { type: "number", example: 1 },
                    limit: { type: "number", example: 10 },
                    total: { type: "number", example: 42 },
                    totalPages: { type: "number", example: 5 },
                    hasNextPage: { type: "boolean", example: true },
                    hasPreviousPage: { type: "boolean", example: false },
                },
            },
            CPBookingsResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/CPBooking" },
                    },
                    pagination: { $ref: "#/components/schemas/CPPaginationMeta" },
                },
            },
            CPQuotationResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/CPQuotation" },
                },
            },
            CPPaymentInitPayloadResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/CPPaymentInitResponse" },
                },
            },
            CPChefMenuResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/CPChefMenu" },
                },
            },
            CPUploadedMenuResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/CPUploadedFile" },
                },
            },
            AssignedBookingNumber: {
                type: "object",
                properties: {
                    id: { type: "string", example: "687f1c8c7e3f2c0012ab9333" },
                    assignedNumber: { type: "number", example: 18 },
                    serviceId: { type: "string", example: "686d53adf9f59b20d4b9da01" },
                    customerId: { type: "string", example: "686d53adf9f59b20d4b9db11" },
                    bookingId: { type: "string", nullable: true, example: "686d53adf9f59b20d4b9db99" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            AssignedBookingNumberCreateRequest: {
                type: "object",
                required: ["serviceId", "customerId"],
                properties: {
                    serviceId: { type: "string", example: "686d53adf9f59b20d4b9da01" },
                    customerId: { type: "string", example: "686d53adf9f59b20d4b9db11" },
                    bookingId: {
                        type: "string",
                        nullable: true,
                        description: "Optional at creation time. Can be attached later when booking is created.",
                        example: "686d53adf9f59b20d4b9db99",
                    },
                },
            },
            AssignedBookingNumberUpdateRequest: {
                type: "object",
                properties: {
                    serviceId: { type: "string", example: "686d53adf9f59b20d4b9da01" },
                    customerId: { type: "string", example: "686d53adf9f59b20d4b9db11" },
                    bookingId: {
                        type: "string",
                        nullable: true,
                        description: "Set this when a booking record has been created.",
                        example: "686d53adf9f59b20d4b9db99",
                    },
                },
            },
            AssignedBookingNumberResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Assigned booking number updated successfully" },
                    data: { $ref: "#/components/schemas/AssignedBookingNumber" },
                },
            },
            AssignedBookingNumbersResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    count: { type: "number", example: 10 },
                    total: { type: "number", example: 33 },
                    page: { type: "number", example: 1 },
                    totalPages: { type: "number", example: 4 },
                    limit: { type: "number", example: 10 },
                    data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/AssignedBookingNumber" },
                    },
                },
            },
            QuoteAdminResponse: {
                type: "object",
                properties: {
                    message: { type: "string", example: "Thank you, we can handle this request next week." },
                    respondedBy: { type: "string", example: "687f1c8c7e3f2c0012ab8111" },
                    respondedAt: { type: "string", format: "date-time" },
                },
            },
            Quote: {
                type: "object",
                properties: {
                    id: { type: "string", example: "687f1c8c7e3f2c0012ab9001" },
                    title: { type: "string", example: "Birthday Chef Request" },
                    description: {
                        type: "string",
                        example: "I need a chef for 25 guests with seafood and grill options.",
                    },
                    customerId: {
                        oneOf: [
                            { type: "string", example: "686d53adf9f59b20d4b9db11" },
                            { $ref: "#/components/schemas/UserProfile" },
                        ],
                    },
                    status: { type: "string", enum: ["PENDING", "RESPONDED", "CLOSED"], example: "PENDING" },
                    adminResponse: {
                        oneOf: [
                            { $ref: "#/components/schemas/QuoteAdminResponse" },
                            { type: "null" },
                        ],
                    },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            QuoteCreateRequest: {
                type: "object",
                required: ["title", "description"],
                properties: {
                    title: { type: "string", example: "Corporate Dinner Quote" },
                    description: {
                        type: "string",
                        example: "Need a quote for a private in-office dinner for 12 people.",
                    },
                },
            },
            QuoteUpdateRequest: {
                type: "object",
                properties: {
                    title: { type: "string", example: "Updated Dinner Quote" },
                    description: { type: "string", example: "Change menu preference to vegetarian options." },
                    status: { type: "string", enum: ["PENDING", "RESPONDED", "CLOSED"] },
                    responseMessage: {
                        type: "string",
                        description: "Admin can send a reply using responseMessage or adminResponse.message",
                        example: "We have shared this with our chef operations team.",
                    },
                    adminResponse: {
                        type: "object",
                        properties: {
                            message: { type: "string", example: "Can you confirm preferred event time?" },
                        },
                    },
                },
            },
            QuoteReplyRequest: {
                type: "object",
                required: ["message"],
                properties: {
                    message: {
                        type: "string",
                        example: "We can provide a senior chef and full procurement support for this request.",
                    },
                },
            },
            QuoteResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    payload: { $ref: "#/components/schemas/Quote" },
                },
            },
            QuotesResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    payload: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Quote" },
                    },
                    meta: {
                        type: "object",
                        properties: {
                            total: { type: "number", example: 40 },
                            page: { type: "number", example: 1 },
                            limit: { type: "number", example: 10 },
                            totalPages: { type: "number", example: 4 },
                        },
                    },
                },
            },
        },
    },
    security: [{ bearerAuth: [] }],
    tags: [
        { name: "Auth" },
        { name: "Admin" },
        { name: "Chef" },
        { name: "Categories" },
        { name: "Services" },
        { name: "Service Categories" },
        { name: "Chef Services" },
        { name: "Service Pricing" },
        { name: "Users" },
        { name: "Menus" },
        { name: "Menu Types" },
        { name: "Quotes" },
        { name: "Payments" },
        { name: "Special Menus" },
        { name: "States" },
        { name: "Notifications" },
        { name: "Procurement" },
        { name: "Favorites" },
        { name: "Ratings" },
        { name: "Chef Ratings" },
        { name: "Client Ratings" },
        { name: "Terms And Conditions" },
        { name: "Assigned Booking Numbers" },
        { name: "Chef Platform" },
    ],
};
const options = {
    definition: swaggerDefinition,
    apis: ["./src/routes/*.ts", "./src/controllers/*.ts", "./src/platform/**/*.ts"],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.default = swaggerSpec;
