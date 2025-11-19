
import nodemailer from 'nodemailer';
import path from 'path';
import axios from 'axios';

interface RemoteImage {
  url: string;
  cid: string;
  filename?: string; // optional
}


export const sendMail = async (
  userEmail: string,
  subject: string,
  html: string,
  remoteImages: RemoteImage[] = []
) => {

  const attachments = await Promise.all(
    remoteImages.map(async (img) => {
      const response = await axios.get(img.url, { responseType: 'arraybuffer' });

      // Guess filename from URL if not provided
      const fileNameFromURL = img.url.split('/').pop() || 'image.png';

      return {
        filename: img.filename || fileNameFromURL,
        content: Buffer.from(response.data, 'binary'),
        cid: img.cid,
      };
    })
    
  );
  const transporter = nodemailer.createTransport({
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
};