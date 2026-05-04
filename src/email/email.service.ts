import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const port = +process.env.EMAIL_PORT! || 465;
    const transportOptions: SMTPTransport.Options = {
      host: process.env.EMAIL_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      }
    };

    this.transporter = nodemailer.createTransport(transportOptions);
  }

  async sendMail(to: string, subject: string, html: string) {
    await this.transporter.sendMail({
      from: `App Liquidaciones <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  }
}
