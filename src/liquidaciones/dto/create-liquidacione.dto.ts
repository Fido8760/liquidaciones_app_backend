import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, Max, IsEnum, ValidateIf } from 'class-validator'

export class CreateLiquidacioneDto {

    @IsDateString({}, { message: 'La fecha de finalización debe ser un formato válido'})
    @IsNotEmpty({ message: 'La fecha final es obligatoria'})
    fecha_fin: string

    @IsDateString({}, { message: 'La fecha de llegada debe ser un formato válido'})
    @IsNotEmpty({ message: 'La fecha de llegada es obligatoria'})
    fecha_llegada: string

    @IsDateString({}, { message: 'La fecha de inicio debe ser un formato válido'})
    @IsNotEmpty({ message: 'La fecha de inicio es obligatoria'})
    fecha_inicio: string

    @IsNumber({}, { message: 'El campo rendimiento debe ser un número.' })
    @Min(0, { message: 'El rendimiento no puede ser negativo.'})
    @IsNotEmpty({ message: 'El campo rendimiento es obligatorio.' })
    rendimiento: number

    @IsNumber({}, { message: 'El campo Kilometros Recorridos debe ser un número.' })
    @Min(0, { message: 'El Kilometros Recorridos no puede ser negativo.'})
    @IsNotEmpty({ message: 'El campo Kilometros Recorridos es obligatorio.' })
    kilometros_recorridos: number

    @IsString({ message: 'El campo cliente debe ser texto.' })
    @MaxLength(120, { message: 'El cliente no puede tener más de 120 caracteres.' })
    @IsNotEmpty({ message: 'El campo cliente es obligatorio.' })
    cliente: string
    
    @IsString({ message: 'El campo folio de liquidacion debe ser texto.' })
    @MaxLength(120, { message: 'El folio de liquidacion no puede tener más de 120 caracteres.' })
    @IsNotEmpty({ message: 'El campo folio de liquidacion es obligatorio.' })
    folio_liquidacion: string

    @IsNumber({}, { message: 'El campo Unidad debe ser un número.' })
    @IsNotEmpty({ message: 'El campo Unidad es obligatorio.' })
    unidadId: number
    
    @IsNumber({}, { message: 'El campo Operador debe ser un número.' })
    @IsNotEmpty({ message: 'El campo Operador es obligatorio.' })
    operadorId: number

}