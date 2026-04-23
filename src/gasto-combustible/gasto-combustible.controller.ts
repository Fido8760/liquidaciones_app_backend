import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { GastoCombustibleService } from './gasto-combustible.service';
import { CreateGastoCombustibleDto } from './dto/create-gasto-combustible.dto';
import { UpdateGastoCombustibleDto } from './dto/update-gasto-combustible.dto';
import { ValidarIdPipe } from 'src/common/pipes/validar-id/validar-id.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/roles-usuarios.enum';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('gasto-combustible')
export class GastoCombustibleController {
  constructor(
    private readonly gastoCombustibleService: GastoCombustibleService,
  ) {}

  @Post()
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createGastoCombustibleDto: CreateGastoCombustibleDto,
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
    return this.gastoCombustibleService.create(
      createGastoCombustibleDto,
      user,
      file,
    );
  }

  @Get('liquidacion/:liquidacionId')
  findByLiquidacion(
    @Param('liquidacionId', ValidarIdPipe) liquidacionId: number,
  ) {
    return this.gastoCombustibleService.findByLiquidacion(+liquidacionId);
  }

  @Get(':id')
  findOne(@Param('id', ValidarIdPipe) id: string) {
    return this.gastoCombustibleService.findOne(+id);
  }

  @Put(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id', ValidarIdPipe) id: string,
    @Body() updateGastoCombustibleDto: UpdateGastoCombustibleDto,
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
    return this.gastoCombustibleService.update(
      +id,
      updateGastoCombustibleDto,
      user,
      file,
    );
  }

  @Delete(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  remove(@Param('id', ValidarIdPipe) id: string, @GetUser() user: User) {
    return this.gastoCombustibleService.remove(+id, user);
  }
}
