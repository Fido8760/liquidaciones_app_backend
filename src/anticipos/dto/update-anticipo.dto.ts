import { PartialType } from '@nestjs/mapped-types';
import { CreateAnticipoDto } from './create-anticipo.dto';

export class UpdateAnticipoDto extends PartialType(CreateAnticipoDto) {}
