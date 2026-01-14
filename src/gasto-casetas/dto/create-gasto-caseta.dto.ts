import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsPositive } from "class-validator"
import { MetodoPagoCaseta } from "../enums/metodo-pago-caseta.enum";

export class CreateGastoCasetaDto {

    @IsNotEmpty({ message: 'El monto es obligatorio' })
    @IsPositive({ message: 'El monto debe ser un valor mayor a cero' }) 
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Precio no válido' })
    @Type(() => Number)
    monto: number;

    @IsNotEmpty({ message: 'El método de pago es obligatorio' })
    @IsEnum(MetodoPagoCaseta, { message: 'Método de pago no válido (IAVE/TAG o EFECTIVO)' })
    metodo_pago_caseta: string;

    @IsOptional()
    @IsString({ message: 'La evidencia debe ser una cadena (URL o nombre de archivo)' })
    evidencia?: string; // El '?' también indica opcionalidad en TypeScript

    @IsNotEmpty({ message: 'La liquidación es obligatoria' })
    @IsPositive({ message: 'El ID de la liquidación debe ser un valor positivo' }) 
    @IsInt({ message: 'El ID de la liquidación debe ser un número entero' })
    @Type(() => Number)
    liquidacionId: number;
}