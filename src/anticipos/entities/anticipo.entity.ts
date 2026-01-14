import { Column, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { AnticipoTipo } from "../enums/anticipos.enum";
import { Liquidacion } from "../../liquidaciones/entities/liquidacion.entity";

@Entity('anticipos')
export class Anticipo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'enum', enum: AnticipoTipo })
    tipo: AnticipoTipo;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    monto: number;

    @ManyToOne(() => Liquidacion , { onDelete: 'CASCADE'})
    liquidacion: Liquidacion;

    @DeleteDateColumn()
    deletedAt: Date;
}
