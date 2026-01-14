import { Liquidacion } from "src/liquidaciones/entities/liquidacion.entity";
import { Column, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('gasto_varios')
export class GastoVario {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 120 })
    concepto: string

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    monto: number

    @Column({ type: 'varchar', length: 225, nullable: true })
    observaciones: string

    @Column({ type: 'varchar', length: 120, nullable: true, default: 'default.pdf' })
    evidencia: string

    @ManyToOne(() => Liquidacion, { onDelete: 'CASCADE'})
    liquidacion: Liquidacion

    @DeleteDateColumn()
    deletedAt: Date;
}
