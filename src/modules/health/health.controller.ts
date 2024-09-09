import { Controller, Get, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export default class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
  ) {}

  /**
   * Checks the overall health of the application.
   * Logs the health check operation and handles any potential errors.
   * @returns A promise that resolves with the health check result, or throws an InternalServerErrorException if the check fails.
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check the overall health of the application' })
  @ApiOkResponse({
    description: 'The application is healthy.',
    schema: {
      example: {
        status: 'ok',
        info: { status: 'up', message: 'Everything is fine' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Health check failed.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Health check failed',
        error: 'Internal Server Error',
      },
    },
  })
  async check(): Promise<HealthCheckResult> {
    this.logger.log('Checking overall health of the application');

    try {
      const result = await this.health.check([
        () => ({ info: { status: 'up', message: 'Everything is fine' } }),
      ]);
      this.logger.log('Health check succeeded');
      return result;
    } catch (error) {
      this.logger.error('Health check failed', error);
      throw new InternalServerErrorException('Health check failed');
    }
  }

  /**
   * Checks the memory health of the application.
   * Logs the memory health check operation and handles any potential errors.
   * @returns A promise that resolves with the memory health check result, or throws an InternalServerErrorException if the check fails.
   */
  @Get('memory')
  @HealthCheck()
  @ApiOperation({ summary: 'Check the memory health of the application' })
  @ApiOkResponse({
    description: 'Memory health is within acceptable limits.',
    schema: {
      example: {
        status: 'ok',
        info: {
          memory_heap: {
            status: 'up',
          },
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Memory health check failed.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Memory health check failed',
        error: 'Internal Server Error',
      },
    },
  })
  async checkMemory(): Promise<HealthCheckResult> {
    this.logger.log('Checking memory health of the application');

    try {
      const result = await this.health.check([
        () => this.memory.checkHeap('memory_heap', 1400 * 1024 * 1024),
      ]);
      this.logger.log('Memory health check succeeded');
      return result;
    } catch (error) {
      this.logger.error('Memory health check failed', error);
      throw new InternalServerErrorException('Memory health check failed');
    }
  }
}
