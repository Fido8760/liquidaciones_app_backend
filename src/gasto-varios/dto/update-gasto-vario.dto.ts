import { PartialType } from '@nestjs/mapped-types';
import { CreateGastoVarioDto } from './create-gasto-vario.dto';

export class UpdateGastoVarioDto extends PartialType(CreateGastoVarioDto) {}
