import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from '../auth/dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GetUser } from './decorators/get-user.decorator';
import { Public } from './decorators/public.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  loginUser(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('forgot-password')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  forgotPass(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPass(forgotPasswordDto);
  }

  @Public()
  @Post('validate-token')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  validateToken(@Body() validateTokenDto: ValidateTokenDto) {
    return this.authService.validateToken(validateTokenDto);
  }

  @Public()
  @Post('reset-password/:token')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  resetPasswordWithToken(
    @Param('token') token: string,
    @Body() resetPassword: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(token, resetPassword);
  }

  @Get('user')
  getUser(@GetUser() user: User) {
    return user;
  }
}
