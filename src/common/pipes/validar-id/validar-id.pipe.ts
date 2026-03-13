import { BadRequestException, Injectable, ParseIntPipe } from '@nestjs/common';

@Injectable()
export class ValidarIdPipe extends ParseIntPipe {
  constructor() {
    super({
      exceptionFactory:  () => new BadRequestException('ID no válido')
    })
  }
}
