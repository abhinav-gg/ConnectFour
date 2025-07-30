import { EmailSendError } from "@/types/miscErrors";
import {loadTemplate, sendEmail} from "./emails"
import Handlebars from "handlebars";

export function sendEmailVerifyCode(code: string,  username: string, email: string) {

    // add a dash in the middle (between chr 3 and 4) and split to list
    const codeToSend = [
        ...code.slice(0, 3).split(''),
        '-',
        ...code.slice(3).split('')
    ];

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
        sendEmail(email, "Verify Con4 Account", html)
    } catch {
        throw new EmailSendError()
    }

}
