import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;


    
    constructor() {
         const transportOptions: SMTPTransport.Options = {
            host: process.env.EMAIL_HOST,
            port: +process.env.EMAIL_PORT!,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        };

        this.transporter = nodemailer.createTransport(transportOptions)
    }

    async sendMail( to: string, subject: string, html: string ) {
        await this.transporter.sendMail({
            from: 'App Liquidaciones <notificaciones@mudanzasamado.mx>',
            to,
            subject,
            html
        })
    }
    
}
