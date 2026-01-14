import { Controller, Get, Param } from '@nestjs/common';
import { OperadoresService } from './operadores.service';

@Controller('operadores')
export class OperadoresController {
  constructor(private readonly operadoresService: OperadoresService) {}


  @Get()
  findAll() {
    return this.operadoresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.operadoresService.findOne(+id);
  }

}
