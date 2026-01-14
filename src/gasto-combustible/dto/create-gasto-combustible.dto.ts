import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator"
import { Type } from "class-transformer"
import { MetodoPago } from "../enums/metodo-pago.enum"

export class CreateGastoCombustibleDto {

    @IsNotEmpty({ message: 'Los litros son obligatorios' })
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Los litros deben ser un número' })
    @IsPositive({ message: 'Debe ser un valor positivo' })
    @Type(() => Number)
    litros: number

    @IsNotEmpty({ message: 'El precio es obligatorio' })
    @IsPositive({ message: 'El precio por litro debe ser un valor positivo' }) 
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Precio no válido' })
    @Type(() => Number)
    precio_litro: number

    @IsNotEmpty({ message: 'El monto es obligatorio' })
    @IsPositive({ message: 'El monto debe ser un valor positivo' }) 
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Monto no válido' })
    @Type(() => Number)
    monto: number

    @IsNotEmpty({ message: 'El método de pago es obligatorio' })
    @IsEnum(MetodoPago, { message: 'Método de pago no válido (TARJETA o EFECTIVO)' })
    metodo_pago: string

    @IsOptional()
    @IsString({ message: 'La evidencia debe ser una cadena (URL o nombre de archivo)' })
    evidencia?: string;

    @IsNotEmpty({ message: 'La liquidación es obligatoria' })
    @Type(() => Number)
    @IsInt({ message: 'El ID de la liquidación debe ser un número entero' })
    liquidacionId: number;
}
