import { Type } from "class-transformer"
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from "class-validator"

export class CreateGastoVarioDto {

    @IsNotEmpty({ message: 'El concepto es Obligatorio' })
    @IsString({ message: 'Texto mal formado' })
    concepto: string

    @IsNotEmpty({ message: 'El monto es obligatorio' })
    @IsPositive({ message: 'El monto debe ser un valor positivo' }) 
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Monto no válido' })
    @Type(() => Number)
    monto: number

    @IsString()
    @MaxLength(255)
    @IsOptional()
    observaciones?: string;

    @IsOptional()
    @IsString({ message: 'La evidencia debe ser una cadena (URL o nombre de archivo)' })
    evidencia: string

    @IsNotEmpty({ message: 'La liquidación es obligatoria' })
    @Type(() => Number)
    @IsInt({ message: 'El ID de la liquidación debe ser un número entero' })
    liquidacionId: number
}
