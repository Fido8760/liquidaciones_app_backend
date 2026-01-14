import { PartialType } from '@nestjs/mapped-types';
import { CreateDeduccionFleteDto } from './create-deduccion-flete.dto';

export class UpdateDeduccionFleteDto extends PartialType(CreateDeduccionFleteDto) {}
