import { Liquidacion } from '../../liquidaciones/entities/liquidacion.entity'
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

@Entity('unidades')
export class Unidad {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 100 })
    no_unidad: string

    @Column({ type: 'varchar', length: 100 })
    tipo_unidad: string

    @Column({ type: 'varchar', length: 100 })
    u_placas: string

    @OneToMany(() => Liquidacion, (liquidacion) => liquidacion.unidad)
    liquidaciones: Liquidacion[]
}