import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger as PinoLogger, LoggerErrorInterceptor } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { middleware } from '@modules/app/app.middleware';
import { AppModule } from '@modules/app/app.module';
import { genReqId } from './config';

async function bootstrap(): Promise<string> {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: isProduction,
      logger: true,
      genReqId,
    }),
    {
      bufferLogs: isProduction,
    },
  );

  app.useLogger(app.get(PinoLogger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  // Fastify Middleware
  await middleware(app);

  // Swagger setup
  const options = new DocumentBuilder()
    .setTitle(`Auth-Shield API's`)
    .setDescription('This is Auth-Shield API documentation.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
   // Swagger UI setup with customization to hide schemas
   SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      defaultModelsExpandDepth: -1, // This hides the models (schemas) section
    },
  });

  app.enableShutdownHooks();
  await app.listen(process.env.PORT || 3000);

  return app.getUrl();
}

void (async () => {
  try {
    const url = await bootstrap();
    Logger.log(url, 'Bootstrap');
  } catch (error) {
    Logger.error(error, 'Bootstrap');
  }
})();
