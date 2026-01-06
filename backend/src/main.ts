import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';


async function bootstrap() {
const app = await NestFactory.create<NestExpressApplication>(AppModule);
app.enableCors({ origin: '*' });
app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });
app.useGlobalPipes(new ValidationPipe({ transform: true }));
  const port = Number(process.env.APP_PORT || 3001);
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();