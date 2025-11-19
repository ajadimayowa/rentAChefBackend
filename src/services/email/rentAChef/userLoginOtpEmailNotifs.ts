import { sendMail } from '../emailService';
import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';

interface ILoginEmailData {
  firstName: string;
  email: string;
  loginOtpCode?: string;
  passwordResetOtpCode?:string|null
}

interface CreatorNotificationEmailData {
  firstName: string;
  email: string;
  emailVerificationCode:string;
}

const sendUserLoginOtpNotificationEmail = async (creatorData: ILoginEmailData) => {
  const { firstName, email, loginOtpCode} = creatorData;
  const templatePath = path.join(
    process.cwd(),
    'src',
    'services',
    'email',
    'emailTemps',
    'ogasela',
    'LoginOtpEmailTemplate.hbs'
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  // Compile the Handlebars templates
  const template = handlebars.compile(templateSource);
  const html = template({ firstName, email, loginOtpCode, orgPrimaryColor: '#ffffffff' });
  const subject = 'Login Otp';
  const remoteImages = [
    {
      url:'https://ogasela-bucket.s3.eu-north-1.amazonaws.com/images/website-pictures/ogasela-icon.png',
      cid: 'logo',
    },
    {
      url:'https://ogasela-bucket.s3.eu-north-1.amazonaws.com/images/website-pictures/ogasela-footer.png',
      cid: 'footer',
    },
  ];
  try {
    await sendMail(email, subject, html, remoteImages);
    console.log('email sent successfully!');
  } catch (error) {
    console.error('Error email:', error);
  }

}

const sendUserLoginNotificationEmail = async (creatorData: ILoginEmailData) => {
  const { firstName, email, loginOtpCode} = creatorData;
  const templatePath = path.join(
    process.cwd(),
    'src',
    'services',
    'email',
    'emailTemps',
    'ogasela',
    'LoginNotificationEmailTemplate.hbs'
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  // Compile the Handlebars templates
  const template = handlebars.compile(templateSource);
  const html = template({ firstName, email, loginOtpCode, orgPrimaryColor: '#ffffffff' });
  const subject = 'Login Activity';
  const remoteImages = [
    {
      url:'https://ogasela-bucket.s3.eu-north-1.amazonaws.com/images/website-pictures/ogasela-icon.png',
      cid: 'logo',
    },
    {
      url:'https://ogasela-bucket.s3.eu-north-1.amazonaws.com/images/website-pictures/ogasela-footer.png',
      cid: 'footer',
    },
  ];
  try {
    await sendMail(email, subject, html, remoteImages);
    console.log('email sent successfully!');
  } catch (error) {
    console.error('Error email:', error);
  }

}

const sendUserPasswordResetNotificationEmail = async (creatorData: ILoginEmailData) => {
  const { firstName, email, loginOtpCode} = creatorData;
  const templatePath = path.join(
    process.cwd(),
    'src',
    'services',
    'email',
    'emailTemps',
    'ogasela',
    'PasswordResetNotificationEmailTemplate.hbs'
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  // Compile the Handlebars templates
  const template = handlebars.compile(templateSource);
  const html = template({ firstName, email, loginOtpCode, orgPrimaryColor: '#ffffffff' });
  const subject = 'Password Reset';
  const remoteImages = [
    {
      url:'https://ogasela-bucket.s3.eu-north-1.amazonaws.com/images/website-pictures/ogasela-icon.png',
      cid: 'logo',
    },
    {
      url:'https://ogasela-bucket.s3.eu-north-1.amazonaws.com/images/website-pictures/ogasela-footer.png',
      cid: 'footer',
    },
  ];
  try {
    await sendMail(email, subject, html, remoteImages);
    console.log('email sent successfully!');
  } catch (error) {
    console.error('Error email:', error);
  }

}

const sendUserPasswordResetOtpEmail = async (creatorData: ILoginEmailData) => {
  const { firstName, email, passwordResetOtpCode} = creatorData;
  const templatePath = path.join(
    process.cwd(),
    'src',
    'services',
    'email',
    'emailTemps',
    'ogasela',
    'PaswordResetOtpEmailTemplate.hbs'
  );

  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  // Compile the Handlebars templates
  const template = handlebars.compile(templateSource);
  const html = template({ firstName, email, passwordResetOtpCode, orgPrimaryColor: '#ffffffff' });
  const subject = 'Password Reset';
  const remoteImages = [
    {
      url:'https://ogasela-bucket.s3.eu-north-1.amazonaws.com/images/website-pictures/ogasela-icon.png',
      cid: 'logo',
    },
    {
      url:'https://ogasela-bucket.s3.eu-north-1.amazonaws.com/images/website-pictures/ogasela-footer.png',
      cid: 'footer',
    },
  ];
  try {
    await sendMail(email, subject, html, remoteImages);
    console.log('email sent successfully!');
  } catch (error) {
    console.error('Error email:', error);
  }

}


export { sendUserLoginOtpNotificationEmail,sendUserLoginNotificationEmail,sendUserPasswordResetOtpEmail,sendUserPasswordResetNotificationEmail }
