import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsPositive } from "class-validator";
import { Type } from "class-transformer";
import { DeduccionesFlete } from "../enums/deducciones-flete.enum";

export class CreateDeduccionFleteDto {
    @IsNotEmpty({ message: 'El tipo es obligatorio' })
    @IsEnum(DeduccionesFlete, { message: 'Seleccione tipo permitido' })
    tipo: DeduccionesFlete

    @IsNotEmpty({ message: 'El monto es obligatorio' })
    @IsPositive({ message: 'El monto debe ser un valor positivo' }) 
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Monto no válido' })
    @Type(() => Number)
    monto: number

    @IsNotEmpty({ message: 'La liquidación es obligatoria' })
    @Type(() => Number)
    @IsInt({ message: 'El ID de la liquidación debe ser un número entero' })
    liquidacionId: number;
}
