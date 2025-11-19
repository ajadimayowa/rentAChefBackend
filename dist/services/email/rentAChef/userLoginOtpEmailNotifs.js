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
exports.sendUserPasswordResetNotificationEmail = exports.sendUserPasswordResetOtpEmail = exports.sendUserLoginNotificationEmail = exports.sendUserLoginOtpNotificationEmail = void 0;
const emailService_1 = require("../emailService");
const handlebars_1 = __importDefault(require("handlebars"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sendUserLoginOtpNotificationEmail = (creatorData) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, email, loginOtpCode } = creatorData;
    const templatePath = path_1.default.join(process.cwd(), 'src', 'services', 'email', 'emailTemps', 'ogasela', 'LoginOtpEmailTemplate.hbs');
    const templateSource = fs_1.default.readFileSync(templatePath, 'utf-8');
    // Compile the Handlebars templates
    const template = handlebars_1.default.compile(templateSource);
    const html = template({ firstName, email, loginOtpCode, orgPrimaryColor: '#ffffffff' });
    const subject = 'Login Otp';
    const remoteImages = [
        {
            url: 'https://ogasela-bucket.s3.eu-north-1.amazonaws.com/images/website-pictures/ogasela-icon.png',
            cid: 'logo',
        },
        {
            url: 'https://ogasela-bucket.s3.eu-north-1.amazonaws.com/images/website-pictures/ogasela-footer.png',
            cid: 'footer',
        },
    ];
    try {
        yield (0, emailService_1.sendMail)(email, subject, html, remoteImages);
        console.log('email sent successfully!');
    }
    catch (error) {
        console.error('Error email:', error);
    }
});
exports.sendUserLoginOtpNotificationEmail = sendUserLoginOtpNotificationEmail;
const sendUserLoginNotificationEmail = (creatorData) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, email, loginOtpCode } = creatorData;
    const templatePath = path_1.default.join(process.cwd(), 'src', 'services', 'email', 'emailTemps', 'ogasela', 'LoginNotificationEmailTemplate.hbs');
    const templateSource = fs_1.default.readFileSync(templatePath, 'utf-8');
    // Compile the Handlebars templates
    const template = handlebars_1.default.compile(templateSource);
    const html = template({ firstName, email, loginOtpCode, orgPrimaryColor: '#ffffffff' });
    const subject = 'Login Activity';
    const remoteImages = [
        {
            url: 'https://ogasela-bucket.s3.eu-north-1.amazonaws.com/images/website-pictures/ogasela-icon.png',
            cid: 'logo',
        },
        {
            url: 'https://ogasela-bucket.s3.eu-north-1.amazonaws.com/images/website-pictures/ogasela-footer.png',
            cid: 'footer',
        },
    ];
    try {
        yield (0, emailService_1.sendMail)(email, subject, html, remoteImages);
        console.log('email sent successfully!');
    }
    catch (error) {
        console.error('Error email:', error);
    }
});
exports.sendUserLoginNotificationEmail = sendUserLoginNotificationEmail;
const sendUserPasswordResetNotificationEmail = (creatorData) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, email, loginOtpCode } = creatorData;
    const templatePath = path_1.default.join(process.cwd(), 'src', 'services', 'email', 'emailTemps', 'ogasela', 'PasswordResetNotificationEmailTemplate.hbs');
    const templateSource = fs_1.default.readFileSync(templatePath, 'utf-8');
    // Compile the Handlebars templates
    const template = handlebars_1.default.compile(templateSource);
    const html = template({ firstName, email, loginOtpCode, orgPrimaryColor: '#ffffffff' });
    const subject = 'Password Reset';
    const remoteImages = [
        {
            url: 'https://ogasela-bucket.s3.eu-north-1.amazonaws.com/images/website-pictures/ogasela-icon.png',
            cid: 'logo',
        },
        {
            url: 'https://ogasela-bucket.s3.eu-north-1.amazonaws.com/images/website-pictures/ogasela-footer.png',
            cid: 'footer',
        },
    ];
    try {
        yield (0, emailService_1.sendMail)(email, subject, html, remoteImages);
        console.log('email sent successfully!');
    }
    catch (error) {
        console.error('Error email:', error);
    }
});
exports.sendUserPasswordResetNotificationEmail = sendUserPasswordResetNotificationEmail;
const sendUserPasswordResetOtpEmail = (creatorData) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, email, passwordResetOtpCode } = creatorData;
    const templatePath = path_1.default.join(process.cwd(), 'src', 'services', 'email', 'emailTemps', 'ogasela', 'PaswordResetOtpEmailTemplate.hbs');
    const templateSource = fs_1.default.readFileSync(templatePath, 'utf-8');
    // Compile the Handlebars templates
    const template = handlebars_1.default.compile(templateSource);
    const html = template({ firstName, email, passwordResetOtpCode, orgPrimaryColor: '#ffffffff' });
    const subject = 'Password Reset';
    const remoteImages = [
        {
            url: 'https://ogasela-bucket.s3.eu-north-1.amazonaws.com/images/website-pictures/ogasela-icon.png',
            cid: 'logo',
        },
        {
            url: 'https://ogasela-bucket.s3.eu-north-1.amazonaws.com/images/website-pictures/ogasela-footer.png',
            cid: 'footer',
        },
    ];
    try {
        yield (0, emailService_1.sendMail)(email, subject, html, remoteImages);
        console.log('email sent successfully!');
    }
    catch (error) {
        console.error('Error email:', error);
    }
});
exports.sendUserPasswordResetOtpEmail = sendUserPasswordResetOtpEmail;
