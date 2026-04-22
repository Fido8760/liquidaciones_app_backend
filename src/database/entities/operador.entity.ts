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

    @Column({ type: 'varchar', length: 50, nullable: true })
    curp: string

    @Column({ type: 'varchar', length: 50, nullable: true })
    rfc: string

    @Column({ type: 'bigint', nullable: true })
    nss: number

    @Column({ type: 'date', nullable: true })
    fe_ingreso: Date

    @Column({ type: 'varchar', length: 255, nullable: true })
    subir_archivo_licencia: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    subir_archivo_apto: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    subir_archivo_ine: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    subir_archivo_control: string

    @Column({ type: 'date', nullable: true })
    vigencia_lic: Date

    @Column({ type: 'date', nullable: true })
    vigencia_apto: Date

    @Column({ type: 'int', nullable: true })
    id_puesto: number

    @Column({ type: 'boolean', default: true })
    activo: boolean

    @OneToMany(() => Liquidacion, (liquidacion) => liquidacion.operador)
    liquidaciones: Liquidacion[]
}