import { PartialType } from '@nestjs/mapped-types';
import { CreateCostoFleteDto } from './create-costo-flete.dto';

export class UpdateCostoFleteDto extends PartialType(CreateCostoFleteDto) {}
