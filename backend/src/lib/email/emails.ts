import nodemailer from 'nodemailer';
import { myConfig } from '@/config/env';
import fs from 'fs';



export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    console.log(myConfig.ZOHO_PWD, myConfig.ZOHO_USER);
    const transporter = nodemailer.createTransport({
      host:'smtp.zoho.eu',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: myConfig.ZOHO_USER,
        pass: myConfig.ZOHO_PWD,
      },
    });
    const info = await transporter.sendMail({
      from: '"Con4" <administrator@con4.uk>',
      to,
      subject,
      html,
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
};

export function loadTemplate(name: string): string | undefined {
  if (!name) return undefined;
  return fs.readFileSync(`./data/email-templates/${name}`).toString();
}
