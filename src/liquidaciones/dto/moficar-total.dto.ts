import { IsNumber, Min } from "class-validator";

export class ModificarTotalDto {
    @IsNumber()
    @Min(0, { message: 'El total no puede ser negativo'})
    total_neto_pagar: number
}