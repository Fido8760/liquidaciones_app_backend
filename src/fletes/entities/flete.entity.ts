import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('fletes')
export class Flete {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  cliente: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'varchar', length: 255 })
  origen: string;

  @Column({ type: 'varchar', length: 255 })
  destino: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  descripcion: string | null;

  @ManyToOne(() => Liquidacion, { onDelete: 'CASCADE' })
  liquidacion: Liquidacion;
}
