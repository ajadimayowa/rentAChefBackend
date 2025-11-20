
import nodemailer from 'nodemailer';
import path from 'path';
import axios from 'axios';


interface RemoteImage {
  url: string;
  cid: string;
  filename?: string; // optional
}

interface LocalImage {
  path: string;
  cid: string;
  filename?: string;
}

interface RemoteImage {
  url: string;
  cid: string;
  filename?: string; // optional
}

interface SendMailOptions {
  userEmail: string;
  subject: string;
  html: string;
  remoteImages?: RemoteImage[];
  localImages?: LocalImage[];
  retries?: number; // number of retry attempts
  retryDelayMs?: number; // delay between retries
}

export const sendMail = async ({
  userEmail,
  subject,
  html,
  remoteImages = [],
  localImages = [],
  retries = 3,
  retryDelayMs = 2000,
}: SendMailOptions) => {
  const { SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, SMTP_PORT } = process.env;
  if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD) {
    throw new Error('SMTP credentials are not set in .env');
  }

  // Prepare remote attachments
  const remoteAttachments = await Promise.all(
    remoteImages.map(async (img) => {
      const response = await axios.get(img.url, { responseType: 'arraybuffer' });
      const fileNameFromURL = img.url.split('/').pop() || 'image.png';
      return {
        filename: img.filename || fileNameFromURL,
        content: Buffer.from(response.data, 'binary'),
        cid: img.cid,
      };
    })
  );

  // Prepare local attachments
  const localAttachments = localImages.map((img) => ({
    filename: img.filename || path.basename(img.path),
    path: img.path,
    cid: img.cid,
  }));

  const port = parseInt(SMTP_PORT || '587');
  const transporter = nodemailer.createTransport({
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
    from: '"Olive From Ogasela" <hello@ogasela.com>',
    to: userEmail,
    subject,
    html,
    attachments: [...remoteAttachments, ...localAttachments],
  };

  // --- Retry logic ---
  let attempt = 0;
  while (attempt < retries) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${userEmail}: ${info.messageId}`);
      return info;
    } catch (error) {
      attempt++;
      console.error(`Attempt ${attempt} failed for ${userEmail}:`, error);
      if (attempt < retries) {
        console.log(`Retrying in ${retryDelayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      } else {
        throw new Error(`Failed to send email to ${userEmail} after ${retries} attempts`);
      }
    }
  }
};