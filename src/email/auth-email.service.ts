import { Injectable } from "@nestjs/common";
import { EmailService } from "../email/email.service";

type EmailType = {
    name: string;
    email: string;
    token: string;
}

@Injectable()
export class AuthEmail {

    constructor(private readonly emailService: EmailService) {}

    async sendForgotEmail(user: EmailType) {

        console.log(user)

        const html = `
            <p>Hola <strong>${user.name}</strong>,</p>
            <p>Para restablecer tu contraseña haz clic en el siguiente enlace:</p>
            <p><a href="${process.env.FRONTEND_URL}/auth/nuevo-password">Restablecer contraseña</a></p>
            <p>E ingresa el código: <strong>${user.token}</strong></p>
            <p>Si no solicitaste este correo, puedes ignorarlo.</p>
        `;

        await this.emailService.sendMail(
            user.email,
            'Instrucciones para restablecer contraseña',
            html
        );
    }
}
