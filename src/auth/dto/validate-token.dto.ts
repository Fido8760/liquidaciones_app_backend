import { IsNotEmpty, Length } from "class-validator";


export class ValidateTokenDto {
    @IsNotEmpty({ message: 'El Token es obligatorio' })
    @Length(6, 6, { message: 'Token no válido'})
    token: string;
}