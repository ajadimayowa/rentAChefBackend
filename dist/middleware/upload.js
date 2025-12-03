"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAdImages = exports.createUpload = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const credential_providers_1 = require("@aws-sdk/credential-providers");
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { AWS_REGION, AWS_BUCKET_NAME } = process.env;
if (!AWS_REGION || !AWS_BUCKET_NAME) {
    throw new Error("Missing required AWS configuration: region or bucket name");
}
const s3Client = new client_s3_1.S3Client({
    region: AWS_REGION,
    credentials: (0, credential_providers_1.fromEnv)(),
});
const createUpload = (folder) => (0, multer_1.default)({
    storage: (0, multer_s3_1.default)({
        s3: s3Client,
        bucket: AWS_BUCKET_NAME,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const fileName = `${Date.now()}-${file.originalname}`;
            cb(null, `${folder}/${fileName}`);
        },
    }),
});
exports.createUpload = createUpload;
// ✅ Export for ads (images folder)
exports.uploadAdImages = (0, exports.createUpload)("images/profile-pictures/");
exports.default = exports.uploadAdImages;
