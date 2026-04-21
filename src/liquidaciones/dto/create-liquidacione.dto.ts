import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, Matches } from 'class-validator'

export class CreateLiquidacioneDto {
    
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'La fecha de inicio debe tener formato YYYY-MM-DD'
    })
    @IsNotEmpty({ message: 'La fecha de inicio es obligatoria'})
    fecha_inicio: string;


    @Matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'La fecha de llegada debe tener formato YYYY-MM-DD'
    })
    @IsNotEmpty({ message: 'La fecha de llegada es obligatoria'})
    fecha_llegada: string;


    @Matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'La fecha final debe tener formato YYYY-MM-DD'
    })
    @IsNotEmpty({ message: 'La fecha final es obligatoria'})
    fecha_fin: string;

    @IsNumber({}, { message: 'El campo Kilometros Recorridos debe ser un número.' })
    @Min(0, { message: 'El Kilometros Recorridos no puede ser negativo.'})
    @IsNotEmpty({ message: 'El campo Kilometros Recorridos es obligatorio.' })
    kilometros_recorridos: number
    
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