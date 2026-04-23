import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateGastoDto } from './create-gasto.dto';

export class UpdateGastoDto extends PartialType(
  OmitType(CreateGastoDto, ['liquidacionId'] as const),
) {
  evidencia?: string;
  evidencia_public_id?: string;
}
