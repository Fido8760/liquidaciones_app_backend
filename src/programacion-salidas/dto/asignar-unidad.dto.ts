import { IsNumber, IsOptional } from "class-validator";

export class AsignarUnidadDto {

    @IsNumber({}, { message: 'El campo Unidad debe ser un número.' })
    unidadId: number;
}