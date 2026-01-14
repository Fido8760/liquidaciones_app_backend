import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import {ExtractJwt, Strategy, } from 'passport-jwt'
import { UsersService } from "src/users/users.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService,
        private readonly userService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
        });
    }

    async validate(paylodad: { id: number }) {
        const user = await this.userService.findOne(paylodad.id);

        if( !user ) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        if ( !user.activo ) {
            throw new UnauthorizedException('Usuario deshabilitado')
        }
        return { 
            id: paylodad.id,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido,
            rol: user.rol
        }
    }
}