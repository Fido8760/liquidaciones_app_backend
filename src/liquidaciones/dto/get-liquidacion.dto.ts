import { IsNumberString, IsOptional } from 'class-validator'

export class GetLiquidacionQueryDto {
    @IsOptional()
    @IsNumberString({}, { message: 'La unidad debe ser un nímero'})
    unidad_id: number

    @IsOptional()
    @IsNumberString({}, {message: 'La cantidad debe ser un número'})
    take: number

    @IsOptional()
    @IsNumberString({}, {message: 'La cantidad debe ser un número'})
    skip: number
}