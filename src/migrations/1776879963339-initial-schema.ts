import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1776879963339 implements MigrationInterface {
  name = 'InitialSchema1776879963339';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`operadores\` DROP COLUMN \`nss\``);
    await queryRunner.query(
      `ALTER TABLE \`operadores\` ADD \`nss\` bigint NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`operadores\` DROP COLUMN \`nss\``);
    await queryRunner.query(`ALTER TABLE \`operadores\` ADD \`nss\` int NULL`);
  }
}
