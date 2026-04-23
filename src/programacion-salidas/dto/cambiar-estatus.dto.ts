import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstatusSalida } from '../enum/estatus-salida.enum';

export class CambiarEstatusDto {
  @IsEnum(EstatusSalida, {
    message: 'El estatus debe ser PENDIENTE, ASIGNADO o CANCELADO.',
  })
  @IsNotEmpty({ message: 'El estatus es obligatorio.' })
  estatus: EstatusSalida;
}
