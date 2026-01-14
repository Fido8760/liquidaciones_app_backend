import { IsNotEmpty, IsString } from "class-validator";

export class CreateNotaDto {
    @IsNotEmpty({ message: 'El contenido de la nota no puede ir vacío'})
    @IsString({ message: 'El contenido debe ser texto'})
    contenido: string;
}
