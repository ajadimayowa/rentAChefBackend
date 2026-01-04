import { sendMail } from '../emailService';
import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';

interface CreatorEmailData {
  firstName: string;
  email: string;
  emailVerificationOtp: string;
  logoUrl?: string; // Optional, if you want to include a logo
  footerUrl?: string; // Optional, if you want to include a footer
  orgPrimaryColor?: string; // Optional, to customize the primary color of the email
}

interface EmailSuccessData {
  firstName: string;
  email: string;
  logoUrl?: string; // Optional, if you want to include a logo
  footerUrl?: string; // Optional, if you want to include a footer
  orgPrimaryColor?: string; // Optional, to customize the primary color of the email
}

interface ILoginOtp {
  firstName: string;
  email: string;
  loginOtp: string;
  logoUrl?: string; // Optional, if you want to include a logo
  footerUrl?: string; // Optional, if you want to include a footer
  orgPrimaryColor?: string; // Optional, to customize the primary color of the email
}

interface IPasswordReset {
  firstName: string;
  email: string;
  loginOtp: string;
}

interface CreatorNotificationEmailData {
  firstName: string;
  email: string;
  emailVerificationCode:string;
  logoUrl?: string; // Optional, if you want to include a logo
  footerUrl?: string; // Optional, if you want to include a footer
  orgPrimaryColor?: string; // Optional, to customize the primary color of the email
}

const sendEmailVerificationOtp = async (creatorData: CreatorEmailData) => {
  const { firstName, email, emailVerificationOtp, logoUrl, footerUrl } = creatorData;
  const templatePath = path.join(
    process.cwd(),
    'src',
    'services',
    'email',
    'emailTemps',
    'rentAChef',
    'EmailVerificationOtpTemplate.hbs'
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  // Compile the Handlebars templates
  const template = handlebars.compile(templateSource);
  const html = template({ firstName, email, emailVerificationOtp, orgPrimaryColor: '#ffffffff' });
  const subject = 'Email Verification';
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
    console.log({sendingTo:email})
    await sendMail({userEmail:email, subject, html, remoteImages});
    console.log('email sent successfully!');
  } catch (error) {
    console.error('Error email:', error);
  }

}


const sendEmailVerificationSuccessEmail = async (creatorData: EmailSuccessData) => {
  const { firstName, email,logoUrl, footerUrl } = creatorData;
  const templatePath = path.join(
    process.cwd(),
    'src',
    'services',
    'email',
    'emailTemps',
    'rentAChef',
    'EmailVerificationSuccessTemplate.hbs'
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  // Compile the Handlebars templates
  const template = handlebars.compile(templateSource);
  const html = template({ firstName, email,orgPrimaryColor: '#ffffffff' });
  const subject = 'Email Verified';
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
    console.log({sendingTo:email})
    await sendMail({userEmail:email, subject, html, remoteImages});
    console.log('email sent successfully!');
  } catch (error) {
    console.error('Error email:', error);
  }

}


const sendLoginOtpEmail = async (creatorData: ILoginOtp) => {
  const { firstName, email, loginOtp, logoUrl, footerUrl } = creatorData;
  const templatePath = path.join(
    process.cwd(),
    'src',
    'services',
    'email',
    'emailTemps',
    'rentAChef',
    'LoginOtpEmailTemplate.hbs'
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  // Compile the Handlebars templates
  const template = handlebars.compile(templateSource);
  const html = template({ firstName, email, loginOtp, orgPrimaryColor: '#ffffffff' });
  const subject = 'Login OTP';
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
    await sendMail({userEmail:email, subject, html, remoteImages});
    console.log('email sent successfully!');
  } catch (error) {
    console.error('Error email:', error);
  }

}

const sendLoginSuccessEmail = async (creatorData: EmailSuccessData) => {
  const { firstName, email,logoUrl, footerUrl } = creatorData;
  const templatePath = path.join(
    process.cwd(),
    'src',
    'services',
    'email',
    'emailTemps',
    'rentAChef',
    'LoginSuccessEmailTemplate.hbs'
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  // Compile the Handlebars templates
  const template = handlebars.compile(templateSource);
  const html = template({ firstName, email,orgPrimaryColor: '#ffffffff' });
  const subject = 'Recent Login';
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
    console.log({sendingTo:email})
    await sendMail({userEmail:email, subject, html, remoteImages});
    console.log('email sent successfully!');
  } catch (error) {
    console.error('Error email:', error);
  }

}


const sendPasswordChangeSuccessEmail = async (creatorData: EmailSuccessData) => {
  const { firstName, email,logoUrl, footerUrl } = creatorData;
  const templatePath = path.join(
    process.cwd(),
    'src',
    'services',
    'email',
    'emailTemps',
    'rentAChef',
    'PasswordResetSuccessEmailTemplate.hbs'
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  // Compile the Handlebars templates
  const template = handlebars.compile(templateSource);
  const html = template({ firstName, email,orgPrimaryColor: '#ffffffff' });
  const subject = 'Password changed';
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
    console.log({sendingTo:email})
    await sendMail({userEmail:email, subject, html, remoteImages});
    console.log('email sent successfully!');
  } catch (error) {
    console.error('Error email:', error);
  }

}

const sendRegistrationNotificationEmail2 = async (creatorData: CreatorNotificationEmailData) => {
  const { firstName, email, logoUrl, footerUrl } = creatorData;
  const loginTime = new Date().toLocaleString(); // Get the current date and time
  const templatePath = path.join(
    process.cwd(),
    'src',
    'services',
    'email',
    'emailTemps',
    'creator',
    'CreatorLoginEmailTemplate.hbs'
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  // Compile the Handlebars templates
  const template = handlebars.compile(templateSource);
  const html = template({ firstName, email, orgPrimaryColor: '#ffffffff', loginTime });
  const subject = 'Root Admin Login.';
  const remoteImages = [
    {
      url: logoUrl || 'https://bckash.s3.eu-north-1.amazonaws.com/images/bc-kash-logo-full.png',
      cid: 'logo',
    },
    {
      url: footerUrl || 'https://bckash.s3.eu-north-1.amazonaws.com/images/bckash-footer.png',
      cid: 'footer',
    },
  ];
  try {
    await sendMail({userEmail:email, subject, html, remoteImages});
    console.log('email sent successfully!');
  } catch (error) {
    console.error('Error email:', error);
  }

}

//password reset
const sendUserPasswordResetOTPEmail = async (creatorData: IPasswordReset) => {
  const { firstName, email, loginOtp} = creatorData;
  const templatePath = path.join(
    process.cwd(),
    'src',
    'services',
    'email',
    'emailTemps',
    'rentAChef',
    'PaswordResetOtpEmailTemplate.hbs'
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  // Compile the Handlebars templates
  const template = handlebars.compile(templateSource);
  const html = template({ firstName, email, loginOtp, orgPrimaryColor: '#ffffffff' });
  const subject = 'Password reset otp';
  const remoteImages = [
    {
      url: 'https://rentachefdev.s3.eu-north-1.amazonaws.com/assets/chefLogo.png',
      cid: 'logo',
    },
    {
      url: 'https://rentachefdev.s3.eu-north-1.amazonaws.com/assets/chefFooter.jpg',
      cid: 'footer',
    },
  ];
  try {
    await sendMail({userEmail:email,subject, html, remoteImages});
    console.log('email sent successfully!');
  } catch (error) {
    console.error('Error email:', error);
  }

}

export { 
  sendEmailVerificationOtp,
  sendLoginOtpEmail,
  sendEmailVerificationSuccessEmail,
  sendLoginSuccessEmail,
  sendUserPasswordResetOTPEmail,
  sendPasswordChangeSuccessEmail
}
