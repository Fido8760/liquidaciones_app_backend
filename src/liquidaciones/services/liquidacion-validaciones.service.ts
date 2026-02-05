import { UserRole } from "src/users/enums/roles-usuarios.enum";
import { EstadoLiquidacion } from "../enums/estado-liquidacion.enum";
import { ForbiddenException, Injectable } from "@nestjs/common";
import { Liquidacion } from "../entities/liquidacion.entity";
import { User } from "src/users/entities/user.entity";

type TransitionMap = Partial<Record<UserRole, Partial<Record<EstadoLiquidacion, EstadoLiquidacion[]>>>>;

const MAPA_TRANSICIONES: TransitionMap = {
    [UserRole.CAPTURISTA]: {
        [EstadoLiquidacion.BORRADOR]: [EstadoLiquidacion.EN_REVISION],
        [EstadoLiquidacion.EN_REVISION]: [EstadoLiquidacion.APROBADA],
    },
    [UserRole.DIRECTOR]: {
        [EstadoLiquidacion.BORRADOR]: [EstadoLiquidacion.CANCELADA],
        [EstadoLiquidacion.EN_REVISION]: [EstadoLiquidacion.CANCELADA, EstadoLiquidacion.APROBADA],
        [EstadoLiquidacion.APROBADA]: [EstadoLiquidacion.EN_REVISION, EstadoLiquidacion.PAGADA, EstadoLiquidacion.CANCELADA],
    },
    [UserRole.ADMIN]: {
        [EstadoLiquidacion.BORRADOR]: [EstadoLiquidacion.CANCELADA],
        [EstadoLiquidacion.EN_REVISION]: [EstadoLiquidacion.CANCELADA, EstadoLiquidacion.APROBADA],
        [EstadoLiquidacion.APROBADA]: [EstadoLiquidacion.EN_REVISION, EstadoLiquidacion.PAGADA, EstadoLiquidacion.CANCELADA],
    },
};

@Injectable()
export class LiquidacionValidacionesService {
    validarEstadoFinal(liquidacion: Liquidacion, user: User) {
        const estadoFinales = [EstadoLiquidacion.PAGADA, EstadoLiquidacion.CANCELADA];

        if (estadoFinales.includes(liquidacion.estado) && user.rol !== UserRole.SISTEMAS) {
            throw new ForbiddenException(`La liquidación está ${liquidacion.estado} y cerrada definitivamente.`);
        }
    }

    validarCambioEstado(estadoActual: EstadoLiquidacion, nuevoEstado: EstadoLiquidacion, user: User) {
        if (user.rol === UserRole.SISTEMAS) {
            if(nuevoEstado === EstadoLiquidacion.PAGADA) {
                throw new ForbiddenException('Sistemas no tiene facultades para autorizar PAGOS.')
            }
            return;
        }

        const transicionesRol = MAPA_TRANSICIONES[user.rol] ?? {};
        const permitidos = transicionesRol[estadoActual] ?? [];

        if (!permitidos.includes(nuevoEstado)) {
            throw new ForbiddenException(`No tienes permisos para cambiar de ${estadoActual} a ${nuevoEstado}.`);
        }
    }

    validarAjuste(liquidacion: Liquidacion, user: User) {
        if(![UserRole.DIRECTOR, UserRole.ADMIN, UserRole.SISTEMAS].includes(user.rol)) {
            throw new ForbiddenException('Solo Directores, Administradores y Sistemas pueden ajustar liquidaciones.');
        }

        if(liquidacion.estado !== EstadoLiquidacion.APROBADA) {
            throw new ForbiddenException('Solo se pueden ajustar liquidaciones en estado APROBADA.');
        }
    }

    validarModificacionTotal(liquidacion: Liquidacion, user: User) {
        if(![UserRole.DIRECTOR, UserRole.ADMIN, UserRole.SISTEMAS].includes(user.rol)) {
            throw new ForbiddenException('Solo Directores, Administradores y Sistemas pueden modificar el total a pagar.');
        }

        if(liquidacion.estado !== EstadoLiquidacion.APROBADA) {
            throw new ForbiddenException('Solo se pueden modificar totales en liquidaciones APROBADAS.')
        }
    }
}