import { Logger, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from 'nestjs-prisma';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { AuthModule } from '@modules/auth/auth.module';
import { HealthModule } from '@modules/health/health.module';
import { UserModule } from '@modules/user/user.module';
import { ExceptionsFilter } from '../../common';
import { CommonModule } from '../../common/common.module';
import { configuration, loggerOptions } from '../../config';

console.log(`${__dirname}/../../../prisma/dev.db`);

@Module({
  imports: [
    LoggerModule.forRoot(loggerOptions),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ServeStaticModule.forRoot({
      rootPath: `${__dirname}/../public`,
    }),
    PrismaModule.forRootAsync({
      isGlobal: true,
      useFactory: (config: ConfigService) => ({
        prismaOptions: {
          ...config.get('prismaOptions'),
          datasources: {
            db: {
              url: `file:${__dirname}/../../../prisma/dev.db`,
            },
          },
        },
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('JwtModule'); 
        logger.log('Initializing JWT configuration');
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: '1d' },
        };
      },
      inject: [ConfigService],
    }),
    CommonModule,
    AuthModule,
    HealthModule,
    UserModule,
  ],
  providers: [
    JwtService,
    {
      provide: APP_FILTER,
      useClass: ExceptionsFilter,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    },
  ],
  controllers: [],
})
export class AppModule {}
