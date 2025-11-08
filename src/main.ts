import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS: permette richieste da qualsiasi origine (incluso localhost e produzione)
  app.enableCors({ 
    origin: true, // Accetta qualsiasi origine
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend avviato su porta ${port}`);
  console.log(`📡 CORS abilitato per tutte le origini`);
}
bootstrap();

