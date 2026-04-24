import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { FletesService } from './fletes.service';
import { CreateFleteDto } from './dto/create-flete.dto';
import { UpdateFleteDto } from './dto/update-flete.dto';
import { ValidarIdPipe } from 'src/common/pipes/validar-id/validar-id.pipe';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/roles-usuarios.enum';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('fletes')
export class FletesController {
  constructor(private readonly fletesService: FletesService) {}

  @Post()
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  create(@Body() createFleteDto: CreateFleteDto, @GetUser() user: User) {
    return this.fletesService.create(createFleteDto, user);
  }


  @Get(':id')
  findOne(@Param('id', ValidarIdPipe) id: string) {
    return this.fletesService.findOne(+id);
  }

  @Put(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  update(
    @Param('id', ValidarIdPipe) id: string,
    @Body() updateFleteDto: UpdateFleteDto,
    @GetUser() user: User,
  ) {
    return this.fletesService.update(+id, updateFleteDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  remove(@Param('id', ValidarIdPipe) id: string, @GetUser() user: User) {
    return this.fletesService.remove(+id, user);
  }
}
