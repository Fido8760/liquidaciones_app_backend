import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { UserRole } from "src/users/enums/roles-usuarios.enum";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const requireRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ]);

        if(!requireRoles) {
            return true
        }

        const { user } = context.switchToHttp().getRequest();

        if(!user) {
            throw new ForbiddenException("No user found in request")
        }

        if (!requireRoles.includes(user.rol)) {
            throw new ForbiddenException("No tienes permisos para acceder a esta acción")
        }
        
        return true;
    }
}