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
exports.sendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const axios_1 = __importDefault(require("axios"));
const sendMail = (userEmail_1, subject_1, html_1, ...args_1) => __awaiter(void 0, [userEmail_1, subject_1, html_1, ...args_1], void 0, function* (userEmail, subject, html, remoteImages = []) {
    const attachments = yield Promise.all(remoteImages.map((img) => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield axios_1.default.get(img.url, { responseType: 'arraybuffer' });
        // Guess filename from URL if not provided
        const fileNameFromURL = img.url.split('/').pop() || 'image.png';
        return {
            filename: img.filename || fileNameFromURL,
            content: Buffer.from(response.data, 'binary'),
            cid: img.cid,
        };
    })));
    const transporter = nodemailer_1.default.createTransport({
        host: process.env.BREVO_SMTP_HOST, // Brevo SMTP host
        port: parseInt('587'), // Use 587 for TLS
        // port: 465,
        // secure: true, // SSL
        auth: {
            user: process.env.BREVO_USERNAME, // Your Brevo SMTP username (API key)
            pass: process.env.BREVO_PASSWORD // Your Brevo API key (same as username)
        },
        secure: false, // Use TLS
        requireTLS: true,
    });
    const mailerOptions = {
        from: '"Olive From Ogasela" <hello@floatsolutionhub.com>', // Sender address
        to: userEmail, // Recipient's email address
        subject: subject,
        html: html,
        attachments: attachments,
        // attachments: [
        //   {
        //     filename: 'fsh-email-template-footer.png',
        //     path: path.join(process.cwd(), 'src', 'assets', 'images', 'fsh-email-template-footer.png'),
        //     cid: 'footerImage' // Use this CID in the HTML to reference the image
        //   },
        //   {
        //     filename: 'fsh-logo.png',
        //     path: path.join(process.cwd(), 'src', 'assets', 'images', 'fsh-logo.png'),
        //     cid: 'logoImage' // Use this CID in the HTML to reference the image
        //   }
        //   ]
    };
    return transporter.sendMail(mailerOptions);
});
exports.sendMail = sendMail;
