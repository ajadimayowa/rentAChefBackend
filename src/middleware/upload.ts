import { S3Client } from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-providers";
import multer from "multer";
import multerS3 from "multer-s3";
import dotenv from "dotenv";

dotenv.config();

const { AWS_REGION, AWS_BUCKET_NAME } = process.env;

if (!AWS_REGION || !AWS_BUCKET_NAME) {
  throw new Error("Missing required AWS configuration: region or bucket name");
}

/** App-wide cap: no uploaded file may be larger than 2 MB. */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "2 MB";

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: fromEnv(),
});

export const createUpload = (folder: string) =>
  multer({
    storage: multerS3({
      s3: s3Client,
      bucket: AWS_BUCKET_NAME,
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        const fileName = `${Date.now()}-${file.originalname}`;
        cb(null, `${folder}/${fileName}`);
      },
      contentType: (req, file, cb) => {
        cb(null, file.mimetype); // ensure proper Content-Type
      },
      contentDisposition: "inline", // ensures it displays in browser / Image component
      acl: "public-read", // make it publicly accessible
    }),
    limits: { fileSize: MAX_UPLOAD_BYTES },
  });

// ✅ Export for profile pictures
export const uploadAdImages = createUpload("images/profile-pictures");

export default uploadAdImages;

/** Max size of a procurement PDF the admin uploads to a booking. */
export const PROCUREMENT_PDF_MAX_BYTES = MAX_UPLOAD_BYTES;

/**
 * Procurement PDFs (admin → booking). PDF only; the key keeps a sanitised copy
 * of the original name so the downloaded file is recognisable.
 */
export const uploadProcurementPdf = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: AWS_BUCKET_NAME,
    key: (_req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80) || "procurement.pdf";
      cb(null, `documents/procurements/${Date.now()}-${safeName}`);
    },
    contentType: (_req, _file, cb) => cb(null, "application/pdf"),
    contentDisposition: "inline",
    acl: "public-read",
  }),
  limits: { fileSize: PROCUREMENT_PDF_MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === "application/pdf" && /\.pdf$/i.test(file.originalname);
    if (isPdf) cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});
