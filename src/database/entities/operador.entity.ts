import { Liquidacion } from '../../liquidaciones/entities/liquidacion.entity'
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

@Entity('operadores')
export class Operador {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 100 })
    nombre: string

    @Column({ type: 'varchar', length: 100 })
    apellido_p: string

    @Column({ type: 'varchar', length: 100 })
    apellido_m: string

    @OneToMany(() => Liquidacion, (liquidacion) => liquidacion.operador)
    liquidaciones: Liquidacion[]
}