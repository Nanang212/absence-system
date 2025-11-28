import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:3001', 
      'http://localhost:3000',
      'https://superb-love-production.up.railway.app' // Railway frontend
    ],
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
