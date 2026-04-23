// src/programacion-salidas/dto/cambiar-estatus.dto.ts
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstatusSalida } from '../enum/estatus-salida.enum';

export class CambiarEstatusDto {
  @IsEnum(EstatusSalida, {
    message: 'El estatus debe ser PENDIENTE, YA_SALIO o CANCELADO.',
  })
  @IsNotEmpty({ message: 'El estatus es obligatorio.' })
  estatus: EstatusSalida;
}
