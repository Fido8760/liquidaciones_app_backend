import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { EstadoLiquidacion } from '../enums/estado-liquidacion.enum'
import { Unidad } from '../../database/entities/unidad.entity'
import { Operador } from '../../database/entities/operador.entity'
import { GastoCombustible } from '../../gasto-combustible/entities/gasto-combustible.entity'
import { GastoCaseta } from 'src/gasto-casetas/entities/gasto-caseta.entity'
import { GastoVario } from 'src/gasto-varios/entities/gasto-vario.entity'
import { CostoFlete } from 'src/costo-fletes/entities/costo-flete.entity'
import { DeduccionFlete } from 'src/deduccion-flete/entities/deduccion-flete.entity'
import { Anticipo } from 'src/anticipos/entities/anticipo.entity'
import { User } from 'src/users/entities/user.entity'
import { Nota } from 'src/nota/entities/nota.entity'

@Entity('liquidaciones')
export class Liquidacion {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Unidad, (unidad) => unidad.liquidaciones, { nullable: false})
    unidad: Unidad
    
    @ManyToOne(() => Operador, (operador) => operador.liquidaciones, { nullable: false})
    operador: Operador

    @Column({ type: 'date'})
    fecha_fin: Date

    @Column({ type: 'date'})
    fecha_llegada: Date

    @Column({ type: 'date'})
    fecha_inicio: Date

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    rendimiento: number

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    rendimiento_ajustado: number

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    kilometros_recorridos: number

    @Column({ type: 'varchar', length: 120 })
    cliente: string

    @Column({ type: 'varchar', length: 120 })
    folio_liquidacion: string

    @Column({
        type: 'enum',                
        enum: EstadoLiquidacion,      
        default: EstadoLiquidacion.BORRADOR
    })
    estado: EstadoLiquidacion;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => GastoCombustible, (gastos_combustible) => gastos_combustible.liquidacion, { cascade: true })
    gastos_combustible: GastoCombustible[]

    @OneToMany(() => GastoCaseta, (gastos_caseta) => gastos_caseta.liquidacion, { cascade: true })
    gastos_caseta: GastoCaseta[]

    @OneToMany(() => GastoVario, (gastos_varios) => gastos_varios.liquidacion, { cascade: true })
    gastos_varios: GastoVario[];

    @OneToMany(() => CostoFlete, (costos_fletes) => costos_fletes.liquidacion, { cascade: true })
    costos_fletes: CostoFlete[];

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    total_combustible: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    total_casetas: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    total_gastos_varios: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    total_costo_fletes: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    total_bruto: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    total_deducciones_comerciales: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    comision_porcentaje: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    total_neto_pagar: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    utilidad_viaje: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
    ajuste_manual: number;

    @Column({ type: 'text', nullable: true})
    motivo_ajuste: string | null;

    @OneToMany(() => DeduccionFlete, (deduccion_flete) => deduccion_flete.liquidacion, { cascade: true })
    deducciones: DeduccionFlete[]

    @OneToMany(() => Anticipo, (anticipo) => anticipo.liquidacion, { cascade: true })
    anticipos: Anticipo[]

    @ManyToOne(() => User, (user) => user.liquidaciones_creadas, { nullable: false })
    usuario_creador: User;

    @ManyToOne(() => User, (user) => user.liquidaciones_editadas, { nullable: true })
    usuario_editor: User | null;

    @ManyToOne(() => User, (user) => user.liquidaciones_aprobadas, { nullable: true })
    usuario_aprobador: User | null;
    
    @ManyToOne(() => User, (user) => user.liquidaciones_pagadas, { nullable: true })
    usuario_pagador: User | null;

    @Column({ type: 'timestamp', nullable: true })
    fecha_pago: Date | null;

    @DeleteDateColumn()
    deletedAt: Date

    @OneToMany(() => Nota, (nota) => nota.liquidacion, { cascade: true })
    notas: Nota[];

}
