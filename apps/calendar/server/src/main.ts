import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import config from './config/default';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: config().domains,
  });
  await app.listen(process.env.PORT || 8080);
}
bootstrap();
