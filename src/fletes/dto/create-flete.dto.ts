import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from "class-validator";

export class CreateFleteDto {
    
    @IsString({ message: 'El campo cliente debe ser texto.' })
    @MaxLength(120, { message: 'El cliente no puede tener más de 120 caracteres.' })
    @IsNotEmpty({ message: 'El campo cliente es obligatorio.' })
    cliente: string;

    @IsNotEmpty({ message: 'El monto es obligatorio' })
    @IsPositive({ message: 'El monto debe ser un valor positivo' }) 
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Monto no válido' })
    @Type(() => Number)
    monto: number;

    @IsString({ message: 'El origen debe ser texto' })
    @MaxLength(255, { message: 'el mensaje no puede tener más de 255 caracteres' })
    origen: string;
    
    @IsString({ message: 'El origen debe ser texto' })
    @MaxLength(255, { message: 'el mensaje no puede tener más de 255 caracteres' })
    destino: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    descripcion: string;

    @IsNotEmpty({ message: 'La liquidación es obligatoria' })
    @Type(() => Number)
    @IsInt({ message: 'El ID de la liquidación debe ser un número entero' })
    liquidacionId: number;
}
