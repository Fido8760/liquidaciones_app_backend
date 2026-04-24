import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { NotaService } from './nota.service';
import { CreateNotaDto } from './dto/create-nota.dto';
import { UpdateNotaDto } from './dto/update-nota.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/roles-usuarios.enum';

@Controller('liquidaciones/:liquidacionId/notas')
export class NotaController {
  constructor(private readonly notaService: NotaService) {}

  @Post()
  @Roles(
    UserRole.ADMIN,
    UserRole.CAPTURISTA,
    UserRole.DIRECTOR,
    UserRole.SISTEMAS,
  )
  create(
    @Param('liquidacionId', ParseIntPipe) liquidacionId: number,
    @Body() createNotaDto: CreateNotaDto,
    @GetUser() user: User,
  ) {
    return this.notaService.create(createNotaDto, user, liquidacionId);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.CAPTURISTA,
    UserRole.DIRECTOR,
    UserRole.SISTEMAS,
  )
  findAll(@Param('liquidacionId', ParseIntPipe) liquidacionId: number) {
    return this.notaService.findAll(liquidacionId);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.CAPTURISTA,
    UserRole.DIRECTOR,
    UserRole.SISTEMAS,
  )
  findOne(@Param('id') id: string) {
    return this.notaService.findOne(+id);
  }

  @Patch(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.CAPTURISTA,
    UserRole.DIRECTOR,
    UserRole.SISTEMAS,
  )
  update(@Param('id') id: string, @Body() updateNotaDto: UpdateNotaDto) {
    return this.notaService.update(+id, updateNotaDto);
  }

  @Delete(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.CAPTURISTA,
    UserRole.DIRECTOR,
    UserRole.SISTEMAS,
  )
  remove(@Param('id') id: string) {
    return this.notaService.remove(+id);
  }
}
