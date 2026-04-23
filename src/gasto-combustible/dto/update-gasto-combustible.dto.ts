import { PartialType } from '@nestjs/mapped-types';
import { CreateGastoCombustibleDto } from './create-gasto-combustible.dto';

export class UpdateGastoCombustibleDto extends PartialType(
  CreateGastoCombustibleDto,
) {
  evidencia?: string;
  evidencia_public_id?: string;
}
