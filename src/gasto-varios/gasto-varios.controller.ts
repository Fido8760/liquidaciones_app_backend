import { Controller, Get, Post, Body, Param, Delete, Put, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { GastoVariosService } from './gasto-varios.service';
import { CreateGastoVarioDto } from './dto/create-gasto-vario.dto';
import { UpdateGastoVarioDto } from './dto/update-gasto-vario.dto';
import { ValidarIdPipe } from 'src/common/pipes/validar-id/validar-id.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/roles-usuarios.enum';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('gasto-varios')
export class GastoVariosController {
  constructor(
    private readonly gastoVariosService: GastoVariosService,
  ) {}

  @Post()
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createGastoVarioDto: CreateGastoVarioDto,
    @GetUser() user: User,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.gastoVariosService.create(createGastoVarioDto, user, file);
  }

  @Get()
  findAll() {
    return this.gastoVariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ValidarIdPipe) id: string) {
    return this.gastoVariosService.findOne(+id);
  }

  @Put(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id', ValidarIdPipe) id: string, 
    @Body() updateGastoVarioDto: UpdateGastoVarioDto,
    @GetUser() user: User,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.gastoVariosService.update(+id, updateGastoVarioDto, user, file);
  }

  @Delete(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  remove(
    @Param('id', ValidarIdPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.gastoVariosService.remove(+id, user);
  }

}
