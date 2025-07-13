import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  healthCheck() {
    return { status: 'OK', message: 'Backend rodando!', datetime: new Date() };
  }
}
