import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from "class-validator";

export class CreateGastoDto {

    @IsNotEmpty({ message: 'El monto es obligatorio' })
    @IsPositive({ message: 'El monto debe ser un valor positivo' })
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Monto no válido' })
    @Type(() => Number)
    monto: number;

    @IsNotEmpty({ message: 'El tipo de gasto es obligatorio' })
    @IsInt({ message: 'El ID del tipo de gasto debe ser un número entero' })
    @Type(() => Number)
    tipoGastoId: number;

    @IsNotEmpty({ message: 'La liquidación es obligatoria' })
    @IsInt({ message: 'El ID de la liquidación debe ser un número entero' })
    @Type(() => Number)
    liquidacionId: number;

    @IsString({ message: 'La descripción debe ser texto' })
    @MaxLength(255, { message: 'La descripción no puede tener más de 255 caracteres' })
    @IsOptional()
    descripcion?: string;

    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean({ message: 'afecta_operador debe ser verdadero o falso' })
    @IsOptional()
    afecta_operador?: boolean;

    @IsString({ message: 'La evidencia debe ser texto' })
    @MaxLength(120, { message: 'La evidencia no puede tener más de 120 caracteres' })
    @IsOptional()
    evidencia?: string;
}
