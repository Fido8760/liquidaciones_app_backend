import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto'; 
import { User } from 'src/users/entities/user.entity';
import { checkPassword, hashPassword } from 'src/utils/auth';
import { JwtService } from '@nestjs/jwt';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { generateToken } from 'src/utils/token';
import { AuthEmail } from 'src/email/auth-email.service';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly authemail: AuthEmail
  ) {}


  async login(loginDto: LoginDto) {

    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({ where: { email }})

    if ( !user ) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordCorrect = await checkPassword(password, user.password);
    if ( !isPasswordCorrect ) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if ( !user.activo ) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.jwtService.sign({ id: user.id })

    return token;
  }

  async forgotPass( forgotPasswordDto: ForgotPasswordDto ) {
    const { email } = forgotPasswordDto;
    const user = await this.userRepository.findOne({ where: { email }})
    if ( !user ) return { message: ('Si el correo existe, se enviarán las instrucciones al correo proporcionado.') };
    user.token = generateToken();
    await this.userRepository.save(user);
    await this.authemail.sendForgotEmail({
      name: user.nombre,
      email: user.email,
      token: user.token
    })
    return { message: ('Si el correo existe, se enviarán las instrucciones al correo proporcionado.') };

  }

  async validateToken(validateTokenDto: ValidateTokenDto) {
    const { token } = validateTokenDto;
    const tokenExists = await this.userRepository.findOne({ where: { token }})
    if( !tokenExists ) {
      throw new UnauthorizedException('Token no válido')
    }
    return { message: 'Token válido' };
  }

  async resetPassword( token: string, resetPasswordDto: ResetPasswordDto) {

    const { password, confirmPassword } = resetPasswordDto;

    if( password !== confirmPassword ) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const user = await this.userRepository.findOne({ where: { token }})
    if( !user ) {
      throw new UnauthorizedException('Token no válido');
    }

    user.password = await hashPassword(password);
    user.token = null;

    await this.userRepository.save(user);

    return { message: 'Contraseña actualizada correctamente'}

  }

  async getUserById( id: number ) {
    return this.userRepository.findOne({ where: { id } });
  } 
  
}
