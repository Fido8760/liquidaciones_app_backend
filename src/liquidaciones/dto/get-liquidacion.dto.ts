// src/liquidaciones/dto/get-liquidaciones-lista.dto.ts

import {
  IsDateString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetLiquidacionQueryDto {
  @IsOptional()
  @IsNumberString({}, { message: 'El operador debe ser un número' })
  operadorId?: string;

  @IsOptional()
  @IsString({ message: 'El folio debe ser texto' })
  folio?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha inicio debe tener formato YYYY-MM-DD' },
  )
  fechaInicio?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha fin debe tener formato YYYY-MM-DD' })
  fechaFin?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'], { message: 'El orden debe ser ASC o DESC' })
  orden?: 'ASC' | 'DESC';

  @IsOptional()
  @IsNumberString({}, { message: 'La página debe ser un número' })
  page?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'El límite debe ser un número' })
  limit?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'La unidad debe ser un número' })
  unidadId?: string;
}
