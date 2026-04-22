import { ProgramacionSalida } from 'src/programacion-salidas/entities/programacion-salida.entity'
import { Liquidacion } from '../../liquidaciones/entities/liquidacion.entity'
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

@Entity('unidades')
export class Unidad {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100 })
    no_unidad: string;

    @Column({ type: 'varchar', length: 100 })
    tipo_unidad: string;

    @Column({ type: 'varchar', length: 100 })
    u_placas: string;

    @Column({ type: 'boolean', default: true })
    activo: boolean

    @Column({ type: 'varchar', length: 255, nullable: true })
    u_serie: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    u_marca: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    modelo: string

    @Column({ type: 'int', nullable: true })
    u_anio: number

    @Column({ type: 'varchar', length: 255, nullable: true })
    no_motor: string

    @OneToMany(() => Liquidacion, (liquidacion) => liquidacion.unidad)
    liquidaciones: Liquidacion[];

    @OneToMany(() => ProgramacionSalida, (programacionSalida) => programacionSalida.unidad)
    programacionSalidas: ProgramacionSalida[];
}