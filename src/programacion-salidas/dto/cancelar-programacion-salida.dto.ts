import { IsEnum, IsNotEmpty } from 'class-validator';
import { MotivoCancelacionSalida } from '../enum/motivo-cancelacion.enum';

export class CancelarProgramacionSalidaDto {
  @IsEnum(MotivoCancelacionSalida, {
    message: 'El motivo de cancelación no es válido.'
  })
  @IsNotEmpty({ message: 'El motivo de cancelación es obligatorio.' })
  motivo_cancelacion: MotivoCancelacionSalida;
}
