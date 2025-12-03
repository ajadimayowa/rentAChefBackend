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
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const sendMail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userEmail, subject, html, remoteImages = [], localImages = [], retries = 3, retryDelayMs = 2000, }) {
    const { SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, SMTP_PORT } = process.env;
    if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD) {
        throw new Error('SMTP credentials are not set in .env');
    }
    // Prepare remote attachments
    const remoteAttachments = yield Promise.all(remoteImages.map((img) => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield axios_1.default.get(img.url, { responseType: 'arraybuffer' });
        const fileNameFromURL = img.url.split('/').pop() || 'image.png';
        return {
            filename: img.filename || fileNameFromURL,
            content: Buffer.from(response.data, 'binary'),
            cid: img.cid,
        };
    })));
    // Prepare local attachments
    const localAttachments = localImages.map((img) => ({
        filename: img.filename || path_1.default.basename(img.path),
        path: img.path,
        cid: img.cid,
    }));
    const port = parseInt(SMTP_PORT || '587');
    const transporter = nodemailer_1.default.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
            user: SMTP_USERNAME,
            pass: SMTP_PASSWORD,
        },
        requireTLS: true,
    });
    const mailOptions = {
        from: '"RentAChef" <support@floatsolutionhub.com>',
        to: userEmail,
        subject,
        html,
        attachments: [...remoteAttachments, ...localAttachments],
    };
    // --- Retry logic ---
    let attempt = 0;
    while (attempt < retries) {
        try {
            const info = yield transporter.sendMail(mailOptions);
            console.log(`Email sent to ${userEmail}: ${info.messageId}`);
            return info;
        }
        catch (error) {
            attempt++;
            console.error(`Attempt ${attempt} failed for ${userEmail}:`, error);
            if (attempt < retries) {
                console.log(`Retrying in ${retryDelayMs}ms...`);
                yield new Promise((resolve) => setTimeout(resolve, retryDelayMs));
            }
            else {
                throw new Error(`Failed to send email to ${userEmail} after ${retries} attempts`);
            }
        }
    }
});
exports.sendMail = sendMail;
