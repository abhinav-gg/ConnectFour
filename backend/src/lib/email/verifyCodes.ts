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

    
    const template = Handlebars.compile(templateString);
    const html = template({ code: codeToSend, username });
    
    try {
        sendEmail(email, "Verify Con4 Account", html)
    } catch {
        throw new EmailSendError()
    }

}
