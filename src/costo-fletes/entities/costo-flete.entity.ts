import { Liquidacion } from "src/liquidaciones/entities/liquidacion.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('costo_fletes')
export class CostoFlete {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    monto: number

    @Column({ type: 'varchar', length: 255, nullable: true})
    origen: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true})
    destino: string | null;

    @Column({ type: 'varchar', length: 120, nullable: true })
    descripcion: string

    @ManyToOne(() => Liquidacion, { onDelete: 'CASCADE'})
    liquidacion: Liquidacion
}
