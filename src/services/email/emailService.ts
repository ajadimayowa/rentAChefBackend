import nodemailer, { Transporter } from 'nodemailer';
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

interface SendMailOptions {
  userEmail: string;
  subject: string;
  html: string;
  text?: string; // plain-text alternative; auto-generated from html when omitted
  remoteImages?: RemoteImage[];
  localImages?: LocalImage[];
  retries?: number; // number of send attempts
  retryDelayMs?: number; // base delay between retries (grows with each attempt)
}

// Read lazily (not destructured at module load) so this works regardless of
// whether dotenv.config() has run yet by the time this module is first imported —
// e.g. index.ts imports route/controller chains that reach this file before its
// own dotenv.config() call runs, which would otherwise freeze these as undefined.
const getFromName = () => process.env.EMAIL_FROM_NAME || 'RentAChef';
const getFromAddress = () => process.env.EMAIL_FROM_ADDRESS || 'no-reply@floatsolutionhub.com';
const getReplyTo = () => process.env.EMAIL_REPLY_TO || 'support@floatsolutionhub.com';

let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, SMTP_PORT } = process.env;

  if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD) {
    throw new Error('SMTP credentials are not set in .env');
  }

  const port = parseInt(SMTP_PORT || '587', 10);
  const secure = port === 465;

  // Pooled + bounded so we reuse one authenticated connection to Brevo instead of
  // renegotiating TLS/auth on every send, and so we back off instead of tripping
  // Brevo's rate limits under bursts.
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: {
      user: SMTP_USERNAME,
      pass: SMTP_PASSWORD,
    },
    requireTLS: !secure,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return transporter;
};

/** Call once at app startup to fail fast/log clearly if SMTP auth or connectivity is broken. */
export const verifyEmailTransport = async (): Promise<boolean> => {
  try {
    await getTransporter().verify();
    console.log('[email] SMTP connection verified');
    return true;
  } catch (error) {
    console.error('[email] SMTP connection failed verification:', error);
    return false;
  }
};

// Sending HTML with no text/plain part is a common spam-filter signal, so we
// always ship a multipart/alternative text version, generated from the HTML
// when the caller doesn't supply one.
const htmlToPlainText = (html: string): string =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|td|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const isRetryableError = (error: unknown): boolean => {
  const code = (error as { code?: string })?.code;
  const responseCode = (error as { responseCode?: number })?.responseCode;
  if (code && ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ESOCKET', 'EDNS', 'EAI_AGAIN'].includes(code)) {
    return true;
  }
  // 4xx SMTP replies are transient (e.g. Brevo throttling/greylisting); 5xx are permanent.
  if (responseCode && responseCode >= 400 && responseCode < 500) return true;
  return false;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const sendMail = async ({
  userEmail,
  subject,
  html,
  text,
  remoteImages = [],
  localImages = [],
  retries = 3,
  retryDelayMs = 1500,
}: SendMailOptions) => {
  const client = getTransporter();

  // A broken/slow remote image shouldn't take the whole email down with it -
  // fetch with a timeout and drop any image that fails rather than throwing.
  const remoteAttachments = (
    await Promise.all(
      remoteImages.map(async (img) => {
        try {
          const response = await axios.get(img.url, {
            responseType: 'arraybuffer',
            timeout: 8000,
          });
          const fileNameFromURL = img.url.split('/').pop() || 'image.png';
          return {
            filename: img.filename || fileNameFromURL,
            content: Buffer.from(response.data, 'binary'),
            cid: img.cid,
          };
        } catch (error) {
          console.error(
            `[email] Failed to fetch remote image ${img.url} for ${userEmail}:`,
            (error as Error).message || error
          );
          return null;
        }
      })
    )
  ).filter((attachment): attachment is NonNullable<typeof attachment> => attachment !== null);

  const localAttachments = localImages.map((img) => ({
    filename: img.filename || path.basename(img.path),
    path: img.path,
    cid: img.cid,
  }));

  const fromAddress = getFromAddress();
  // Used for the Message-ID header so it lines up with the authenticated sending domain (SPF/DKIM).
  const sendingDomain = fromAddress.split('@')[1] || 'floatsolutionhub.com';

  const mailOptions = {
    from: `"${getFromName()}" <${fromAddress}>`,
    replyTo: getReplyTo(),
    to: userEmail,
    subject,
    html,
    text: text || htmlToPlainText(html),
    attachments: [...remoteAttachments, ...localAttachments],
    messageId: `<${Date.now()}.${Math.random().toString(36).slice(2)}@${sendingDomain}>`,
  };

  let attempt = 0;
  while (attempt < retries) {
    attempt++;
    try {
      const info = await client.sendMail(mailOptions);
      console.log(`[email] sent to ${userEmail}: ${info.messageId}`);
      return info;
    } catch (error) {
      const retryable = isRetryableError(error);
      const isLastAttempt = attempt >= retries;
      console.error(
        `[email] attempt ${attempt}/${retries} failed for ${userEmail} (retryable: ${retryable}):`,
        (error as Error).message || error
      );
      if (isLastAttempt || !retryable) {
        throw new Error(
          `Failed to send email to ${userEmail} after ${attempt} attempt(s): ${(error as Error).message || error}`
        );
      }
      await sleep(retryDelayMs * attempt);
    }
  }
};
