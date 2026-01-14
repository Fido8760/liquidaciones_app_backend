import { Liquidacion } from "src/liquidaciones/entities/liquidacion.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('notas')
export class Nota {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    contenido: string;

    @CreateDateColumn()
    createdAt: Date

    @ManyToOne(() => User, (user) => user.notas, { eager: false })
    usuario: User;

    @ManyToOne(() => Liquidacion, (liquidacion) => liquidacion.notas, { onDelete: 'CASCADE'})
    liquidacion: Liquidacion;

    @DeleteDateColumn()
    deletedAt: Date;
}
