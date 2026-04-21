import { PartialType } from '@nestjs/mapped-types';
import { CreateProgramacionSalidaDto } from './create-programacion-salida.dto';

export class UpdateProgramacionSalidaDto extends PartialType(CreateProgramacionSalidaDto) {}
