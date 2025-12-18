import {Route, Get, Tags} from '@mathfalcon/tsoa-runtime';
import {HealthService} from '~/services';

const healthService = new HealthService();

@Route('health')
@Tags('Health')
export class HealthController {
  @Get('/')
  public async basic() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('/detailed')
  public async detailed() {
    return healthService.performHealthCheck();
  }

  @Get('/database')
  public async database() {
    const dbCheck = await healthService.checkDatabase();

    if (!dbCheck) {
      return {
        status: 'skipped',
        message: 'Database check skipped - DATABASE_URL not configured',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: dbCheck.status,
      timestamp: new Date().toISOString(),
      database: dbCheck,
    };
  }

  @Get('/memory')
  public async memory() {
    const memoryCheck = healthService.checkMemory();

    return {
      status: memoryCheck.status,
      timestamp: new Date().toISOString(),
      memory: memoryCheck,
    };
  }

  @Get('/ready')
  public async readiness() {
    const healthCheck = await healthService.performHealthCheck();
    const isReady = healthCheck.status === 'healthy';

    return {
      ready: isReady,
      status: healthCheck.status,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('/live')
  public async liveness() {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
