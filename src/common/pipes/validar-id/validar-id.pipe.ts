import { ArgumentMetadata, BadRequestException, Injectable, ParseIntPipe, PipeTransform } from '@nestjs/common';

@Injectable()
export class ValidarIdPipe extends ParseIntPipe {
  constructor() {
    super({
      exceptionFactory:  () => new BadRequestException('ID no válido')
    })
  }
}
