import { PartialType } from '@nestjs/mapped-types';
import { CreateGastoCasetaDto } from './create-gasto-caseta.dto';

export class UpdateGastoCasetaDto extends PartialType(CreateGastoCasetaDto) {}
