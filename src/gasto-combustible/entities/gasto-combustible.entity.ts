import { Column, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MetodoPago } from "../enums/metodo-pago.enum";
import { Liquidacion } from "../../liquidaciones/entities/liquidacion.entity";

@Entity('gasto_combustible')
export class GastoCombustible {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'decimal', precision: 6, scale: 2 })
    litros: number

    @Column({ type: 'decimal', precision: 6, scale: 2 })
    precio_litro: number

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    monto: number

    @Column({ type: 'enum', enum: MetodoPago})
    metodo_pago: MetodoPago

    @Column({ type: 'varchar', length: 120, nullable: true, default: 'default.pdf' })
    evidencia: string

    @ManyToOne(() => Liquidacion, { onDelete: 'CASCADE'})
    liquidacion: Liquidacion

    @DeleteDateColumn()
    deletedAt: Date;
}
