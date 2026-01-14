import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';

export class AjustarLiquidacionDto {
  @IsNumber({}, { message: 'El rendimiento ajustado debe ser un número.' })
  @Min(0, { message: 'El rendimiento ajustado no puede ser negativo.' })
  @IsNotEmpty({ message: 'El rendimiento ajustado es obligatorio.' })
  rendimiento_ajustado: number;

  @IsNumber({}, { message: 'El porcentaje de comisión debe ser un número.' })
  @Min(0, { message: 'El porcentaje de comisión no puede ser negativo.' })
  @Max(100, { message: 'El porcentaje de comisión no puede ser mayor a 100.' })
  @IsNotEmpty({ message: 'El porcentaje de comisión es obligatorio.' })
  comision_porcentaje: number;

  @IsOptional()
  @IsNumber({}, { message: 'El ajuste manual debe ser un número.' })
  ajuste_manual?: number;

  @IsOptional()
  @IsString({ message: 'El motivo del ajuste debe ser texto.' })
  @MaxLength(500, { message: 'El motivo del ajuste no puede tener más de 500 caracteres.' })
  @ValidateIf(o => o.ajuste_manual && o.ajuste_manual !== 0)
  @IsNotEmpty({ message: 'Debe proporcionar un motivo cuando hay un ajuste manual.' })
  motivo_ajuste?: string;
}