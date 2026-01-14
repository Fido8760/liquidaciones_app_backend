import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { UserRole } from "../enums/roles-usuarios.enum";

export class CreateUserDto {

    @IsNotEmpty({ message: 'El nombre es obligatorio'})
    @IsString({ message: 'Valor no válido, el nombre debe contener letras' })
    nombre: string;

    @IsNotEmpty({ message: 'El apellido es obligatorio'})
    @IsString({ message: 'Valor no válido, el apellido debe contener letras' })
    apellido: string;

    @IsEmail({}, { message: 'El correo no es válido' })
    email: string;

    @IsString()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password: string;
    
    @IsEnum(UserRole, { message: 'El rol no es válido' })
    rol: UserRole;
    
    @IsOptional()
    @IsArray()
    permisos_especiales?: string[];
}
