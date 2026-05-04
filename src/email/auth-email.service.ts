import { Injectable } from '@nestjs/common';
import { EmailService } from '../email/email.service';

type EmailType = {
  name: string;
  email: string;
  token: string;
};

@Injectable()
export class AuthEmail {
  constructor(private readonly emailService: EmailService) {}

  async sendForgotEmail(user: EmailType) {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/nuevo-password`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background:#1a73e8;padding:32px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:22px;">Mudanzas Amado</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px 32px;">
                    <p style="margin:0 0 16px;color:#333;font-size:16px;">
                      Hola, <strong>${user.name}</strong>
                    </p>
                    <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
                      Recibimos una solicitud para restablecer la contraseña de tu cuenta. 
                      Haz clic en el botón e ingresa tu código de verificación.
                    </p>

                    <!-- Button -->
                    <div style="text-align:center;margin:0 0 24px;">
                      <a href="${resetUrl}"
                        style="display:inline-block;background:#1a73e8;color:#ffffff;text-decoration:none;
                                padding:14px 32px;border-radius:6px;font-size:15px;font-weight:bold;">
                        Restablecer contraseña
                      </a>
                    </div>

                    <!-- Token -->
                    <p style="margin:0 0 8px;color:#555;font-size:14px;text-align:center;">
                      Tu código de verificación es:
                    </p>
                    <div style="text-align:center;margin:0 0 24px;">
                      <span style="display:inline-block;background:#f0f4ff;color:#1a73e8;
                                  font-size:28px;font-weight:bold;letter-spacing:8px;
                                  padding:12px 24px;border-radius:6px;border:2px dashed #1a73e8;">
                        ${user.token}
                      </span>
                    </div>

                    <p style="margin:0;color:#999;font-size:12px;text-align:center;">
                      Si no solicitaste este correo, puedes ignorarlo. Tu contraseña no cambiará.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
                    <p style="margin:0;color:#aaa;font-size:12px;">
                      © ${new Date().getFullYear()} Mudanzas Amado · Todos los derechos reservados
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.emailService.sendMail(
      user.email,
      'Instrucciones para restablecer contraseña',
      html,
    );
  }
}
