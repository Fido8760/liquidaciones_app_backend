import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { EstadoLiquidacion } from '../enums/estado-liquidacion.enum'
import { Unidad } from '../../database/entities/unidad.entity'
import { Operador } from '../../database/entities/operador.entity'
import { GastoCombustible } from '../../gasto-combustible/entities/gasto-combustible.entity'
import { Flete } from 'src/fletes/entities/flete.entity'
import { Anticipo } from 'src/anticipos/entities/anticipo.entity'
import { User } from 'src/users/entities/user.entity'
import { Nota } from 'src/nota/entities/nota.entity'
import { ResultadoRendimiento } from '../enums/resultado-rendimiento.enum'
import { Gasto } from 'src/gastos/entities/gasto.entity'

@Entity('liquidaciones')
export class Liquidacion {
    @PrimaryGeneratedColumn()
    id: number;
    
    @ManyToOne(() => Unidad, (unidad) => unidad.liquidaciones, { nullable: false})
    unidad: Unidad;
    
    @ManyToOne(() => Operador, (operador) => operador.liquidaciones, { nullable: false})
    operador: Operador;
    
    @Column({ type: 'varchar', length: 120 })
    folio_liquidacion: string;

    @Column({ type: 'date'})
    fecha_inicio: Date;

    @Column({ type: 'date'})
    fecha_fin: Date;

    @Column({ type: 'date'})
    fecha_llegada: Date;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    kilometros_recorridos: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    rendimiento_tabulado: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    rendimiento_real: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0})
    diesel_a_favor_sin_iva: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0})
    diesel_en_contra_sin_iva: number;
    
    @Column({ type: 'enum', enum: ResultadoRendimiento, default: ResultadoRendimiento.FAVOR })
    resultado_rendimiento: ResultadoRendimiento;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    total_fletes: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    total_combustible: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
    gasto_ferry: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, nullable: false })
    comision_porcentaje: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    comision_estimada: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    comision_pagada: number | null;
    
    @Column({ type: 'enum', enum: EstadoLiquidacion, default: EstadoLiquidacion.BORRADOR })
    estado: EstadoLiquidacion;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    total_gastos: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    total_bruto: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    total_neto_sugerido: number | null;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    total_neto_pagar: number;
    
    @Column({ type: 'boolean', default: false })
    total_modificado_manualmente: boolean;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    utilidad_viaje: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    ajuste_manual: number;
    
    @Column({ type: 'text', nullable: true})
    motivo_ajuste: string | null;
 
    @Column({ type: 'timestamp', nullable: true })
    fecha_pago: Date | null;
    
    @Column({ type: 'timestamp', nullable: true })
    fecha_modificacion_comision: Date | null;
    
    @Column({ type: 'timestamp', nullable: true })
    fecha_modificacion_total: Date | null;
    
    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;
    
    @DeleteDateColumn()
    deletedAt: Date;
    
    @OneToMany(() => GastoCombustible, (gastos_combustible) => gastos_combustible.liquidacion, { cascade: true })
    gastos_combustible: GastoCombustible[];

    @OneToMany(() => Gasto, (gasto) => gasto.liquidacion, { cascade: true})
    gastos: Gasto[];

    @OneToMany(() => Flete, (flete) => flete.liquidacion, { cascade: true })
    fletes: Flete[];

    @OneToMany(() => Anticipo, (anticipo) => anticipo.liquidacion, { cascade: true })
    anticipos: Anticipo[]
    
    @OneToMany(() => Nota, (nota) => nota.liquidacion, { cascade: true })
    notas: Nota[];
    
    @ManyToOne(() => User, (user) => user.liquidaciones_creadas, { nullable: false })
    usuario_creador: User;

    @ManyToOne(() => User, (user) => user.liquidaciones_editadas, { nullable: true })
    usuario_editor: User | null;

    @ManyToOne(() => User, (user) => user.liquidaciones_aprobadas, { nullable: true })
    usuario_aprobador: User | null;

    @ManyToOne(() => User, (user) => user.liquidaciones_modificadas_comision, { nullable: true })
    usuario_modificador_comision: User | null;
    
    @ManyToOne(() => User, (user) => user.liquidaciones_pagadas, { nullable: true })
    usuario_pagador: User | null;

    @ManyToOne(() => User, (user) => user.liquidaciones_modificadas_total, { nullable: true })
    usuario_modificador_total: User | null;

}