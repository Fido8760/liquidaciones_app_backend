import { ForbiddenException } from "@nestjs/common";
import { Liquidacion } from "src/liquidaciones/entities/liquidacion.entity";
import { EstadoLiquidacion } from "src/liquidaciones/enums/estado-liquidacion.enum";
import { User } from "src/users/entities/user.entity";
import { UserRole } from "src/users/enums/roles-usuarios.enum";

export function validarBloqueoEdicion(liquidacion: Liquidacion, user: User) {
    if( user.rol === UserRole.SISTEMAS) return;

    const estadosBloquedos = [
        EstadoLiquidacion.APROBADA,
        EstadoLiquidacion.PAGADA,
        EstadoLiquidacion.CANCELADA
    ]

    if(estadosBloquedos.includes(liquidacion.estado)) {
        throw new ForbiddenException( `No se pueden realizar modificaciones. La liquidación está ${liquidacion.estado}`);
    }
}