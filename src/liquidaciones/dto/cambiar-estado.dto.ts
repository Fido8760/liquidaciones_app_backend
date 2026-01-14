import { IsEnum } from "class-validator";
import { EstadoLiquidacion } from "../enums/estado-liquidacion.enum";

export class CambiarEstadoDto {
    @IsEnum(EstadoLiquidacion, { message: "Estado no válido"})
    estado: EstadoLiquidacion;
}