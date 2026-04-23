import { IsDateString, IsOptional } from 'class-validator';

export class GetSalidaDiaQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  fecha?: string;
}
