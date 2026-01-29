import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from "class-validator";

export class CreateCostoFleteDto {

    @IsNotEmpty({ message: 'El monto es obligatorio' })
    @IsPositive({ message: 'El monto debe ser un valor positivo' }) 
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Monto no válido' })
    @Type(() => Number)
    monto: number

    @IsOptional()
    @IsString({ message: 'El origen debe ser texto' })
    @MaxLength(255, { message: 'el mensaje no puede tener más de 255 caracteres' })
    origen?: string
    
    @IsOptional()
    @IsString({ message: 'El origen debe ser texto' })
    @MaxLength(255, { message: 'el mensaje no puede tener más de 255 caracteres' })
    destino?: string

    @IsString()
    @MaxLength(255)
    @IsOptional()
    descripcion: string

    @IsNotEmpty({ message: 'La liquidación es obligatoria' })
    @Type(() => Number)
    @IsInt({ message: 'El ID de la liquidación debe ser un número entero' })
    liquidacionId: number
}
