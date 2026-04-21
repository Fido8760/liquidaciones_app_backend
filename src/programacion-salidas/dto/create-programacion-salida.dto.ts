import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { EstatusSalida } from '../enum/estatus-salida.enum';
import { TipoUnidad } from '../enum/tipo-unidad.enum';

export class CreateProgramacionSalidaDto {

    @IsOptional()
    @IsNumber({}, { message: 'El campo Unidad debe ser un número.' })
    unidadId?: number;

    @IsEnum(TipoUnidad, { message: 'Debe seleccionar un tipo de unidad válido(TRACTOCAMION, MUDANCERO, CAMIONETA).' })
    @IsNotEmpty({ message: 'El tipo de unidad solicitado es obligatorio.' })
    tipo_unidad_solicitado: TipoUnidad;
    
    @IsString({ message: 'El campo Cliente debe ser texto.' })
    @MaxLength(100, { message: 'El Cliente no puede tener más de 100 caracteres.' })
    @IsNotEmpty({ message: 'El campo Cliente es obligatorio.' })
    cliente: string;

    @IsString({ message: 'El campo Destino debe ser texto.' })
    @MaxLength(150, { message: 'El Destino no puede tener más de 150 caracteres.' })
    @IsNotEmpty({ message: 'El campo Destino es obligatorio.' })
    destino: string;

    @IsDateString({}, { message: 'La fecha de salida debe tener un formato válido.' })
    @IsNotEmpty({ message: 'La fecha de salida es obligatoria.' })
    fecha_salida: string;

    @IsDateString({}, { message: 'La fecha de carga debe tener un formato válido.' })
    @IsNotEmpty({ message: 'La fecha de carga es obligatoria.' })
    fecha_carga: string;

    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'La hora de carga debe tener formato HH:mm.' })
    @IsNotEmpty({ message: 'La hora de carga es obligatoria.' })
    hora_carga: string;

    @IsDateString({}, { message: 'La fecha de descarga debe tener un formato válido.' })
    @IsNotEmpty({ message: 'La fecha de descarga es obligatoria.' })
    fecha_descarga: string;

    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'La hora de descarga debe tener formato HH:mm.' })
    @IsNotEmpty({ message: 'La hora de descarga es obligatoria.' })
    hora_descarga: string;

    @IsOptional()
    @IsEnum(EstatusSalida, { message: 'El estatus debe ser PENDIENTE, YA_SALIO o CANCELADO.' })
    estatus?: EstatusSalida;

    @IsOptional()
    @IsString({ message: 'Las observaciones deben ser texto.' })
    observaciones?: string;
}