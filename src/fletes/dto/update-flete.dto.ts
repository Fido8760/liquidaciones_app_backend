import { PartialType } from '@nestjs/mapped-types';
import { CreateFleteDto } from './create-flete.dto';

export class UpdateFleteDto extends PartialType(CreateFleteDto) {}
