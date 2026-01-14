import { Column, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { DeduccionesFlete } from "../enums/deducciones-flete.enum";
import { Liquidacion } from "src/liquidaciones/entities/liquidacion.entity";

@Entity('deducciones_flete')
export class DeduccionFlete {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'enum', enum: DeduccionesFlete})
    tipo: DeduccionesFlete

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    monto: number

    @ManyToOne(() => Liquidacion, { onDelete: 'CASCADE'})
    liquidacion: Liquidacion

    @DeleteDateColumn()
    deletedAt: Date;
}
