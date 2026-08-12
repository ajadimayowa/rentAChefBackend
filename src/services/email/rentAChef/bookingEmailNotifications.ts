import { sendMail } from '../emailService';
import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';

interface BookingNotificationEmailData {
  firstName: string;
  email: string;
  heading: string;
  message: string;
  bookingNumber?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  logoUrl?: string;
  footerUrl?: string;
}

const loginUrl = () => `${process.env.CLIENT_URL || ''}/login`;

/** Shared sender behind every booking-lifecycle notification (chef assigned, procurement added, booking approved, comment added) — one template, different heading/message per call site. */
export const sendBookingNotificationEmail = async (data: BookingNotificationEmailData) => {
  const {
    firstName,
    email,
    heading,
    message,
    bookingNumber,
    ctaLabel = 'Log in to view booking',
    ctaUrl = loginUrl(),
    logoUrl,
    footerUrl,
  } = data;

  const templatePath = path.join(__dirname, '..', 'emailTemps', 'rentAChef', 'BookingNotificationEmailTemplate.hbs');
  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = handlebars.compile(templateSource);
  const html = template({ firstName, email, heading, message, bookingNumber, ctaLabel, ctaUrl, orgPrimaryColor: '#ffffff' });

  const remoteImages = [
    { url: logoUrl || 'https://rentachefdev.s3.eu-north-1.amazonaws.com/assets/chefLogo.png', cid: 'logo' },
    { url: footerUrl || 'https://rentachefdev.s3.eu-north-1.amazonaws.com/assets/chefFooter.jpg', cid: 'footer' },
  ];

  try {
    await sendMail({ userEmail: email, subject: heading, html, remoteImages });
    console.log(`[email] booking notification sent to ${email}: ${heading}`);
  } catch (error) {
    console.error(`[email] Failed to send booking notification to ${email}:`, error);
  }
};
