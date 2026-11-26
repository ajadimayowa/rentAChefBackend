import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';
import { sendMail } from '../emailService';

export interface InvoiceEmailData {
  email: string;
  firstName: string;
  invoiceNumber: string;
  issuedOn: string;
  serviceName: string;
  details: { label: string; value: string }[];
  lines: { label: string; hint?: string; amount: string }[];
  total: string;
}

/** Sends a booking invoice. Unlike notifications, failures are thrown so the caller can tell the user. */
export const sendInvoiceEmail = async (data: InvoiceEmailData) => {
  const templatePath = path.join(__dirname, '..', 'emailTemps', 'rentAChef', 'InvoiceEmailTemplate.hbs');
  const template = handlebars.compile(fs.readFileSync(templatePath, 'utf-8'));
  const html = template({ ...data, orgPrimaryColor: '#ffffff' });

  await sendMail({
    userEmail: data.email,
    subject: `Your RentAChef invoice ${data.invoiceNumber} — ${data.serviceName}`,
    html,
    remoteImages: [
      { url: 'https://rentachefdev.s3.eu-north-1.amazonaws.com/assets/chefLogo.png', cid: 'logo' },
      { url: 'https://rentachefdev.s3.eu-north-1.amazonaws.com/assets/chefFooter.jpg', cid: 'footer' },
    ],
  });
};
