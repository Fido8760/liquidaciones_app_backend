import { Unidad } from 'src/database/entities/unidad.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstatusSalida } from '../enum/estatus-salida.enum';
import { User } from 'src/users/entities/user.entity';
import { MotivoCancelacionSalida } from '../enum/motivo-cancelacion.enum';
import { TipoUnidad } from '../enum/tipo-unidad.enum';

@Entity('programacion_salidas')
export class ProgramacionSalida {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Unidad, (unidad) => unidad.programacionSalidas, {
    nullable: true,
  })
  unidad: Unidad | null;

  @Column({ type: 'enum', enum: TipoUnidad, nullable: false })
  tipo_unidad_solicitado: TipoUnidad;

  @Column({ type: 'varchar', length: 100 })
  cliente: string;

  @Column({ type: 'varchar', length: 150 })
  destino: string;

  @Column({ type: 'date' })
  fecha_salida: string;

  @Column({ type: 'date' })
  fecha_carga: string;

  @Column({ type: 'time' })
  hora_carga: string;

  @Column({ type: 'date' })
  fecha_descarga: string;

  @Column({ type: 'time' })
  hora_descarga: string;

  @Column({
    type: 'enum',
    enum: EstatusSalida,
    default: EstatusSalida.SIN_ASIGNAR,
  })
  estatus: EstatusSalida;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'enum', enum: MotivoCancelacionSalida, nullable: true })
  motivo_cancelacion: MotivoCancelacionSalida | null;

  @ManyToOne(() => User, { nullable: false })
  creadoPor: User;

  @ManyToOne(() => User, { nullable: true })
  modificadoPor: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
