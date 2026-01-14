import { PartialType } from '@nestjs/mapped-types';
import { CreateGastoCombustibleDto } from './create-gasto-combustible.dto';

export class UpdateGastoCombustibleDto extends PartialType(CreateGastoCombustibleDto) {}
