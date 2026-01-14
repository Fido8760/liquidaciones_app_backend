import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { CostoFletesService } from './costo-fletes.service';
import { CreateCostoFleteDto } from './dto/create-costo-flete.dto';
import { UpdateCostoFleteDto } from './dto/update-costo-flete.dto';
import { ValidarIdPipe } from 'src/common/pipes/validar-id/validar-id.pipe';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/roles-usuarios.enum';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('costo-fletes')
export class CostoFletesController {
  constructor(private readonly costoFletesService: CostoFletesService) {}

  @Post()
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  create(
    @Body() createCostoFleteDto: CreateCostoFleteDto,
    @GetUser() user: User
  ) {
    return this.costoFletesService.create(createCostoFleteDto, user);
  }

  @Get()
  findAll() {
    return this.costoFletesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ValidarIdPipe) id: string) {
    return this.costoFletesService.findOne(+id);
  }

  @Put(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  update(
    @Param('id', ValidarIdPipe) id: string, 
    @Body() updateCostoFleteDto: UpdateCostoFleteDto,
    @GetUser() user: User
  ) {
    return this.costoFletesService.update(+id, updateCostoFleteDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  remove(
    @Param('id', ValidarIdPipe) id: string, 
    @GetUser() user: User
  ) {
    return this.costoFletesService.remove(+id, user);
  }
}
