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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBookingNotificationEmail = void 0;
const emailService_1 = require("../emailService");
const handlebars_1 = __importDefault(require("handlebars"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const loginUrl = () => `${process.env.CLIENT_URL || ''}/login`;
/** Shared sender behind every booking-lifecycle notification (chef assigned, procurement added, booking approved, comment added) — one template, different heading/message per call site. */
const sendBookingNotificationEmail = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, email, heading, message, bookingNumber, ctaLabel = 'Log in to view booking', ctaUrl = loginUrl(), logoUrl, footerUrl, } = data;
    const templatePath = path_1.default.join(__dirname, '..', 'emailTemps', 'rentAChef', 'BookingNotificationEmailTemplate.hbs');
    const templateSource = fs_1.default.readFileSync(templatePath, 'utf-8');
    const template = handlebars_1.default.compile(templateSource);
    const html = template({ firstName, email, heading, message, bookingNumber, ctaLabel, ctaUrl, orgPrimaryColor: '#ffffff' });
    const remoteImages = [
        { url: logoUrl || 'https://rentachefdev.s3.eu-north-1.amazonaws.com/assets/chefLogo.png', cid: 'logo' },
        { url: footerUrl || 'https://rentachefdev.s3.eu-north-1.amazonaws.com/assets/chefFooter.jpg', cid: 'footer' },
    ];
    try {
        yield (0, emailService_1.sendMail)({ userEmail: email, subject: heading, html, remoteImages });
        console.log(`[email] booking notification sent to ${email}: ${heading}`);
    }
    catch (error) {
        console.error(`[email] Failed to send booking notification to ${email}:`, error);
    }
});
exports.sendBookingNotificationEmail = sendBookingNotificationEmail;
