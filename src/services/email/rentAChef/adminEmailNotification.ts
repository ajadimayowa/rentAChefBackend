import { sendMail } from '../emailService';
import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';

interface AdminCreationEmailData {
  firstName: string;
  fullName: string;
  email: string;
  role: string;
  logoUrl?: string; // Optional, if you want to include a logo
  footerUrl?: string; // Optional, if you want to include a footer
  orgPrimaryColor?: string; // Optional, to customize the primary color of the email
}

const sendAdminCreationEmail = async (adminData: AdminCreationEmailData) => {
  const { firstName, email, role, logoUrl, footerUrl } = adminData;
  const templatePath = path.join(
    __dirname,
    '..',
    'emailTemps',
    'rentAChef',
    'AdminCreationEmailTemplate.hbs'
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  // Compile the Handlebars templates
  const template = handlebars.compile(templateSource);
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
    await sendMail({ userEmail: email, subject, html, remoteImages });
    console.log('email sent successfully!');
  } catch (error) {
    console.error('Error email:', error);
  }
};

export { sendAdminCreationEmail };
