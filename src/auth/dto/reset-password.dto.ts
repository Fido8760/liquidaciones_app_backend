import { IsNotEmpty, MinLength } from "class-validator";


export class ResetPasswordDto {

    @IsNotEmpty({ message: 'El password es obligatorio'})
    @MinLength(6, { message: 'El password debe tener al menos 6 caracteres'})
    password: string;

    @IsNotEmpty({ message: 'La confirmación del password es obligatoria'})
    confirmPassword: string;
}