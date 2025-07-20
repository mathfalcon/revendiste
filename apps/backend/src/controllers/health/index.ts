import { Route, Get, Tags } from '@tsoa/runtime';
import { HealthService } from '~/services';

const healthService = new HealthService();

@Route('health')
@Tags('Health')
export class HealthController {
  // Basic health check - just returns 200 OK
  @Get('/')
  public async basic() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }

  // Detailed health check with all system information
  @Get('/detailed')
  public async detailed() {
    const healthCheck = await healthService.performHealthCheck();

    // Set appropriate status code based on health
    const statusCode =
      healthCheck.status === 'healthy'
        ? 200
        : healthCheck.status === 'degraded'
        ? 200
        : 503;

    // Note: tsoa will handle the status code automatically based on the response
    // You may need to configure tsoa to handle custom status codes if needed
    return healthCheck;
  }

  // Database health check only
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

  // Memory health check only
  @Get('/memory')
  public async memory() {
    const memoryCheck = healthService.checkMemory();

    return {
      status: memoryCheck.status,
      timestamp: new Date().toISOString(),
      memory: memoryCheck,
    };
  }

  // Readiness check - for Kubernetes readiness probes
  @Get('/ready')
  public async readiness() {
    const healthCheck = await healthService.performHealthCheck();

    // Readiness should only be true if all critical services are healthy
    const isReady = healthCheck.status === 'healthy';

    return {
      ready: isReady,
      status: healthCheck.status,
      timestamp: new Date().toISOString(),
    };
  }

  // Liveness check - for Kubernetes liveness probes
  @Get('/live')
  public async liveness() {
    // Liveness check is simpler - just check if the app is running
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
