import { IsBoolean } from "class-validator";

export class CambiarEstadoUsuarioDTO {
    @IsBoolean({message: 'El estado debe ser un valor booleano'})
    activo: boolean;
}