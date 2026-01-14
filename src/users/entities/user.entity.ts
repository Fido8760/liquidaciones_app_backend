import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { UserRole } from '../enums/roles-usuarios.enum';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';
import { Nota } from 'src/nota/entities/nota.entity';

@Entity('usuarios_liquidacion')
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ type: 'varchar', length: 50 })
    nombre: string;

    @Column({ type: 'varchar', length: 50 })
    apellido: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 60 })
    password: string;

    @Column({ type: 'varchar', length: 6, nullable: true })
    token: string | null;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.CAPTURISTA })
    rol: UserRole;

    @Column({ type: 'simple-array', nullable: true })
    permisos_especiales: string[];

    @Column({ type: 'boolean', default: true })
    activo: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @OneToMany(() => Liquidacion, (liquidacion) => liquidacion.usuario_creador)
    liquidaciones_creadas: Liquidacion[];

    @OneToMany(() => Liquidacion, (liquidacion) => liquidacion.usuario_editor)
    liquidaciones_editadas: Liquidacion[];

    @OneToMany(() => Liquidacion, (liquidacion) => liquidacion.usuario_aprobador)
    liquidaciones_aprobadas: Liquidacion[];

    @OneToMany(() => Liquidacion, (liquidacion) => liquidacion.usuario_pagador)
    liquidaciones_pagadas: Liquidacion[];

    @OneToMany(() => Nota, (nota) => nota.usuario)
    notas: Nota[];

    @ManyToOne(() => User, { nullable: true })
    createdBy: User;

    @ManyToOne(() => User, { nullable: true })
    updatedBy: User;

    @ManyToOne(() => User, { nullable: true })
    deletedBy: User;

    @DeleteDateColumn()
    deletedAt: Date;
}
