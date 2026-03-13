import { Liquidacion } from "src/liquidaciones/entities/liquidacion.entity";
import { TipoGasto } from "src/tipo-gastos/entities/tipo-gasto.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('gastos')
export class Gasto {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Liquidacion, liquidacion => liquidacion.gastos, { onDelete: 'CASCADE' })
    liquidacion: Liquidacion;

    @ManyToOne(() => TipoGasto, { nullable: false, eager: true, onDelete: 'RESTRICT' })
    tipo_gasto: TipoGasto;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    monto: number;

    @Column({ type: 'varchar', length: 255, nullable: true})
    descripcion: string | null;

    @Column({ default: false })
    afecta_operador: boolean;

    @Column({ type: 'varchar', length: 120, nullable: true, default: 'default.pdf' })
    evidencia: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true, default: null })
    evidencia_public_id: string | null;

    @CreateDateColumn()
    createdAt: Date;
    
    @DeleteDateColumn()
    deletedAt: Date;
}
