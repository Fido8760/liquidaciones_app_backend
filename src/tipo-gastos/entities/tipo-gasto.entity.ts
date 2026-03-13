import { Gasto } from "src/gastos/entities/gasto.entity";
import { Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('tipos_gasto')
export class TipoGasto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    nombre: string;

    @Column({ default: true })
    activo: boolean;

    @OneToMany(() => Gasto, gasto => gasto.tipo_gasto)
    gastos: Gasto[];
}
