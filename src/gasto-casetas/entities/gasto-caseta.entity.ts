import { Column, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MetodoPagoCaseta } from "../enums/metodo-pago-caseta.enum";
import { Liquidacion } from "src/liquidaciones/entities/liquidacion.entity";

@Entity('gasto_caseta')
export class GastoCaseta {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'decimal', precision: 10, scale:2 })
    monto: number

    @Column({ type: 'enum', enum: MetodoPagoCaseta })
    metodo_pago_caseta: MetodoPagoCaseta

    @Column({ type: 'varchar', length: 120, nullable: true, default: 'default.pdf' })
    evidencia: string

    @ManyToOne(() => Liquidacion, { onDelete: 'CASCADE'})
    liquidacion: Liquidacion

    @DeleteDateColumn()
    deletedAt: Date;
}

