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
exports.sendAdminCreationEmail = void 0;
const emailService_1 = require("../emailService");
const handlebars_1 = __importDefault(require("handlebars"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sendAdminCreationEmail = (adminData) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, email, role, logoUrl, footerUrl } = adminData;
    const templatePath = path_1.default.join(__dirname, '..', 'emailTemps', 'rentAChef', 'AdminCreationEmailTemplate.hbs');
    const templateSource = fs_1.default.readFileSync(templatePath, 'utf-8');
    // Compile the Handlebars templates
    const template = handlebars_1.default.compile(templateSource);
    const html = template({ firstName, email, role, orgPrimaryColor: '#ffffff' });
    const subject = 'Profile Created';
    const remoteImages = [
        {
            url: logoUrl || 'https://rentachefdev.s3.eu-north-1.amazonaws.com/assets/chefLogo.png',
            cid: 'logo',
        },
        {
            url: footerUrl || 'https://rentachefdev.s3.eu-north-1.amazonaws.com/assets/chefFooter.jpg',
            cid: 'footer',
        },
    ];
    try {
        console.log({ sendingTo: email });
        yield (0, emailService_1.sendMail)({ userEmail: email, subject, html, remoteImages });
        console.log('email sent successfully!');
    }
    catch (error) {
        console.error('Error email:', error);
    }
});
exports.sendAdminCreationEmail = sendAdminCreationEmail;
