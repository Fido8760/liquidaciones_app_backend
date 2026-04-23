import { IsDateString, IsNumberString, IsOptional } from 'class-validator';

export class GetProgramacionSalidasQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha inicio debe tener formato YYYY-MM-DD' },)
  fechaInicio?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha fin debe tener formato YYYY-MM-DD' })
  fechaFin?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'La pagina debe ser un numero' })
  page?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'El limite debe ser un numero' })
  limit?: string;
}
