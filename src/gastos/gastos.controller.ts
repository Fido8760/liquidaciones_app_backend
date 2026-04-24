import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator, } from '@nestjs/common';
import { GastosService } from './gastos.service';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoDto } from './dto/update-gasto.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/roles-usuarios.enum';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { ValidarIdPipe } from 'src/common/pipes/validar-id/validar-id.pipe';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('gastos')
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}

  @Post()
  @Roles(UserRole.SISTEMAS, UserRole.CAPTURISTA)
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createGastoDto: CreateGastoDto,
    @GetUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|pdf)$/ }),
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.gastosService.create(createGastoDto, user, file);
  }

  @Get('liquidacion/:liquidacionId')
  @Roles(UserRole.ADMIN, UserRole.CAPTURISTA, UserRole.DIRECTOR, UserRole.SISTEMAS)
  findByLiquidacion(
    @Param('liquidacionId', ValidarIdPipe) liquidacionId: string,
  ) {
    return this.gastosService.findByLiquidacion(+liquidacionId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CAPTURISTA, UserRole.DIRECTOR, UserRole.SISTEMAS)
  findOne(@Param('id') id: string) {
    return this.gastosService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.SISTEMAS, UserRole.CAPTURISTA)
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @Body() updateGastoDto: UpdateGastoDto,
    @GetUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|pdf)$/ }),
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.gastosService.update(+id, updateGastoDto, user, file);
  }

  @Delete(':id')
  @Roles(UserRole.SISTEMAS, UserRole.CAPTURISTA)
  remove(@Param('id', ValidarIdPipe) id: number, @GetUser() user: User) {
    return this.gastosService.remove(id, user);
  }

  @Patch(':id/toggle-afecta-operador')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  toggleAfectaOperador(
    @Param('id', ValidarIdPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.gastosService.toggleAfectaOperador(+id, user);
  }
}
