import { Controller, Get, Post, Body, Param, Delete, Put, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { GastoCasetasService } from './gasto-casetas.service';
import { CreateGastoCasetaDto } from './dto/create-gasto-caseta.dto';
import { UpdateGastoCasetaDto } from './dto/update-gasto-caseta.dto';
import { ValidarIdPipe } from 'src/common/pipes/validar-id/validar-id.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/roles-usuarios.enum';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('gasto-casetas')
export class GastoCasetasController {
  constructor(
    private readonly gastoCasetasService: GastoCasetasService,
  ) {}

  @Post()
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createGastoCasetaDto: CreateGastoCasetaDto,
    @GetUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.gastoCasetasService.create(createGastoCasetaDto, user, file);
  }

  @Get()
  findAll() {
    return this.gastoCasetasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ValidarIdPipe) id: string) {
    return this.gastoCasetasService.findOne(+id);
  }

  @Put(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id', ValidarIdPipe) id: string, 
    @Body() updateGastoCasetaDto: UpdateGastoCasetaDto,
    @GetUser() user: User,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.gastoCasetasService.update(+id, updateGastoCasetaDto, user, file);
  }

  @Delete(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  remove(
    @Param('id', ValidarIdPipe) id: string,
    @GetUser() user: User
  ) {
    return this.gastoCasetasService.remove(+id, user);
  }

}
