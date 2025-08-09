import { EmailSendError } from "@/types/miscErrors";
import {loadTemplate, sendEmail} from "./emails"
import Handlebars from "handlebars";
import { JobSets } from "@/jobs";

export async function sendEmailVerifyCode(code: string,  username: string, email: string) {

    const templateString = loadTemplate("verification-email.html")

    const digits = [...code].map((char, idx) => ({
        value: char,
        style: `
          width: ${idx === 0 ? 60 : 50}px;
          height: 80px;
          border-radius: 12px;
          background-color: ${idx % 2 === 0 ? '#ef5350' : '#ffca28'};
          font-size: 36px;
          font-weight: bold;
          color: #FFFFFF;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          vertical-align: middle;
          text-align: center;
          ${idx !== 0 ? 'padding-left: 16px;' : ''}
        `.trim()
      }));

    const template = Handlebars.compile(templateString);
    const html = template({ digits, username });

    try {
        await JobSets.getEmailQueue().add('sendVerificationEmail', {
            to: email,
            subject: "Verify Con4 Account",
            html
        });
    } catch {
        throw new EmailSendError();
    }


}
